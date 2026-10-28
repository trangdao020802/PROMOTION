import test from 'node:test';import assert from 'node:assert/strict';
import {policyData} from '../scripts/policy-data.mjs';import {priceFor,AuditEngine} from '../src/local/calculation.mjs';import {buildModel} from '../src/local/model.mjs';import {parseDate} from '../src/core/source-parser.mjs';import {legacyDiscountFor} from '../src/core/legacy-discount.mjs';import {resolveCourseInfo} from '../src/core/course-info.mjs';
const p=policyData(),get=(pkg='12 months',hours=4,layer=1)=>priceFor({policy:p},{H:`AGLS | New Price 2024 | Layer${layer}`,I:hours+' hours/week',J:pkg,D:parseDate('2026-01-10'),L:'0'},{group:'AGLS',contractType:'New'});
test('primary historical 2024 book supplies regular and split gross values, independently of Report observations',()=>{
 assert.equal(get('18 months').gross,63000000);assert.equal(get('24 months').gross,82560000);assert.equal(get('12 months',3).gross,36000000);assert.equal(get('9 month siblings').gross,31500000);assert.equal(get('9 month siblings').discount,2000000);assert.equal(get('6 months',4,3).gross,24000000);assert.equal(get('2 months',3).gross,6750000);
 const q=structuredClone(p);q.priceEvidence.master.forEach(r=>r.observedGross=1);const c={H:'ATLS New Price 2024 Layer1',I:'4 hrs/week',J:'18 months',D:parseDate('2026-10-10')};assert.equal(priceFor({policy:q},c,{group:'ATLS'}).gross,63000000);
});
test('historical scholarships and referral use separate source amounts; unknown labels do not turn into zero',()=>{
 const price=get(),scholar='New Price 2024 - Học bổng ghi danh - 4hrs - Trả thẳng/Trả góp 3/6/9 tháng Apollo hỗ trợ';
 assert.equal(legacyDiscountFor(price,[scholar],{contractType:'New'}).amount,4000000);assert.equal(legacyDiscountFor(price,[scholar,'Referral - Referral for new 1.000.000 VND (AGLS/ATLS)'],{contractType:'New'}).amount,5000000);
 assert.equal(legacyDiscountFor(price,[scholar,'Ưu đãi không có căn cứ'],{}).amount,null);
 assert.ok(legacyDiscountFor(get('9 month siblings'),['Siblings - Siblings 1.000.000 VND (AGLS/ATLS/IELTS)'],{contractType:'New'}).checks.some(s=>s.startsWith('CHECK - GÓI CHIA ĐÔI')));
});
test('semantically identical labeled Course info from Raw and Hub does not blank out H:I:J',()=>{
 const r=resolveCourseInfo([{H:'ATLS - New Price 2026 - Layer 1',I:'4 hrs/week',J:'12 months'},{H:'ATLS | New Price 2026 | Layer1 — Primary',I:'4 hours / week',J:'12 tháng'}]);assert.equal(r.complete,true);assert.deepEqual(r.warnings,[]);
 const conflict=resolveCourseInfo([{H:'ATLS New Price 2024 Layer1'},{H:'ATLS New Price 2026 Layer1'}]);assert.equal(conflict.values.H,null);assert.ok(conflict.warnings.length);
});
test('a historical source-backed invoice reconciles after eligibility approval but a financial difference survives approval',()=>{
 const c={B:'QA',C:'QA1',D:'QA2601-PAY-000999',E:'QA2601-CT-000999',R:'QA-LEGACY',S:'SYNTHETIC',O:parseDate('2026-01-10'),P:'QA999',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'ATLS New Price 2024 Layer1',AA:'4 hrs/week',AB:'12 months',AQ:'Học bổng ghi danh - 4hrs - Trả thẳng/Trả góp 3/6/9 tháng Apollo hỗ trợ',AO:'0',AH:'Online Payments',AJ:'',AC:48000000,AD:4000000,AE:0,AF:44000000,AG:200},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-01-01',to:'2026-12-31',center:'QA1'},cutoff:parseDate('2026-12-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:c.E,student:c.R,target:44000000,paid:44000000,courseFee:c.Z,hoursPerWeek:c.AA,package:c.AB,totalHours:200,contractType:'New',center:'QA1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const engine=new AuditEngine(buildModel(bundle,p)),id='CT::'+c.E;let result=engine.calculate({id});assert.equal(result.cells.M,48000000);assert.equal(result.cells.N,4000000);assert.equal(result.cells.Q,44000000);
 const reviews=Object.fromEntries(result.reviewItems.map(i=>[i.id,{approved:true,scope:i.scope}]));result=engine.calculate({id},{reviews});assert.equal(result.cells.AF,'OK',JSON.stringify({reasons:result.resultReasons,checks:result.promotion.checks,BD:result.cells.BD,BO:result.cells.BO}));
 engine.groups.get(id).cells.T=48010000;result=engine.calculate({id},{reviews});assert.equal(result.cells.AF,'CHECK');
});
