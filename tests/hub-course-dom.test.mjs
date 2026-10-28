import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {coursePageFromDocument,parseCoursePage} from '../src/core/hub-course.mjs';
test('the Hub Contract reader reads labeled H:L controls and never inspects credential values',async()=>{
 const ct='QA2610-CT-000007',student='QA-DOM',url='https://hub24.apollo.vn:7777/contract/detail/12345',nodes=[],controls=new Map(),messages=[],ticks=[];
 const node=(textContent='',extra={})=>({textContent,hidden:false,getAttribute:()=>null,getClientRects:()=>[{}],querySelectorAll:()=>[],...extra});
 for(const [label,value]of [['Student ID',student],['Price name *','ATLS - New Price 2026 - Layer 1'],['Hour/week','3 hrs/week'],['Package before discount','12 months'],['Giftcode No.','QA-FULL-CODE'],['Discount apply','2026 October - Promotion Discount - 12 months;2026 October - Promotion Month - 12 months']]){
  const id='field-'+nodes.length;controls.set(id,node('',{tagName:'INPUT',name:id,value}));nodes.push(node(label,{getAttribute:k=>k==='for'?id:null}));
 }
 const hiddenPassword=node('',{hidden:true});Object.defineProperty(hiddenPassword,'value',{get(){throw Error('Secret access forbidden');}});
 const document={documentElement:{},getElementById:id=>controls.get(id),querySelectorAll:s=>s==='input[type="password"]'?[hiddenPassword]:s.startsWith('h1,')?[node('Contract '+ct)]:s.startsWith('label,dt')?nodes:[]};
 let clock=0;class Clock extends Date{static now(){return clock;}}
 const context=vm.createContext({URL,Date:Clock,Promise,console,document,location:{origin:'https://hub24.apollo.vn:7777',href:url,pathname:'/contract/detail/12345'},setInterval:f=>(ticks.push(f),ticks.length),clearInterval:()=>{},MutationObserver:class{observe(){}disconnect(){}}});
 context.window={};context.window.top=context.window;context.chrome={runtime:{sendMessage:async m=>{messages.push(m);return m.type==='context'?{id:'qa-course',kind:'course',course:{ct,student,url}}:{};}}};
 for(const name of ['core.js','course-core.js','hub-course.js'])vm.runInContext(fs.readFileSync(new URL('../reference/hub/'+name,import.meta.url),'utf8'),context);
 for(let i=0;i<12;i++)await Promise.resolve();clock=1000;for(const tick of ticks)tick();for(let i=0;i<12;i++)await Promise.resolve();
 const result=messages.find(m=>m.type==='course-complete');assert.ok(result);assert.equal(result.payload.ct,ct);assert.equal(result.payload.student,student);assert.equal(result.payload.courseFee,'ATLS - New Price 2026 - Layer 1');assert.equal(result.payload.giftcode,'QA-FULL-CODE');assert.equal(result.payload.discount,'2026 October - Promotion Discount - 12 months;2026 October - Promotion Month - 12 months');
});
const ct='QA2610-CT-000007',student='QA-DOM',url='https://hub24.apollo.vn:7777/contract/detail/12345';
const element=(textContent='',extra={})=>({tagName:'DIV',textContent,hidden:false,getAttribute:()=>null,getClientRects:()=>[{}],querySelectorAll:()=>[],...extra});
function readonly({nested=false,duplicate=false,wrongStudent=false}={}){
 const labels=[];
 const add=(label,value)=>{
  const valueNode=element(value),node=element(label,{tagName:'LABEL'});labels.push(node);
  if(nested){const column=element(label,{nextElementSibling:valueNode,querySelectorAll:()=>[node]});node.parentElement=column;column.parentElement=element(label+' '+value,{querySelectorAll:()=>[node]});labels.push(column);}
  else node.nextElementSibling=valueNode;
 };
 for(const [label,value]of [['Contract No.',ct],['Student ID',wrongStudent?'QA-OTHER':student],['Price name','ATLS - New Price 2026 - Layer 1'],['Price type','Month'],['Package','2 months'],['Hour/week','3 hrs/week'],['Course fee','7.200.000 VNĐ'],['Discount','0 VNĐ'],['Total fee','7.200.000 VNĐ'],['Total months','2 Months'],['Course hour','25 Hours'],['Giftcode No.','0'],['Discount apply','0']])add(label,value);
 if(duplicate)add('Price name','ATLS - New Price 2026 - Layer 2');
 return {documentElement:{},getElementById:()=>null,querySelectorAll:s=>s.startsWith('h1,')?[element('Contract detail')]:s.startsWith('label,dt')?labels:[]};
}
test('read-only neighboring columns and nested label columns match the supplied Course info layout',()=>{
 for(const nested of [false,true]){const page=coursePageFromDocument(readonly({nested})),result=parseCoursePage({url,...page},{ct,student,url});assert.ok(result.payload,JSON.stringify(result));assert.equal(result.payload.courseFee,'ATLS - New Price 2026 - Layer 1');assert.equal(result.payload.hoursPerWeek,'3 hrs/week');assert.equal(result.payload.package,'2 months');assert.equal(result.payload.giftcode,'0');assert.ok(!page.pairs.some(p=>p.value.includes('7.200.000')));}
 assert.equal(parseCoursePage({url,...coursePageFromDocument(readonly({duplicate:true}))},{ct,student,url}).error,'conflict');
 assert.equal(parseCoursePage({url,...coursePageFromDocument(readonly({wrongStudent:true}))},{ct,student,url}).error,'student');
});
test('background DOM activity cannot reset the Course info stability clock',async()=>{
 const document=readonly({nested:true}),messages=[],ticks=[],observers=[];let clock=0;
 class Clock extends Date{static now(){return clock;}}
 const context=vm.createContext({URL,Date:Clock,Promise,console,document,location:{origin:'https://hub24.apollo.vn:7777',href:url,pathname:'/contract/detail/12345'},setInterval:f=>(ticks.push(f),ticks.length),clearInterval:()=>{},MutationObserver:class{constructor(f){observers.push(f);}observe(){}disconnect(){}}});
 context.window={};context.window.top=context.window;context.chrome={runtime:{sendMessage:async m=>{messages.push(m);return m.type==='context'?{id:'qa-readonly',kind:'course',course:{ct,student,url}}:{};}}};
 for(const name of ['core.js','course-core.js','hub-course.js'])vm.runInContext(fs.readFileSync(new URL('../reference/hub/'+name,import.meta.url),'utf8'),context);
 for(let i=0;i<12;i++)await Promise.resolve();
 for(let i=0;i<20;i++){clock+=50;for(const observe of observers)observe([{type:'childList',target:{textContent:'Unrelated widget update'}}]);for(const tick of ticks)tick();}
 for(let i=0;i<12;i++)await Promise.resolve();assert.equal(messages.filter(m=>m.type==='course-complete').length,1);assert.ok(!messages.some(m=>m.type==='course-failure'));
});
test('the extension forwards a specific Course info failure only from the bound Hub tab',async()=>{
 const messages=[],store={},listeners=[];
 const chrome={storage:{session:{get:async key=>({[key]:store[key]}),set:async value=>Object.assign(store,value),remove:async key=>delete store[key]}},tabs:{create:async()=>({id:20}),update:async()=>{},remove:async()=>{},sendMessage:async(id,m)=>messages.push({id,...m}),onRemoved:{addListener:()=>{}},onUpdated:{addListener:()=>{}}},runtime:{onMessage:{addListener:f=>listeners.push(f)}}};
 const context=vm.createContext({chrome,URL,console,Date,Promise,setTimeout,clearTimeout});context.importScripts=(...names)=>{for(const name of names)vm.runInContext(fs.readFileSync(new URL('../reference/hub/'+name,import.meta.url),'utf8').replaceAll('https://promotion-installment.trangdao2802.chatgpt.site','https://promotion-hub-2026.roundskunk11.chatgpt.site'),context);};
 vm.runInContext(fs.readFileSync(new URL('../reference/hub/background.js',import.meta.url),'utf8'),context);
 const send=(m,tab=10,location='https://promotion-hub-2026.roundskunk11.chatgpt.site/')=>new Promise(resolve=>listeners[0](m,{frameId:0,tab:{id:tab},documentId:'qa-doc',url:location},resolve));
 await send({type:'course-start',id:'qa-course-failure',course:{ct,student,url}});
 await send({type:'course-failure',id:'qa-course-failure',reason:'conflict',fields:['courseFee']},21,url);assert.ok(store.job);assert.ok(!messages.some(m=>m.type==='error'));
 await send({type:'course-failure',id:'qa-course-failure',reason:'conflict',fields:['courseFee','password=value']},20,url);assert.equal(store.job,undefined);const error=messages.at(-1);assert.equal(error.code,'course_unavailable');assert.match(error.message,/nhiều giá trị/);assert.match(error.message,/courseFee/);assert.ok(!JSON.stringify(error).includes('password'));
});
