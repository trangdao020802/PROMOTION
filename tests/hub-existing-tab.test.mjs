import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {backgroundRuntime} from './helpers/existing-hub-runtime.mjs';
const origin='https://hub24.apollo.vn:7777',channel='promotion-hub/existing-tab/v1';
const course={ct:'QA2610-CT-000004',student:'QA-NETWORK',url:origin+'/contract/detail/12345'};
const load=(context,names)=>{for(const name of names)vm.runInContext(fs.readFileSync(new URL('../reference/hub/'+name,import.meta.url),'utf8'),context);};
const drain=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
const raw=()=>({ContractId:12345,ContractNo:course.ct,StudentCode:course.student,ListCourseInfo:[{PriceName:'ATLS - New Price',HowWeekName:'3 hrs/week',ProductPackageName:'2 months'}],ListGiftCode:[],ListDiscount:[],Address:'PRIVATE-DO-NOT-COPY',Token:'PRIVATE-DO-NOT-COPY'});
test('single lookup and monthly CT/DEP link reads never create, navigate, activate or close a browser tab',async()=>{
 for(const [type,codes]of [['start',[course.ct]],['index-start',[course.ct,'QA2610-CT-000005']],['index-start',['QA2610-DEP-000004']]]){
  const r=backgroundRuntime(),id='qa-links';await r.send({type,id,codes,ct:codes[0]});assert.equal(r.store.job.hubTab,20);assert.equal(r.store.job.reused,true);
  const links=codes.map((ct,i)=>({ct,url:origin+(ct.includes('-DEP-')?'/deposit/detail/':'/contract/detail/')+(12345+i)}));
  await r.send({type:'agent-complete',id,agentKey:'qa-agent',links},20,r.tabs[0].url);
  assert.ok(r.messages.some(m=>m.type===(type==='start'?'result':'index-result')));assert.equal(r.store.job,undefined);assert.deepEqual(r.mutations,[]);assert.equal(r.tabs.length,1);assert.equal(r.tabs[0].url,origin+'/home');
 }
});
test('missing, stale or busy Hub brokers report errors with no new-tab fallback',async()=>{
 for(const options of [{tabs:[]},{tabs:[{id:20,url:'https://example.com/'}]},{ready:false},{accepted:false}]){
  const r=backgroundRuntime(options),reply=await r.send({type:'course-start',id:'qa-no-hub',course});
  assert.ok(reply.code==='hub_tab_missing'||r.messages.some(m=>m.code==='hub_tab_unavailable'));assert.equal(r.store.job,undefined);assert.deepEqual(r.mutations,[]);
 }
});
test('cancel, timeout, closed or navigated Hub tabs release their read without changing any remaining tab',async()=>{
 for(const mode of ['cancel','timeout','closed','navigation']){
  const r=backgroundRuntime();await r.send({type:'index-start',id:'qa-stop',codes:[course.ct]});
  if(mode==='cancel')await r.send({type:'cancel',id:'qa-stop'});
  if(mode==='timeout')await r.send({type:'agent-complete',id:'qa-stop',agentKey:'qa-agent',error:true,code:'hub_timeout',message:'Hết giờ'},20,r.tabs[0].url);
  if(mode==='closed'){r.removed[0](20);await r.flush();}
  if(mode==='navigation'){r.updated[0](20,{url:origin+'/contract/list'});await r.flush();}
  assert.equal(r.store.job,undefined);assert.deepEqual(r.mutations,[]);
  await r.send({type:'agent-complete',id:'qa-stop',agentKey:'qa-agent',links:[]},20,r.tabs[0].url);assert.ok(!r.messages.some(m=>m.type==='index-result'));
 }
});
test('a result requires the current Hub document agent, job, top frame and exact requested identities',async()=>{
 const r=backgroundRuntime();await r.send({type:'course-start',id:'qa-bound',course});
 const payload={...course,courseFee:'ATLS',hoursPerWeek:'3 hrs/week',package:'2 months',giftcode:'0',discount:'0',groupKoc:null,contractType:null};
 for(const [m,tab,url,extra]of [
  [{agentKey:'other-agent'},20,origin+'/home',{}],
  [{id:'other-job'},20,origin+'/home',{}],
  [{},21,origin+'/home',{}],
  [{},20,origin+'/home',{frameId:1}],
  [{},20,'https://example.com/',{}],
  [{payload:{...payload,student:'WRONG'}},20,origin+'/home',{}]
 ]){await r.send({type:'agent-complete',id:'qa-bound',agentKey:'qa-agent',payload,...m},tab,url,extra);assert.ok(r.store.job);}
 await r.send({type:'agent-complete',id:'qa-bound',agentKey:'qa-agent',payload},20,origin+'/home');assert.equal(r.store.job,undefined);assert.deepEqual(r.mutations,[]);
});
function mainRuntime({managed=false}={}){
 const messages=[],listeners=[],calls=[],xhrLoads=[],pathname=managed?'/contract/detail/12345':'/home';
 class XHR{open(method,url){this.method=method;this.url=url;}addEventListener(type,fn){xhrLoads.push({xhr:this,fn});}}
 const response=(url,value)=>{const bytes=new TextEncoder().encode(JSON.stringify(value));return {ok:true,url,body:{getReader:()=>{let read=false;return {read:async()=>read?{done:true}:(read=true,{done:false,value:bytes}),cancel:async()=>{}};}},clone(){return response(url,value);}};};
 const originalFetch=async(url,options)=>{calls.push({url,options});return response(url,raw());};
 const context=vm.createContext({URL,Date,Promise,WeakMap,TextDecoder,AbortController,console,location:{origin,pathname,href:origin+pathname}});
 context.window={name:managed?'promotion-hub-read:qa-main':'',fetch:originalFetch,XMLHttpRequest:XHR,addEventListener:(type,fn)=>{if(type==='message')listeners.push(fn);},postMessage:m=>messages.push(m)};
 context.window.parent=managed?{postMessage:m=>messages.push(m)}:context.window;context.window.top=managed?{}:context.window;
 load(context,['core.js','index-core.js','course-core.js','course-network-core.js','reuse-agent-main.js']);
 const send=(m,from=context.window,host=origin)=>listeners.forEach(fn=>fn({source:from,origin:host,data:{channel,id:'qa-main',...m}}));
 return {context,messages,calls,xhrLoads,XHR,send};
}
test('an existing Hub tab reads only an actually observed GET route, with no guessed API path',async()=>{
 const r=mainRuntime();r.send({type:'read-course',course});await drain();assert.equal(r.calls.length,0);assert.equal(r.messages.at(-1).type,'route-missing');
 // Simulate the user's normal Hub request. Observing it learns only a route.
 const xhr=new r.XHR();xhr.open('GET',origin+'/qa/GetContractDetail?contractId=87654');
 r.send({type:'read-course',course});await drain();assert.equal(r.calls.length,1);assert.equal(r.calls[0].url,origin+'/qa/GetContractDetail?contractId=12345');assert.equal(r.calls[0].options.credentials,'same-origin');
 const result=r.messages.find(m=>m.type==='course');assert.ok(result);assert.equal(result.projection.ct,course.ct);assert.ok(!JSON.stringify(result).includes('PRIVATE-DO-NOT-COPY'));
 const count=r.calls.length;r.send({type:'read-course',course:{...course,url:'https://example.com/contract/detail/12345'}});r.send({type:'read-course',course},r.context.window,'https://example.com');await drain();assert.equal(r.calls.length,count);
});
test('a managed inner frame projects its own request and sends only requested fields to its parent',async()=>{
 const r=mainRuntime({managed:true});await r.context.window.fetch(origin+'/qa/GetContractDetail?contractId=12345');await drain();assert.equal(r.messages.length,0);
 r.send({type:'activate',course},r.context.window.parent);assert.equal(r.messages.at(-1).type,'course');assert.equal(r.messages.at(-1).id,'qa-main');assert.ok(!JSON.stringify(r.messages).includes('PRIVATE-DO-NOT-COPY'));assert.equal(r.calls.length,1);
});
function isolatedRuntime({blocked=false}={}){
 let clock=0,next=1;const listeners=[],timers=new Map(),messages=[],posts=[],frames=[];
 const root={querySelectorAll:()=>[]};
 class Clock extends Date{static now(){return clock;}}
 const context=vm.createContext({URL,Date:Clock,Promise,Set,Map,console,crypto:{randomUUID:()=> 'qa-agent'},location:{origin,pathname:'/home',href:origin+'/home'},setInterval:fn=>{const id=next++;timers.set(id,fn);return id;},clearInterval:id=>timers.delete(id),setTimeout:fn=>{const id=next++;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
 context.window={addEventListener:(type,fn)=>listeners.push({type,fn}),postMessage:m=>posts.push(m)};context.window.top=context.window;
 context.document={documentElement:{appendChild:e=>frames.push(e)},createElement:()=>{const e={style:{},setAttribute:(k,v)=>{e[k]=v;},addEventListener:(type,fn)=>{e[type]=fn;},remove:()=>{e.removed=true;},contentDocument:root,contentWindow:{location:{href:'about:blank'},postMessage:m=>posts.push(m)}};if(blocked)Object.defineProperty(e.contentWindow,'location',{get:()=>{throw Error('blocked');}});return e;}};
 const chromeMessages=[];context.chrome={runtime:{id:'qa-extension',sendMessage:async m=>{messages.push(m);return {};},onMessage:{addListener:fn=>chromeMessages.push(fn)}}};
 load(context,['core.js','index-core.js','course-core.js','course-network-core.js','reuse-agent.js']);
 const send=(m,sender={id:'qa-extension'})=>{let reply;chromeMessages[0](m,sender,v=>{reply=v;});return reply;};
 const packet=(m,source=context.window,host=origin)=>listeners.filter(l=>l.type==='message').forEach(l=>l.fn({source,origin:host,data:{channel,id:'qa-isolated',...m}}));
 const tick=ms=>{clock+=ms;for(const fn of [...timers.values()])fn();};
 return {context,send,packet,tick,messages,posts,frames,timers};
}
test('the existing-tab broker owns only an invisible inert iframe and removes it on cancel',()=>{
 const r=isolatedRuntime(),ready=r.send({type:'hub-agent-ping'});assert.equal(ready.agentKey,'qa-agent');
 assert.equal(r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'bad',kind:'course',course}),undefined);
 const reply=r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});assert.equal(reply.accepted,true);assert.equal(r.frames.length,0);
 r.packet({type:'route-missing'});assert.equal(r.frames.length,1);const f=r.frames[0];assert.equal(f.src,course.url);assert.equal(f.inert,'');assert.equal(f['aria-hidden'],'true');assert.equal(f.sandbox,'allow-scripts allow-same-origin');assert.equal(f.tabIndex,-1);
 r.send({type:'hub-agent-stop',id:'qa-isolated',agentKey:'qa-agent'});assert.equal(f.removed,true);assert.equal(r.timers.size,0);assert.equal(r.context.location.href,origin+'/home');assert.equal(r.messages.length,0);
});
test('blocked background frames report a clear error and are cleaned without opening a tab',()=>{
 const r=isolatedRuntime({blocked:true});r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'index',codes:[course.ct]});const f=r.frames[0];f.load();assert.equal(r.messages.length,1);assert.equal(r.messages[0].type,'agent-complete');assert.equal(r.messages[0].code,'hub_frame_unavailable');assert.equal(f.removed,true);assert.equal(r.timers.size,0);assert.equal(r.context.location.href,origin+'/home');
});
test('an API result is bound to the requested CT/student, stops its fallback and returns only the projected payload',()=>{
 const r=isolatedRuntime();r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});
 const p={source:origin+'/qa/GetContractDetail?contractId=12345',contractId:'12345',ct:course.ct,student:course.student,fields:{giftcode:'0',discount:'0'},courses:[{courseFee:'ATLS',hoursPerWeek:'3 hrs/week',package:'2 months'}]};
 r.packet({type:'course',projection:p},{},origin);assert.equal(r.messages.length,0);
 r.packet({type:'course',projection:p});assert.equal(r.messages.length,1);assert.equal(r.messages[0].payload.courseFee,'ATLS');assert.equal(r.frames.length,0);assert.equal(r.timers.size,0);assert.ok(!r.messages[0].projection);
 r.packet({type:'course',projection:p});assert.equal(r.messages.length,1);
 const bad=isolatedRuntime();bad.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});bad.packet({type:'course',projection:{...p,student:'OTHER'}});assert.equal(bad.messages[0].code,'course_unavailable');assert.ok(!bad.messages[0].payload);
});

test('pre-upgrade automated jobs are discarded without closing their former tabs',async()=>{
 const r=backgroundRuntime();r.store.job={id:'old-job',kind:'course',hubTab:22,sourceTab:10,expires:Date.now()+10000};
 await r.send({type:'index-start',id:'new-job',codes:[course.ct]});assert.equal(r.store.job.id,'new-job');assert.deepEqual(r.mutations,[]);
});
test('a frame timeout cleans up and keeps the existing Hub URL unchanged',()=>{
 const r=isolatedRuntime();r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'index',codes:[course.ct]});r.tick(31000);
 assert.equal(r.messages[0].code,'hub_frame_unavailable');assert.equal(r.frames[0].removed,true);assert.equal(r.timers.size,0);assert.equal(r.context.location.href,origin+'/home');
});
