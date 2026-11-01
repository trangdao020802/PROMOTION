import test from 'node:test';
import assert from 'node:assert/strict';
import {policyData} from '../scripts/policy-data.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {discountPolicyMatch} from '../src/core/promotions.mjs';
import {courseHourTotals,renewalWeekOffer} from '../src/core/course-hours.mjs';
import {manualCheckKey,updateReview} from '../src/core/reviews.mjs';
import {hubFixture} from './helpers/hub-policy-fixture.mjs';
const policy=policyData(),cash='2026 October - Promotion Discount - 24 months - From 06/10';
const addon='1 Months (Sep/Oct2026 - Tặng Tháng (TRẢ THẲNG) - All layer - Tặng 1 tháng)';
function fixture({hours=3,pkg='24 months',type='New',label=cash,method='Online Payments',when='2026-10-10',gross=hours===3?77400000:103200000,discount=hours===3?20898000:27864000,totalHours=hours===3?313:417,full=true}={}){
 const day=parseDate(when),net=gross-discount,c={B:'CENTER GIẢ',C:'QA1',D:'QA2610-PAY-000101',E:'QA2610-CT-000101',R:'QA-EXTRA-HOURS',S:'DỮ LIỆU GIẢ GIỜ TẶNG',O:day,P:'QA-HOURS',I:'Paid',F:'Payment',G:type,X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:hours+' hrs/week',AB:pkg,AQ:label,AH:method,AJ:method==='Installment'?'12 month':'',AC:gross,AD:discount,AE:0,AF:net,AG:totalHours},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-01-01',to:'2026-12-31',center:''},cutoff:parseDate('2026-12-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:c.E,student:c.R,target:net+(full?0:1000000),paid:net,courseFee:c.Z,hoursPerWeek:c.AA,package:pkg,totalHours,contractType:type,center:'QA1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const engine=new AuditEngine(buildModel(bundle,policy));return {engine,bundle,read:(patch={})=>engine.calculate({id:'CT::'+c.E},patch)};
}
const reviews=row=>({reviews:Object.fromEntries(row.reviewItems.map(item=>[item.id,{approved:true,scope:item.scope}]))});
test('one awarded month uses the actual weekly hours and is included once in the total',()=>{
 for(const [hours,extra,total]of [[3,12.5,313],[4,50/3,417]]){
  const r=fixture({hours}).read();assert.ok(Math.abs(r.cells.extraHours-extra)<1e-10);assert.equal(r.cells.R,total);assert.equal(r.courseHours.bonusMonths,1);assert.equal(r.courseHours.baseHours,hours===3?300:400);assert.equal(r.courseHours.components.filter(c=>c.kind==='straight').length,1);
  assert.equal(r.cells.M,hours===3?77400000:103200000);assert.equal(r.cells.N,hours===3?20898000:27864000);assert.equal(r.cells.Q,hours===3?56502000:75336000);assert.equal(r.cells.AD,0);
 }
});
test('the exact compact Sep/Oct2026 label denotes one awarded month, not a one-month Package',()=>{
 const match=discountPolicyMatch(addon,parseDate('2026-10-10'));assert.equal(match.kind,'straight');assert.equal(match.monthAddon,true);assert.equal(match.addonMonths,1);assert.equal(match.ruleKey,'BBQ426_STRAIGHT');assert.deepEqual(match.issues,[]);
 const r=fixture({label:cash+';'+addon}).read();assert.equal(r.cells.extraHours,12.5);assert.equal(r.cells.R,313);assert.equal(r.cells.N,20898000);assert.ok(!r.promotion.checks.some(c=>/GÓI TRONG DISCOUNT KHÁC PACKAGE|CHƯA CÓ RULE/.test(c)));
});
test('repeated straight-payment labels never add the same policy award twice',()=>{
 for(const label of [cash+';'+addon+';'+addon,addon+';'+cash,cash+';'+addon+';Sep/Oct 2026 - Trả thẳng - Tặng 1 tháng']){
  const r=fixture({label}).read();assert.equal(r.cells.extraHours,12.5);assert.equal(r.courseHours.bonusMonths,1);assert.equal(r.cells.R,313);
 }
});
test('changing Hour/week recalculates extra and total hours without rewriting source actuals',()=>{
 const f=fixture(),r=f.read({I:'4 hrs/week'});assert.equal(r.cells.R,417);assert.ok(Math.abs(r.cells.extraHours-50/3)<1e-10);assert.equal(r.cells.X,313);assert.equal(r.cells.AD,-104);assert.equal(f.bundle.records[0].cells.AG,313);assert.equal(f.bundle.exports[0].totalHours,313);
});
test('a month-only straight add-on changes hours without creating a cash discount',()=>{
 const r=fixture({label:addon,discount:0}).read();assert.equal(r.cells.N,0);assert.equal(r.cells.Q,77400000);assert.equal(r.cells.extraHours,12.5);assert.equal(r.cells.R,313);
});
test('approved half-course policy grants half a straight month and retains fractions until the final round',()=>{
 for(const [hours,gross,discount,extra,total]of [[3,58050000,17415000,6.25,231],[4,77400000,23220000,25/3,308]]){
  const f=fixture({hours,pkg:'18 months siblings',label:'2026 October - Promotion Discount - 36/36 siblings - From 06/10',gross,discount,totalHours:total});let r=f.read();assert.equal(r.cells.R,null);assert.equal(r.cells.extraHours,null);
  r=f.read(reviews(r));assert.equal(r.courseHours.bonusMonths,.5);assert.ok(Math.abs(r.cells.extraHours-extra)<1e-10);assert.equal(r.cells.R,total);
 }
});
test('loyalty and direct months stack once after verification and remain pending before it',()=>{
 const f=fixture({type:'Renew',label:[cash,'2026 October - Promotion Month - 24 months',addon].join(';'),totalHours:350});let r=f.read();assert.equal(r.cells.R,null);assert.equal(r.cells.extraHours,null);
 r=f.read(reviews(r));assert.equal(r.courseHours.bonusMonths,4);assert.equal(r.cells.extraHours,50);assert.equal(r.cells.R,350);assert.equal(r.cells.N,20898000);assert.deepEqual(r.courseHours.components.map(c=>c.kind).sort(),['loyalty','straight']);
});
test('an eligible New referral month and straight month use the same single hour accumulator',()=>{
 const f=fixture({label:[cash,'Q4 2026 - Promotion Siblings (Month) - 1 months add on',addon].join(';'),totalHours:325});let r=f.read();r=f.read(reviews(r));assert.equal(r.courseHours.bonusMonths,2);assert.equal(r.cells.extraHours,25);assert.equal(r.cells.R,325);assert.deepEqual(r.courseHours.components.map(c=>c.kind).sort(),['referral','straight']);
});
test('installments cannot receive a straight-payment award through a combined label or Approved checkbox',()=>{
 const f=fixture({label:cash+';'+addon,method:'Installment',totalHours:300});let r=f.read();r=f.read({...reviews(r),approved:true});assert.equal(r.cells.extraHours,0);assert.equal(r.cells.R,300);assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(c=>c.includes('TẶNG THÁNG TRẢ THẲNG KHÔNG ÁP DỤNG TRẢ GÓP')));
});
test('unknown hours, unresolved full payment and unknown month rules remain uncalculated instead of zero',()=>{
 for(const [f,patch]of [[fixture({full:false}),{}],[fixture(),{I:''}]]){
  const r=f.read(patch);assert.equal(r.cells.extraHours,null);assert.equal(r.cells.R,null);assert.ok(r.calculationIssues.some(i=>i.columns.includes('extraHours')));
 }
 const r=fixture({label:'Tặng 1 tháng - Chương trình chưa có kỳ'}).read();assert.equal(r.cells.extraHours,null);assert.equal(r.cells.R,null);assert.equal(r.cells.AF,'CHECK');
});
test('a known zero-award course has numeric zero extra hours and retains its regular total',()=>{
 const r=fixture({label:'',discount:0,totalHours:300}).read();assert.equal(r.cells.extraHours,0);assert.equal(r.cells.R,300);assert.equal(r.courseHours.bonusMonths,0);
});
test('unapproved award quantities and expired shared labels keep CHECK instead of granting arbitrary months',()=>{
 const wrong=fixture({label:cash+';'+addon.replaceAll('1 tháng','2 tháng').replace('1 Months','2 Months')}).read();assert.equal(wrong.cells.extraHours,12.5);assert.equal(wrong.cells.R,313);assert.ok(wrong.promotion.checks.some(c=>c.includes('SỐ THÁNG TẶNG KHÁC RULE')));
 const expired=fixture({when:'2026-11-10',label:cash+';'+addon}).read();assert.equal(expired.cells.AF,'CHECK');assert.ok(expired.promotion.checks.some(c=>c.includes('SEP/OCT NGOÀI THỜI KỲ')));
 const conflict=fixture({label:cash+';'+addon.replace('Tặng 1 tháng','Tặng 2 tháng')}).read();assert.equal(conflict.cells.extraHours,null);assert.equal(conflict.cells.R,null);
});
test('the base and all award months are rounded together, never each component separately',()=>{
 const r=courseHourTotals({months:18,hours:3},[{kind:'a',months:.5},{kind:'b',months:.5}],25/6);assert.equal(r.extraHours,12.5);assert.equal(r.totalHours,238);assert.ok(Math.abs(r.baseHours-225)<1e-10);
 for(const factor of [null,NaN,0,-1])assert.equal(courseHourTotals({months:24,hours:3},[],factor).totalHours,null);
});

