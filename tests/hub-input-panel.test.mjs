import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';

// Exercise the panel's real click handler and local API routes. A static host
// returns index.html for /api/*, which must never be used for browser data.
const reactStub=`
export const useMemo=f=>f();
export const useRef=value=>({current:value});
export const useEffect=()=>{};
export const useState=initial=>{const i=globalThis.qa.states.length;globalThis.qa.states.push(initial);return [initial,v=>{globalThis.qa.states[i]=typeof v==='function'?v(globalThis.qa.states[i]):v;}];};
const React={createElement:(type,props,...children)=>({type,props:props||{},children})};export default React;
`;
const databaseStub=`
export const all=async store=>[...(globalThis.qa.stores[store]||new Map()).values()];
export const get=async(store,id)=>globalThis.qa.stores[store]?.get(id);
export const put=async(store,value)=>{(globalThis.qa.stores[store]??=new Map()).set(value.id,value);return value;};
export const versioned=async(store,id,version,create)=>{const values=globalThis.qa.stores[store]??=new Map(),old=values.get(id);if((old?.version||0)!==version)throw Object.assign(Error('Tab khác đã sửa link.'),{conflict:true});const value={...create(old),id,version:version+1};values.set(id,value);return value;};
`;
const bundled=build({entryPoints:[new URL('../src/local/HubInputAutofill.tsx',import.meta.url).pathname],bundle:true,write:false,format:'cjs',platform:'node',target:'es2022',jsx:'transform',plugins:[{name:'panel-test-boundaries',setup(b){
 b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'qa'}));
 b.onResolve({filter:/^\.\/db\.mjs$/},()=>({path:'db',namespace:'qa'}));
 b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:a.path==='react'?reactStub:databaseStub,loader:'js'}));
}}]});
function nodes(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(nodes)]:[];}
async function runPanel({existing=false,count=1,lookupError=false}={}){
 const qa={states:[],stores:{links:new Map()},network:[],lookups:[],reads:[],saved:[],links:[],busy:[]};
 const ct='QA2610-CT-000004',student='QA-INPUTS',url='https://hub24.apollo.vn:7777/contract/detail/12345';
 if(existing)qa.stores.links.set(ct,{id:ct,ct,url,version:3});
 const module={exports:{}},context=vm.createContext({qa,module,exports:module.exports,URL,Response,AbortController,DOMException,crypto,console,setTimeout,clearTimeout,fetch:async(input)=>{qa.network.push(String(input));return new Response('<!doctype html><title>Promotion Studio</title>',{headers:{'Content-Type':'text/html'}});}});
 vm.runInContext((await bundled).outputFiles[0].text,context);
 let complete;const done=new Promise(resolve=>{complete=resolve;});
 const rows=Array.from({length:count},(_,i)=>{const code=i?'QA2610-CT-000005':ct;return {id:'CT::'+code,ct:code,kind:'contract',cells:{F:student,contractTotal:code}};});
 const tree=module.exports.default({rows,datasetId:'qa-local',checkBridge:async()=>({version:'1.6.2',capabilities:['contract-inputs']}),makeLookup:()=>async code=>{qa.lookups.push(code);if(lookupError)throw Error('Lỗi kiểm thử kết nối');return {ct:code,url};},readInputs:async expected=>{qa.reads.push(expected);return {...expected,courseFee:'ATLS - New Price 2026 - Layer 1',hoursPerWeek:'3 hrs/week',package:'2 months',giftcode:'0',discount:'0'};},onSave:async(row,payload)=>qa.saved.push({row,payload}),onLinkSaved:link=>qa.links.push(link),onBusyChange:value=>{qa.busy.push(value);if(!value)complete();}});
 const start=nodes(tree).find(n=>n.type==='button'&&n.props.className==='primary-button');assert.ok(start);start.props.onClick();await done;return {qa,ct,student,url};
}
test('Input panel uses browser-local JSON to resolve and save missing links before reading H:L',{timeout:5000},async()=>{
 const {qa,ct,student,url}=await runPanel();assert.equal(qa.saved.length,1);assert.equal(qa.saved[0].payload.ct,ct);assert.equal(qa.saved[0].payload.student,student);assert.equal(qa.saved[0].payload.package,'2 months');assert.deepEqual(qa.lookups,[ct]);assert.equal(qa.stores.links.get(ct).url,url);assert.equal(qa.links.length,1);assert.equal(qa.network.length,0);assert.match(qa.states[2],/1 CT đã lưu và tính lại/);assert.deepEqual(qa.busy,[true,false]);
});
test('Input panel reuses the existing browser link without a static-host API request',{timeout:5000},async()=>{
 const {qa,ct}=await runPanel({existing:true});assert.equal(qa.saved.length,1);assert.equal(qa.lookups.length,0);assert.equal(qa.links.length,0);assert.equal(qa.stores.links.get(ct).version,3);assert.equal(qa.network.length,0);
});
test('Input panel reports an interrupted batch without claiming all contracts were read',{timeout:5000},async()=>{
 const {qa}=await runPanel({count:2,lookupError:true});assert.equal(qa.saved.length,0);assert.equal(qa.lookups.length,1);assert.match(qa.states[2],/Đã dừng/);assert.match(qa.states[2],/1\/2 CT/);assert.equal(qa.network.length,0);
});
