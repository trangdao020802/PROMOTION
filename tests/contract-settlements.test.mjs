import test from 'node:test';
import assert from 'node:assert/strict';
import {buildModel,identity} from '../src/local/model.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {paymentAllocations} from '../src/core/payment-allocations.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
const old='QA2610-CT-000111',ct='QA2610-CT-000222',dep='QA2610-DEP-000111',dep2='QA2610-DEP-000222',student='QA-STUDENT-MOVED';
const day=parseDate;
function sample(){
 const base={B:'Trung tâm kiểm thử',C:'QA1',R:student,S:'HỌC VIÊN KIỂM THỬ',I:'Paid',F:'Payment',G:'New',X:'ATLS',AH:'Online Payments',Z:'ATLS - New Price 2026 - Layer 1',AA:'3 hrs/week',AB:'2 months',AQ:'',AC:7200000,AD:0,AE:0,AF:7200000};
 const row=(i,cells)=>({sourceKey:'p',sourceRow:i+2,cells:{...base,...cells}});
 const cash=[row(0,{D:'QA2610-PAY-000111',E:dep,P:'000531',O:day('2026-10-25')}),row(1,{D:'QA2610-PAY-000222',E:dep2,P:'000534',O:day('2026-10-26'),AF:40995000,Z:'',AA:'',AB:'',AC:0})];
 const move=(i,from,to,amount,date)=>({sourceKey:'t',sourceRow:i+2,type:'Transfer',date:day(date),fromStudent:student,toStudent:student,from,to,out:amount,amount});
 const transfers=[move(0,dep,old,7200000,'2026-10-25'),move(1,old,ct,7200000,'2026-10-26'),move(2,dep2,ct,40995000,'2026-10-26')];
 const exp=(code,target,packageName)=>({sourceKey:'e',sourceRow:code===old?2:3,ct:code,student,target,paid:target,courseFee:base.Z,hoursPerWeek:'3 hrs/week',package:packageName,totalHours:225,contractType:'New',center:'QA1'});
 return {kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:'QA1'},cutoff:day('2026-10-31'),records:cash,cash,transfers,exports:[exp(old,7200000,'2 months'),exp(ct,48195000,'18 months (VTDH-Full)')],sources:[['p','payment'],['t','transfer'],['e','export']].map(([key,role],fileIndex)=>({key,role,fileIndex,fileName:'QA-'+key+'.csv',sheetName:'CSV',headerRow:1,rowCount:3}))};
}
const model=b=>buildModel(b,policyData());

