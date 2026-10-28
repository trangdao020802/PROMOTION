import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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
