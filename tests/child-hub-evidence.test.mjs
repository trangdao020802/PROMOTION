import test from 'node:test';
import assert from 'node:assert/strict';
import {projectHubContract,projectHubMovements,validateHubContract,projectHubDisplayedTables,mergeDisplayedHubContract} from '../src/core/hub-contract.mjs';
import {upstreamCandidates,originPaymentSummary,ctCode,ancestryKey} from '../src/core/hub-upstream.mjs';
import {childFactInput,compareChildFacts,childFactKey} from '../src/core/child-hub-evidence.mjs';
const master='OP2610-CT-0050516',child='OP2610-CT-0050504',student='HN27261012249',url='https://hub24.apollo.vn:7777/contract/detail/589137';
const payment={PaymentId:15214,ContractId:589137,PaymentCode:'OP2506-PAY-0088924',PaymentTypeName:'Payment',PaymentMethodTypeName:'Online Payments',Amount:4725000,TotalAmount:4725000,RemainAmount:0,IsComplete:true,CompleteDate:'2025-06-27T00:00:00'};
const raw={ContractId:589137,ContractNo:child,ListCourseInfo:[],ListDiscount:[],
 ListMovingOut:[{FromContractNo:child,ToContractNo:master,TransferAmount:4725000,TransferDate:'31/10/2026',PaymentCode:'2610-PAY-0152514'}]};
const make=()=>projectHubContract(raw,{payments:[{
 id:'15214',code:payment.PaymentCode,amount:payment.Amount,totalAmount:payment.TotalAmount,remaining:0,typeId:null,type:'Payment',method:'Online Payments',scheduledDate:null,completeDate:'2025-06-27',complete:true
}],paymentState:'read'});
const payload=()=>({ct:child,student,url,courseState:'empty',courseFee:null,hoursPerWeek:null,package:null,giftcode:null,discount:null,groupKoc:null,contractType:null,hubContract:make()});
test('Hub Moving-out from an intermediate CT is read once and never treated as a new invoice',()=>{
 const facts=make();assert.equal(facts.movements.state,'read');assert.equal(facts.movements.rows.length,1);
 assert.deepEqual(facts.movements.rows.map(x=>[x.from,x.to,x.amount,x.date]),[[child,master,4725000,'2026-10-31']]);
 assert.ok(validateHubContract(facts));
 const evidence=childFactInput({datasetId:'qa',masterCt:master,ct:child,student,url,payload:payload()});
 assert.ok(evidence);assert.equal(evidence.hubContract.payments.rows.length,1);
 assert.equal(evidence.id,childFactKey({datasetId:'qa',masterCt:master,ct:child,student}));
});
test('CT link, student and Hub payload must agree, including when contract has no active course',()=>{
 for(const [change,expected] of [
  [{student:'OTHER'},null],
  [{url:'https://hub24.apollo.vn:7777/contract/detail/589138'},null],
  [{ct:master},null]
 ]){
  const evidence=childFactInput({datasetId:'qa',masterCt:master,ct:child,student,url,payload:{...payload(),...change}});
  assert.equal(evidence,expected);
 }
 assert.equal(childFactInput({datasetId:'qa',masterCt:master,ct:child,student,url,payload:{...payload(),hubContract:null}}),null);
});
test('compare missing PaymentList and Transfer without turning Hub evidence into received cash',()=>{
 const fact=childFactInput({datasetId:'qa',masterCt:master,ct:child,student,url,payload:payload()});
 const row={ct:master,cells:{F:student},receipts:[],reconciliation:{movementHistory:[]}};
 const missing=compareChildFacts(fact,row);
 assert.equal(missing.missingPayments,1);assert.equal(missing.missingTransfers,1);
 assert.equal(missing.payments[0].sourceAmount,null);
 assert.equal(missing.hubMoves[0].sourceMatched,false);
 assert.equal(compareChildFacts(fact,{...row,cells:{F:'ANOTHER'}}),null);
});
test('read-only Hub amounts and imported source transactions compare without double-counting a multi-hop transfer',()=>{
 const fact=childFactInput({datasetId:'qa',masterCt:master,ct:child,student,url,payload:payload()});
 const row={ct:master,cells:{F:student},
 receipts:[{payment:payment.PaymentCode,vat:'0000514',amount:4725000}],
 reconciliation:{movementHistory:[
  {from:child,to:master,amount:4725000,invoiceBacked:true,refs:[{file:'Transfer PaymentList'}]},
  {from:'OP2610-DEP-0033554',to:child,amount:4725000,invoiceBacked:true,refs:[{file:'Transfer PaymentList'}]}
 ]}};
 const result=compareChildFacts(fact,row);
 assert.equal(result.payments[0].status,'matched');assert.equal(result.payments[0].invoice,'0000514');
 assert.equal(result.missingPayments,0);assert.equal(result.missingTransfers,0);
 assert.equal(result.hubMoves[0].sourceMatched,true);assert.equal(result.transfers.length,2);
 assert.equal(result.payments.reduce((s,p)=>s+(p.sourceAmount??0),0),4725000);
});
test('unread Hub Moving information stays pending, and malformed movements are refused',()=>{
 const noList={...raw,ListMovingOut:undefined};
 const p=projectHubContract(noList);assert.equal(p.movements.state,'pending');assert.equal(p.movements.rows.length,0);
 for(const v of [
  {...raw,ListMovingOut:[{...raw.ListMovingOut[0],ToContractNo:'OTHER-CT-123'}]},
  {...raw,ListMovingOut:[{...raw.ListMovingOut[0],TransferAmount:-1}]},
  {...raw,ListMovingOut:[{...raw.ListMovingOut[0],FromContractNo:'OP2610-CT-OTHER'}]}
 ])assert.equal(projectHubMovements(v),null);
});

