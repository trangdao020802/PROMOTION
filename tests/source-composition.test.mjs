import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
import {reusableSources,selectReusableSources,prepareSourceSheets,hubReportPlan} from '../src/core/source-composition.mjs';
import {buildBundle,validateBundle,parseDate} from '../src/core/source-parser.mjs';
import {buildModel} from '../src/local/model.mjs';
import {sourceFixture} from './helpers/source-fixture.mjs';
import {policyData} from '../scripts/policy-data.mjs';
const selected=(d,history=false)=>selectReusableSources(reusableSources(d),d.bundle.sources.map(s=>s.key),{includeHistory:history});
const preview=(d,sources=selected(d))=>{const prepared=prepareSourceSheets([],sources);return {...prepared,...buildBundle(prepared.sheets,d.bundle.scope)};};
test('reuses the saved period without reparsing original files and excludes history by default',()=>{
 const d=sourceFixture(),original=JSON.stringify(d),historical={sourceKey:'h',sourceRow:2,cells:{...d.bundle.cash[0].cells,D:'QA2610-PAY-000002',E:'QA2610-DEP-000002',O:parseDate('2026-10-15'),P:'0000777'}};
 d.bundle.sources.push({...d.bundle.sources[0],key:'h',fileIndex:3,fileName:'history.csv'});d.fileIds.push('history-file');d.bundle.cash.push(historical);
 const before=JSON.stringify(d),period=preview(d);
 assert.equal(validateBundle(period.bundle),null);assert.equal(period.bundle.cash.length,1);assert.equal(period.bundle.records.length,1);
 assert.equal(period.sheets.some(s=>s.fileName==='history.csv'),false);assert.equal(period.fileRefs.length,3);
 const withHistory=preview(d,selected(d,true));assert.equal(withHistory.bundle.cash.length,2);assert.equal(withHistory.bundle.records.length,1);
 assert.equal(JSON.stringify(d),before);assert.notEqual(original,before);
});
test('combines independently keyed batches, keeps file provenance and counts the same paid invoice once',()=>{
 const a=sourceFixture(),b=sourceFixture('saved-b'),prepared=prepareSourceSheets([], [...selected(a),...selected(b)]),result=buildBundle(prepared.sheets,a.bundle.scope);
 assert.deepEqual(result.errors,[]);assert.equal(result.bundle.records.length,1);assert.equal(result.bundle.exports.length,1);
 assert.equal(new Set(result.bundle.sources.map(s=>s.key)).size,6);assert.equal(prepared.fileRefs.length,6);
 assert.equal(prepared.origins[3].datasetId,b.id);assert.equal(prepared.origins[3].sourceKey,'p');
 const model=buildModel(result.bundle,policyData());assert.equal(model.extensions.accounts.statistics.receipts,1);assert.equal(model.contractGroups[0].account.net,7200000);
});
test('a new PaymentList can replace only the unchecked saved sheet and retain the other sources',()=>{
 const d=sourceFixture(),saved=selectReusableSources(reusableSources(d),['e','t']);
 const incoming={...reusableSources(d)[0],fileIndex:0,fileName:'new-payment.csv',records:[{sourceRow:2,cells:{...d.bundle.cash[0].cells,P:'0000790'}}]};
 const prepared=prepareSourceSheets([incoming],saved),result=buildBundle(prepared.sheets,d.bundle.scope);
 assert.deepEqual(result.errors,[]);assert.equal(result.bundle.records[0].cells.P,'0000790');
 assert.deepEqual(prepared.fileRefs,[{kind:'saved',id:d.fileIds[1]},{kind:'saved',id:d.fileIds[2]},{kind:'new',index:0}]);
});
test('conflicting saved or refreshed payments and Export snapshots block saving',()=>{
 const a=sourceFixture(),b=sourceFixture('saved-b');b.bundle.cash[0].cells.AF+=100;
 let prepared=prepareSourceSheets([], [...selected(a),...selected(b)]),result=buildBundle(prepared.sheets,a.bundle.scope);
 assert.equal(result.bundle,null);assert.ok(result.errors.some(e=>/mâu thuẫn/.test(e.message)));
 b.bundle.cash[0].cells.AF=a.bundle.cash[0].cells.AF;b.bundle.exports[0].target+=100;
 prepared=prepareSourceSheets([], [...selected(a),...selected(b)]);result=buildBundle(prepared.sheets,a.bundle.scope);
 assert.equal(result.bundle,null);assert.ok(result.errors.some(e=>/Export có CT/.test(e.message)));
});
test('source limits and missing selected roles are reported before save',()=>{
 const d=sourceFixture();assert.equal(preview(d,selected(d).filter(s=>s.role!=='transfer')).bundle,null);
 assert.throws(()=>prepareSourceSheets([],Array.from({length:9},(_,i)=>({...selected(d)[0],fileId:'file'+i}))),/8 file/);
});
test('Hub reads only the chosen reports and does not add historical months unless requested',()=>{
 assert.deepEqual(hubReportPlan('2026-11',0,['payment']),[{report:'payment',month:'2026-11'}]);
 assert.deepEqual(hubReportPlan('2026-11',2,['export']),[{report:'export',month:'2026-11'}]);
 assert.deepEqual(hubReportPlan('2026-01',1,['payment','transfer']),[{report:'transfer',month:'2026-01'},{report:'payment',month:'2026-01'},{report:'payment',month:'2025-12'},{report:'transfer',month:'2025-12'}]);
 assert.throws(()=>hubReportPlan('2026-11',0,[]),/ít nhất/);assert.throws(()=>hubReportPlan('2026-13'),/Chọn tháng/);
});
test('the actual source worker previews a saved-only composition without reading a file',async()=>{
 const output=await build({entryPoints:[new URL('../src/supplied/source-parser.worker.mjs',import.meta.url).pathname],bundle:true,write:false,format:'iife',platform:'browser'}),messages=[],self={postMessage:m=>messages.push(m)};
 const context=vm.createContext({self,TextEncoder,TextDecoder,Uint8Array,Uint16Array,Int32Array,Date,Map,Set,console});
 vm.runInContext(output.outputFiles[0].text,context);
 const d=sourceFixture();await self.onmessage({data:{type:'preview',requestId:2,configurations:[],savedSources:selected(d),scope:d.bundle.scope}});
 const result=messages.at(-1);assert.equal(result.type,'preview');assert.equal(result.requestId,2);assert.equal(validateBundle(JSON.parse(JSON.stringify(result.bundle))),null);assert.equal(result.fileRefs[0].kind,'saved');
});
