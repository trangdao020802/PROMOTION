import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {backgroundRuntime} from './helpers/existing-hub-runtime.mjs';
import {hubFixture} from './helpers/hub-policy-fixture.mjs';
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
test('a direct read retains the observed role and AJAX header and never needs the Hub Angular model',async()=>{
 const r=mainRuntime(),xhr=new r.XHR();xhr.open('GET',origin+'/qa/GetContractDetail?contractId=87654&userRoleId=23&_=cache');
 r.send({type:'read-course',course});await drain();assert.equal(r.calls.length,1);assert.equal(r.calls[0].url,origin+'/qa/GetContractDetail?contractId=12345&userRoleId=23');assert.equal(r.calls[0].options.headers['X-Requested-With'],'XMLHttpRequest');assert.equal(r.calls[0].options.cache,'no-store');assert.equal(r.context.window.angular,undefined);assert.ok(r.messages.some(m=>m.type==='course-fetch'));assert.ok(r.messages.some(m=>m.type==='course'));
 const learned=mainRuntime();learned.send({type:'learn-route',course,source:origin+'/qa/GetContractDetail?contractId=12345&userRoleId=24'});learned.send({type:'read-course',course});await drain();assert.equal(learned.calls[0].url,origin+'/qa/GetContractDetail?contractId=12345&userRoleId=24');
});
test('the existing Angular GET client can read immediately with its real role, without scope writes or a guessed endpoint',async()=>{
 const r=mainRuntime(),root={},scope={sessionInfo:{UserRoleId:41},contractDetail:{ListDiscount:'KEEP',GiftCode:'KEEP'},$apply:()=>{throw Error('Digest/model writes are forbidden');}},calls=[];
 r.context.document={querySelector:()=>root};
 const service={getContractDetail:params=>{calls.push(params);new r.XHR().open('GET',origin+'/qa/GetContractDetail?contractId='+params.contractId+'&userRoleId='+params.userRoleId);return Promise.resolve(raw());}};
 r.context.window.angular={element:()=>({injector:()=>({get:name=>name==='$rootScope'?scope:service})})};
 r.send({type:'read-course',course});await drain();assert.equal(calls.length,1);assert.equal(calls[0].contractId,'12345');assert.equal(calls[0].userRoleId,41);assert.equal(r.calls.length,0);assert.equal(scope.contractDetail.ListDiscount,'KEEP');assert.equal(scope.contractDetail.GiftCode,'KEEP');
 const result=r.messages.find(m=>m.type==='course');assert.ok(result);assert.equal(result.projection.source,origin+'/qa/GetContractDetail?contractId=12345&userRoleId=41');assert.ok(!JSON.stringify(result).includes('PRIVATE-DO-NOT-COPY'));
 const cancelled=mainRuntime();let resolve,aborted=0;const promise=new Promise(r=>{resolve=r;});promise.abort=()=>{aborted++;};cancelled.context.document={querySelector:()=>root};cancelled.context.window.angular={element:()=>({injector:()=>({get:name=>name==='$rootScope'?scope:{getContractDetail:params=>{new cancelled.XHR().open('GET',origin+'/qa/GetContractDetail?contractId='+params.contractId+'&userRoleId=41');return promise;}}})})};
 cancelled.send({type:'read-course',course});cancelled.send({type:'stop'});resolve(raw());await drain();assert.equal(aborted,1);assert.ok(!cancelled.messages.some(m=>m.type==='course'));
});
test('a managed inner frame projects its own request and sends only requested fields to its parent',async()=>{
 const r=mainRuntime({managed:true});await r.context.window.fetch(origin+'/qa/GetContractDetail?contractId=12345');await drain();assert.equal(r.messages.length,0);
 r.send({type:'activate',course},r.context.window.parent);assert.equal(r.messages.at(-1).type,'course');assert.equal(r.messages.at(-1).id,'qa-main');assert.ok(!JSON.stringify(r.messages).includes('PRIVATE-DO-NOT-COPY'));assert.equal(r.calls.length,1);
});
test('one requested CT invokes the authenticated lookup services and publishes only scoped rule metadata',async()=>{
 const r=mainRuntime(),f=hubFixture(),calls=[],root={};r.context.setTimeout=setTimeout;r.context.clearTimeout=clearTimeout;r.context.document={querySelector:()=>root};
 const service={
  getContractDetail:p=>{calls.push('detail');new r.XHR().open('GET',origin+'/api/Contract/GetContractDetail?contractId='+p.contractId+'&userRoleId='+p.userRoleId);return Promise.resolve(f.detail);},
  getContractInfoForUpdate:p=>(calls.push('info'),Promise.resolve(f.info)),getCoursePrice:p=>(calls.push('price'),Promise.resolve([f.price])),getApplicableGroupDiscount:p=>(calls.push('groups'),Promise.resolve(f.groups)),
  update:()=>{throw Error('Contract writes forbidden');},create:()=>{throw Error('Contract writes forbidden');}
 };
 r.context.window.angular={element:()=>({injector:()=>({get:name=>name==='$rootScope'?{sessionInfo:{UserRoleId:41}}:service})})};
 r.send({type:'read-course',course});await drain();const result=r.messages.find(m=>m.type==='course');assert.ok(result?.projection.hubPolicy);assert.deepEqual(calls,['detail','info','price','groups']);assert.equal(result.projection.hubPolicy.product.unitPrice,3225000);assert.ok(!JSON.stringify(result).includes('PRIVATE-NEVER-COPY'));assert.equal(r.calls.length,0);
});
function isolatedRuntime({blocked=false}={}){
 let clock=0,next=1;const listeners=[],timers=new Map(),deadlines=new Map(),messages=[],posts=[],frames=[];
 const root={querySelectorAll:()=>[]};
 class Clock extends Date{static now(){return clock;}}
 const context=vm.createContext({URL,Date:Clock,Promise,Set,Map,console,crypto:{randomUUID:()=> 'qa-agent'},location:{origin,pathname:'/home',href:origin+'/home'},setInterval:fn=>{const id=next++;timers.set(id,fn);return id;},clearInterval:id=>timers.delete(id),setTimeout:(fn,ms=0)=>{const id=next++;timers.set(id,fn);deadlines.set(id,clock+ms);return id;},clearTimeout:id=>{deadlines.delete(id);timers.delete(id);}});
 context.window={addEventListener:(type,fn)=>listeners.push({type,fn}),postMessage:m=>posts.push(m)};context.window.top=context.window;
 context.document={documentElement:{appendChild:e=>frames.push(e)},createElement:()=>{const e={style:{},setAttribute:(k,v)=>{e[k]=v;},addEventListener:(type,fn)=>{e[type]=fn;},remove:()=>{e.removed=true;},contentDocument:root,contentWindow:{location:{href:'about:blank'},postMessage:m=>posts.push(m)}};if(blocked)Object.defineProperty(e.contentWindow,'location',{get:()=>{throw Error('blocked');}});return e;}};
 const chromeMessages=[];context.chrome={runtime:{id:'qa-extension',sendMessage:async m=>{messages.push(m);return {};},onMessage:{addListener:fn=>chromeMessages.push(fn)}}};
 load(context,['core.js','report-core.js','voucher-core.js','index-core.js','course-core.js','course-network-core.js','reuse-agent.js']);
 const send=(m,sender={id:'qa-extension'})=>{let reply;chromeMessages[0](m,sender,v=>{reply=v;});return reply;};
 const packet=(m,source=context.window,host=origin)=>listeners.filter(l=>l.type==='message').forEach(l=>l.fn({source,origin:host,data:{channel,id:'qa-isolated',...m}}));
 const tick=ms=>{clock+=ms;for(const [id,fn]of [...timers]){if(!timers.has(id)||deadlines.has(id)&&clock<deadlines.get(id))continue;if(deadlines.has(id)){deadlines.delete(id);timers.delete(id);}fn();}};
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
function inertCourseDocument({empty=false,wrongStudent=false}={}){
 const element=(textContent,extra={})=>({tagName:'DIV',textContent,hidden:false,getAttribute:()=>null,getClientRects:()=>[],querySelectorAll:()=>[],...extra});
 const pairs=[['Contract No.',course.ct],['Student ID',wrongStudent?'QA-OTHER':course.student],['Price name','ATLS New Price 2026 Layer1'],['Hour/week','4 hrs/week'],['Package before discount','18 months'],['Giftcode No.','0'],['Discount apply','0']];
 const nodes=empty?[]:pairs.map(([label,value])=>element(label,{tagName:'LABEL',nextElementSibling:element(value)}));
 return {documentElement:{},querySelector:()=>null,querySelectorAll:s=>s.startsWith('h1,')?[element('Contract '+course.ct)]:s.startsWith('label,dt')?nodes:[]};
}
test('a static Course info page is fetched as inert HTML and completes without starting its app or creating an iframe',async()=>{
 const r=isolatedRuntime(),calls=[];r.context.AbortController=AbortController;r.context.DOMParser=class{parseFromString(){return inertCourseDocument();}};
 r.context.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,url,headers:{get:()=>null},text:async()=>'<html>synthetic Course info</html>'};};
 r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});r.packet({type:'route-missing'});await drain();
 assert.equal(calls.length,1);assert.equal(calls[0].url,course.url);assert.equal(calls[0].options.credentials,'same-origin');assert.equal(r.frames.length,0);assert.equal(r.messages.length,1);assert.equal(r.messages[0].payload.student,course.student);assert.equal(r.messages[0].payload.package,'18 months');assert.equal(r.timers.size,0);
});
test('inert HTML with a different student fails without storing inputs or opening a fallback tab',async()=>{
 const r=isolatedRuntime();r.context.AbortController=AbortController;r.context.DOMParser=class{parseFromString(){return inertCourseDocument({wrongStudent:true});}};r.context.fetch=async url=>({ok:true,url,headers:{get:()=>null},text:async()=>'<html>synthetic mismatch</html>'});
 r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});r.packet({type:'route-missing'});await drain();assert.equal(r.frames.length,0);assert.equal(r.messages[0].code,'course_unavailable');assert.equal(r.messages[0].payload,undefined);
});
test('DOM mutation completes a background iframe read without waiting for a polling timer',async()=>{
 const r=isolatedRuntime(),observers=[];r.context.MutationObserver=class{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});r.packet({type:'route-missing'});const f=r.frames[0];f.contentWindow.location.href=course.url;f.contentDocument=inertCourseDocument({empty:true});f.load();assert.equal(r.messages.length,0);assert.equal(observers.length,1);
 const full=inertCourseDocument();const queries=full.querySelectorAll;f.contentDocument.querySelectorAll=s=>queries(s).map(e=>({...e,getClientRects:()=>[{}],...(e.nextElementSibling?{nextElementSibling:{...e.nextElementSibling,getClientRects:()=>[{}]}}:{})}));observers[0].fn([]);await drain();assert.equal(r.messages.length,1);assert.equal(r.messages[0].payload.courseFee,'ATLS New Price 2026 Layer1');assert.equal(f.removed,true);assert.equal(observers[0].disconnected,true);
});

