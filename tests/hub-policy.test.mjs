import test from 'node:test';import assert from 'node:assert/strict';
import {hubFixture} from './helpers/hub-policy-fixture.mjs';
import {hubPolicyRequest,projectHubPolicy,validateHubPolicy,calculateHubPolicy,readHubPolicy,hubPolicyRevision,policyMatchesInputs} from '../src/core/hub-policy.mjs';
import {coursePayload,contractInputPlan} from '../src/core/hub-course.mjs';
import {inputTargets,completeInputRun,newInputRun} from '../src/core/hub-input-progress.mjs';
test('typed Hub lookup binds IDs and scope; saved contract totals and personal fields never become a price',()=>{
 const f=hubFixture();assert.ok(validateHubPolicy(f.policy));assert.equal(f.policy.product.unitPrice,3225000);assert.equal(JSON.stringify(f.policy).includes('PRIVATE'),false);
 const r=calculateHubPolicy(f.policy,f.cells,f.context);assert.equal(r.gross,38700000);assert.equal(r.discount,3870000);assert.equal(r.extraHours,12.5);assert.equal(r.totalHours,163);
 for(const change of [{PriceId:999},{ProductPackageId:999},{HourWeekId:999}]){const info=structuredClone(f.info);Object.assign(info.listProduct[0],change);assert.equal(hubPolicyRequest(f.detail,info),null);}
 const bad=structuredClone(f.info);bad.ContractId=999;assert.equal(hubPolicyRequest(f.detail,bad),null);delete bad.ContractId;assert.equal(hubPolicyRequest(f.detail,bad),null);
 const dup=structuredClone(f.price);dup.ListPriceType[0].ListPackage[0].ListHourWeek.push(f.hour);assert.equal(projectHubPolicy(f.request,[dup],f.groups),null);
});
test('different inputs, center, installment context and upgrade cannot reuse a CT snapshot',()=>{
 const f=hubFixture();for(const patch of [{H:'ATLS - New Price 2026 - Layer 2'},{I:'4 hrs/week'},{J:'18 months'},{B:'OTHER'}])assert.equal(policyMatchesInputs(f.policy,{...f.cells,...patch},f.context),false);
 assert.equal(policyMatchesInputs(f.policy,f.cells,{...f.context,method:'Installment'}),false);
 const upgrade=structuredClone(f.policy);upgrade.context.upgrade=true;assert.equal(calculateHubPolicy(upgrade,f.cells,f.context),null);
 const secret=structuredClone(f.policy);secret.Token='DO-NOT-STORE';assert.equal(validateHubPolicy(secret),false);
 const nested=structuredClone(f.policy);nested.groups[0].discounts[0].detail.token='DO-NOT-STORE';assert.equal(validateHubPolicy(nested),false);
 const expected={ct:f.detail.ContractNo,student:'QA-INPUTS',url:'https://hub24.apollo.vn:7777/contract/detail/12345'};
 assert.ok(coursePayload({...expected,courseFee:f.cells.H,hubPolicy:f.policy},expected));assert.equal(coursePayload({...expected,courseFee:f.cells.H,hubPolicy:{...f.policy,ct:'QA2610-CT-999999'}},expected),null);
});
test('stable lookup IDs join normalized course/package/hour keys without requiring identical display text',()=>{
 const f=hubFixture();f.price.PriceName='atls - new price 2026 - LAYER 1 !!!';f.pkg.ProductPackageName='12 MONTHS';f.hour.HourWeekName='3 hours/week';assert.ok(projectHubPolicy(f.request,[f.price],f.groups));
 f.price.PriceName='ATLS - New Price 2026 - Layer 2';assert.equal(projectHubPolicy(f.request,[f.price],f.groups),null);
 const bad=structuredClone(f.info);bad.CreatedDate='2026-02-31T10:00:00';assert.equal(hubPolicyRequest(f.detail,bad),null);
});
test('progressive percentages, group whitelists, order and per-group caps are enforced',()=>{
 const f=hubFixture(),p=structuredClone(f.policy);p.groups[1].type=1;p.groups[1].discounts[0].detail.percent=10;p.groups[1].discounts[0].detail.months=0;
 assert.equal(calculateHubPolicy(p,f.cells,f.context).discount,7353000); // 10% then 10% = 19%
 p.groups[0].with=[];assert.match(calculateHubPolicy(p,f.cells,f.context).error,/CỘNG CHUNG/);
 p.groups[0].with=[303];p.firstGroupId=null;assert.match(calculateHubPolicy(p,f.cells,f.context).error,/CHỌN ĐẦU/);
 p.firstGroupId=301;p.groups[0].max=5;const capped=calculateHubPolicy(p,f.cells,f.context);assert.equal(capped.components[0].amount,1935000);assert.ok(capped.checks.some(c=>c.includes('VƯỢT TRẦN')));
 p.groups[0].discounts[0].detail.rule=null;assert.match(calculateHubPolicy(p,f.cells,f.context).error,/THỨ TỰ/);
});
test('installment rates and gift months come from their own branch, not the direct-payment amount',()=>{
 const f=hubFixture({installment:true}),r=calculateHubPolicy(f.policy,f.cells,f.context);assert.equal(r.discount,1935000);assert.equal(r.giftMonths,0);assert.equal(r.extraHours,0);assert.equal(r.totalHours,150);
});
test('fixed voucher type 7/8 is applied after default percentage; percentage voucher precedes last offers',()=>{
 const f=hubFixture(),p=structuredClone(f.policy),cells={...f.cells,K:'QA-CODE',L:f.cells.L.split(';')[0]};
 p.context.giftCodeTypeId=1;assert.equal(calculateHubPolicy(p,cells,f.context,{type:'amount',amount:1000000}).discount,3770000);
 p.context.giftCodeTypeId=7;assert.equal(calculateHubPolicy(p,cells,f.context,{type:'amount',amount:1000000}).discount,3870000);
 p.context.giftCodeTypeId=null;assert.match(calculateHubPolicy(p,cells,f.context,{type:'amount',amount:1000000}).error,/LOẠI GIFTCODE/);
 p.groups[1].type=1;p.groups[1].discounts[0].detail={...p.groups[1].discounts[0].detail,percent:5,months:0,rule:'last'};
 const r=calculateHubPolicy(p,{...cells,L:f.cells.L},f.context,{type:'percent',rate:.1,maximum:0});assert.equal(r.discount,5612000);assert.equal(r.giftcode,3483000);
 assert.equal(calculateHubPolicy(p,{...cells,L:f.cells.L},f.context,{type:'percent',rate:.1,maximum:1000000}).giftcode,1000000);
});
test('weeks retain week units; unknown week-to-gift-month conversion is not invented',()=>{
 const f=hubFixture(),p=structuredClone(f.policy);Object.assign(p.product,{typeId:2,priceName:'ATLS - New Price 2026 - Layer 1 (gói tuần)',packageName:'2 weeks',units:2,unitPrice:500000});
 const cells={...f.cells,H:p.product.priceName,J:'2 weeks',L:'0'};const r=calculateHubPolicy(p,cells,f.context);assert.equal(r.gross,1000000);assert.equal(r.baseHours,6);assert.equal(r.extraHours,0);
 const gift=calculateHubPolicy(p,{...cells,L:f.cells.L},f.context);assert.equal(gift.extraHours,null);assert.equal(gift.totalHours,null);assert.ok(gift.checks.some(s=>s.includes('GÓI TUẦN')));
});
test('lookup invokes only source-known read services with CT parameters and a shared deadline',async()=>{
 const f=hubFixture(),calls=[];const client={info:async p=>(calls.push(['info',p]),f.info),prices:async p=>(calls.push(['prices',p]),[f.price]),groups:async p=>(calls.push(['groups',p]),f.groups)};
 const result=await readHubPolicy(f.detail,client);assert.ok(result.policy);assert.equal(calls.length,3);assert.deepEqual(calls[0][1],{contractId:12345});assert.deepEqual(calls[1][1],{centerId:1,productGroupIds:'49',groupPeopleId:2});assert.equal(calls[2][1].date,'2026-10-10T08:00:00');assert.deepEqual(JSON.parse(calls[2][1].listProductGroup),[{productGroupId:49,hourWeekId:8,packageId:71,priceTypeId:1}]);
 const timers=[],pending=new Promise(()=>{});let aborted=0;pending.abort=()=>aborted++;const waiting=readHubPolicy(f.detail,{...client,info:()=>pending},{budgetMs:100,schedule:fn=>(timers.push(fn),timers.length),unschedule:()=>{}});await Promise.resolve();timers[0]();assert.equal((await waiting).policyError,'timeout');assert.equal(aborted,1);
 const denied=await readHubPolicy(f.detail,{info:async()=>{throw Error('403');}});assert.equal(denied.policy,null);assert.equal(denied.policyError,'permission');
});
test('policy revisions ignore fetch time and invalidate approvals when financial rules change',()=>{
 const f=hubFixture();assert.equal(hubPolicyRevision(f.policy),hubPolicyRevision({...f.policy,capturedAt:'2026-10-31T12:00:00.000Z'}));const changed=structuredClone(f.policy);changed.groups[0].discounts[0].detail.percent=12;assert.notEqual(hubPolicyRevision(f.policy),hubPolicyRevision(changed));
});
test('voucher lookup reads original type and cap by code and never trusts the saved contract cap',async()=>{
 const f=hubFixture();f.detail.GiftCode='QA-CODE';f.detail.ListCourseInfo[0].GiftCode='QA-CODE';f.detail.ListCourseInfo[0].GiftCodeDiscountAmountMax=123;const calls=[];
 const result=await readHubPolicy(f.detail,{info:async()=>f.info,prices:async()=>[f.price],groups:async()=>f.groups,voucher:async p=>(calls.push(p),{GiftCode:'QA-CODE',GiftCodeTypeId:7,GiftCodeIsFixed:true,GiftCodeDiscountAmount:1000000,GiftCodeDiscountAmountMax:1000000,Address:'PRIVATE-NEVER-COPY'})});
 assert.equal(result.policy.voucher.maximum,1000000);assert.equal(result.policy.context.giftCodeTypeId,7);assert.equal(JSON.stringify(result).includes('PRIVATE-NEVER-COPY'),false);assert.deepEqual(calls,[{code:'QA-CODE',centerId:1,kidId:41}]);
 const r=calculateHubPolicy(result.policy,{...f.cells,K:'QA-CODE'},f.context,{type:'amount',amount:1000000,maximum:null});assert.equal(r.discount,3870000);assert.equal(r.giftcode,1000000);
 assert.match(calculateHubPolicy(result.policy,{...f.cells,K:'QA-CODE'},f.context,{type:'amount',amount:2000000}).error,/KHÁC CẤU HÌNH/);
});
test('all five source inputs still require a rule snapshot when the automatic policy lookup was requested',()=>{
 const f=hubFixture(),row={kind:'contract',ct:f.detail.ContractNo,cells:{...f.cells,F:'QA-INPUTS'}};
 const targets=inputTargets([row],false,{policy:true}),run=newInputRun(null,targets,false,'qa-run');const source={ct:row.ct,student:'QA-INPUTS',giftcode:'0'};
 assert.deepEqual(completeInputRun(run,row.ct,'QA-INPUTS',source).missing,['hubPolicy']);assert.equal(completeInputRun(run,row.ct,'QA-INPUTS',{...source,hubPolicy:f.policy}).complete,true);
 assert.equal(contractInputPlan([row],{needsPolicy:()=>true}).length,1);
});
