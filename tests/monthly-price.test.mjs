import test from 'node:test';
import assert from 'node:assert/strict';
import {policyData} from '../scripts/policy-data.mjs';
import {regularMonthlyPrice} from '../src/core/monthly-price.mjs';
import {regularTwoMonthPrice} from '../src/core/promotions.mjs';
import {priceFor,AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
const policy=policyData(),when=parseDate('2026-10-10');
const input=(months=2,layer=1,hours=3,family='ATLS')=>({H:`${family} - New Price 2026 - Layer ${layer}`,I:hours+' hrs/week',J:months+' months',D:when,L:''});
const price=(p=policy,cells=input(),type='New')=>priceFor({policy:p},cells,{group:cells.H.startsWith('AGLS')?'AGLS':'ATLS',contractType:type});
function engineFor(net=7200000,giftcode=''){
 const cells={B:'CENTER GIẢ KIỂM THỬ',C:'QA1',D:'QA2610-PAY-002',E:'QA2610-CT-002',R:'QA-MONTHLY',S:'DỮ LIỆU GIẢ KIỂM THỬ',O:when,P:'QA002',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:input().H,AA:'3 hrs/week',AB:'2 months',AQ:'',AO:giftcode,AH:'Online Payments',AJ:'',AC:7200000,AD:0,AE:giftcode?720000:0,AF:net,AG:25},row={sourceKey:'p',sourceRow:2,cells};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:parseDate('2026-10-31'),records:[row],cash:[row],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:cells.E,student:cells.R,target:net,paid:net,courseFee:cells.Z,hoursPerWeek:cells.AA,package:cells.AB,totalHours:25,contractType:'New',center:'QA1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 return new AuditEngine(buildModel(bundle,policy));
}
test('all six layer/hour combinations multiply the month before discount for regular and odd packages',()=>{
 for(const [layer,hours,monthly]of [[1,3,3600000],[2,3,3450000],[3,3,3300000],[1,4,4800000],[2,4,4600000],[3,4,4400000]])for(const family of ['ATLS','AGLS'])for(const months of [1,2,4,5]){
  const r=price(policy,input(months,layer,hours,family));assert.equal(r.gross,monthly*months,`${family}|${layer}|${hours}|${months}`);assert.equal(r.discount,0);assert.equal(r.monthly,monthly);assert.equal(r.maxTerms,0);assert.ok(r.refs.some(ref=>ref.sheet==='BẢNG GIÁ'&&ref.cell.startsWith('F')));
 }
});
test('stale promotional Audit month values cannot change the regular gross or create a discount',()=>{
 const p=structuredClone(policy);for(const row of p.auditPolicy.baseTuition.filter(r=>r.row>=51)){row.E=2600000;row.F=1000000;}
 const r=price(p,input(2));assert.equal(r.gross,7200000);assert.equal(r.discount,0);
 const legacy=regularTwoMonthPrice({extensions:{roadmap:p.roadmap,prices:p.prices}},{course:input().H,hours:input().I,package:input().J,group:'ATLS'});assert.equal(legacy.amount,7200000);
});
test('missing, ambiguous or conflicting monthly gross sources stay CHECK instead of using trial or Report prices',()=>{
 const cases=[
  p=>{p.roadmap=p.roadmap.filter(r=>r.A!=='1|3|3');},
  p=>{p.roadmap.push({...p.roadmap.find(r=>r.A==='1|3|3')});},
  p=>{p.monthlyRates.find(r=>r.layer===1&&r.hours===3).monthly=2600000;},
  p=>{p.prices.push({C:input().H,D:input().I,E:'3 months',J:7800000});}
 ];
 for(const change of cases){const p=structuredClone(policy);change(p);const r=price(p);assert.equal(r.gross,null);assert.ok(r.issue.includes('CHƯA CÓ ĐƠN GIÁ'));}
});
test('the two-month CT reconciles 7.2 million before promotions and percent vouchers are applied once',()=>{
 const e=engineFor();let r=e.calculate({id:'CT::QA2610-CT-002'});assert.equal(r.cells.M,7200000);assert.equal(r.cells.N,0);assert.equal(r.cells.Q,7200000);assert.equal(r.cells.Z,0);assert.equal(r.cells.AF,'OK');assert.ok(r.cells.AN.includes('F37'));assert.ok(!r.cells.AN.includes('RULE · dòng 54'));
 const withGift=engineFor(6480000,'QA-MONTHLY10');withGift.setVouchers([{code:'QA-MONTHLY10',label:'QA 10%',studentId:'QA-MONTHLY',studentName:'DỮ LIỆU GIẢ KIỂM THỬ',center:'QA1',startDate:'2026-10-01',endDate:'2026-10-31',status:'APPROVED',type:'percent',rate:.1,amount:null,minimum:0,maximum:0,approvalNote:'Căn cứ kiểm thử giả'}]);
 r=withGift.calculate({id:'CT::QA2610-CT-002'});assert.equal(r.cells.M,7200000);assert.equal(r.cells.O,720000);assert.equal(r.cells.Q,6480000);assert.equal(r.cells.AF,'OK');
 r=e.calculate({id:'CT::QA2610-CT-002'},{L:'Q4 2026 Promotion Discount'});assert.equal(r.cells.M,7200000);assert.equal(r.cells.N,null);assert.equal(r.cells.Q,null);assert.equal(r.cells.AF,'CHECK');
});
test('ordinary monthly gross is available for Renew; known packages keep their own approved schedules',()=>{
 assert.equal(price(policy,input(2),'Renew').gross,7200000);assert.equal(price(policy,input(2),'Renew').issue,null);
 assert.equal(price(policy,input(12)).gross,38700000);assert.equal(price(policy,input(18)).gross,56700000);assert.equal(price(policy,input(24)).gross,77400000);
});
test('visible normalized RULE 51–56 and two-month price references use the corrected source values',()=>{
 assert.equal(policy.monthlyRates.length,6);
 for(const row of policy.auditPolicy.baseTuition.filter(r=>r.row>=51)){
  const expected=policy.monthlyRates.find(r=>r.layer===row.B&&r.hours===row.C);assert.equal(row.E,expected.monthly);assert.equal(row.F,0);assert.ok(row.I.includes('CHƯA GIẢM'));
  const display=policy.rules.find(r=>r.A===row.A&&r.row===row.row);assert.equal(display.E,expected.monthly);assert.equal(display.referenceSet,'MONTHLY_GROSS_CORRECTED');
 }
 const rows=policy.prices.filter(r=>r.C===input().H&&r.D===input().I&&r.E==='2 months');assert.ok(rows.length);assert.ok(rows.every(r=>r.J===7200000&&!r.I.startsWith('Report')));
});
