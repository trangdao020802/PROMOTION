import test from 'node:test';
import assert from 'node:assert/strict';
import {AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {reviewScope,updateReview,validateReviews,reviewTableColumns} from '../src/core/reviews.mjs';

function engine({renew=false,paid=74336000,voucherStatus='APPROVED'}={}){
 const code=renew?'':'CEOAP-QA',gift=renew?0:1000000,net=75336000-gift;
 const cells={B:'Hà Nội',C:'HN1',D:'HN2610-PAY-008888',E:'HN2610-CT-009999',R:'QA-REVIEWS',S:'KIỂM THỬ DUYỆT',O:parseDate('2026-10-10'),P:'QA8888',I:'Paid',F:'Payment',G:renew?'Renew':'New',X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:'4 hrs/week',AB:'24 months',AO:code,AQ:'Q4 2026 Promotion Discount',AH:'Installment',AJ:'12 month',AC:103200000,AD:27864000,AE:gift,AF:renew?net:paid,AG:renew?450:400};
 const r={sourceKey:'p',sourceRow:2,cells};const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:'HN1'},cutoff:parseDate('2026-10-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:cells.E,student:cells.R,target:net,paid:net,courseFee:cells.Z,hoursPerWeek:cells.AA,package:cells.AB,totalHours:cells.AG,contractType:cells.G,center:'HN1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'Report',headerRow:1,rowCount:1}))};
 const e=new AuditEngine(buildModel(bundle,policyData()));
 if(code)e.setVouchers([{code,label:'QA CEO case',studentId:cells.R,studentName:cells.S,center:'HN1',startDate:'2026-10-01',endDate:'2026-10-31',type:'amount',amount:gift,rate:null,minimum:0,maximum:0,status:voucherStatus,approvalNote:'QA voucher basis'}]);
 return e;
}
const run=(e,p={})=>e.calculate({id:'CT::HN2610-CT-009999'},p);
function allReviews(row){let reviews={};for(const item of row.reviewItems)reviews={...reviews,...updateReview({...row,reviews},item.id,true)};return reviews;}
test('CEO and registration are separate columns; installment approval does not approve either one',()=>{
 const e=engine();let row=run(e,{approved:true});
 assert.deepEqual(row.reviewItems.map(i=>i.id).sort(),['ceo','registration']);assert.ok(row.reviewItems.every(i=>!i.approved));assert.equal(row.cells.AF,'CHECK');
 const reviews=updateReview(row,'ceo',true);row=run(e,{approved:true,reviews});
 assert.ok(!row.promotion.checks.some(m=>m.includes('CEO:')));assert.equal(row.cells['review:ceo'],'Đã duyệt');assert.equal(row.cells.AF,'CHECK');
 row=run(e,{reviews:allReviews(row)});assert.equal(row.cells.AF,'OK');assert.equal(row.cells.verificationCheck,'Đã duyệt');
 const revoked=updateReview(row,'ceo',false);row=run(e,{reviews:revoked});assert.ok(row.promotion.checks.some(m=>m.includes('CEO:')));assert.equal(row.cells.AF,'CHECK');
});
test('review scope binds student, giftcode, EPP, full date and financial contract context',()=>{
 const row=run(engine()),scope=reviewScope(row);
 for(const mutation of [r=>r.cells.F='OTHER',r=>r.cells.K='OTHER',r=>r.context.term='18 month',r=>r.reconciliation.net-=1,r=>r.reconciliation.events[0].date+=1]){
  const changed=structuredClone(row);mutation(changed);assert.notEqual(reviewScope(changed),scope);
 }
 const e=engine(),reviews=allReviews(row);let changed=run(e,{K:'ANOTHER-CODE',reviews});assert.equal(changed.reviewItems.find(i=>i.id==='registration').approved,false);assert.equal(changed.cells.AF,'CHECK');
});
test('condition approvals leave money differences and an unapproved voucher blocked',()=>{
 for(const config of [{paid:74334000},{voucherStatus:'PENDING'}]){
  const e=engine(config),row=run(e),approved=run(e,{approved:true,reviews:allReviews(row)});
  assert.ok(approved.reviewItems.every(i=>i.approved));assert.equal(approved.cells.AF,'CHECK');
  if(config.voucherStatus)assert.notEqual(approved.cells.CI,'OK');else assert.notEqual(approved.cells.AC,0);
 }
});
test('a loyalty approval determines source-defined bonus months without inventing past-fee numbers',()=>{
 const e=engine({renew:true}),row=run(e);assert.equal(row.cells.R,null);assert.ok(row.reviewItems.some(i=>i.id==='loyalty'));
 const approved=run(e,{reviews:allReviews(row)});assert.ok(Math.abs(approved.cells.R-450)<1e-6);assert.equal(approved.cells.AF,'OK');assert.equal(approved.verification.input.priorFees,null);
 const reverted=run(e,{reviews:updateReview(approved,'loyalty',false)});assert.equal(reverted.cells.R,null);assert.equal(reverted.cells.AF,'CHECK');
});
test('dynamic review columns are retained after approval and exported with their statuses',()=>{
 const e=engine(),row=run(e),approved=run(e,{reviews:allReviews(row)}),base=[{key:'AE'},{key:'AF'},{key:'AG'}];
 const cols=reviewTableColumns(base,[approved]);assert.deepEqual(cols.filter(c=>c.kind==='review').map(c=>c.reviewId).sort(),['ceo','registration']);assert.equal(approved.cells['review:ceo'],'Đã duyệt');
 assert.equal(validateReviews(approved.reviews),null);assert.ok(validateReviews({ceo:true}));assert.ok(validateReviews({ceo:{approved:'true',scope:'x'}}));assert.ok(validateReviews({all:{approved:true,scope:'x'}}));
});
