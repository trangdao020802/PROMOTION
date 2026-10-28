import test from 'node:test';
import assert from 'node:assert/strict';
import {pricingIdentity,weeklyHours,packageIdentity} from '../src/core/pricing-key.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {priceFor} from '../src/local/calculation.mjs';
import {dateSerial} from '../src/core/verification.mjs';
import {buildPriceCatalogue} from '../src/core/price-catalog.mjs';
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
test('new supplements are displayed with the same numbers used by the calculator',()=>{
 const catalogue=buildPriceCatalogue(p);
 for(const r of p.typedPrices.filter(r=>r.group==='ATLS/AGLS'&&r.year===2026)){
  const row=catalogue.find(c=>c.id==='supplement-'+p.typedPrices.indexOf(r));assert.equal(row.gross,r.gross);assert.equal(row.net,r.gross-r.discount);
  const suffix=r.variant==='vtdh'?' VTDH':'',pkg=r.variant==='split'?r.months+' months siblings':r.months+' months'+(r.variant==='trial'?' trial':'');
  const result=get('ATLS New Price 2026 Layer '+r.layer+suffix,r.hours+' hrs/week',pkg,r.from);assert.equal(result.gross,r.gross);assert.equal(result.discount,r.discount);
 }
});
