import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code='QA-FULL-GIFTCODE-15',url='https://hub24.apollo.vn:7777/giftcode/detail/12345';
const node=(textContent='',extra={})=>({textContent,hidden:false,getAttribute:()=>null,getClientRects:()=>[{}],querySelector:()=>null,querySelectorAll:()=>[],closest:()=>null,...extra});
function table(head,data){
 const rows=data.map(cells=>({querySelectorAll:()=>cells.map(c=>typeof c==='string'?node(c):c)}));
 return {querySelectorAll:selector=>selector==='thead th'?head.map(s=>node(s)):selector==='tbody tr'?rows:[],closest:()=>null};
}
function runtime(document,job,{send,location=url}={}){
 const messages=[],ticks=[];let clock=0;
 class Clock extends Date{static now(){return clock;}}
 const context=vm.createContext({URL,Date:Clock,console,Promise,Event:class{constructor(type){this.type=type;}},HTMLInputElement:Input,document,location:{origin:'https://hub24.apollo.vn:7777',pathname:new URL(location).pathname,href:location},setInterval:f=>(ticks.push(f),ticks.length),clearInterval:()=>{},MutationObserver:class{observe(){}disconnect(){}}});
 context.window={};context.window.top=context.window;
 context.chrome={runtime:{sendMessage:async m=>{messages.push(m);if(m.type==='context')return job;return send?.(m)??{};}}};
 vm.runInContext(fs.readFileSync(new URL('../reference/hub/core.js',import.meta.url),'utf8'),context);
 vm.runInContext(fs.readFileSync(new URL('../reference/hub/voucher-core.js',import.meta.url),'utf8'),context);
 vm.runInContext(fs.readFileSync(new URL('../reference/hub/hub-voucher.js',import.meta.url),'utf8'),context);
 return {messages,advance:async ms=>{clock+=ms;for(const f of ticks)await f();},settle:async()=>{for(let i=0;i<12;i++)await Promise.resolve();}};
}
class Input{
 constructor(name,value,extra={}){this.name=name;this._value=value;this.id='';this.placeholder='';this.type='text';this.tagName='INPUT';Object.assign(this,extra);}
 get value(){return this._value;}set value(value){this._value=value;}
 dispatchEvent(){}getAttribute(){return null;}getClientRects(){return this.hidden?[]:[{}];}closest(){return null;}
}
test('the Hub reader fills the listing search and observed date range, then follows only the result link',async()=>{
 const keyword=new Input('s',''),dates=new Input('applyDate','01-10-2026 to 31-10-2026'),secret=new Input('password','',{type:'password',hidden:true});
 Object.defineProperty(secret,'value',{get(){throw Error('Credential read forbidden');}});
 let clicked=0;
 const search=node('Search',{click:()=>{clicked++;}}),never=node('Update',{click:()=>{throw Error('Record updates forbidden');}});
 const results=table(['Voucher name','Conditions','Center','Start date','End date','Status','Created by'],[[node('QA Voucher',{querySelectorAll:()=>[node('QA Voucher',{href:url})]}),'Minimum: 0 đ Discount amount: 15% Maximum: 0 đ','North, South','2026-09-05 00:00','2026-12-31 23:59','Being applied','QA APPROVER']]);
 const document={documentElement:{},querySelectorAll:selector=>selector==='input'?[keyword,dates,secret]:selector==='input[type="password"]'?[secret]:selector.startsWith('button,')?[search,never]:selector==='table'&&clicked?[results]:[]};
 const r=runtime(document,{id:'job',kind:'voucher',voucher:{code},stage:'voucher-search'},{location:'https://hub24.apollo.vn:7777/giftcode/manage',send:m=>m.type==='voucher-search-applied'?{apply:true}:{}});
 await r.settle();assert.equal(keyword.value,code);assert.equal(dates.value,'01-01-2000 to 31-12-2099');assert.equal(clicked,1);
 await r.advance(1000);await r.settle();assert.equal(r.messages.at(-1).type,'voucher-detail');assert.equal(r.messages.at(-1).row.url,url);
});
test('the Hub reader extracts detail controls and the exact code row without clicking Update',async()=>{
 const labels=[],controls=new Map();
 for(const [label,value,unit='']of [['Voucher name *','QA Voucher'],['Code prefix *','QA-FULL'],['Discount amount *','15','%'],['Minimum','0'],['Maximum','0'],['Start date *','05/09/2026 00:00'],['End date *','31/12/2026 23:59'],['Status','Active']]){
  const id='control-'+labels.length,control=new Input(id,value,{parentElement:node('',{querySelectorAll:selector=>selector.startsWith('input')?[control]:unit?[node(unit)]:[]})});controls.set(id,control);labels.push(node(label,{getAttribute:key=>key==='for'?id:null}));
 }
 const codes=table(['No.','Giftcode No.','Status'],[['1',code,'Used']]);
 const document={documentElement:{},getElementById:id=>controls.get(id),querySelectorAll:selector=>selector==='label,dt'?labels:selector==='table'?[codes]:[]};
 const r=runtime(document,{id:'job',kind:'voucher',voucher:{code},stage:'voucher-detail',url,list:{center:'North, South',creator:'QA APPROVER'}});await r.settle();await r.advance(1000);await r.settle();
 const result=r.messages.find(m=>m.type==='voucher-complete');assert.ok(result);assert.equal(result.payload.code,code);assert.equal(result.payload.rate,.15);assert.equal(result.payload.startDate,'2026-09-05');assert.equal(result.payload.center,'North, South');
 const separate='https://hub24.apollo.vn:7777/giftcode/listgiftcode/12345';
 const listRuntime=runtime(document,{id:'job-list',kind:'voucher',voucher:{code},stage:'voucher-codes',url,codesUrl:separate,detailPairs:[{label:'Voucher name',value:'QA Voucher'},{label:'Discount amount',value:'15',unit:'%'}],list:{center:'North, South'}},{location:separate});await listRuntime.settle();await listRuntime.advance(1000);await listRuntime.settle();assert.equal(listRuntime.messages.find(m=>m.type==='voucher-complete')?.payload.rate,.15);
});
function discountDocument(value,unit,tables=[]){
 const control=new Input('discount',value),inner=node('',{querySelectorAll:selector=>selector.startsWith('input')?[control]:[]}),group=node('',{querySelectorAll:selector=>selector.startsWith('input')?[control]:[node(unit)]});inner.parentElement=group;control.parentElement=inner;
 // Minimum/Maximum have VND units elsewhere in the row, never the discount.
 group.parentElement=node('',{querySelectorAll:selector=>selector.startsWith('input')?[control,new Input('minimum','0'),new Input('maximum','0')]:[node('đ')]});
 const label=node('Discount amount *',{getAttribute:key=>key==='for'?'discount':null}),codes=table(['Giftcode No.','Status'],[[code,'Used']]);
 return {documentElement:{},getElementById:id=>id==='discount'?control:null,querySelectorAll:selector=>selector==='label,dt'?[label]:selector==='table'?[...tables,codes]:[]};
}
test('nested Discount amount suffix selects VND or percent and never reads the neighboring Maximum unit',async()=>{
 for(const [value,unit,type,amount,rate]of [['2.000.000','đ','amount',2000000,null],['15','%','percent',null,.15]]){
  const centers=table(['Center code','Center name'],[['HN15.VP','QA CENTER']]),document=discountDocument(value,unit,[centers]);
  const r=runtime(document,{id:'units',kind:'voucher',voucher:{code},stage:'voucher-detail',url,list:{center:'North, South'}});await r.settle();await r.advance(1000);await r.settle();
  const result=r.messages.find(m=>m.type==='voucher-complete');assert.ok(result,JSON.stringify(r.messages));assert.equal(result.payload.type,type);assert.equal(result.payload.amount,amount);assert.equal(result.payload.rate,rate);assert.equal(result.payload.center,'HN15.VP');
 }
 const r=runtime(discountDocument('2.000.000',''),{id:'unknown-unit',kind:'voucher',voucher:{code},stage:'voucher-detail',url});await r.settle();await r.advance(1000);await r.settle();assert.equal(r.messages.at(-1).type,'voucher-failure');assert.equal(r.messages.at(-1).reason,'unit');
});
test('Center code scope includes all observed pages and survives the separate List gift code stage',async()=>{
 let page=1,clicks=0;
 const next=node('Next',{getAttribute:key=>key==='aria-disabled'?String(page===2):null,click:()=>{page=2;clicks++;}});
 const wrapper=node('',{querySelector:selector=>selector==='.dataTables_info'?node('Showing '+(page===1?'1 to 1':'2 to 2')+' of 2 entries'):selector.startsWith('.dataTables_paginate')?next:null});
 const centers={querySelectorAll:selector=>selector==='thead th'?[node('Center code')]:selector==='tbody tr'?[{querySelectorAll:()=>[node(page===1?'HN15.VP':'HN22.NVO')]}]:[],closest:()=>wrapper};
 const document=discountDocument('2.000.000','đ',[centers]);
 const r=runtime(document,{id:'pages',kind:'voucher',voucher:{code},stage:'voucher-detail',url,list:{center:'North, South'}});await r.settle();await r.advance(1000);await r.settle();assert.equal(clicks,1);assert.equal(r.messages.some(m=>m.type==='voucher-complete'),false);
 await r.advance(1000);await r.settle();assert.equal(r.messages.find(m=>m.type==='voucher-complete')?.payload.center,'HN15.VP, HN22.NVO');
 const separate='https://hub24.apollo.vn:7777/giftcode/listgiftcode/12345';
 const codes=table(['Giftcode No.','Center code','Status'],[['OTHER-CODE','HN99.OTHER','Used'],[code,'HN15.VP','Used']]);
 const codeDocument={documentElement:{},querySelectorAll:selector=>selector==='table'?[codes]:[]};
 const read=runtime(codeDocument,{id:'codes-center',kind:'voucher',voucher:{code},stage:'voucher-codes',url,codesUrl:separate,detailPairs:[{label:'Discount amount',value:'2.000.000',unit:'đ'},{label:'Center code',value:'HN15.VP, HN22.NVO'}],list:{center:'North, South'}},{location:separate});await read.settle();await read.advance(1000);await read.settle();assert.equal(read.messages.find(m=>m.type==='voucher-complete')?.payload.center,'HN15.VP');
});
