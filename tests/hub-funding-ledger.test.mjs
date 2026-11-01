import test from 'node:test';
import assert from 'node:assert/strict';
import {buildModel} from '../src/local/model.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {attachHubFunding} from '../src/core/hub-proven-funding.mjs';
import {projectHubContract,projectHubDisplayedTables} from '../src/core/hub-contract.mjs';
import {projectContractDetail,parseContractDetailProjection} from '../src/core/hub-course-network.mjs';
import {childFactInput,childFactKey,mergeChildFinancialFact} from '../src/core/child-hub-evidence.mjs';
import {paymentAllocations} from '../src/core/payment-allocations.mjs';
import {knownFinanceDocuments} from '../src/core/hub-upstream.mjs';
const master='QA2610-CT-000900',mids=['QA2610-CT-000901','QA2610-CT-000902'],roots=['QA2506-CT-000801','QA2506-DEP-000802'],student='QA-RECEIVER',datasetId='qa-history';
const invoiceRefs=['0000801','0000802'];
const move=(from,to,amount=4725000)=>({sourceKey:'t',sourceRow:2,type:'Transfer',date:parseDate('2026-10-31'),from,to,fromStudent:student,toStudent:student,out:amount,amount});
function fixture(){
 const c={B:'QA CENTER',C:'QA1',D:'QA2610-PAY-000900',E:master,R:student,S:'HỒ SƠ GIẢ TRUY VẾT',O:parseDate('2026-10-31'),P:'0000900',I:'Paid',F:'Payment',G:'Renew',X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:'3 hrs/week',AB:'3 months',AO:'0',AQ:'0',AH:'Online Payments',AC:10800000,AD:0,AE:0,AF:1350000,AG:38},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:parseDate('2026-10-31'),records:[r],cash:[r],transfers:mids.map(m=>move(m,master)),exports:[{sourceKey:'e',sourceRow:2,ct:master,student,target:10800000,paid:10800000,courseFee:c.Z,hoursPerWeek:c.AA,package:c.AB,totalHours:38,contractType:'Renew',center:'QA1'}],sources:['payment','export','transfer'].map((role,i)=>({key:['p','e','t'][i],role,fileIndex:i,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const model=buildModel(bundle,policyData());model.dataset={id:datasetId};return {model,bundle};
}
function fact(index,{paidDate='2025-06-27',invoiceRef=invoiceRefs[index]}={}){
 const ct=roots[index],deposit=ct.includes('-DEP-'),id=8800+index,url='https://hub24.apollo.vn:7777/'+(deposit?'deposit':'contract')+'/detail/'+id;
 const raw={...(deposit?{DepositId:id,DepositNo:ct}:{ContractId:id,ContractNo:ct}),StudentCode:'QA-DIFFERENT-PAYER',ListCourseInfo:[],ListMovingOut:[{FromContractNo:ct,ToContractNo:mids[index],Amount:4725000,TransferDate:'2026-10-31'}]};
 const hubContract=projectHubContract(raw,{payments:[{id:String(1800+index),code:'QA2506-PAY-00080'+index,amount:4725000,totalAmount:4725000,remaining:0,typeId:null,type:'Payment',method:'Online Payments',scheduledDate:null,completeDate:paidDate,complete:true,...(invoiceRef?{invoiceRef}:{})}],paymentState:'read'});
 return {id:childFactKey({datasetId,masterCt:master,ct,student}),datasetId,masterCt:master,ct,student,url,hubContract};
}
const facts=()=>[fact(0),fact(1)],links=list=>list.map(f=>({ct:f.ct,url:f.url}));
const row=model=>new AuditEngine(model).calculate({id:'CT::'+master});
test('two old CT/DEP receipts fund pending child transfers in the original ledger and clear their pending paths',()=>{
 const f=fixture(),before=row(f.model),saved=facts();assert.equal(before.cells.W,1350000);assert.equal(paymentAllocations(before).pending.length,2);
 const course=[before.cells.H,before.cells.I,before.cells.J,before.cells.K,before.cells.L];
 attachHubFunding(f.model,{datasetId,facts:saved,links:links(saved)});const after=row(f.model),allocations=paymentAllocations(after);
 assert.equal(after.cells.W,10800000);assert.equal(after.cells.ctCheck,'OK');assert.equal(after.cells.AC,0);assert.equal(after.reconciliation.transferIn,9450000);
 assert.equal(allocations.total,9450000);assert.equal(allocations.pending.length,0);assert.equal(allocations.invoices.length,2);assert.ok(allocations.invoices.every(i=>i.paths[0].length===2&&i.amount===4725000));assert.equal(after.receipts.length,3);
 assert.deepEqual([after.cells.H,after.cells.I,after.cells.J,after.cells.K,after.cells.L],course);assert.ok(!after.reconciliation.warnings.some(w=>w.includes('chưa đủ hóa đơn')));
 const reload=fixture();attachHubFunding(reload.model,{datasetId,facts:[...saved,saved[0]],links:links(saved)});assert.equal(row(reload.model).cells.W,10800000);
});
test('receipt dates, source URL binding and unproven paths stay pending instead of creating cash',()=>{
 for(const changed of [facts().map((f,i)=>i?f:fact(0,{paidDate:'2026-11-01'})),facts().map((f,i)=>i?f:{...f,url:f.url+'9'}),facts().map((f,i)=>i?f:fact(0,{invoiceRef:null}))]){
  const f=fixture();attachHubFunding(f.model,{datasetId,facts:changed,links:links(changed)});assert.equal(row(f.model).cells.W,6075000);
 }
});
test('importing the historical PaymentList later never counts the original receipt twice',()=>{
 const f=fixture(),saved=facts();
 for(const [i,h]of saved.entries())f.model.input.cashSources[0].rows.push({payment:h.hubContract.payments.rows[0].code,contract:h.ct,student:'QA-DIFFERENT-PAYER',vat:invoiceRefs[i],date:parseDate('2025-06-27'),amount:4725000,paid:true,cancelled:false,ref:{file:'QA history'}});
 attachHubFunding(f.model,{datasetId,facts:saved,links:links(saved)});assert.equal(row(f.model).cells.W,10800000);assert.equal(row(f.model).receipts.length,3);
});
test('finance-only reads accept a different payer and a Deposit while course reads retain student identity checks',()=>{
 for(const [i,ct]of roots.entries()){
  const deposit=ct.includes('-DEP-'),id=8800+i,request={ct,student,url:'https://hub24.apollo.vn:7777/'+(deposit?'deposit':'contract')+'/detail/'+id,readFinance:true};
  const raw={...(deposit?{DepositId:id,DepositNo:ct}:{ContractId:id,ContractNo:ct}),StudentCode:'QA-DIFFERENT-PAYER',ListCourseInfo:[],ListPayment:[]};
  const api='https://hub24.apollo.vn:7777/api/'+(deposit?'Deposit/GetDepositDetail?depositId=':'Contract/GetContractDetail?contractId=')+id;
  const projected=projectContractDetail(raw,api,request.url),result=parseContractDetailProjection(projected,request);assert.ok(result.payload);assert.equal(result.payload.courseFee,null);assert.equal(result.payload.readFinance,true);
  const f=childFactInput({datasetId,masterCt:master,ct,student,url:request.url,payload:result.payload});assert.ok(f);assert.equal(f.courseSummary.courseFee,null);
  if(!deposit)assert.equal(parseContractDetailProjection(projected,{...request,readFinance:false}).error,'student');
 }
});
test('the displayed Moving-in header names discover another CT or DEP rather than treating Not available as a missing receipt',()=>{
 const displayed=projectHubDisplayedTables([{headers:['Payment code','Payment method','Moving-in date','Moving-in amount','Moving-in from','E-Invoice','Others'],rows:[['QA2610-PAY-000901','Transfer','31/10/2026','4.725.000',roots[0],'Not available',''],['QA2610-PAY-000902','Transfer','31/10/2026','4.725.000',roots[1],'Not available','']]}],mids[0]);
 assert.equal(displayed.payments,null);assert.equal(displayed.movements.length,2);assert.deepEqual(displayed.movements.map(m=>m.from),roots);
 const f=fixture(),group=f.model.contractGroups[0],context={datasetId,masterCt:master,student};
 const saved={id:childFactKey({...context,ct:mids[0]}),...context,ct:mids[0],hubContract:{movements:{rows:displayed.movements}}};
 const known=knownFinanceDocuments(group,[saved],context);assert.ok(known.has(roots[0]));assert.ok(known.has(roots[1]));
});
test('a partial retry preserves prior financial evidence; an explicitly read empty list replaces it',()=>{
 const prior=fact(0),next=structuredClone(prior);next.hubContract.payments={state:'unavailable',rows:[]};next.hubContract.movements={state:'pending',rows:[]};
 const merged=mergeChildFinancialFact(prior,next);assert.equal(merged.hubContract.payments.rows.length,1);assert.equal(merged.hubContract.movements.rows.length,1);assert.deepEqual(merged.lastReadMissing,['payments','movements']);
 next.hubContract.payments={state:'read',rows:[]};assert.equal(mergeChildFinancialFact(prior,next).hubContract.payments.rows.length,0);
});