test('displayed 2025 Payment Info and Moving-out are recognized as original paid evidence',()=>{
 const initial=projectHubContract({...raw,ContractNo:'OP2506-CT-0027985',ContractId:589137,ListMovingOut:undefined});
 const tables=[
  {headers:['Payment code','Payment method','Scheduled date','Completed date','Payment amount','Remain amount','Paid amount','E-Invoice','Complete payment'],
   rows:[['OP2506-PAY-0088924','Online Payments','27/06/2025','27/06/2025','4.725.000','0','4.725.000','SECRET-EINVOICE','true']]},
  {headers:['Payment code','Transfer date','Moving out amount','Transfer to'],
   rows:[['2610-PAY-0152514','31/10/2026','4.725.000','OP2610-CT-0050504']]}
 ];
 const merged=mergeDisplayedHubContract(initial,tables,'OP2506-CT-0027985');
 assert.ok(validateHubContract(merged));assert.equal(merged.payments.state,'read');
 assert.equal(merged.payments.rows[0].code,'OP2506-PAY-0088924');
 assert.equal(merged.payments.rows[0].amount,4725000);
 assert.equal(merged.payments.rows[0].completeDate,'2025-06-27');
 assert.equal(merged.payments.rows[0].id,null);
 assert.equal(merged.movements.rows[0].to,'OP2610-CT-0050504');
 assert.equal(merged.movements.rows[0].date,'2026-10-31');
 assert.ok(!JSON.stringify(merged).includes('SECRET-EINVOICE'));
});
test('both 2025 origin contracts can be identified from immediate transfer links, not just the parent CT',()=>{
 const rootA='OP2506-CT-0027985',rootB='OP2506-CT-0027984';
 const middleA='OP2610-CT-0050504',middleB='OP2610-CT-0050513';
 const history=[
  {from:rootA,to:middleA,amount:4725000},
  {from:middleA,to:master,amount:4725000},
  {from:rootB,to:middleB,amount:4725000},
  {from:middleB,to:master,amount:4725000}
 ];
 const row={ct:master,reconciliation:{movementHistory:history},cells:{F:student}};
 assert.deepEqual(upstreamCandidates(row,middleA),[rootA]);
 assert.deepEqual(upstreamCandidates(row,middleB),[rootB]);
 assert.deepEqual(upstreamCandidates(row,rootA),[]);
 assert.deepEqual(upstreamCandidates({ct:master,reconciliation:{movementHistory:[]}},middleA,{hubContract:{movements:{rows:[{from:rootA,to:middleA,amount:4725000}]}}}),[rootA]);
 assert.equal(ctCode('not contract'),null);
 assert.equal(ancestryKey({datasetId:'qa',masterCt:master,student,parentCt:middleA}).includes(middleA),true);
});
test('two distinct original Paid documents are counted once, intermediate transfers are not a new receipt',()=>{
 const facts=[
  {ct:'OP2506-CT-0027985',hubContract:{payments:{rows:[{id:null,code:'OP2506-PAY-0088924',amount:4725000,complete:true}]}}},
  {ct:'OP2506-CT-0027984',hubContract:{payments:{rows:[{id:'7999',code:'OP2506-PAY-0088925',amount:4725000,complete:true}]}}},
  {ct:'OP2610-CT-0050504',hubContract:{payments:{rows:[]}}},
  {ct:'OP2610-CT-0050513',hubContract:{payments:{rows:[]}}}
 ];
 const total=originPaymentSummary([...facts,facts[0]]);
 assert.equal(total.payments.length,2);
 assert.equal(total.hubPaid,9450000);
 assert.equal(total.payments.some(p=>p.ct==='OP2610-CT-0050504'),false);
});
test('payment table rejects malformed code/money and non-financial columns',()=>{
 const projected=projectHubDisplayedTables([
  {headers:['Payment code','Payment amount','Paid amount','Completed date'],rows:[
   ['OP2506-PAY-0088924','4.725.000','4.725.000','27/06/2025'],
   ['OP2506-PAY-0088926','4.725.000','-1.000.000','27/06/2025'],
   ['INVALID','4.725.000','4.725.000','27/06/2025']]},
  {headers:['Password','Token','Username'],rows:[['secret','secret','secret']]}
 ],'OP2506-CT-0027985');
 assert.equal(projected.payments.length,1);
 assert.equal(projected.movements,null);
 assert.ok(!JSON.stringify(projected).includes('secret'));
});
