import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {build} from 'esbuild';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {hubFixture} from './helpers/hub-policy-fixture.mjs';

// Exercise the panel's real click handler and local API routes. A static host
// returns index.html for /api/*, which must never be used for browser data.
const reactStub=`
export const useMemo=f=>f();
export const useRef=value=>({current:value});
export const useEffect=callback=>globalThis.qa.effects.push(callback);
export const useState=initial=>{const i=globalThis.qa.states.length;globalThis.qa.states.push(initial);return [initial,v=>{globalThis.qa.states[i]=typeof v==='function'?v(globalThis.qa.states[i]):v;}];};
const React={createElement:(type,props,...children)=>({type,props:props||{},children})};export default React;
`;
const databaseStub=`
export const activatePolicy=async()=>{throw Error("Not part of Input panel tests");};
export const all=async store=>[...(globalThis.qa.stores[store]||new Map()).values()];
export const get=async(store,id)=>globalThis.qa.stores[store]?.get(id);
export const put=async(store,value)=>{(globalThis.qa.stores[store]??=new Map()).set(value.id,value);return value;};
export const versioned=async(store,id,version,create)=>{const values=globalThis.qa.stores[store]??=new Map(),old=values.get(id);if((old?.version||0)!==version)throw Object.assign(Error('Tab khác đã sửa link.'),{conflict:true});const value={...create(old),id,version:version+1};values.set(id,value);return value;};
`;
const bundled=build({stdin:{contents:`export {default} from ${JSON.stringify(new URL('../src/local/HubInputAutofill.tsx',import.meta.url).pathname)};export {localFetch} from ${JSON.stringify(new URL('../src/local/api.mjs',import.meta.url).pathname)};`,resolveDir:new URL('..',import.meta.url).pathname,loader:'js'},bundle:true,write:false,format:'cjs',platform:'node',target:'es2022',jsx:'transform',plugins:[{name:'panel-test-boundaries',setup(b){
 b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'qa'}));
 b.onResolve({filter:/^\.\/db\.mjs$/},()=>({path:'db',namespace:'qa'}));
 b.onLoad({filter:/local\/model\.mjs$/},a=>({contents:fs.readFileSync(a.path,'utf8').replace('export function buildModel(bundle,p){','export function buildModel(bundle,p){globalThis.qa.modelBuilds=(globalThis.qa.modelBuilds||0)+1;'),loader:'js'}));
 b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:a.path==='react'?reactStub:databaseStub,loader:'js'}));
}}]});
function nodes(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(nodes)]:[];}
const policies=JSON.stringify(policyData());
function dataset(rows){
 const day=parseDate('2026-10-10'),records=rows.map((r,i)=>({sourceKey:'p',sourceRow:i+2,cells:{B:'QA CENTER',C:'QA1',D:'QA2610-PAY-'+String(i+4).padStart(6,'0'),E:r.ct,R:r.cells.F,S:'DỮ LIỆU GIẢ',O:day,P:'QA00'+i,I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'',AA:'',AB:'',AQ:'',AO:'',AH:'Online Payments',AJ:'',AC:7200000,AD:0,AE:0,AF:7200000,AG:25}}));
 return {id:'qa-local',fileIds:[],bundle:{kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:parseDate('2026-10-31'),records,cash:records,transfers:[],exports:records.map(r=>({sourceKey:'e',sourceRow:r.sourceRow,ct:r.cells.E,student:r.cells.R,target:7200000,paid:7200000,totalHours:25,contractType:'New',center:'QA1'})),sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:records.length}))}};
}
async function runPanel({existing=false,count=1,lookupError=false,version='1.6.12',timeoutOnce=false,partialOnce=false,persisted=null,automatic=false,completeRows=[],policyRows=completeRows}={}){
 const qa={states:[],effects:[],bridgeChecks:0,stores:{links:new Map(),datasets:new Map(),courseSources:new Map()},network:[],lookups:[],reads:[],saved:[],links:[],busy:[],attempts:new Map()};
 if(persisted)qa.stores=persisted;
 const ct='QA2610-CT-000004',student='QA-INPUTS',url='https://hub24.apollo.vn:7777/contract/detail/12345';
 const rows=Array.from({length:count},(_,i)=>{const code='QA2610-CT-'+String(i+4).padStart(6,'0');return {id:'CT::'+code,ct:code,kind:'contract',hubPolicy:policyRows.includes(i)?hubFixture({ct:code,months:2,unitPrice:3600000,offers:false}).policy:null,cells:{F:student,B:'QA1',contractTotal:code,...(completeRows.includes(i)?{H:'ATLS - New Price 2026 - Layer 1',I:'3 hrs/week',J:'2 months',K:'0',L:'0'}:{})}};});qa.stores.datasets.set('qa-local',dataset(rows));
 if(existing)qa.stores.links.set(ct,{id:ct,ct,url,version:3});
 const module={exports:{}},context=vm.createContext({qa,module,exports:module.exports,URL,Response,AbortController,DOMException,crypto,console,setTimeout,clearTimeout,fetch:async(input)=>{if(String(input).endsWith('rules.json'))return new Response(policies,{headers:{'Content-Type':'application/json'}});qa.network.push(String(input));return new Response('<!doctype html><title>Promotion Studio</title>',{headers:{'Content-Type':'text/html'}});}});
 vm.runInContext((await bundled).outputFiles[0].text,context);
 let complete;
 const tree=module.exports.default({rows,datasetId:'qa-local',request:automatic?{id:'qa-automatic',scope:'dataset'}:null,checkBridge:async()=>{qa.bridgeChecks++;return {version,capabilities:['contract-inputs','course-network','policy-api','no-new-tabs']};},makeLookup:()=>async code=>{qa.lookups.push(code);if(lookupError)throw Error('Lỗi kiểm thử kết nối');return {ct:code,url};},readInputs:async expected=>{
  qa.reads.push(expected);const attempt=(qa.attempts.get(expected.ct)||0)+1;qa.attempts.set(expected.ct,attempt);
  if(timeoutOnce&&expected.ct==='QA2610-CT-000005'&&attempt===1)throw Object.assign(Error('Hết thời gian Hub.'),{code:'timeout'});
  return {...expected,hubPolicy:hubFixture({ct:expected.ct,months:2,unitPrice:3600000,offers:false}).policy,courseFee:partialOnce&&attempt>1?null:'ATLS - New Price 2026 - Layer 1',hoursPerWeek:partialOnce&&attempt>1?null:'3 hrs/week',package:partialOnce&&attempt===1?null:'2 months',giftcode:'0',discount:'0'};
 },onSave:async(row,payload)=>{const res=await module.exports.localFetch('/api/course-sources',{method:'PATCH',body:JSON.stringify({payload,datasetId:'qa-local',hash:'qa-local',version:qa.stores.courseSources.get(payload.ct)?.version??0})}),data=await res.json();if(!res.ok)throw Error(data.error);qa.saved.push({row,payload});return {row,source:data.source};},onLinkSaved:link=>qa.links.push(link),onBusyChange:value=>{qa.busy.push(value);if(!value)complete();}});
 const button=nodes(tree).find(n=>n.type==='button'&&n.props.className==='primary-button');assert.ok(button);let firedAutomatic=false;const start=async()=>{const done=new Promise(resolve=>{complete=resolve;});if(automatic&&!firedAutomatic){firedAutomatic=true;qa.effects.at(-1)();}else button.props.onClick();await done;};await start();return {qa,ct,student,url,retry:start,api:module.exports.localFetch};
}
test('automatic linking reads only missing CT inputs and skips CTs with complete inputs and their verified rule snapshots',{timeout:5000},async()=>{
 const mixed=await runPanel({automatic:true,count:3,completeRows:[0,2]});assert.equal(mixed.qa.reads.length,1);assert.equal(mixed.qa.reads[0].ct,'QA2610-CT-000005');assert.equal(mixed.qa.saved.length,1);
 const complete=await runPanel({automatic:true,count:3,completeRows:[0,1,2]});assert.equal(complete.qa.bridgeChecks,0);assert.equal(complete.qa.reads.length,0);assert.match(complete.qa.states[2],/Không còn CT thiếu/);
});
test('Input panel uses browser-local JSON to resolve and save missing links before reading H:L',{timeout:5000},async()=>{
 const {qa,ct,student,url}=await runPanel();assert.equal(qa.saved.length,1);assert.equal(qa.saved[0].payload.ct,ct);assert.equal(qa.saved[0].payload.student,student);assert.equal(qa.saved[0].payload.package,'2 months');assert.deepEqual(qa.lookups,[ct]);assert.equal(qa.stores.links.get(ct).url,url);assert.equal(qa.links.length,1);assert.equal(qa.network.length,0);assert.match(qa.states[2],/1 CT đã lưu và tính lại/);assert.deepEqual(qa.busy,[true,false]);
});
test('complete raw inputs still trigger automatic API rules when no CT rule snapshot is stored',{timeout:5000},async()=>{
 const r=await runPanel({automatic:true,count:2,completeRows:[0,1],policyRows:[]});assert.equal(r.qa.reads.length,2);assert.ok(r.qa.saved.every(s=>s.payload.hubPolicy));assert.ok(r.qa.stores.settings.get('hub-input-run:qa-local').targets.every(t=>t.policy===true));
});
test('Input panel reuses the existing browser link without a static-host API request',{timeout:5000},async()=>{
 const {qa,ct}=await runPanel({existing:true});assert.equal(qa.saved.length,1);assert.equal(qa.lookups.length,0);assert.equal(qa.links.length,0);assert.equal(qa.stores.links.get(ct).version,3);assert.equal(qa.network.length,0);
});
test('a batch reuses one source identity index instead of rebuilding the workbook for every CT write',{timeout:5000},async()=>{
 const {qa}=await runPanel({count:12});assert.equal(qa.saved.length,12);assert.equal(qa.modelBuilds,1);assert.equal(qa.reads.length,12);assert.equal(qa.network.length,0);
});
test('Input panel reports an interrupted batch without claiming all contracts were read',{timeout:5000},async()=>{
 const {qa}=await runPanel({count:2,lookupError:true});assert.equal(qa.saved.length,0);assert.equal(qa.lookups.length,1);assert.match(qa.states[2],/Đã dừng/);assert.match(qa.states[2],/1\/2 CT/);assert.equal(qa.network.length,0);
});
test('the old Course info reader must be updated before starting a bulk read',{timeout:5000},async()=>{
 for(const version of ['1.6.2','1.6.3','1.6.4','1.6.6','1.6.11']){const {qa}=await runPanel({version});assert.match(qa.states[2],/1.6.12/);assert.equal(qa.states[4],true);assert.equal(qa.lookups.length,0);assert.equal(qa.reads.length,0);assert.equal(qa.saved.length,0);}
});
test('retry after a timeout skips completed contracts and continues the failed and untouched contracts',{timeout:5000},async()=>{
 const {qa,retry}=await runPanel({count:3,timeoutOnce:true});assert.equal(qa.saved.length,1);assert.equal(qa.reads.length,2);assert.match(qa.states[2],/2\/3 CT/);await retry();assert.equal(qa.saved.length,3);assert.equal(qa.reads.length,4);assert.equal(qa.attempts.get('QA2610-CT-000004'),1);assert.equal(qa.attempts.get('QA2610-CT-000005'),2);assert.equal(qa.attempts.get('QA2610-CT-000006'),1);await retry();assert.equal(qa.reads.length,4);assert.equal(qa.network.length,0);
});
test('a new panel instance resumes from persisted progress after a page reload',{timeout:5000},async()=>{
 const first=await runPanel({count:3,timeoutOnce:true});assert.equal(first.qa.saved.length,1);const reopened=await runPanel({count:3,persisted:first.qa.stores});assert.equal(reopened.qa.reads.length,2);assert.ok(reopened.qa.reads.every(r=>r.ct!==first.ct));assert.equal(reopened.qa.stores.courseSources.get(first.ct).version,1);assert.equal(reopened.qa.network.length,0);
});
test('partial course inputs remain pending and the next saved source retains previously read fields',{timeout:5000},async()=>{
 const {qa,retry,ct}=await runPanel({partialOnce:true});assert.equal(qa.states[3][0].status,'partial');assert.equal(qa.stores.settings.get('hub-input-run:qa-local').completed.length,0);await retry();assert.equal(qa.states[3][0].status,'saved');assert.equal(qa.stores.courseSources.get(ct).courseFee,'ATLS - New Price 2026 - Layer 1');assert.equal(qa.stores.courseSources.get(ct).package,'2 months');assert.equal(qa.stores.settings.get('hub-input-run:qa-local').completed.length,1);
});
test('a checkpoint cannot complete another student or an unsaved source version',{timeout:5000},async()=>{
 const {qa,api,ct}=await runPanel();const run=qa.stores.settings.get('hub-input-run:qa-local');
 for(const body of [{student:'QA-OTHER',sourceVersion:1},{student:'QA-INPUTS',sourceVersion:999}]){const response=await api('/api/hub-input-progress',{method:'PATCH',body:JSON.stringify({operation:'complete',datasetId:'qa-local',runId:run.runId,version:run.version,ct,...body})});assert.equal(response.status,400);assert.equal(qa.stores.settings.get('hub-input-run:qa-local').version,run.version);}
});
