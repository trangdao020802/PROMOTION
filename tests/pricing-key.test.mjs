import test from 'node:test';
import assert from 'node:assert/strict';
import {pricingIdentity,weeklyHours,packageIdentity} from '../src/core/pricing-key.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {priceFor} from '../src/local/calculation.mjs';
import {dateSerial} from '../src/core/verification.mjs';
import {buildPriceCatalogue} from '../src/core/price-catalog.mjs';
import {packageKey} from '../src/core/contracts.mjs';
import {auditPackageKey} from '../src/core/audit-policy.mjs';
import {discountPolicyMatch} from '../src/core/promotions.mjs';
const p=policyData(),get=(H,I,J,date='2026-10-10',L='0')=>priceFor({policy:p},{H,I,J,L,D:dateSerial(date)},{group:'ATLS',contractType:'New'});
test('spelling, punctuation and extra product descriptions do not change explicit pricing identity',()=>{
 for(const c of ['AGLS | New Price 2026 | Layer1 — Kindy','agls new price 2026 layer: 1','AGLS - New Price 2026 - Layer 1']){
  const r=get(c,'3 hours / week','12 tháng');assert.equal(r.gross,38700000);assert.equal(r.discount,3870000);assert.equal(r.maxTerms,6);assert.equal(r.key,'AGLS|2026|1|3|standard|12');
 }
 assert.equal(weeklyHours('4 giờ/tuần'),4);assert.equal(weeklyHours('4'),4);assert.equal(weeklyHours('3 hrs/week / 4 hrs/week'),null);
});
test('conflicting layers or years stay blocked instead of picking the first token',()=>{
 for(const course of ['ATLS New Price 2026 Layer 1 Layer 2','ATLS New Price 2024 New Price 2026 Layer 1']){const r=get(course,'4 hrs/week','18 months');assert.equal(r.gross,null);assert.match(r.issue,/MÂU THUẪN/);}
 const old=get('ATLS New Price 2024 Layer 1','4 hrs/week','18 months');assert.equal(old.gross,63000000);assert.equal(old.discount,4000000);assert.ok(old.refs.some(r=>r.sheet==='2025'));
 assert.equal(get('ATLS New Price 2024 Layer 1','4 hrs/week','15 months').gross,null);
});
test('18 months paid at once, VTDH installment stages and AHP resolve different source-backed schedules',()=>{
 const full=get('New Price 2026 - Layer 1 - 18 Tháng (Đóng 1 lần)','4 hrs/week','18 months');assert.equal(full.gross,75600000);assert.equal(full.discount,11340000);assert.equal(full.maxTerms,9);
 const stage=get('New Price 2026 - Vững tin đồng hành - Layer 1 - Lần đóng 1/2/3/4','4 hrs/week','2 months');assert.equal(stage.gross,8400000);assert.equal(stage.discount,0);assert.equal(stage.maxTerms,0);
 const kindy=get('AGLS New Price 2026 Layer2 VTDH','3 hrs/week','2 months');assert.equal(kindy.gross,6000000);
 const ahp=get('ATLS - New Price 2026 - AHP Price (for other Layer)','4 hrs/week','18 months');assert.equal(ahp.gross,72000000);assert.equal(ahp.discount,10800000);assert.ok(ahp.refs.some(r=>r.row===93));
 assert.equal(get('ATLS New Price 2026 AHP','4 hrs/week','18 months','2026-03-16').gross,null);
});
test('18/24/36 split packages use the months of one child, with separate cash and extra months',()=>{
 for(const [pkg,key,gross,discount]of [['9 month siblings','18 SPLIT',37800000,5000000],['12 month siblings','24 SPLIT',51600000,13932000],['18 month siblings','36 SPLIT',77400000,23220000]]){
  const r=get('AGLS New Price 2026 Layer1','4 hrs/week',pkg);assert.equal(r.pkg,key);assert.equal(r.gross,gross);assert.equal(r.discount,discount);assert.equal(r.months,Number.parseInt(pkg));assert.equal(packageIdentity(pkg).key,key);
 }
 assert.equal(get('ATLS New Price 2026 Layer1','3 hrs/week','18 month siblings','2026-09-10','Big Bang Sep 2026 - Giảm Tiền - Layer 1 - 36 months (chia đôi) - 3hrs/week').discount,18000000);
});
test('trial price is not multiplied into a regular short package',()=>{
 assert.equal(get('ATLS New Price 2026 Layer1','4 hrs/week','1 tháng trải nghiệm').gross,3600000);
 assert.equal(get('ATLS New Price 2026 Layer1','4 hrs/week','2 months').gross,9600000);
});
test('all package readers agree on purchased units regardless of the discount label',()=>{
 const labels=['0','2026 October - Promotion Discount - 36/36 siblings - From 06/10','Big Bang Sep 2026 - Giảm Tiền - Layer 1 - 36 months (chia đôi) - 4hrs/week'];
 for(const [input,key,months]of [['36 months',36,36],[' 36 THÁNG ',36,36],['36; months',36,36],['18 months siblings','36 SPLIT',18],['18 THÁNG SIBLINGS','36 SPLIT',18],['36 SPLIT','36 SPLIT',18],['36 tháng (CHIA ĐÔI)','36 SPLIT',18],['12 SPLIT','12 SPLIT',6],['36 months siblings','72 SPLIT',36]]){
  assert.equal(packageIdentity(input).key,key,input);assert.equal(packageIdentity(input).months,months,input);assert.equal(packageKey(input),key,input);
  for(const label of labels)assert.equal(auditPackageKey(input,label,dateSerial('2026-10-10'),packageKey(input),p.auditPolicy),key,input+' '+label);
 }
 const unsupported=get('ATLS New Price 2026 Layer1','4 hrs/week','36 months siblings');assert.equal(unsupported.gross,null);assert.equal(unsupported.months,36);
});
test('price windows select their own cash columns and explicit Q4 offers never inherit the earlier rate',()=>{
 const course='ATLS New Price 2026 Layer1',label='2026 October - Promotion Discount - 36/36 siblings - From 06/10';
 for(const [when,discount,regime]of [['2026-09-30',20640000,'base'],['2026-10-01',23736000,'october'],['2026-10-05',23736000,'october'],['2026-10-06',27864000,'q4'],['2026-12-31',27864000,'q4']]){
  const r=get(course,'4 hrs/week','24 months',when);assert.equal(r.gross,103200000);assert.equal(r.discount,discount);assert.equal(r.regime,regime);assert.equal(r.issue,null);
 }
 for(const [when,valid]of [['2026-10-05',false],['2026-10-06',true],['2026-12-31',true],['2027-01-01',false]]){
  const r=get(course,'4 hrs/week','36 months',when,label);assert.equal(r.months,36);assert.equal(r.gross,154800000);assert.equal(r.discount,46440000);assert.equal(r.net,108360000);assert.equal(r.regime,'q4');
  assert.equal(discountPolicyMatch(label,dateSerial(when)).ruleKey,'BBQ426_CASH');assert.equal(!!r.issue,!valid);if(!valid)assert.match(r.issue,/NGOÀI THỜI KỲ/);
 }
 assert.equal(get(course,'4 hrs/week','24 months','2027-01-01').gross,null);
});
test('new supplements are displayed with the same numbers used by the calculator',()=>{
 const catalogue=buildPriceCatalogue(p);
 for(const r of p.typedPrices.filter(r=>r.group==='ATLS/AGLS'&&r.year===2026)){
  const row=catalogue.find(c=>c.id==='supplement-'+p.typedPrices.indexOf(r));assert.equal(row.gross,r.gross);assert.equal(row.net,r.gross-r.discount);
  const suffix=r.variant==='vtdh'?' VTDH':'',pkg=r.variant==='split'?r.months+' months siblings':r.months+' months'+(r.variant==='trial'?' trial':'');
  const result=get('ATLS New Price 2026 Layer '+r.layer+suffix,r.hours+' hrs/week',pkg,r.from);assert.equal(result.gross,r.gross);assert.equal(result.discount,r.discount);
 }
});