test('the shared straight award works in September and early October without becoming a cash discount',()=>{
 for(const when of ['2026-09-15','2026-10-03']){
  const r=fixture({when,label:addon,discount:0}).read();assert.equal(r.cells.N,0);assert.equal(r.cells.extraHours,12.5);assert.equal(r.cells.R,313);assert.ok(!r.promotion.checks.some(c=>/NGOÀI.*(?:KỲ|HẠN)|SỐ THÁNG TẶNG KHÁC RULE/.test(c)));
 }
});
test('an explicitly displayed loyalty quantity is checked as award months, not purchased Package months',()=>{
 const f=fixture({type:'Renew',label:cash+';3 Months (2026 October - Promotion Month - 24 months)',method:'Installment',totalHours:338});let r=f.read();r=f.read(reviews(r));assert.equal(r.courseHours.bonusMonths,3);assert.equal(r.cells.extraHours,37.5);assert.equal(r.cells.R,338);assert.ok(!r.promotion.checks.some(c=>/GÓI TRONG DISCOUNT KHÁC PACKAGE|SỐ THÁNG TẶNG KHÁC RULE/.test(c)));
});
test('a paid-in-full loyalty-only offer still receives its source-defined straight award once',()=>{
 const f=fixture({type:'Renew',label:'2026 October - Promotion Month - 24 months',discount:0,totalHours:350});let r=f.read();r=f.read(reviews(r));assert.equal(r.cells.N,0);assert.equal(r.courseHours.bonusMonths,4);assert.equal(r.cells.extraHours,50);assert.equal(r.cells.R,350);
});