test('voucher and report readers use managed offscreen frames without navigating the Hub tab',()=>{
 for(const request of [{kind:'voucher',voucher:{code:'QA-SILENT'}},{kind:'report',report:'payment',month:'2026-10'}]){
  const r=isolatedRuntime();r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',duration:300000,...request});assert.equal(r.frames.length,1);
  assert.match(r.frames[0].name,/^promotion-hub:qa-isolated:qa-agent$/);assert.ok(r.frames[0].inert!==undefined);assert.equal(r.frames[0].sandbox,'allow-scripts allow-same-origin allow-forms');
  assert.equal(r.context.location.href,origin+'/home');r.send({type:'hub-agent-stop',id:'qa-isolated',agentKey:'qa-agent'});assert.equal(r.frames[0].removed,true);
 }
});
test('partial Course info cannot finish before the master CT Discount info renders',async()=>{
 const r=isolatedRuntime();r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});r.packet({type:'route-missing'});
 const f=r.frames[0],full=inertCourseDocument(),queries=full.querySelectorAll;let offersReady=false;
 const names='2026 October - Promotion Discount - 12 months;Sep/Oct 2026 - Tặng Tháng (TRẢ THẲNG) - All layer - Tặng 1 tháng';
 f.contentWindow.location.href=course.url;
 f.contentDocument={...full,querySelectorAll:s=>queries(s).filter(e=>offersReady||!['Giftcode No.','Discount apply'].includes(e.textContent)).map(e=>({...e,getClientRects:()=>[{}],...(e.nextElementSibling?{nextElementSibling:{...e.nextElementSibling,textContent:e.textContent==='Discount apply'?names:e.nextElementSibling.textContent,getClientRects:()=>[{}]}}:{})}))};
 f.load();r.tick(1000);await drain();assert.equal(r.messages.length,0);assert.ok(!f.removed);
 offersReady=true;r.tick(1000);await drain();assert.equal(r.messages.length,1);assert.equal(r.messages[0].payload.discount,names);assert.equal(r.messages[0].payload.giftcode,'0');assert.equal(f.removed,true);assert.equal(r.context.location.href,origin+'/home');
});
test('a responding direct API gets time to finish without booting a hidden page, and a slow CT has a bounded deadline',()=>{
 const r=isolatedRuntime();r.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});r.packet({type:'course-fetch'});r.tick(2000);assert.equal(r.frames.length,0);assert.equal(r.messages.length,0);
 const p={source:origin+'/qa/GetContractDetail?contractId=12345&userRoleId=23',contractId:'12345',ct:course.ct,student:course.student,fields:{giftcode:'0',discount:'2026 October - Promotion Discount - 18 months'},courses:[{courseFee:'ATLS',hoursPerWeek:'3 hrs/week',package:'18 months'}]};r.packet({type:'course',projection:p});assert.equal(r.messages.length,1);assert.equal(r.frames.length,0);assert.equal(r.timers.size,0);
 const slow=isolatedRuntime();slow.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});slow.packet({type:'course-fetch'});slow.tick(8001);assert.equal(slow.frames.length,1);slow.frames[0].contentWindow.location.href=course.url;slow.tick(6000);assert.equal(slow.messages.length,1);assert.ok(slow.messages[0].code);assert.equal(slow.frames[0].removed,true);assert.equal(slow.timers.size,0);
 const hung=isolatedRuntime();let signal;hung.context.AbortController=AbortController;hung.context.DOMParser=class{};hung.context.fetch=(url,options)=>{signal=options.signal;return new Promise(()=>{});};hung.send({type:'hub-agent-run',id:'qa-isolated',agentKey:'qa-agent',kind:'course',course});hung.packet({type:'course-fetch'});hung.tick(8001);hung.tick(6000);assert.equal(hung.messages[0].code,'course_unavailable');assert.equal(signal.aborted,true);assert.equal(hung.timers.size,0);
});
