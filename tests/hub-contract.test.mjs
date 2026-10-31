import test from 'node:test';
import assert from 'node:assert/strict';
import {contractRoot,projectHubContract,projectContractPayments,validateHubContract} from '../src/core/hub-contract.mjs';
import {projectContractDetail,parseContractDetailProjection} from '../src/core/hub-course-network.mjs';
import {resolveCourseInfo} from '../src/core/course-info.mjs';
import {inputTargets,newInputRun,completeInputRun} from '../src/core/hub-input-progress.mjs';
const expected={ct:'QA2610-CT-000004',student:'QA-FACTS',url:'https://hub24.apollo.vn:7777/contract/detail/12345'};
const api='https://hub24.apollo.vn:7777/api/Contract/GetContractDetail?contractId=12345&userRoleId=41';
const root=()=>({ContractId:12345,ContractNo:expected.ct,StudentCode:expected.student,ListCourseInfo:[{PriceName:'ATLS - New Price 2026 - Layer 1',HourWeekName:'3 hrs/week',ProductPackageName:'18 months'}],GiftCodeId:null,GiftCode:null,ListDiscount:[{GroupDiscountId:301,GroupDiscountName:'2026 October - Promotion Discount',GroupDiscountTypeId:1,DiscountName:'18 months',PercentDiscount:15,AmountDiscount:0,GiftMonths:0},{GroupDiscountId:303,GroupDiscountName:'2026 October - Promotion Month',GroupDiscountTypeId:3,DiscountName:'18 months',PercentDiscount:0,AmountDiscount:0,GiftMonths:2}],ListPayment:[],Phone:'PRIVATE',Address:'PRIVATE',Token:'PRIVATE'});
const payment=()=>({PaymentId:12,ContractId:12345,PaymentCode:'QA2610-PAY-000004',PaymentTypeId:2,PaymentTypeName:'Payment',PaymentMethodTypeName:'Online Payments',Amount:64260000,TotalAmount:64260000,RemainAmount:0,IsComplete:true,CompleteDate:'2026-10-30T17:00:00',ScheduledDate:'2026-10-01T00:00:00',CitizenID:'PRIVATE',VirtualAccountNumber:'PRIVATE',Note:'PRIVATE'});
test('direct API and item/controller wrappers extract both cash and gifted-month names from the receiving CT',()=>{
 for(const value of [root(),{data:root()},{item:root()},{$vm:{contractInfo:root()}},{Data:{item:root()}}]){
  assert.equal(contractRoot(value).ContractId,12345);const result=parseContractDetailProjection(projectContractDetail(value,api,expected.url),expected);
  assert.equal(result.payload.discount,'2026 October - Promotion Discount - 18 months;2026 October - Promotion Month - 18 months');
  assert.equal(result.payload.hubContract.discounts[0].percent,15);assert.equal(result.payload.hubContract.discounts[1].months,2);
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
 }
 assert.equal(contractRoot({Data:root(),Result:root()}),null);
});
test('malformed master discounts remain missing even when a child course says its own list is empty',()=>{
 const r=root();r.ListDiscount=[{GroupDiscountId:301}];r.ListCourseInfo[0].ListDiscount=[];
 const result=parseContractDetailProjection(projectContractDetail(r,api,expected.url),expected);assert.equal(result.payload.discount,null);
});
test('payment API rows are scoped, projected and deduplicated without banking or contact data',()=>{
 const rows=projectContractPayments([payment()],12345);assert.equal(rows[0].amount,64260000);assert.equal(rows[0].remaining,0);
 assert.ok(!JSON.stringify(rows).includes('PRIVATE'));
 assert.equal(projectContractPayments([{...payment(),ContractId:999}],12345),null);
 assert.equal(projectContractPayments([payment(),payment()],12345),null);
 const facts=projectHubContract(root(),{payments:rows,paymentState:'read'});assert.ok(validateHubContract(facts));assert.equal(facts.payments.rows.length,1);
 assert.equal(validateHubContract({...facts,Token:'PRIVATE'}),false);
 const projection=projectContractDetail(root(),api,expected.url);projection.hubContract=facts;
 const bound=parseContractDetailProjection(projection,expected);assert.equal(bound.payload.hubContract.payments.rows[0].code,payment().PaymentCode);
 projection.hubContract={...facts,ct:'QA2610-CT-000999'};assert.equal(parseContractDetailProjection(projection,expected).error,'format');
});
test('an empty ListPayment placeholder is pending until the separate payment query actually completes',()=>{
 const facts=projectHubContract(root());assert.equal(facts.payments.state,'pending');
 const row={kind:'contract',ct:expected.ct,cells:{F:expected.student,H:'ATLS',I:'3 hrs/week',J:'18 months',K:'0',L:'Offer'}};
 const run=newInputRun(null,inputTargets([row],true,{facts:true}),true,'qa-lists');
 const source={...expected,courseFee:'ATLS',hoursPerWeek:'3 hrs/week',package:'18 months',giftcode:'0',discount:'Offer',hubContract:facts};
 assert.deepEqual(completeInputRun(run,expected.ct,expected.student,source).missing,['payments']);
 source.hubContract=projectHubContract(root(),{payments:[],paymentState:'read'});
 assert.equal(completeInputRun(run,expected.ct,expected.student,source).complete,true); // no Hub policy is required
 source.discount=null;assert.deepEqual(completeInputRun(run,expected.ct,expected.student,source).missing,['discount']);
 source.discount='Previously saved offer';source.lastReadMissing=['discount'];assert.deepEqual(completeInputRun(run,expected.ct,expected.student,source).missing,['discount']);
});
test('offer order/case differences do not blank the field; a different fresh CT offer stays visible with a conflict',()=>{
 const a='2026 October - Promotion Discount - 18 months',b='2026 October - Promotion Month - 18 months';
 const same=resolveCourseInfo([{L:a+';'+b,ref:{file:'PaymentList'}},{L:(b+';'+a).toUpperCase(),hub:true,ref:{file:'Hub'}}]);
 assert.ok(same.values.L);assert.equal(same.warnings.length,0);
 const changed=resolveCourseInfo([{L:'2026 October - Promotion Discount - 12 months',ref:{file:'PaymentList'}},{L:a+';'+b,hub:true,ref:{file:'Hub'}}]);
 assert.equal(changed.values.L,a+';'+b);assert.equal(changed.fields.L.length,2);assert.equal(changed.warnings.length,1);
 const none=resolveCourseInfo([{L:a},{L:'0',hub:true}]);assert.equal(none.values.L,'0');assert.equal(none.warnings.length,1);
});