const weekGift='Học bổng tái phí - Tặng tuần - Tặng 2 tuần',cash12='2026 October - Promotion Discount - 12 months';
test('a saved case approval unlocks renewal weeks without blocking the known 12-month cash formula',()=>{
 for(const [hours,gross,discount,extra,total]of [[3,38700000,3870000,18.5,169],[4,51600000,5160000,74/3,225]]){
  const config={hours,gross,discount,type:'Renew',pkg:'12 months',label:cash12+';'+weekGift,totalHours:total},f=fixture(config),before=f.read();
  assert.equal(before.cells.N,discount);assert.equal(before.cells.Q,gross-discount);assert.equal(before.cells.R,null);assert.equal(before.cells.extraHours,null);
  const id='renewal-week',item=before.reviewItems.find(i=>i.id===id);
  assert.ok(item);assert.ok(item.details.some(s=>s.includes('2 tuần tặng × '+hours)));assert.equal(item.approved,false);
  const patch={reviews:{[manualCheckKey('XÁC MINH - Ưu đãi cần xác minh riêng: chưa đủ chính sách được duyệt')]:{approved:true,scope:item.scope}}},after=f.read(patch);
  assert.equal(after.cells.N,discount);assert.equal(after.cells.Q,gross-discount);assert.ok(Math.abs(after.cells.extraHours-extra)<1e-9);assert.equal(after.cells.R,total);assert.equal(after.courseHours.bonusWeeks,2);assert.equal(after.courseHours.bonusMonths,1);assert.equal(after.cells.AF,'OK');
  assert.ok(after.cells.AN.includes('2 tuần × '+hours+' giờ/tuần'));assert.ok(!after.promotion.checks.some(s=>/CHƯA CÓ RULE/.test(s)));
  const reload=fixture(config).read(JSON.parse(JSON.stringify(patch)));assert.equal(reload.cells.R,total);assert.equal(reload.reviewItems.find(i=>i.id===id).approved,true);
  const revoked=f.read({reviews:updateReview(after,id,false)});assert.equal(revoked.cells.R,null);assert.equal(revoked.cells.N,discount);assert.equal(revoked.cells.AF,'CHECK');
  const changed=f.read({...patch,I:hours===3?'4 hrs/week':'3 hrs/week'});assert.equal(changed.cells.R,null);assert.equal(changed.reviewItems.find(i=>i.id===id).approved,false);
 }
});
test('a standalone week scholarship changes hours only; equivalent duplicate labels grant it once',()=>{
 for(const label of [weekGift,weekGift+';  HOC BONG TAI PHI — TANG TUAN — TANG 2 TUAN  ']){
  const f=fixture({type:'Renew',pkg:'12 months',gross:38700000,discount:0,label,totalHours:156}),before=f.read(),after=f.read(reviews(before));
  assert.equal(after.cells.N,0);assert.equal(after.cells.Q,38700000);assert.equal(after.cells.extraHours,6);assert.equal(after.cells.R,156);assert.equal(after.courseHours.components.filter(c=>c.kind==='renewal-week').length,1);
 }
});
test('weekly approval cannot approve New eligibility, conflicting quantities or unknown financial rules',()=>{
 const newborn=fixture({type:'New',pkg:'12 months',label:cash12+';'+weekGift,gross:38700000,discount:3870000,totalHours:169});let r=newborn.read();r=newborn.read(reviews(r));assert.equal(r.cells.R,null);assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(s=>s.includes('chưa đủ điều kiện')));
 const conflicting=fixture({type:'Renew',label:cash+';'+weekGift+';'+weekGift.replace('2 tuần','1 tuần')});r=conflicting.read();r=conflicting.read(reviews(r));assert.equal(r.cells.R,null);assert.ok(r.promotion.checks.some(s=>s.includes('SỐ TUẦN TẶNG TÁI PHÍ MÂU THUẪN')));
 for(const invalid of [weekGift.replace('2 tuần','-2 tuần'),weekGift.replace('2 tuần','2.5 tuần'),'Học bổng riêng - Giảm tiền - Chưa có mức giảm']){
  const f=fixture({type:'Renew',label:cash+';'+invalid});let before=f.read(),after=f.read(reviews(before));assert.equal(after.cells.N,null);assert.equal(after.cells.Q,null);assert.equal(after.cells.AF,'CHECK');assert.ok(after.calculationIssues.some(i=>i.code==='discount'));
 }
});
test('month and week awards share one final round without a month factor on weekly gifts',()=>{
 const r=courseHourTotals({months:12,hours:3},[{kind:'straight',months:1},{kind:'renewal-weeks',weeks:2}],25/6);assert.equal(r.extraHours,18.5);assert.equal(r.totalHours,169);assert.deepEqual(r.components.map(c=>c.hours),[12.5,6]);
 const weekly=courseHourTotals({unit:'weeks',weeks:2,hours:4},[{kind:'renewal-weeks',weeks:2}],null);assert.equal(weekly.extraHours,8);assert.equal(weekly.totalHours,16);
});
test('Hub lookup rules also wait for the scoped renewal-week approval and then recalculate',()=>{
 const h=hubFixture({ct:'QA2610-CT-000101'}),p=structuredClone(h.policy);
 p.groups[1].name='Học bổng tái phí - Tặng tuần';p.groups[1].discounts[0].name='Tặng 2 tuần';p.groups[1].discounts[0].detail.months=2;
 const f=fixture({type:'Renew',pkg:'12 months',gross:38700000,discount:3870000,label:cash12+';'+weekGift,totalHours:156});f.engine.data.contractGroups[0].hubPolicy=p;
 const before=f.read();assert.equal(before.context.hubRules,true);assert.equal(before.cells.R,null);assert.equal(before.cells.N,3870000);assert.equal(before.reviewItems.length,1);
 const after=f.read(reviews(before));assert.equal(after.cells.extraHours,6);assert.equal(after.cells.R,156);assert.equal(after.courseHours.bonusMonths,0);assert.equal(after.courseHours.bonusWeeks,2);assert.equal(after.cells.AF,'OK');
});

