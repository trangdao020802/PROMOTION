import test from 'node:test';
import assert from 'node:assert/strict';
import {projectHubContract,validateHubContract,mergeHubContractDate} from '../src/core/hub-contract.mjs';
import {parseCoursePage} from '../src/core/hub-course.mjs';
import {upgradeLinksFromDocument,upgradeEdges,upgradeSourceMissing} from '../src/core/hub-upgrade.mjs';
import {readUpgradeFinance} from '../src/core/hub-upgrade-reader.mjs';
import {financeBundle} from '../src/core/hub-finance-bundle.mjs';
import {knownFinanceDocuments,upstreamCandidates,originPaymentSummary} from '../src/core/hub-upstream.mjs';
import {childFactKey} from '../src/core/child-hub-evidence.mjs';
import {attachHubFunding,hubFundingSources} from '../src/core/hub-proven-funding.mjs';
import {buildModel} from '../src/local/model.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {build} from 'esbuild';
import vm from 'node:vm';
import {hubFixture} from './helpers/hub-policy-fixture.mjs';
import {projectLearnerPaymentPage,mergeLearnerFinance} from '../src/core/hub-learner-payments.mjs';
import {invoiceReadsComplete} from '../src/core/hub-invoice.mjs';
import {fullPaymentDay} from '../src/core/verification.mjs';
import {upgradeFunding} from '../src/core/hub-upgrade-funding.mjs';
const master='QA2610-CT-000902',origin='QA2609-CT-000901',student='QA-UPGRADE',datasetId='qa-upgrade';
const url=id=>'https://hub24.apollo.vn:7777/contract/detail/'+id;
const payment=(id,ct,amount,date)=>({PaymentId:id,ContractId:ct,PaymentCode:'QA-PAY-'+id,Amount:amount,RemainAmount:0,TotalAmount:amount,IsComplete:true,PaymentTypeId:2,PaymentTypeName:'Payment',PaymentMethodTypeName:'Online Payments',CompleteDate:date,InvoiceNo:'0000'+id,InvoiceDate:date,InvoiceAmount:amount});
const masterFacts=()=>projectHubContract({ContractId:902,ContractNo:master,CreatedDate:'2026-10-20',UpgradeFromContractId:901,ListCourseInfo:[],ListPayment:[payment(902,902,29100000,'2026-10-20')],ListMovingIn:[],ListMovingOut:[]});
const originFacts=()=>projectHubContract({ContractId:901,ContractNo:origin,CreatedDate:'2026-09-08',UpgradeToContractId:902,UpgradeToContractNo:master,ListCourseInfo:[],ListPayment:[payment(901,901,9600000,'2026-09-08')],ListMovingIn:[],ListMovingOut:[]});
async function savedFacts(){const f=await readUpgradeFinance(masterFacts(),async link=>{assert.equal(link.id,'901');return originFacts();});assert.ok(validateHubContract(f));return f;}
function fixture({history=false,bundleOnly=false}={}){
 const c={B:'QA CENTER',C:'QA1',D:'QA-PAY-902',E:master,R:student,S:'HỒ SƠ KIỂM THỬ',O:parseDate('2026-10-20'),P:'0000902',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:'3 hrs/week',AB:'12 months',AO:'0',AQ:'0',AH:'Online Payments',AC:38700000,AD:0,AE:0,AF:29100000,AG:150};
 const records=[{sourceKey:'p',sourceRow:2,cells:c}];
 if(history)records.push({sourceKey:'p',sourceRow:3,cells:{...c,D:'QA-PAY-901',E:origin,O:parseDate('2026-09-08'),P:'0000901',AF:9600000}});
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:parseDate('2026-10-31'),records,cash:records,transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:master,student,target:38700000,paid:38700000,courseFee:c.Z,hoursPerWeek:c.AA,package:c.AB,totalHours:150,contractType:'New',center:'QA1'}],sources:['payment','export','transfer'].map((role,i)=>({key:['p','e','t'][i],role,fileIndex:i,fileName:'QA-'+role+'.xlsx',sheetName:'QA',headerRow:1,rowCount:records.length}))};
 if(bundleOnly)return bundle;
 const model=buildModel(bundle,policyData());model.dataset={id:datasetId};return model;
}
function context(f){return {datasetId,facts:[{id:childFactKey({datasetId,masterCt:master,ct:master,student}),datasetId,masterCt:master,ct:master,student,url:url(902),hubContract:f}],links:[{ct:master,url:url(902)}]};}
const calculated=model=>new AuditEngine(model).calculate({id:'CT::'+master});
function depositUpgrade(){
 const dep='QA2610-DEP-000900',root={ContractId:902,ContractNo:master,LeadId:40,KidId:41,CreatedDate:'2026-10-31',UpgradeFromContractId:901,ListCourseInfo:[]};
 const group=(ct,id,ListPayment)=>({ContractDepositNo:ct,ContractDepositId:id,ListPayment});
 const rows=[group(master,902,[{PaymentId:902,PaymentCode:'QA2610-PAY-000902',Amount:27630000,PaymentDate:'2026-10-31',Status:'Paid',PaymentType:'Payment',InvoiceNo:'0000625'}]),
  group(origin,901,[{PaymentCode:'QA2610-PAY-000901',Amount:7200000,PaymentDate:'2026-10-08',Status:'Paid',PaymentType:'Deposit to contract',RelatedContractDepositNo:dep}]),
  group(dep,900,[{PaymentCode:'QA2610-PAY-000900',Amount:7200000,PaymentDate:'2026-10-08',Status:'Paid',PaymentType:'Deposit',InvoiceNo:'0000571'}]),
  group('QA2610-CT-000999',999,[{PaymentCode:'QA2610-PAY-000999',Amount:99000000,PaymentDate:'2026-10-08',Status:'Paid',InvoiceNo:'0000999'}])];
 const page=projectLearnerPaymentPage({KidId:41,TotalCount:4,ListData:rows},root);
 return {dep,root,page};
}
test('Learner Payments follows Upgrade then Deposit-to-contract and carries only the original 7.2m invoice',()=>{
 const {dep,root,page}=depositUpgrade(),f=mergeLearnerFinance(projectHubContract(root),[page]);
 assert.ok(validateHubContract(f));assert.deepEqual(f.relatedFinance?.map(d=>d.ct).sort(),[dep,origin].sort());
 assert.equal(upgradeSourceMissing(f),false);
 const bundle=fixture({bundleOnly:true}),c=bundle.records[0].cells;c.D='QA2610-PAY-000902';c.O=parseDate('2026-10-31');c.AF=27630000;c.AQ='2026 October - Promotion Discount - 12 months';
 bundle.exports[0].target=34830000;bundle.exports[0].paid=34830000;
 const model=buildModel(bundle,policyData());model.dataset={id:datasetId};attachHubFunding(model,context(f));const after=calculated(model);
 assert.equal(after.cells.W,34830000);assert.equal(after.cells.Q,34830000);assert.equal(after.cells.AC,0);
 assert.equal(after.receipts.length,2);assert.equal(after.receipts.find(p=>p.contract===dep).vat,'0000571');
 assert.equal(after.reconciliation.transferIn,7200000);assert.equal(after.reconciliation.hubSupplement.receipts[0].allocated,7200000);
 assert.equal(after.reconciliation.hubSupplement.pending.length,0);
 const intermediary=f.relatedFinance.find(d=>d.ct===origin);assert.equal(invoiceReadsComplete(intermediary),true);assert.equal(originPaymentSummary([{ct:origin,hubContract:intermediary}]).payments[0].internal,true);
 attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,34830000);
});
test('Upgrade retains the Deposit ancestry read while fetching the old contract',async()=>{
 const {root,page}=depositUpgrade(),from={...root,ContractId:901,ContractNo:origin,UpgradeFromContractId:undefined,UpgradeToContractId:902,UpgradeToContractNo:master};
 const old=mergeLearnerFinance(projectHubContract(from),[page]),f=await readUpgradeFinance(projectHubContract(root),async()=>old);
 assert.ok(validateHubContract(f));assert.equal(f.relatedFinance?.length,2);assert.ok(f.relatedFinance.some(d=>d.ct.includes('-DEP-')));
 const noLearner={...projectHubContract(root)};delete noLearner.learner;
 const withoutLead=await readUpgradeFinance(noLearner,async()=>old);assert.equal(withoutLead.relatedFinance?.length,2);
});
test('Deposit-to-contract is an outgoing allocation of one original Deposit, never another cash receipt',()=>{
 const {dep}=depositUpgrade(),p=payment(900,900,7200000,'2026-10-08');p.PaymentCode='QA2610-PAY-000900';
 const f=projectHubContract({DepositId:900,DepositNo:dep,ListCourseInfo:[],ListPayment:[p,{...p,PaymentId:901,PaymentCode:'QA2610-PAY-000901',InvoiceNo:undefined,PaymentTypeName:'Deposit to contract',RelatedContractDepositNo:origin}]});
 assert.equal(f.payments.rows.length,1);assert.equal(f.movements.rows[0].from,dep);assert.equal(f.movements.rows[0].to,origin);
 const summary=originPaymentSummary([{ct:dep,hubContract:f}]);assert.equal(summary.originalCount,1);assert.equal(summary.invoicePaid,7200000);
});
test('partial Deposit reads are enriched by the same bound learner invoice without adding another 7.2m',()=>{
 const {dep,root,page}=depositUpgrade(),f=mergeLearnerFinance(projectHubContract(root),[page]),ctx=context(f);
 const old=structuredClone(f.relatedFinance.find(d=>d.ct===dep));delete old.payments.rows[0].invoiceRef;delete old.payments.rows[0].invoice;
 const depositURL='https://hub24.apollo.vn:7777/Deposit/detail/900';
 const stale={datasetId,masterCt:master,ct:dep,student,url:depositURL,hubContract:old};stale.id=childFactKey(stale);ctx.facts.unshift(stale);ctx.links.push({ct:dep,url:depositURL});
 const model=fixture(),result=hubFundingSources(model.input,ctx);
 assert.equal(result.cash.find(r=>r.contract===dep)?.amount,7200000);assert.equal(result.cash.filter(r=>r.contract===dep).length,1);
 assert.equal(result.moves.find(m=>m.type==='Upgrade')?.amount,7200000);
});
test('missing Upgrade, Deposit link or original invoice cannot credit the receiving CT',()=>{
 for(const missing of ['upgrade','deposit','invoice']){
  const {root,page}=depositUpgrade();if(missing==='upgrade')delete root.UpgradeFromContractId;
  if(missing==='deposit')page.documents.find(d=>d.ct===origin).movements.rows=[];
  if(missing==='invoice'){const p=page.documents.find(d=>d.ct.includes('-DEP-')).payments.rows[0];delete p.invoice;delete p.invoiceRef;}
  const f=mergeLearnerFinance(projectHubContract(root),[page]),model=fixture(),ctx=context(f);
  assert.equal(hubFundingSources(model.input,ctx).moves.filter(m=>m.type==='Upgrade').length,0);
  if(missing==='invoice')assert.equal(upgradeSourceMissing(f),true);
 }
});
test('Upgrade metadata takes only CreatedDate from the exact receiving CT, preserving existing facts',()=>{
 const f=masterFacts();f.contractDate=null;
 const info={ContractId:902,ContractNo:master,CreatedDate:'2026-10-20T10:00:00',FinalAmount:1,Phone:'PRIVATE-DO-NOT-COPY'};
 const result=mergeHubContractDate(f,info);
 assert.equal(result.contractDate,'2026-10-20');assert.ok(validateHubContract(result));assert.equal(result.payments,f.payments);
 assert.ok(!JSON.stringify(result).includes('PRIVATE-DO-NOT-COPY'));assert.equal(f.contractDate,null);
 for(const patch of [{ContractId:901},{ContractNo:origin},{CreatedDate:'2026-02-30'},{CreatedDate:null}])assert.equal(mergeHubContractDate(f,{...info,...patch}),f);
 assert.equal(mergeHubContractDate(masterFacts(),info).contractDate,'2026-10-20');
});
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
 assert.equal(calculated(model).reconciliation.hubSupplement.receipts[0].allocated,9600000);
});
test('separately saved Upgrade evidence uses the receiving CT date already read with its Hub policy',()=>{
 const f=masterFacts();f.contractDate=null;f.upgrades[0].ct=origin;f.upgrades[0].date=null;
 const ctx=context(f),policy=hubFixture({ct:master,contractId:902,offers:false}).policy;
 ctx.facts[0].hubPolicy=policy;
 const child={datasetId,masterCt:master,ct:origin,student,url:url(901),hubContract:originFacts()};child.id=childFactKey(child);
 ctx.facts.push(child);ctx.links.push({ct:origin,url:url(901)});
 const model=fixture();attachHubFunding(model,ctx);const after=calculated(model);
 assert.equal(after.cells.W,38700000);assert.equal(after.cells.AC,0);
 assert.equal(after.reconciliation.transferIn,9600000);
 assert.equal(after.reconciliation.movementHistory[0].date,parseDate(policy.createdDate));
 assert.equal(after.reconciliation.hubSupplement.receipts[0].allocated,9600000);
 assert.equal(f.contractDate,null,'calculation must not overwrite the saved read');
 attachHubFunding(model,ctx);assert.equal(calculated(model).cells.W,38700000);
});
test('an invalid or differently bound policy cannot invent a date; a valid future date remains outside the period',()=>{
 for(const patch of [null,{ct:'QA2610-CT-000999'},{contractId:999},{createdDate:'2026-11-20'},{createdDate:'invalid'}]){
  const f=masterFacts();f.contractDate=null;f.upgrades[0].ct=origin;f.upgrades[0].date=null;
  const ctx=context(f),child={datasetId,masterCt:master,ct:origin,student,url:url(901),hubContract:originFacts()};child.id=childFactKey(child);
  if(patch)ctx.facts[0].hubPolicy={...hubFixture({ct:master,contractId:902,offers:false}).policy,...patch};
  ctx.facts.push(child);ctx.links.push({ct:origin,url:url(901)});
  const model=fixture();attachHubFunding(model,ctx);const after=calculated(model);
  if(patch?.createdDate==='2026-11-20'){assert.equal(after.cells.W,29100000);assert.ok(after.reconciliation.hubSupplement.pending.some(p=>p.from===origin&&p.to===master));}
  else{assert.equal(after.cells.W,38700000);assert.equal(after.reconciliation.movementHistory.find(m=>m.kind==='Upgrade').dateBasis,'period-end');}
 }
});
test('an explicit undated Upgrade allocates the saved 9.6m at cutoff without inventing a full-payment date',async()=>{
 const f=await savedFacts();f.contractDate=null;f.upgrades[0].date=null;
 const model=fixture();attachHubFunding(model,context(f));const after=calculated(model);
 assert.equal(after.cells.W,38700000);assert.equal(after.cells.AC,0);assert.equal(after.reconciliation.transferIn,9600000);
 assert.equal(after.reconciliation.hubSupplement.pending.length,0);assert.equal(after.reconciliation.hubSupplement.notes.length,1);
 assert.equal(after.reconciliation.movementHistory.find(m=>m.kind==='Upgrade').dateBasis,'period-end');assert.equal(fullPaymentDay(after.reconciliation),null);
 assert.equal(after.receipts.find(r=>r.contract===origin).date,parseDate('2026-09-08'));
 attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,38700000);
});
test('undated Upgrade still requires a reported receiver, original paid cash, capacity and consistent known dates',async()=>{
 for(const kind of ['receiver','cash','capacity','date-conflict']){
  const f=await savedFacts();f.contractDate=null;f.upgrades[0].date=null;const model=fixture();
  if(kind==='receiver'){model.input.paid=[];model.input.records=[];}
  if(kind==='cash')f.relatedFinance[0].payments.rows[0].completeDate='2026-11-01';
  if(kind==='capacity')model.input.transferSources.push({rows:[{type:'Transfer',date:parseDate('2026-10-25'),from:origin,to:'QA2610-CT-000904',out:9600000,amount:9600000,fromStudent:student,toStudent:student,ref:{file:'QA'}}]});
  if(kind==='date-conflict'){f.upgrades[0].date='2026-10-20';f.relatedFinance[0].upgrades[0].date='2026-10-21';}
  const result=hubFundingSources(model.input,context(f));assert.equal(result.moves.filter(m=>m.type==='Upgrade').length,0);assert.ok(result.pending.length>0);
 }
});
test('an undated multi-level Upgrade is allocated from the oldest invoice toward the reported master',()=>{
 const middle='QA2610-CT-000905',model=fixture();
 model.input.cashSources.push({rows:[{payment:'QA-PAY-901',contract:origin,student,vat:'0000901',date:parseDate('2026-09-08'),amount:9600000,paid:true,cancelled:false,ref:{file:'QA'}}]});
 const r=upgradeFunding(model.input,[{from:middle,to:master,date:null},{from:origin,to:middle,date:null}]);
 assert.deepEqual(r.moves.map(m=>[m.from,m.to,m.amount]),[[origin,middle,9600000],[middle,master,9600000]]);assert.equal(r.pending.length,0);
});
test('loading saved browser sources passes the receiving policy date into the funding ledger',async()=>{
 const f=masterFacts();f.contractDate=null;f.upgrades[0].ct=origin;f.upgrades[0].date=null;
 const child={datasetId,masterCt:master,ct:origin,student,url:url(901),hubContract:originFacts()};child.id=childFactKey(child);
 const saved={id:master+'|'+student,ct:master,student,url:url(902),hubContract:f,hubPolicy:hubFixture({ct:master,contractId:902,offers:false}).policy,courseFee:'ATLS - New Price 2026 - Layer 1',hoursPerWeek:'3 hrs/week',package:'12 months',giftcode:'0',discount:'0'};
 const state={datasets:[{id:datasetId,bundle:fixture({bundleOnly:true})}],settings:[child],links:[{ct:master,url:url(902)},{ct:origin,url:url(901)}],courseSources:[saved]};
 const compiled=await build({entryPoints:[new URL('../src/local/api.mjs',import.meta.url).pathname],bundle:true,write:false,format:'cjs',platform:'node',target:'es2022',plugins:[{name:'qa-browser-storage',setup(b){
  b.onResolve({filter:/db\.mjs$/},()=>({path:'db',namespace:'qa'}));
  b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const all=async name=>qa.stores[name]??[];export const get=async(name,id)=>(qa.stores[name]??[]).find(x=>x.id===id);export const put=async()=>{};export const versioned=async()=>{};export const activatePolicy=async()=>{};',loader:'js'}));
 }}]});
 const scope={qa:{stores:state},module:{exports:{}},console,URL,URLSearchParams,Date,crypto,TextEncoder,TextDecoder,Response,Blob,setTimeout,clearTimeout,fetch:async()=>new Response(JSON.stringify(policyData()))};
 // Run the real loadWorkbook/buildModel path with synthetic saved sources.
 vm.runInContext(compiled.outputFiles[0].text,vm.createContext(scope));
 const loaded=await scope.module.exports.loadWorkbook(datasetId),row=calculated(loaded);
 assert.equal(row.cells.W,38700000);assert.equal(row.reconciliation.transferIn,9600000);
 assert.equal(saved.hubContract.contractDate,null);
});
test('historical PaymentList and a source course row do not create duplicate money or a second active course',async()=>{
 const model=fixture({history:true}),f=await savedFacts();assert.equal(model.contractGroups.length,2);
 attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,38700000);
 assert.equal(model.contractGroups.length,1);assert.ok(model.contractGroups[0].sourceContracts.includes(origin));
 assert.equal(model.contractGroups[0].receipts.length,2);
 assert.equal(calculated(model).reconciliation.hubSupplement.receipts[0].allocated,9600000);
});
test('Upgrade only allocates the remaining invoice balance after other recorded outflows',async()=>{
 for(const out of [3000000,9600000]){
  const model=fixture(),f=await savedFacts();
  model.input.transferSources.push({rows:[{type:'Transfer',from:origin,to:'QA2610-CT-000904',date:parseDate('2026-10-25'),out,amount:out,fromStudent:student,toStudent:student,ref:{file:'QA Transfer'}}]});
  attachHubFunding(model,context(f));assert.equal(calculated(model).cells.W,38700000-out);
 }
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
test('missing original invoice, future cash, competing upgrade targets and loops cannot manufacture funding',async()=>{
 for(const change of [f=>{delete f.relatedFinance[0].payments.rows[0].invoiceRef;delete f.relatedFinance[0].payments.rows[0].invoice;},f=>{f.relatedFinance[0].payments.rows[0].completeDate='2026-11-01';},f=>{f.relatedFinance[0].upgrades.push({direction:'to',ct:'QA2610-CT-000903',id:'903',url:url(903),date:'2026-10-20'});},f=>{f.relatedFinance[0].upgrades.push({direction:'from',ct:master,id:'902',url:url(902),date:'2026-10-20'});}]){
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
