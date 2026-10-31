import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePolicyRow,validatePolicyRows,stagePolicyUpdate,mergePolicyPack,matchTypedPrice} from '../src/core/policy-pack.mjs';
import {pricingIdentity} from '../src/core/pricing-key.mjs';
import {priceFor} from '../src/core/price-resolver.mjs';
import {dateSerial} from '../src/core/verification.mjs';

const base={group:'ATLS',year:2026,layer:1,hours:3,variant:'standard',months:12,monthly:3200000,
 gross:38400000,discount:4608000,maxTerms:6,straight:1,loyalty:0,referral:0,
 from:'2026-10-06',to:'2026-12-31',center:'*',contractType:'Renew',
 course:'ATLS - New Price 2026 - Layer 1',source:'Giá tháng 10 đã phê duyệt',approval:'RCM xét hồ sơ đúng ngày',
 discountLabels:['2026 October - Promotion Discount - 12 months'],conditions:'Thanh toán trước hạn'};

test('saved price override supplies one typed price to the real contract resolver',()=>{
 const price=normalizePolicyRow(base);
 assert.deepEqual(validatePolicyRows([price]),[]);
 const policy=mergePolicyPack({typedPrices:[],prices:[]},{id:'policy-version:qa',title:'QA validated policy',rows:[price]});
 const matched=priceFor({policy},{H:base.course,I:'3 hrs/week',J:'12 months',D:dateSerial('2026-10-22'),B:'HN24.TCY',L:base.discountLabels[0]},{group:'ATLS',contractType:'Renew'});
 assert.equal(matched.gross,38400000);assert.equal(matched.discount,4608000);
 assert.equal(matched.monthly,3200000);assert.equal(matched.override,true);assert.equal(matched.issue,null);
 assert.equal(matched.net,33792000);
});

test('a completed 1-week reference price becomes usable; Report observation alone is never imported',()=>{
 const course='ATLS - New Price 2024 (Nationwide) (gói tuần)';
 const price=normalizePolicyRow({...base,year:2024,layer:0,course,variant:'weekly',months:null,
  weeks:1,monthly:null,gross:1500000,discount:0,maxTerms:0,straight:0,
  from:'2024-01-01',to:'2027-12-31'});
 assert.deepEqual(validatePolicyRows([price]),[]);
 const identity=pricingIdentity(course,'3 hrs/week','1 Week');
 const policy=mergePolicyPack({typedPrices:[],prices:[]},{id:'policy-version:weekly',title:'Weekly QA',rows:[price]});
 const matched=matchTypedPrice(policy,identity,dateSerial('2026-10-31'),{center:'HN24.TCY',contractType:'Renew'});
 assert.equal(matched.gross,1500000);
 const use=priceFor({policy},{H:course,I:'3 hrs/week',J:'1 Week',D:dateSerial('2026-10-31'),B:'HN24.TCY'},
  {group:'ATLS',contractType:'Renew'});
 assert.equal(use.unit,'weeks');assert.equal(use.gross,1500000);assert.equal(use.unitPrice,1500000);
});

test('missing approval, invalid amount or invalid effectiveness dates cannot enable a price',()=>{
 for(const invalid of [
  {...base,approval:''},
  {...base,discount:39000000},
  {...base,to:'2026-10-01'},
  {...base,monthly:3000000}
 ]){
  assert.ok(validatePolicyRows([normalizePolicyRow(invalid)]).length>0);
 }
});

test('updating an existing scoped row replaces its dates without changing neighboring policy windows',()=>{
 const old=normalizePolicyRow({...base,from:'2026-10-01',to:'2026-12-31'});
 const amendment=normalizePolicyRow({...base,monthly:3300000,gross:39600000,from:'2026-10-15',to:'2026-10-31'});
 const updated=stagePolicyUpdate([old],[amendment]);
 assert.equal(updated.length,3);
 assert.deepEqual(validatePolicyRows(updated),[]);
 assert.deepEqual(updated.map(x=>[x.from,x.to]),[['2026-10-01','2026-10-14'],['2026-11-01','2026-12-31'],['2026-10-15','2026-10-31']]);
});

test('scoped center policy does not leak its price to a different center or New students',()=>{
 const price=normalizePolicyRow({...base,center:'HN24.TCY',contractType:'Renew'});
 const policy=mergePolicyPack({typedPrices:[],prices:[]},{id:'policy-version:scoped',title:'Scoped',rows:[price]});
 const identity=pricingIdentity(base.course,'3 hrs/week','12 months');
 assert.equal(matchTypedPrice(policy,identity,dateSerial('2026-11-01'),{center:'HN24.TCY',contractType:'Renew'})?.gross,38400000);
 assert.equal(matchTypedPrice(policy,identity,dateSerial('2026-11-01'),{center:'HN5.VQ',contractType:'Renew'}),null);
 assert.equal(matchTypedPrice(policy,identity,dateSerial('2026-11-01'),{center:'HN24.TCY',contractType:'New'}),null);
});