test('approved renewal two-week award extends hours without replacing a 12-month cash discount',()=>{
 const cash12='2026 October - Promotion Discount - 12 months';
 const award='Học bổng tái phí - Tặng tuần - Tặng 2 tuần';
 for(const hours of [3,4]){
  const f=fixture({hours,pkg:'12 months',type:'Renew',label:cash12+';'+award,
   gross:hours===3?38700000:51600000,discount:hours===3?4644000:6192000,totalHours:hours===3?156:208});
  const initial=f.read(),item=initial.reviewItems.find(x=>x.id==='renewal-week');
  assert.ok(item,'An explicit 2-week renewal award needs its own review');
  assert.equal(item.approved,false);
  assert.equal(initial.cells.extraHours,null);
  assert.equal(initial.cells.R,null);
  const cashOnly=f.read({L:cash12});
  assert.equal(typeof cashOnly.cells.N,'number');
  const approved=f.read({reviews:{'renewal-week':{approved:true,scope:item.scope}}});
  assert.equal(approved.cells.N,cashOnly.cells.N,'Keep the 12-month cash discount unchanged');
  assert.equal(approved.cells.extraHours,cashOnly.cells.extraHours+2*hours);
  assert.equal(approved.courseHours.bonusWeeks,2);
  assert.equal(approved.cells.R,Math.round(approved.courseHours.baseHours+approved.cells.extraHours));
  assert.equal(approved.reviewItems.find(x=>x.id==='renewal-week')?.approved,true);
  const removed=f.read({reviews:{'renewal-week':{approved:false,scope:item.scope}}});
  assert.equal(removed.cells.extraHours,null);
  assert.equal(removed.cells.R,null);
  const changed=f.read({I:(hours===3?4:3)+' hrs/week',reviews:{'renewal-week':{approved:true,scope:item.scope}}});
  assert.equal(changed.reviewItems.find(x=>x.id==='renewal-week')?.approved,false,'Hour/week edits invalidate prior approval');
 }
});
test('two-week renewal approval is never a blanket grant to a New student or a different award',()=>{
 const offer='Học bổng tái phí - Tặng tuần - Tặng 2 tuần';
 const f=fixture({pkg:'12 months',type:'New',label:offer,gross:38700000,discount:0});
 const initial=f.read(),item=initial.reviewItems.find(x=>x.id==='renewal-week');
 assert.ok(item);
 const approved=f.read({reviews:{'renewal-week':{approved:true,scope:item.scope}}});
 assert.equal(approved.cells.extraHours,null);
 assert.ok(approved.promotion.checks.some(message=>message.includes('TẶNG TUẦN TÁI PHÍ: học viên New')));
 assert.equal(renewalWeekOffer(offer),2);
 assert.equal(renewalWeekOffer('Tặng 2 tuần'),0);
});
