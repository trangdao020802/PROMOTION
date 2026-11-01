import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedHubSupplement} from '../src/core/hub-proven-funding.mjs';
import {childFactKey} from '../src/core/child-hub-evidence.mjs';
import {projectHubContract,projectHubDisplayedTables,mergeDisplayedHubContract,contractRoot} from '../src/core/hub-contract.mjs';
const master='QA2610-CT-0050516',student='QA-HISTORY-STUDENT',datasetId='dataset-verified';
const mid=['QA2610-CT-0050504','QA2610-CT-0050513'];
const roots=['QA2506-CT-0027985','QA2506-CT-0027984'];
const amount=4725000;
const date='2026-10-31',invoiceRefs=['ee2def81-9f58-4405-ae05-039080e05a0a','f322ed81-9f58-4405-ae05-039080e05a0b'];
function makeFact(origin,to,i,invoiceRef=invoiceRefs[i]){
 const url='https://hub24.apollo.vn:7777/contract/detail/'+(589137+i);
 const root={ContractId:589137+i,ContractNo:origin,ListCourseInfo:[],ListDiscount:[],ListMovingOut:[{FromContractNo:origin,ToContractNo:to,TransferAmount:amount,TransferDate:'31/10/2026',PaymentCode:'2610-PAY-015251'+i}]};
 const contract=projectHubContract(root,{payments:[{id:null,code:'QA2506-PAY-008892'+i,amount,totalAmount:amount,remaining:0,typeId:null,type:'Payment',method:'Online Payments',scheduledDate:'2025-06-27',completeDate:'2025-06-27',complete:true,...(invoiceRef?{invoiceRef}:{})}],paymentState:'read'});
 assert.ok(contract);
 return {id:childFactKey({datasetId,masterCt:master,ct:origin,student}),datasetId,masterCt:master,ct:origin,student,url,hubContract:contract};
}
const facts=roots.map((root,i)=>makeFact(root,mid[i],i));
const links=facts.map(f=>({ct:f.ct,url:f.url}));
const sourceMovements=mid.map(m=>({from:m,to:master,amount,date,invoiceBacked:false}));
const run=(opts={})=>verifiedHubSupplement({masterCt:master,student,datasetId,sourceMovements,links,facts,...opts});
test('two separate 2025 original Paid references fund the master once across two CT intermediates',()=>{
 const result=run();
 assert.equal(result.amount,9450000);
 assert.equal(result.receipts.length,2);
 assert.deepEqual(result.receipts.map(r=>r.origin).sort(),[...roots].sort());
 assert.ok(result.receipts.every(r=>r.path.length===2&&r.allocated===amount&&r.invoiceRef));
 assert.equal(result.pending.length,0);
});
test('duplicate original Hub payment and already imported PaymentList never increase funded total',()=>{
 const f=facts[0];
 assert.equal(run({facts:[...facts,f]}).amount,9450000);
 assert.equal(run({sourcePayments:[{payment:'QA2506-PAY-0088920'}]}).amount,4725000);
});
test('a missing E-Invoice, missing moving path or disagreement in amount keeps CT unresolved',()=>{
 const absent=facts.map((f,i)=>i===0?makeFact(f.ct,mid[0],0,null):f);
 assert.equal(run({facts:absent}).amount,4725000);
 assert.equal(run({facts:absent}).pending.length,1);
 assert.equal(run({sourceMovements:sourceMovements.slice(0,1)}).amount,4725000);
 assert.equal(run({sourceMovements:[...sourceMovements,{from:mid[0],to:master,amount:9500000,date}]}).amount,4725000);
});
test('same intermediate CT cannot count two original payments beyond its transfer capacity',()=>{
 const shared=[makeFact(roots[0],mid[0],0),makeFact(roots[1],mid[0],1)];
 const result=run({facts:shared,sourceMovements:[sourceMovements[0]]});
 assert.equal(result.amount,4725000);
});
test('reader captures the E-Invoice document identifier from visible Payment Info, not unrelated columns',()=>{
 const ct=roots[0];
 const displayed=projectHubDisplayedTables([{
  headers:['Payment code','Payment method','Scheduled date','Completed date','Payment amount','Remain amount','Paid amount','E-Invoice','Complete payment'],
  rows:[['QA2506-PAY-0088920','Online Payments','27/06/2025','27/06/2025','4.725.000','0','4.725.000',invoiceRefs[0],'Paid']]
 }],ct);
 assert.equal(displayed.payments[0].invoiceRef,invoiceRefs[0]);
 const root={ContractId:589137,ContractNo:ct,ListCourseInfo:[],ListDiscount:[]};
 const old=projectHubContract(root,{payments:[{id:'123456',code:'QA2506-PAY-0088920',amount,totalAmount:amount,remaining:0,typeId:null,type:'Payment',method:'Online Payments',scheduledDate:'2025-06-27',completeDate:'2025-06-27',complete:true}],paymentState:'read'});
 const updated=mergeDisplayedHubContract(old,[{headers:['Payment code','Payment amount','Paid amount','Completed date','E-Invoice'],
 rows:[['QA2506-PAY-0088920','4.725.000','4.725.000','27/06/2025',invoiceRefs[0]]]}],ct);
 assert.equal(updated.payments.rows[0].invoiceRef,invoiceRefs[0]);
 const withoutCourse=contractRoot({Data:{ContractId:589137,ContractNo:ct,ListMovingOut:[]}});
 assert.equal(withoutCourse.ContractNo,ct);
});
