import test from 'node:test';import assert from 'node:assert/strict';
import {projectContractDetail,parseContractDetailProjection} from '../src/core/hub-course-network.mjs';
import {resolveCourseInfo} from '../src/core/course-info.mjs';
import {missingContractInputs} from '../src/core/hub-course.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';import {buildModel} from '../src/local/model.mjs';
import {policyData} from '../scripts/policy-data.mjs';import {dateSerial} from '../src/core/verification.mjs';
const identity={ct:'TC2610-CT-0049893',student:'QA-MASTER-OFFERS',url:'https://hub24.apollo.vn:7777/contract/detail/9893'},api='https://hub24.apollo.vn:7777/qa/GetContractDetail?contractId=9893';
const names=['2026 October - Promotion Discount - 12 months','Sep/Oct 2026 - Tặng Tháng (TRẢ THẲNG) - All layer - Tặng 1 tháng'];
function fixture(){
 const c={B:'QA CENTER',C:'HN24.TC',D:'QA2610-PAY-009893',E:identity.ct,R:identity.student,S:'HỌC VIÊN GIẢ',O:dateSerial('2026-10-03'),P:'QA9893',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:'3 hrs/week',AB:'12 months',AQ:'',AO:'',AH:'Online Payments',AJ:'',AC:38700000,AD:3870000,AE:0,AF:34830000,AG:163},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:dateSerial('2026-10-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:identity.ct,student:identity.student,target:34830000,paid:34830000,totalHours:163,courseFee:c.Z,hoursPerWeek:c.AA,package:c.AB,contractType:'New',center:c.C}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const engine=new AuditEngine(buildModel(bundle,policyData())),record={id:'CT::'+identity.ct};
 const raw={ContractId:9893,ContractNo:identity.ct,StudentCode:identity.student,ListCourseInfo:[{PriceName:c.Z,HourWeekName:c.AA,ProductPackageName:c.AB,ListDiscount:[],ListGiftCode:[]}],ListGiftCode:[],Discounts:JSON.stringify([{DiscountName:'10.00% ('+names[0]+')'},{DiscountName:'1 Months ('+names[1]+')'}])};
 return {engine,record,raw,calculate:patch=>engine.calculate(record,patch)};
}
test('master CT names fill detail Discount apply, calculate 3,870,000 reduction and 163 total hours',()=>{
 const f=fixture(),before=f.calculate();assert.equal(before.cells.L,null);assert.equal(before.cells.N,null);assert.equal(before.cells.Q,null);assert.ok(missingContractInputs(before).includes('L'));
 const payload=parseContractDetailProjection(projectContractDetail(f.raw,api,identity.url),identity).payload;assert.equal(payload.discount,names.join(';'));assert.equal(payload.giftcode,'0');
 f.engine.updateCourseSource(payload);const after=f.calculate();assert.equal(after.cells.L,names.join(';'));assert.equal(after.cells.K,'0');assert.equal(after.cells.M,38700000);assert.equal(after.cells.N,3870000);assert.equal(after.cells.O,0);assert.equal(after.cells.Q,34830000);assert.equal(after.cells.extraHours,12.5);assert.equal(after.cells.R,163);assert.equal(after.cells.AA,0);assert.equal(after.cells.AC,0);
 const manual=f.calculate({L:'0'});assert.equal(manual.cells.L,'0');assert.equal(manual.cells.N,0);assert.equal(manual.cells.AC,-3870000);
});
test('a partial Hub offer read stays unknown until explicit no-offer values arrive',()=>{
 const f=fixture(),payload={...identity,courseFee:f.raw.ListCourseInfo[0].PriceName,hoursPerWeek:'3 hrs/week',package:'12 months',giftcode:null,discount:null};
 f.engine.updateCourseSource(payload);let row=f.calculate();assert.equal(row.cells.N,null);assert.equal(row.cells.O,null);assert.equal(row.cells.Q,null);assert.equal(row.cells.R,null);
 f.engine.updateCourseSource({...payload,giftcode:'0',discount:'0'});row=f.calculate();assert.equal(row.cells.L,'0');assert.equal(row.cells.N,0);assert.equal(row.cells.O,0);assert.equal(row.cells.Q,38700000);assert.notEqual(row.cells.AC,0);
});
test('receiving master CT offers remain separate from an intermediary CT and ambiguous codes stay unresolved',()=>{
 const source=resolveCourseInfo([{K:'0',L:'0',ref:{file:'Master'}},{K:'QA-RETIRED',L:names[0],fallback:true,ref:{file:'Intermediary'}}]);assert.equal(source.values.K,'0');assert.equal(source.values.L,'0');
 const conflict=resolveCourseInfo([{K:'QA-ONE'},{K:'QA-TWO'}]);assert.equal(conflict.values.K,null);assert.ok(conflict.warnings.length);
});