test('resolves a fully moved intermediate CT to the final CT, using its course and one cash balance',()=>{
 const b=sample(),before=structuredClone(b),m=model(b);
 assert.equal(m.contractGroups.length,1);
 const g=m.contractGroups[0];assert.equal(g.ct,ct);assert.equal(g.account.ct,ct);assert.equal(g.cells.C,ct);assert.equal(g.cells.F,student);
 assert.equal(g.cells.J,'18 months (VTDH-Full)');assert.equal(g.cells.I,'3 hrs/week');assert.equal(g.cells.D,day('2026-10-26'));
 assert.deepEqual(g.sourceContracts,[old]);assert.equal(g.memberIds.length,2);assert.equal(g.receipts.length,2);assert.equal(g.account.net,48195000);
 assert.deepEqual(g.account.warnings,[]);assert.equal(m.extensions.accounts.statistics.resolved,2);
 const row=new AuditEngine(m).calculate({id:g.id});assert.equal(row.cells.contractTotal,ct);assert.equal(row.cells.W,48195000);
 const p=paymentAllocations(row);assert.equal(p.total,48195000);assert.equal(p.invoices.length,2);assert.deepEqual(p.invoices[0].paths[0].map(e=>e.to),[old,ct]);
 assert.deepEqual(b,before);
});
test('the final parent is resolved even when the retired CT or final CT is missing from Export',()=>{
 for(const missing of [old,ct]){
  const b=sample();b.exports=b.exports.filter(e=>e.ct!==missing);const m=model(b);
  assert.equal(m.contractGroups.length,1);const g=m.contractGroups[0];assert.equal(g.ct,ct);assert.equal(g.account.ct,ct);
  const row=new AuditEngine(m).calculate({id:g.id});assert.equal(row.cells.contractTotal,ct);
  if(missing===ct){assert.equal(g.cells.J,'2 months');assert.deepEqual(g.courseInfo.originContracts,[old]);assert.equal(row.cells.AF,'CHECK');assert.equal(row.reconciliation.target,null);}
 }
});
test('a direct payment on the old CT also belongs to the final parent after full transfer',()=>{
 const b=sample();b.cash[0].cells.E=old;b.transfers.shift();const m=model(b);
 assert.equal(m.contractGroups.length,1);assert.equal(m.contractGroups[0].ct,ct);assert.equal(m.contractGroups[0].receipts.length,2);
});
test('multi-hop CT transfers collapse to one final parent and keep all intermediate trace steps',()=>{
 const b=sample(),middle='QA2610-CT-000333';b.transfers[1].to=middle;b.transfers.push({...b.transfers[1],sourceRow:9,from:middle,to:ct});
 const m=model(b);assert.equal(m.contractGroups.length,1);assert.deepEqual(new Set(m.contractGroups[0].sourceContracts),new Set([old,middle]));
 const row=new AuditEngine(m).calculate({id:m.contractGroups[0].id});assert.deepEqual(paymentAllocations(row).invoices[0].paths[0].map(e=>e.to),[old,middle,ct]);
});
test('partial transfers and independent courses for the same student stay as separate real CTs',()=>{
 const b=sample();b.transfers[1].out=b.transfers[1].amount=3000000;let m=model(b);assert.equal(m.contractGroups.length,2);assert.ok(!m.contractSettlements[old]);
 b.transfers.splice(1,1);m=model(b);assert.equal(m.contractGroups.length,2);
 const engine=new AuditEngine(m);for(const g of m.contractGroups){engine.calculate({id:g.id},{H:'ATLS - New Price 2026 - Layer 1',I:'3 hrs/week',J:'18 months (VTDH-Full)'});}
 assert.equal(engine.data.contractGroups.length,2);assert.equal(model(b).contractGroups.length,2);
});
test('unproved, cross-student, divergent and cyclic transfers never silently remove a CT',()=>{
 const cases=[
  b=>{b.cash[0].cells.I='Pending';},
  b=>{b.transfers[1].toStudent='OTHER-STUDENT';},
  b=>{b.transfers[1].out=b.transfers[1].amount=3000000;b.transfers.push({...b.transfers[1],sourceRow:9,to:'QA2610-CT-000333',out:4200000,amount:4200000});},
  b=>{b.transfers.push({...b.transfers[1],sourceRow:9,from:ct,to:old,date:day('2026-10-27'),out:7200000,amount:7200000});},
  b=>{b.transfers[1].amount=7000000;}
 ];
 for(const mutate of cases){const b=sample();mutate(b);const m=model(b);assert.ok(!m.contractSettlements[old]);assert.ok(m.contractGroups.some(g=>g.ct===old));}
});
test('parent resolution respects the cutoff and does not inherit retired course edits or approvals',()=>{
 const b=sample();b.cutoff=day('2026-10-25');b.scope.to='2026-10-25';b.records=[b.cash[0]];let m=model(b);assert.deepEqual(m.contractGroups.map(g=>g.ct),[old]);
 const current=model(sample()),g=current.contractGroups[0];assert.equal(identity({kind:g.kind,ct:g.ct,cells:g.cells}),ct+'|'+student);
 const engine=new AuditEngine(current),patch={J:'24 months',approved:true};
 const row=engine.calculate({id:g.id},patch);assert.equal(row.cells.J,'24 months');assert.equal(row.cells.contractTotal,ct);
 assert.equal(engine.data.contractGroups.length,1);assert.equal(model(sample()).contractGroups[0].cells.J,'18 months (VTDH-Full)');
});
