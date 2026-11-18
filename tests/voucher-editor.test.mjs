import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';

const compiled=build({entryPoints:[new URL('../src/local/VoucherEditor.tsx',import.meta.url).pathname],bundle:true,write:false,format:'cjs',platform:'node',jsx:'transform',plugins:[{name:'voucher-editor-test',setup(builder){
 builder.onResolve({filter:/^react$/},()=>({path:'react',namespace:'qa'}));
 builder.onResolve({filter:/hub-voucher-bridge\.mjs$/},()=>({path:'bridge',namespace:'qa'}));
 builder.onLoad({filter:/.*/,namespace:'qa'},file=>({contents:file.path==='react'
  ?'export const {useState,useRef,useEffect,useCallback}=globalThis.qa.react; export default globalThis.qa.react;'
  :'export const VOUCHER_BRIDGE_VERSION="1.6.26"; export const readHubVoucher=(...args)=>globalThis.qa.read(...args);',loader:'js'}));
}}]});
const profile={ct:'QA2611-CT-000001',studentId:'QA-EDITOR',studentName:'HỌC VIÊN KIỂM THỬ',center:'QA1'};
const payload=(code,rate)=>({code,url:'https://hub24.apollo.vn:7777/giftcode/detail/12345',label:'QA voucher',center:'QA1',startDate:'2026-11-01',endDate:'2026-11-30',type:'percent',amount:null,rate,minimum:0,maximum:0,status:'ACTIVE',creator:'QA',description:'',studentId:'',studentName:'',checkedAt:'2026-11-18T07:00:00.000Z'});
function nodes(tree){return tree&&typeof tree==='object'?[tree,...(tree.children??[]).flat(Infinity).flatMap(nodes)]:[];}
async function mountEditor(initial={}){
 const hooks=[],timers=new Map(),requests=[],effects=[];
 let cursor=0,clock=0,nextTimer=0,pending=false,tree,Editor;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
 const react={
  createElement:(type,props,...children)=>({type,props:props??{},children}),
  useState(value){const index=cursor++;hooks[index]??={value:typeof value==='function'?value():value};return [hooks[index].value,next=>{const value=typeof next==='function'?next(hooks[index].value):next;if(!Object.is(value,hooks[index].value)){hooks[index].value=value;pending=true;}}];},
  useRef(value){const index=cursor++;hooks[index]??={current:value};return hooks[index];},
  useCallback(callback,deps){const index=cursor++;if(!same(hooks[index]?.deps,deps))hooks[index]={callback,deps};return hooks[index].callback;},
  useEffect(callback,deps){const index=cursor++;if(!same(hooks[index]?.deps,deps)){const old=hooks[index];hooks[index]={deps};effects.push(()=>{old?.cleanup?.();hooks[index].cleanup=callback();});}},
 };
 const qa={react,read:(code,options)=>new Promise((resolve,reject)=>requests.push({code,options,resolve,reject}))};
 const module={exports:{}},context=vm.createContext({qa,module,exports:module.exports,AbortController,URL,console,window:{addEventListener(){},removeEventListener(){}},setTimeout:(callback,ms)=>{const id=++nextTimer;timers.set(id,{callback,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext((await compiled).outputFiles[0].text,context);Editor=module.exports.default;
 const props={initial,profile,onSave:async value=>value};
 function render(){
  do{pending=false;cursor=0;tree=Editor(props);for(const effect of effects.splice(0))effect();}while(pending);
 }
 async function settle(){for(let turn=0;turn<16;turn++){await Promise.resolve();if(pending)render();}}
 render();
 return {
  requests,settle,
  code:()=>nodes(tree).find(node=>node.type==='input'&&node.props.maxLength===150),
  rate:()=>nodes(tree).find(node=>node.type==='input'&&Number(node.props.max)===100),
  button:()=>nodes(tree).find(node=>node.type==='button'&&node.children.includes('Tìm & tự điền từ Hub')),
  async enter(code){this.code().props.onChange({target:{value:code}});await settle();},
  async advance(ms){clock+=ms;for(const [id,timer] of [...timers])if(timer.at<=clock){timers.delete(id);timer.callback();}await settle();},
  async clickLookup(){this.button().props.onClick();await settle();},
  text:()=>JSON.stringify(tree),
 };
}
test('typing a new full Giftcode starts one lookup after the pause without needing blur',async()=>{
 const editor=await mountEditor();await editor.enter('QA-NEW-15');
 await editor.advance(449);assert.equal(editor.requests.length,0);
 await editor.advance(1);assert.equal(editor.requests.length,1);
 assert.equal(editor.requests[0].code,'QA-NEW-15');assert.equal(editor.requests[0].options.force,false);
 assert.equal(editor.code().props.disabled,false);
 editor.requests[0].resolve(payload('QA-NEW-15',.15));await editor.settle();
 assert.ok(editor.rate(),editor.text());assert.equal(editor.rate().props.value,15);
 editor.code().props.onBlur();await editor.advance(1000);assert.equal(editor.requests.length,1);
});
test('changing the code cancels its lookup and a late response cannot overwrite the replacement',async()=>{
 const editor=await mountEditor();await editor.enter('QA-FIRST');await editor.advance(450);
 const first=editor.requests[0];await editor.enter('QA-SECOND');
 assert.equal(first.options.signal.aborted,true);await editor.advance(450);
 assert.equal(editor.requests.length,2);assert.equal(editor.requests[1].code,'QA-SECOND');
 first.resolve(payload('QA-FIRST',.15));await editor.settle();
 assert.equal(editor.rate(),undefined);assert.equal(editor.code().props.value,'QA-SECOND');
 editor.requests[1].resolve(payload('QA-SECOND',.25));await editor.settle();
 assert.ok(editor.rate(),editor.text());assert.equal(editor.rate().props.value,25);assert.ok(!editor.text().includes('QA-FIRST'));
});
test('an incomplete saved Voucher uses its detail URL and the refresh button forces a fresh read',async()=>{
 const code='QA-SAVED',url='https://hub24.apollo.vn:7777/giftcode/detail/12345';
 const editor=await mountEditor({code,hubUrl:url,status:'PENDING'});await editor.advance(450);
 assert.equal(editor.requests.length,1);assert.equal(editor.requests[0].options.url,url);
 editor.requests[0].resolve(payload(code,.15));await editor.settle();
 await editor.clickLookup();assert.equal(editor.requests.length,2);assert.equal(editor.requests[1].options.force,true);
 editor.requests[1].resolve(payload(code,.2));await editor.settle();assert.ok(editor.rate(),editor.text());assert.equal(editor.rate().props.value,20);
});
