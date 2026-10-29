import test from 'node:test';import assert from 'node:assert/strict';
import {pricingIdentity,packageIdentity} from '../src/core/pricing-key.mjs';
import {priceFor} from '../src/core/price-resolver.mjs';
import {courseHourTotals} from '../src/core/course-hours.mjs';
import {resolveCourseInfo} from '../src/core/course-info.mjs';
import {coursePayload} from '../src/core/hub-course.mjs';
import {buildPriceCatalogue} from '../src/core/price-catalog.mjs';
import {normalizePolicyRow,validatePolicyRows,mergePolicyPack} from '../src/core/policy-pack.mjs';
import {policyTableRows} from '../src/core/policy-import.mjs';
import {dateSerial} from '../src/core/verification.mjs';import {policyData} from '../scripts/policy-data.mjs';
const policy=policyData();
test('weekly course facts tolerate case, accents, punctuation and missing spaces, with ATLS as default',()=>{
 for(const H of ['ATLS - NEW PRICE 2024 - LAYER 1 (GÓI TUẦN)','atls;newprice2024;layer1;goi.tuan','NewPrice2024Layer1(goituan)','new price 2024 : layer 1 : tuần']){
  const r=pricingIdentity(H,'3 giờ / tuần','2 months',{group:'AGLS'});assert.equal(r.group,'ATLS');assert.equal(r.year,2024);assert.equal(r.layer,1);assert.equal(r.variant,'weekly');assert.equal(r.weeks,2);assert.equal(r.months,null);assert.equal(r.packageKey,'2 WEEKS');assert.equal(r.courseKey,'ATLS|2024|layer1|goituan');
 }
 const explicit=pricingIdentity(' aGlS - New Price 2026 - Layer 1 (gói tuần) ','4 hrs/week','3 weeks');assert.equal(explicit.group,'AGLS');assert.equal(explicit.weeks,3);
 assert.equal(packageIdentity('2 weeks').months,null);
 assert.equal(packageIdentity('36 SPLIT (18M/bé)').key,'36 SPLIT');assert.equal(packageIdentity('36 months (chia đôi)').months,18);
 assert.equal(packageIdentity('12.months').key,12);
 const once=pricingIdentity('NewPrice2026;Layer1;18Tháng(ĐÓNG 1 LẦN)','4 hrs/week','18 months');assert.equal(once.courseKey,'ATLS|2026|layer1|18thang|dong1lan');
 assert.equal(pricingIdentity('NewPrice2026 Layer1 18 Tháng (Đóng 1 lần)','4 hrs/week','').months,18);
 assert.ok(pricingIdentity('NewPrice2026 Layer1 18 Tháng (Đóng 1 lần)','4 hrs/week','12 months').conflicts.length);
});
test('weeks use the source weekly price and weeks × Hour/week, without a month conversion',()=>{
 const r=priceFor({policy},{H:'NewPrice2024Layer1(gói tuần)',I:'3 giờ/tuần',J:'2 months',D:dateSerial('2026-10-10'),L:'0'},{contractType:'Renew'});
 assert.equal(r.gross,2250000);assert.equal(r.unitPrice,1125000);assert.equal(r.weeks,2);assert.equal(r.months,null);
 const hours=courseHourTotals(r,[],25/6);assert.equal(hours.baseHours,6);assert.equal(hours.totalHours,6);assert.equal(hours.baseWeeks,2);assert.equal(hours.baseMonths,null);
 assert.equal(courseHourTotals(r,[],undefined).totalHours,6);
 const fresh=priceFor({policy},{H:'ATLS New Price 2026 Layer1 (gói tuần)',I:'3 hrs/week',J:'2 weeks',D:dateSerial('2026-10-10'),L:'0'},{contractType:'Renew'});assert.equal(fresh.gross,null);
});
test('raw and Hub weekly labels agree without blanking inputs, and the bridge saves Weeks',()=>{
 const r=resolveCourseInfo([{H:'ATLS - New Price 2024 - Layer 1 (gói tuần)',I:'3 giờ/tuần',J:'2 months',ref:{file:'QA raw'}},{H:'newprice2024layer1(goituan)',I:'3 hrs/week',J:'2 Weeks',ref:{file:'QA Hub'}}]);
 assert.deepEqual(r.warnings,[]);assert.equal(r.values.J,'2 weeks');
 const expected={ct:'QA2610-CT-000101',student:'QA-WEEKS',url:'https://hub24.apollo.vn:7777/contract/detail/101'};
 assert.equal(coursePayload({...expected,courseFee:r.values.H,hoursPerWeek:'3 giờ/tuần',package:'2 MONTHS'},expected).package,'2 weeks');
 assert.equal(coursePayload({...expected,courseFee:r.values.H,giftcode:'2.000.000 đ'},expected).giftcode,null);
 const once=resolveCourseInfo([{H:'ATLS New Price 2026 Layer1',J:'18 months'},{H:'NewPrice2026Layer1 18 Tháng (Đóng 1 lần)',J:'18 tháng'}]);assert.equal(once.warnings.length,0);assert.match(once.values.H,/Đóng 1 lần/);
 assert.equal(resolveCourseInfo([{H:'NewPrice2026Layer1 18 Tháng (Đóng 1 lần)',I:'4 hrs/week'}]).values.J,'18 months');
});
test('weekly catalogue and import declare Weeks explicitly and retain their own policy period',()=>{
 for(const r of buildPriceCatalogue(policy).filter(r=>r.variant==='weekly')){assert.equal(r.unit,'weeks');assert.equal(r.months,null);if(r.id.startsWith('supplement-'))assert.match(r.package,/weeks/i);if(r.gross!=null)assert.equal(r.gross,r.unitPrice*r.weeks);else assert.equal(r.unitPrice,null);assert.notEqual(r.status,'conflict');}
 const row=normalizePolicyRow({group:'ATLS',year:2026,layer:0,hours:3,variant:'weekly',weeks:2,gross:2400000,discount:0,maxTerms:0,from:'2026-10-01',to:'2026-10-31',source:'QA approved weekly policy',approval:'QA only'});assert.equal(row.months,null);assert.equal(row.packageKey,'2 WEEKS');assert.deepEqual(validatePolicyRows([row]),[]);
 const p=mergePolicyPack(policy,{id:'qa-weekly',rows:[row]});const r=priceFor({policy:p},{H:'NewPrice2026Layer1 gói tuần',I:'3 hrs/week',J:'2',D:dateSerial('2026-10-10'),L:'0'},{contractType:'Renew'});assert.equal(r.gross,2400000);assert.equal(r.weeks,2);
 const imported=policyTableRows({rows:[['group','year','layer','hours','variant','weeks','gross','discount','maxTerms','from','to','source','approval'],['ATLS',2026,0,3,'weekly',2,2400000,0,0,'2026-10-01','2026-10-31','QA source','QA approval']]});assert.equal(imported[0].weeks,2);assert.deepEqual(validatePolicyRows(imported),[]);
});
