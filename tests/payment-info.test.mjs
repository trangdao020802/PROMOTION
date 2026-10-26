import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentAllocations} from '../src/core/payment-allocations.mjs';
import {buildModel} from '../src/local/model.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';

const day=parseDate,ct='HN2610-CT-009999',old='HN2609-CT-008888',dep='HN2609-DEP-007777';
const receipt=(id,contract,amount,date='2026-10-22')=>({id,payment:'QA-PAY-'+id,vat:id,contract,amount,date:day(date),verified:true,method:'Online Payments',term:'',refs:[{file:'QA PaymentList',sheet:'Report',row:2}]});
const move=(id,from,to,amount,invoiceIds,date='2026-10-22',extra={})=>({payment:id,from,to,amount,invoiceIds,date:day(date),invoiceBacked:true,refs:[{file:'QA Transfer',sheet:'Report',row:2}],...extra});
export function samplePaymentRow(){
 const receipts=[receipt('0000460',dep,7200000,'2026-09-14'),receipt('0000551','HN2610-DEP-007778',28136000),receipt('0000550','HN2610-DEP-007779',40000000)];
 receipts[1].method='Installment (Credit Card)';receipts[1].term='12 month';receipts[2].method='Payoo POS - Installment';receipts[2].term='12 month';
 const history=[move('a',dep,old,7200000,['0000460'],'2026-09-15'),move('b',old,ct,7200000,['0000460']),move('c',receipts[1].contract,ct,28136000,['0000551']),move('d',receipts[2].contract,ct,40000000,['0000550'])];
 return {kind:'contract',cells:{contractTotal:ct},receipts,reconciliation:{cutoff:day('2026-10-31'),movementHistory:history,events:history.filter(e=>e.to===ct)}};
}
test('Payment info shows three original invoices once, with original method/date and full intermediate lineage',()=>{
 const row=samplePaymentRow(),before=structuredClone(row),p=paymentAllocations(row);
 assert.equal(p.ct,ct);assert.equal(p.total,75336000);assert.equal(p.invoices.length,3);assert.equal(p.originals.length,0);assert.deepEqual(p.dates,[day('2026-10-22')]);
 assert.deepEqual(p.invoices.map(i=>i.amount),[7200000,40000000,28136000]);
 const invoice=p.invoices.find(i=>i.id==='0000460');
 assert.equal(invoice.receipt.date,day('2026-09-14'));assert.equal(invoice.receipt.method,'Online Payments');
 assert.deepEqual(invoice.paths[0].map(e=>[e.from,e.to,e.date]),[[dep,old,day('2026-09-15')],[old,ct,day('2026-10-22')]]);
 assert.ok(invoice.paths[0].every(e=>e.refs.length===1));assert.deepEqual(row,before);
});
test('copies of the same transfer do not create invoices or add intermediate amounts',()=>{
 const row=samplePaymentRow();row.reconciliation.events.push(structuredClone(row.reconciliation.events[0]));
 const p=paymentAllocations(row);assert.equal(p.total,75336000);assert.equal(p.invoices.length,3);assert.equal(p.invoices[0].paths[0].length,2);
});
test('one original invoice allocated partially to the viewed CT keeps its own amount separate',()=>{
 const row=samplePaymentRow();row.receipts=[row.receipts[0]];row.reconciliation.movementHistory=[move('a',dep,ct,3000000,['0000460'])];row.reconciliation.events=[];
 const p=paymentAllocations(row);assert.equal(p.total,3000000);assert.equal(p.invoices[0].amount,3000000);assert.equal(p.invoices[0].receipt.amount,7200000);
});
test('a partially moved mixed pool does not invent FIFO or pro-rata invoice shares',()=>{
 const row=samplePaymentRow();row.receipts=[receipt('a',dep,3000000),receipt('b',dep,7000000)];row.reconciliation.movementHistory=[move('pool',dep,ct,5000000,['a','b'])];row.reconciliation.events=[];
 const p=paymentAllocations(row);assert.equal(p.total,5000000);assert.deepEqual(p.invoices.map(i=>i.amount),[null,null]);assert.ok(p.invoices.every(i=>i.warnings.length));
 row.reconciliation.movementHistory[0].amount=10000000;
 assert.deepEqual(paymentAllocations(row).invoices.map(i=>i.amount),[3000000,7000000]);
});
test('missing original invoices, unsupported movements and later transfers stay pending',()=>{
 const row=samplePaymentRow();row.receipts=[];let p=paymentAllocations(row);assert.equal(p.total,0);assert.equal(p.invoices.length,0);assert.equal(p.pending.length,3);
 const r=samplePaymentRow();r.reconciliation.movementHistory[2].invoiceBacked=false;r.reconciliation.events[1].invoiceBacked=false;
 r.reconciliation.movementHistory[3].date=day('2026-11-01');r.reconciliation.events[2].date=day('2026-11-01');p=paymentAllocations(r);
 assert.equal(p.total,7200000);assert.equal(p.pending.length,1);assert.ok(!p.invoices.some(i=>i.id==='0000550'));
});
test('outgoing signed ledger amounts are preserved and a circular path cannot repeat an invoice amount',()=>{
 const row=samplePaymentRow();row.reconciliation.events.push(move('out',ct,'HN2610-CT-009998',-1000000,['0000460']));
 let p=paymentAllocations(row);assert.equal(p.outgoing.length,1);assert.equal(p.outgoing[0].debit,1000000);assert.equal(p.total,75336000);
 row.reconciliation.movementHistory.push(move('cycle',old,dep,7200000,['0000460']));p=paymentAllocations(row);
 assert.equal(p.invoices[0].amount,null);assert.ok(p.invoices[0].warnings.some(w=>w.includes('vòng')));
});
test('real model funding and contract grouping carry the three original invoices through an old CT',()=>{
 const row=samplePaymentRow(),sources=[['p','payment'],['e','export'],['t','transfer']].map(([key,role],fileIndex)=>({key,role,fileIndex,fileName:'QA-'+key+'.csv',sheetName:'Report',rowCount:3,headerRow:1}));
 const cash=row.receipts.map((r,i)=>({sourceKey:'p',sourceRow:i+2,cells:{B:'Hà Nội',C:'HN1',D:r.payment,E:r.contract,R:'QA-STUDENT',S:'KIỂM THỬ PAYMENT INFO',O:r.date,P:r.vat,I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:'4 hrs/week',AB:'24 months',AH:r.method,AJ:r.term,AF:r.amount,AC:103200000,AD:27864000,AE:0,AQ:'Q4 2026 Promotion Discount'}}));
 const transfers=row.reconciliation.movementHistory.map((e,i)=>({sourceKey:'t',sourceRow:i+2,type:'Transfer',fromStudent:'QA-STUDENT',toStudent:'QA-STUDENT',from:e.from,to:e.to,date:e.date,out:e.amount,amount:e.amount}));
  const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:'HN1'},cutoff:day('2026-10-31'),records:cash.slice(1),cash,transfers,exports:[{sourceKey:'e',sourceRow:2,ct,student:'QA-STUDENT',target:75336000,paid:75336000,courseFee:cash[0].cells.Z,hoursPerWeek:'4 hrs/week',package:'24 months',totalHours:400,contractType:'New',center:'HN1'}],sources};
 const engine=new AuditEngine(buildModel(bundle,policyData()));const result=engine.calculate({id:'CT::'+ct});const p=paymentAllocations(result);
 assert.equal(result.reconciliation.net,75336000);assert.equal(p.total,75336000);assert.equal(p.invoices.length,3);assert.equal(p.invoices.find(i=>i.receipt.contract===dep).paths[0].length,2);
 assert.equal(result.cells.AF,'CHECK');assert.ok(result.reviewItems.some(i=>i.id==='source-comparison'));
 const reviews=Object.fromEntries(result.reviewItems.map(i=>[i.id,{approved:true,scope:i.scope}]));
 const approved=engine.calculate({id:'CT::'+ct},{reviews});
 assert.equal(approved.cells.AF,'OK');assert.deepEqual(approved.resultReasons,[]);assert.equal(approved.cells.Z,null);
 const revoked=engine.calculate({id:'CT::'+ct},{reviews:{...reviews,'source-comparison':{...reviews['source-comparison'],approved:false}}});assert.equal(revoked.cells.AF,'CHECK');
});
