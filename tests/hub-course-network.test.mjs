import {backgroundRuntime} from './helpers/existing-hub-runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {courseDetailEndpoint,projectContractDetail,parseContractDetailProjection,COURSE_NETWORK_CHANNEL} from '../src/core/hub-course-network.mjs';
const expected={ct:'QA2610-CT-000004',student:'QA-NETWORK',url:'https://hub24.apollo.vn:7777/contract/detail/12345'};
// The route is a fixture. Production discovers the actual observed route.
const api='https://hub24.apollo.vn:7777/qa/GetContractDetail?contractId=12345';
const record=()=>({ContractId:12345,ContractNo:expected.ct,StudentCode:expected.student,ContractTypeName:'Renew',ListGiftCode:[],ListDiscount:[],SellerName:'DO NOT COPY',Address:'DO NOT COPY',AccessToken:'DO NOT COPY',ListCourseInfo:[{ContractDetailId:11,ProductPackageId:71,PriceId:589,HowweekId:8,ProductId:139,ProductGroupName:'ATLS',PriceName:'ATLS - New Price 2026 - Layer 1',HowWeekName:'3 hrs/week',ProductPackageName:'2 months',CourseFee:7200000}]});
test('only an observed GET GetContractDetail for the detail URL contractId is accepted',()=>{
 assert.equal(courseDetailEndpoint(api,expected.url),api);assert.equal(courseDetailEndpoint(api+'&_=123',expected.url),api);
 for(const value of [api.replace('12345','99999'),api+'&contractId=12345',api+'&token=secret',api.replace('hub24.apollo.vn:7777','example.com'),api.replace('GetContractDetail','UpdateContractDetail')])assert.equal(courseDetailEndpoint(value,expected.url),null);
 assert.equal(courseDetailEndpoint(api,expected.url,'POST'),null);
});
test('ListCourseInfo projection keeps only explicit course names and excludes numeric lookup IDs and personal fields',()=>{
 const p=projectContractDetail({Data:record()},api,expected.url),result=parseContractDetailProjection(p,expected);assert.equal(result.payload.courseFee,record().ListCourseInfo[0].PriceName);assert.equal(result.payload.hoursPerWeek,'3 hrs/week');assert.equal(result.payload.package,'2 months');assert.equal(result.payload.giftcode,'0');assert.equal(result.payload.discount,'0');assert.equal(result.payload.groupKoc,'ATLS');assert.equal(result.payload.contractType,'Renew');assert.ok(!JSON.stringify(p).includes('DO NOT COPY'));assert.ok(!JSON.stringify(p).includes('7200000'));
 const raw=record();delete raw.ListCourseInfo[0].PriceName;delete raw.ListCourseInfo[0].HowWeekName;delete raw.ListCourseInfo[0].ProductPackageName;
 const noNames=parseContractDetailProjection(projectContractDetail(raw,api,expected.url),expected).payload;assert.equal(noNames.courseFee,null);assert.equal(noNames.hoursPerWeek,null);assert.equal(noNames.package,null);
});
test('network input refuses another contract, student, ID or more than one course',()=>{
 for(const [field,value,error]of [['ContractNo','QA2610-CT-009999','identity'],['ContractId',99999,'identity'],['StudentCode','QA-OTHER','student']]){const raw=record();raw[field]=value;assert.equal(parseContractDetailProjection(projectContractDetail(raw,api,expected.url),expected).error,error);}
 const raw=record();raw.ListCourseInfo.push({...raw.ListCourseInfo[0],PriceName:'ATLS - Layer 2'});assert.equal(parseContractDetailProjection(projectContractDetail(raw,api,expected.url),expected).error,'conflict');raw.ListCourseInfo=[];assert.equal(parseContractDetailProjection(projectContractDetail(raw,api,expected.url),expected).error,'empty');
});
test('partial API fields may use independently verified DOM fields without inventing a numeric lookup name',()=>{
 const raw=record();delete raw.ListCourseInfo[0].ProductPackageName;delete raw.ContractNo;
 const p=projectContractDetail(raw,api,expected.url);assert.equal(parseContractDetailProjection(p,expected).error,'identity');
 const result=parseContractDetailProjection(p,expected,{...expected,courseFee:null,hoursPerWeek:null,package:'2 months'});assert.equal(result.payload.package,'2 months');assert.equal(result.payload.courseFee,record().ListCourseInfo[0].PriceName);assert.equal(result.via,'network+dom');
});
function networkRuntime(){
 const messages=[],listeners=[],calls=[],loads=[];
 class XHR{open(method,url){this.method=method;this.url=url;}addEventListener(type,fn){loads.push({xhr:this,fn});}}
 const originalOpen=XHR.prototype.open,body=JSON.stringify(record()),bytes=new TextEncoder().encode(body);
 const originalFetch=async url=>{calls.push(url);return {ok:true,url,clone:()=>({body:{getReader:()=>{let sent=false;return {read:async()=>sent?{done:true}:(sent=true,{done:false,value:bytes}),cancel:async()=>{}};}}})};};
 const context=vm.createContext({URL,Date,Promise,WeakMap,TextDecoder,console,location:{origin:'https://hub24.apollo.vn:7777',pathname:'/contract/detail/12345',href:expected.url}});
 context.window={fetch:originalFetch,XMLHttpRequest:XHR,addEventListener:(type,fn)=>listeners.push(fn),postMessage:packet=>messages.push(packet)};context.window.top=context.window;
 for(const name of ['course-network-core.js','course-tap.js'])vm.runInContext(fs.readFileSync(new URL('../reference/hub/'+name,import.meta.url),'utf8'),context);
 const send=packet=>listeners.forEach(fn=>fn({source:context.window,origin:'https://hub24.apollo.vn:7777',data:{channel:COURSE_NETWORK_CHANNEL,...packet}}));
 return {context,messages,calls,loads,XHR,originalOpen,originalFetch,send};
}
test('the observer buffers the page GET until activation, projects it, and issues no additional request',async()=>{
 const r=networkRuntime();await r.context.window.fetch(api);for(let i=0;i<20;i++)await Promise.resolve();assert.equal(r.calls.length,1);assert.ok(!r.messages.some(m=>m.type==='snapshot'));
 r.send({type:'activate',id:'qa-network',url:expected.url});const snapshot=r.messages.find(m=>m.type==='snapshot');assert.ok(snapshot);assert.equal(snapshot.projection.ct,expected.ct);assert.ok(!JSON.stringify(snapshot).includes('DO NOT COPY'));
 r.send({type:'release',id:'qa-network'});assert.equal(r.context.window.fetch,r.originalFetch);assert.equal(r.XHR.prototype.open,r.originalOpen);
});
test('the XHR observer ignores unrelated IDs and reads the matching response without sending it again',()=>{
 const r=networkRuntime();r.send({type:'activate',id:'qa-xhr',url:expected.url});
 const xhr=new r.XHR();xhr.open('GET',api);xhr.status=200;xhr.responseType='json';xhr.response=record();xhr.responseURL=api;for(const load of r.loads)load.fn();assert.ok(r.messages.some(m=>m.type==='snapshot'));assert.equal(r.calls.length,0);
 const before=r.messages.length,bad=new r.XHR();bad.open('GET',api.replace('12345','99999'));bad.status=200;bad.responseType='json';bad.response=record();bad.responseURL=api.replace('12345','99999');for(const load of r.loads.filter(l=>l.xhr===bad))load.fn();assert.equal(r.messages.length,before);
});
test('Course info success, failure and navigation leave the existing Hub tab untouched',async()=>{
 const r=backgroundRuntime();
 for(const message of [{payload:parseContractDetailProjection(projectContractDetail(record(),api,expected.url),expected).payload},{error:true,code:'hub_login',message:'Đăng nhập Hub.'},{error:true,code:'hub_timeout',message:'Hết giờ.'}]){
  await r.send({type:'course-start',id:'qa-silent',course:expected});
  await r.send({type:'agent-complete',id:'qa-silent',agentKey:'qa-agent',...message},20,r.tabs[0].url);
  assert.equal(r.store.job,undefined);
 }
 await r.send({type:'course-start',id:'qa-auth-redirect',course:expected});r.updated[0](20,{url:'https://hub24.apollo.vn:10000/login?returnUrl=qa'});await r.flush();assert.equal(r.store.job,undefined);
 assert.deepEqual(r.mutations,[]);assert.equal(r.tabs[0].url,'https://hub24.apollo.vn:7777/home');assert.ok(r.messages.some(m=>m.code==='hub_login'));
});
async function bootstrapRuntime(job){
 const messages=[],posted=[],listeners=[],context=vm.createContext({URL,Promise,Date,console,location:{origin:'https://hub24.apollo.vn:7777',href:expected.url,pathname:'/contract/detail/12345'}});
 context.window={addEventListener:(type,fn)=>listeners.push(fn),postMessage:m=>posted.push(m)};context.window.top=context.window;context.chrome={runtime:{sendMessage:async m=>{messages.push(m);return m.type==='context'?job:{};}}};
 for(const name of ['course-core.js','course-network-core.js','course-bootstrap.js'])vm.runInContext(fs.readFileSync(new URL('../reference/hub/'+name,import.meta.url),'utf8'),context);
 for(let i=0;i<12;i++)await Promise.resolve();
 const send=(data,origin='https://hub24.apollo.vn:7777')=>listeners.forEach(fn=>fn({source:context.window,origin,data:{channel:COURSE_NETWORK_CHANNEL,...data}}));
 return {context,messages,posted,send};
}
test('document-start network extraction can complete H:L before the visible DOM renders',async()=>{
 const r=await bootstrapRuntime({kind:'course',id:'qa-fast',course:expected});assert.ok(r.posted.some(m=>m.type==='activate'));
 r.send({type:'snapshot',id:'qa-fast',projection:projectContractDetail(record(),api,expected.url)});
 for(let i=0;i<12;i++)await Promise.resolve();const complete=r.messages.find(m=>m.type==='course-complete');assert.ok(complete);assert.equal(complete.payload.package,'2 months');assert.equal(complete.payload.hoursPerWeek,'3 hrs/week');assert.ok(r.posted.some(m=>m.type==='release'));assert.equal(r.context.PromotionHubCourseWire.done,true);
});
test('bootstrap ignores wrong jobs/origins and leaves incomplete data for the verified DOM fallback',async()=>{
 const r=await bootstrapRuntime({kind:'course',id:'qa-partial',course:expected}),raw=record();delete raw.ListCourseInfo[0].HowWeekName;const projection=projectContractDetail(raw,api,expected.url);
 r.send({type:'snapshot',id:'qa-other',projection});r.send({type:'snapshot',id:'qa-partial',projection},'https://example.com');assert.equal(r.context.PromotionHubCourseWire.projection,null);
 r.send({type:'snapshot',id:'qa-partial',projection});assert.equal(r.context.PromotionHubCourseWire.done,false);assert.ok(r.context.PromotionHubCourseWire.projection);assert.ok(!r.messages.some(m=>m.type==='course-complete'));
});
test('ordinary Hub tabs with no requested job release the page observers in either script load order',async()=>{
 const r=await bootstrapRuntime(null);assert.ok(r.posted.some(m=>m.type==='release'&&m.id===null));r.send({type:'ready'});assert.equal(r.posted.filter(m=>m.type==='release').length,2);assert.ok(!r.messages.some(m=>m.type==='course-complete'));
});
