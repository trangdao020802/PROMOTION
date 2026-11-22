import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
import {sourceFixture} from './helpers/source-fixture.mjs';
import {reusableSources,selectReusableSources,prepareSourceSheets} from '../src/core/source-composition.mjs';
import {inheritedFinanceSettings} from '../src/core/dataset-continuity.mjs';
import {buildBundle} from '../src/core/source-parser.mjs';
import {projectHubContract,validateHubContract} from '../src/core/hub-contract.mjs';
import {policyData} from '../scripts/policy-data.mjs';
const db=`export const all=async s=>[...(qa.stores[s]??new Map()).values()].map(v=>structuredClone(v));
export const get=async(s,id)=>structuredClone(qa.stores[s]?.get(id));
export const put=async(s,v)=>{if(qa.failStore===s)throw Error('Lỗi lưu kiểm thử');(qa.stores[s]??=new Map()).set(v.id,structuredClone(v));return v;};
export const versioned=async(s,id,version,make)=>{const value={...make(await get(s,id)),id,version:version+1};return put(s,value);};
export const activatePolicy=async()=>{};`;
const compiled=build({entryPoints:[new URL('../src/local/api.mjs',import.meta.url).pathname],bundle:true,write:false,format:'cjs',platform:'node',plugins:[{name:'reuse-db',setup(b){b.onResolve({filter:/^\.\/db\.mjs$/},()=>({path:'db',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:db,loader:'js'}));}}]});
async function setup(){
 const dataset=sourceFixture(),qa={stores:{datasets:new Map([[dataset.id,dataset]]),files:new Map(dataset.fileIds.map((id,i)=>[id,{id,name:dataset.bundle.sources[i].fileName,blob:new Blob(['source'])}])),settings:new Map([['current',{id:'current',datasetId:dataset.id}]]),edits:new Map([[dataset.bundle.exports[0].ct+'|QA-STUDENT',{id:dataset.bundle.exports[0].ct+'|QA-STUDENT',recordId:'CT::'+dataset.bundle.exports[0].ct,student:'QA-STUDENT',version:4,patch:{H:'ATLS - New Price 2026 - Layer 1',I:'4 hrs/week',J:'24 months',K:'QA-CODE',L:'0',approved:true}}]])}};
 const module={exports:{}},context=vm.createContext({qa,module,exports:module.exports,structuredClone,Response,URL,Blob,FormData,crypto,TextEncoder,TextDecoder,DOMException,console,fetch:async input=>{assert.ok(String(input).endsWith('rules.json'));return new Response(JSON.stringify(policyData()));}});
 vm.runInContext((await compiled).outputFiles[0].text,context);
 const sources=selectReusableSources(reusableSources(dataset),['p','e','t']),prepared=prepareSourceSheets([],sources),result=buildBundle(prepared.sheets,dataset.bundle.scope);
 const body={bundle:result.bundle,fileIds:prepared.fileRefs.map(r=>r.id),origins:prepared.origins};
 return {qa,dataset,body,api:module.exports.localFetch};
}
test('saved source API lists retained rows and matching manual edits; save preserves them in the new batch',async()=>{
 const {qa,dataset,body,api}=await setup(),old=JSON.stringify(dataset),edits=JSON.stringify([...qa.stores.edits.values()]);
 const response=await api('/api/datasets/sources?id='+dataset.id),data=await response.json();assert.equal(response.status,200);assert.equal(data.editedRecords,1);assert.equal(data.sources[0].records[0].cells.P,'0000778');
 const saved=await api('/api/datasets',{method:'POST',body:JSON.stringify(body)}),result=await saved.json();assert.equal(saved.status,200,JSON.stringify(result));assert.notEqual(result.dataset.id,dataset.id);
 assert.equal(JSON.stringify(qa.stores.datasets.get(dataset.id)),old);assert.equal(JSON.stringify([...qa.stores.edits.values()]),edits);
 const bootstrap=await (await api('/api/bootstrap?dataset='+result.dataset.id)).json();assert.equal(bootstrap.edits['CT::'+dataset.bundle.exports[0].ct].patch.K,'QA-CODE');assert.equal(bootstrap.edits['CT::'+dataset.bundle.exports[0].ct].version,4);assert.equal(bootstrap.continuity.matchedRecords,1);
 assert.equal(qa.stores.settings.get('current').datasetId,result.dataset.id);
});
test('tampered rows, foreign file references and unchecked history are rejected without switching batches',async()=>{
 for(const change of [b=>{b.bundle.cash[0].cells.AF+=1;},b=>{b.fileIds[0]=b.fileIds[1];},b=>{b.origins[0].sourceKey='missing';}]){
  const {qa,dataset,body,api}=await setup();change(body);
  const response=await api('/api/datasets',{method:'POST',body:JSON.stringify(body)});assert.equal(response.status,400);assert.equal(qa.stores.datasets.size,1);assert.equal(qa.stores.settings.get('current').datasetId,dataset.id);
 }
});
test('an interrupted save keeps the current dataset and original edits intact',async()=>{
 const {qa,dataset,body,api}=await setup();qa.failStore='datasets';
 const response=await api('/api/datasets',{method:'POST',body:JSON.stringify(body)});assert.equal(response.ok,false);assert.equal(qa.stores.settings.get('current').datasetId,dataset.id);assert.equal(qa.stores.datasets.size,1);assert.equal([...qa.stores.edits.values()][0].version,4);
});
test('only financial evidence from selected batches and the same master CT/student is inherited',()=>{
 const d=sourceFixture(),masterCt=d.bundle.exports[0].ct,student='QA-STUDENT',ct='QA2610-CT-000002';
 const hubContract=projectHubContract({ContractId:123,ContractNo:ct,ListDiscount:[]},{payments:[],paymentState:'read',capturedAt:'2026-11-20T08:00:00Z'});assert.equal(validateHubContract(hubContract),true);
 const fact={id:'hub-child-fact:old',datasetId:d.id,masterCt,student,ct,hubContract,url:'https://hub24.apollo.vn:7777/contract/detail/123',version:3};
 const upstream={id:'hub-upstream|old',datasetId:d.id,masterCt,student,parentCt:ct,codes:['QA2610-DEP-000003']};
 const result=inheritedFinanceSettings([fact,upstream,{...fact,id:'hub-child-fact:other-student',student:'OTHER'},{...upstream,id:'hub-upstream|unselected',datasetId:'unselected'}],[d.id],[{kind:'contract',ct:masterCt,cells:{F:student}}],'combined');
 assert.equal(result.length,2);assert.ok(result.every(r=>r.datasetId==='combined'&&r.student===student));assert.ok(result[0].id.includes('combined'));assert.equal(fact.datasetId,d.id);assert.equal(fact.version,3);
});
