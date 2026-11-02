import test from 'node:test';
import assert from 'node:assert/strict';
import {projectHubContract,validateHubContract} from '../src/core/hub-contract.mjs';
import {parseCoursePage} from '../src/core/hub-course.mjs';
import {upgradeLinksFromDocument,upgradeEdges,upgradeSourceMissing} from '../src/core/hub-upgrade.mjs';
import {readUpgradeFinance} from '../src/core/hub-upgrade-reader.mjs';
import {financeBundle} from '../src/core/hub-finance-bundle.mjs';
import {knownFinanceDocuments,upstreamCandidates} from '../src/core/hub-upstream.mjs';
import {childFactKey} from '../src/core/child-hub-evidence.mjs';
import {attachHubFunding,hubFundingSources} from '../src/core/hub-proven-funding.mjs';
import {buildModel} from '../src/local/model.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {build} from 'esbuild';
import vm from 'node:vm';
const master='QA2610-CT-000902',origin='QA2609-CT-000901',student='QA-UPGRADE',datasetId='qa-upgrade';
const url=id=>'https://hub24.apollo.vn:7777/contract/detail/'+id;
const payment=(id,ct,amount,date)=>({PaymentId:id,ContractId:ct,PaymentCode:'QA-PAY-'+id,Amount:amount,RemainAmount:0,TotalAmount:amount,IsComplete:true,PaymentTypeId:2,PaymentTypeName:'Payment',PaymentMethodTypeName:'Online Payments',CompleteDate:date,InvoiceNo:'0000'+id,InvoiceDate:date,InvoiceAmount:amount});
const masterFacts=()=>projectHubContract({ContractId:902,ContractNo:master,CreatedDate:'2026-10-20',UpgradeFromContractId:901,ListCourseInfo:[],ListPayment:[payment(902,902,29100000,'2026-10-20')],ListMovingIn:[],ListMovingOut:[]});
const originFacts=()=>projectHubContract({ContractId:901,ContractNo:origin,CreatedDate:'2026-09-08',UpgradeToContractId:902,UpgradeToContractNo:master,ListCourseInfo:[],ListPayment:[payment(901,901,9600000,'2026-09-08')],ListMovingIn:[],ListMovingOut:[]});
async function savedFacts(){const f=await readUpgradeFinance(masterFacts(),async link=>{assert.equal(link.id,'901');return originFacts();});assert.ok(validateHubContract(f));return f;}
function fixture({history=false}={}){
 const c={B:'QA CENTER',C:'QA1',D:'QA-PAY-902',E:master,R:student,S:'HỒ SƠ KIỂM THỬ',O:parseDate('2026-10-20'),P:'0000902',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:'3 hrs/week',AB:'12 months',AO:'0',AQ:'0',AH:'Online Payments',AC:38700000,AD:0,AE:0,AF:29100000,AG:150};
 const records=[{sourceKey:'p',sourceRow:2,cells:c}];
 if(history)records.push({sourceKey:'p',sourceRow:3,cells:{...c,D:'QA-PAY-901',E:origin,O:parseDate('2026-09-08'),P:'0000901',AF:9600000}});
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:parseDate('2026-10-31'),records,cash:records,transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:master,student,target:38700000,paid:38700000,courseFee:c.Z,hoursPerWeek:c.AA,package:c.AB,totalHours:150,contractType:'New',center:'QA1'}],sources:['payment','export','transfer'].map((role,i)=>({key:['p','e','t'][i],role,fileIndex:i,fileName:'QA-'+role+'.xlsx',sheetName:'QA',headerRow:1,rowCount:records.length}))};
 const model=buildModel(bundle,policyData());model.dataset={id:datasetId};return model;
}
function context(f){return {datasetId,facts:[{id:childFactKey({datasetId,masterCt:master,ct:master,student}),datasetId,masterCt:master,ct:master,student,url:url(902),hubContract:f}],links:[{ct:master,url:url(902)}]};}
const calculated=model=>new AuditEngine(model).calculate({id:'CT::'+master});
test('Upgrade from ID reads the original contract, binds its CT, and discovers it without Moving-in/out',async()=>{
 const initial=masterFacts();assert.equal(initial.upgrades[0].ct,null);assert.ok(upgradeSourceMissing(initial));
 const f=await savedFacts();assert.equal(f.upgrades[0].ct,origin);assert.equal(f.relatedFinance.length,1);assert.equal(upgradeSourceMissing(f),false);
 assert.equal(financeBundle(f)[0].ct,origin);assert.equal(upgradeEdges([f,...f.relatedFinance])[0].date,'2026-10-20');
 const row={ct:master,cells:{F:student},account:{movementHistory:[]}};assert.deepEqual(upstreamCandidates(row,master,{hubContract:f}),[origin]);
 assert.ok(knownFinanceDocuments(row,context(f).facts,{datasetId,masterCt:master,student}).has(origin));
});
test('a 9.6m original Paid invoice funds the upgraded master once, alongside 29.1m current cash',async()=>{
 const model=fixture(),f=await savedFacts();assert.equal(calculated(model).cells.W,29100000);
 attachHubFunding(model,context(f));const after=calculated(model);
 assert.equal(after.cells.W,38700000);assert.equal(after.cells.AC,0);assert.equal(after.receipts.length,2);
 assert.equal(after.reconciliation.transferIn,9600000);assert.equal(after.reconciliation.movementHistory[0].kind,'Upgrade');
 assert.equal(after.receipts.find(r=>r.contract===origin).vat,'0000901');
 attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,38700000);
});
test('historical PaymentList and a source course row do not create duplicate money or a second active course',async()=>{
 const model=fixture({history:true}),f=await savedFacts();assert.equal(model.contractGroups.length,2);
 attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,38700000);
 assert.equal(model.contractGroups.length,1);assert.ok(model.contractGroups[0].sourceContracts.includes(origin));
 assert.equal(model.contractGroups[0].receipts.length,2);
});
test('an existing Transfer path is authoritative and is never duplicated by its Upgrade link',async()=>{
 const model=fixture(),f=await savedFacts();model.input.transferSources.push({rows:[{type:'Transfer',from:origin,to:master,date:parseDate('2026-10-20'),out:9600000,amount:9600000,fromStudent:student,toStudent:student,ref:{file:'QA Transfer'}}]});
 const extra=hubFundingSources(model.input,context(f));assert.equal(extra.moves.length,0);
 attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,38700000);
});
test('a conflicting original PaymentList amount cannot be credited through Upgrade',async()=>{
 const model=fixture({history:true}),f=await savedFacts();f.relatedFinance[0].payments.rows[0].amount=9500000;f.relatedFinance[0].payments.rows[0].invoice.amount=9500000;
 attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,29100000);assert.ok(calculated(model).groupWarnings.some(w=>w.includes('PaymentList khác')));
});
test('missing original invoice, unknown date, future cash, competing upgrade targets and loops cannot manufacture funding',async()=>{
 for(const change of [f=>{delete f.relatedFinance[0].payments.rows[0].invoiceRef;delete f.relatedFinance[0].payments.rows[0].invoice;},f=>{f.contractDate=null;f.upgrades[0].date=null;},f=>{f.relatedFinance[0].payments.rows[0].completeDate='2026-11-01';},f=>{f.relatedFinance[0].upgrades.push({direction:'to',ct:'QA2610-CT-000903',id:'903',url:url(903),date:'2026-10-20'});},f=>{f.relatedFinance[0].upgrades.push({direction:'from',ct:master,id:'902',url:url(902),date:'2026-10-20'});}]){
  const model=fixture(),f=await savedFacts();change(f);assert.ok(validateHubContract(f));attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,29100000);
 }
});
test('Upgrade reader preserves inputs and skips a failed, wrong-ID or cyclic source',async()=>{
 for(const read of [async()=>{throw Error('timeout');},async()=>({...originFacts(),contractId:'999'}),async()=>masterFacts()]){
  const before=masterFacts(),result=await readUpgradeFinance(before,read);assert.equal(result.payments.rows[0].amount,29100000);assert.ok(upgradeSourceMissing(result));assert.equal(before.upgrades[0].ct,null);
 }
 const ctrl=new AbortController();ctrl.abort();let calls=0;await readUpgradeFinance(masterFacts(),async()=>{calls++;return originFacts();},{signal:ctrl.signal});assert.equal(calls,0);
});
test('only a labelled Upgrade link identifies the old/new breadcrumb pair',()=>{
 const anchor={tagName:'A',textContent:origin,innerText:origin,getAttribute:k=>k==='href'?'/contract/detail/901':null,getClientRects:()=>[{}],closest:()=>null};
 const value={querySelectorAll:s=>s==='a[href]'?[anchor]:[],getClientRects:()=>[{}],closest:()=>null};
 const label={textContent:'Upgrade from contract',nextElementSibling:value,getClientRects:()=>[{}],closest:()=>null};
 const links=upgradeLinksFromDocument({querySelectorAll:()=>[label]});assert.equal(links[0].ct,origin);assert.equal(links[0].id,'901');
 const request={ct:master,student,url:url(902),readFinance:true},page={url:url(902),titles:[origin+' / '+master],upgradeLinks:links,financeTables:[]};
 assert.ok(parseCoursePage(page,request).payload);assert.equal(parseCoursePage({...page,upgradeLinks:[]},request).error,'identity');
 anchor.getAttribute=()=> 'https://other.example/contract/detail/901';assert.equal(upgradeLinksFromDocument({querySelectorAll:()=>[label]}).length,0);
});
test('the calculation worker removes a retired Upgrade row and can finish its queued source read',async()=>{
 const initial=fixture({history:true}),updated=fixture({history:true}),facts=await savedFacts();attachHubFunding(updated,context(facts));
 const compiled=await build({entryPoints:[new URL('../src/local/calculator.worker.mjs',import.meta.url).pathname],bundle:true,write:false,format:'cjs',platform:'node',target:'es2022',plugins:[{name:'worker-boundaries',setup(b){
  b.onResolve({filter:/^\.\/(?:api|contract-memory)\.mjs$/},args=>args.importer.endsWith('/calculator.worker.mjs')?{path:args.path,namespace:'qa'}:null);
  b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:a.path==='./api.mjs'?'export const loadWorkbook=async()=>qa.models.shift();':'export const rememberCalculation=async()=>{};',loader:'js'}));
 }}]});
 const messages=[],scope={qa:{models:[initial,updated]},self:{postMessage:m=>messages.push(m)},console,URL,Date,crypto,TextEncoder,TextDecoder,setTimeout,clearTimeout};
 vm.runInContext(compiled.outputFiles[0].text,vm.createContext(scope));
 await scope.self.onmessage({data:{type:'init',datasetId}});
 await scope.self.onmessage({data:{type:'course-source',requestId:1,datasetId,record:{id:'CT::'+master},vouchers:[],source:{ct:master,student,url:url(902),hubContract:facts,courseFee:'ATLS - New Price 2026 - Layer 1',hoursPerWeek:'3 hrs/week',package:'12 months',giftcode:'0',discount:'0'}}});
 const response=messages.find(m=>m.requestId===1);assert.equal(response.type,'course-sources-ready');assert.equal(response.rows.length,1);assert.equal(response.row.cells.W,38700000);
 await scope.self.onmessage({data:{type:'course-source',requestId:2,datasetId,record:{id:'CT::'+origin},vouchers:[],source:{ct:origin,student,url:url(901),hubContract:originFacts(),courseFee:'ATLS - New Price 2026 - Layer 1',hoursPerWeek:'3 hrs/week',package:'3 months',giftcode:'0',discount:'0'}}});
 const queued=messages.find(m=>m.requestId===2);assert.equal(queued.type,'course-sources-ready');assert.equal(queued.row.id,'CT::'+master);assert.equal(queued.rows.length,1);assert.equal(queued.row.cells.W,38700000);assert.equal(queued.row.cells.J,'12 months');
});
