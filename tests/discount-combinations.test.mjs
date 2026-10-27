import test from 'node:test';
import assert from 'node:assert/strict';
import {policyData} from '../scripts/policy-data.mjs';
import {discountOffers,discountPolicyMatch,discountPolicyCheck,fixedSiblingAmount,matchingPrograms} from '../src/core/promotions.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {parseDate,parseCsv,autoMap,normalizeSheet} from '../src/core/source-parser.mjs';
const fixed='Siblings - Siblings 1.000.000 VND (AGLS/ATLS/IELTS)',cash='2026 October - Promotion Discount - 36/36 siblings - From 06/10',months='2026 October - Promotion Month - 36 months siblings',label=[fixed,cash,months,''].join(';'),day=parseDate('2026-10-10'),policy=policyData();
function fixture({offer=label,pkg='18 months siblings',layer=1,type='New',gross=58050000,discount=18415000,net=gross-discount,hours=231}={}){
 const c={B:'CENTER KIỂM THỬ',C:'QA1',D:'QA2610-PAY-003',E:'QA2610-CT-003',R:'QA-COMBO',S:'DỮ LIỆU GIẢ KIỂM THỬ',O:day,P:'QA003',I:'Paid',F:'Payment',G:type,X:'ATLS',Z:`ATLS - New Price 2026 - Layer ${layer}`,AA:'3 hrs/week',AB:pkg,AQ:offer,AH:'Online Payments',AJ:'',AC:gross,AD:discount,AE:0,AF:net,AG:hours},row={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:parseDate('2026-10-31'),records:[row],cash:[row],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:c.E,student:c.R,target:net,paid:net,courseFee:c.Z,hoursPerWeek:c.AA,package:pkg,totalHours:hours,contractType:type,center:c.C}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const model=buildModel(bundle,policy);return {model,engine:new AuditEngine(model),id:'CT::'+c.E};
}
const calculate=(f,patch={})=>f.engine.calculate({id:f.id},patch);
const approvals=r=>({reviews:Object.fromEntries(r.reviewItems.map(i=>[i.id,{approved:true,scope:i.scope}]))});
test('the PaymentList combination retains all three full labels and finds cash, fixed Siblings and gift months separately',()=>{
 assert.deepEqual(discountOffers(label),[fixed,cash,months]);
 const m=discountPolicyMatch(label,day);assert.equal(m.ruleKey,'BBQ426_CASH');assert.equal(m.kind,'cash');assert.deepEqual(m.issues,[]);assert.equal(discountPolicyMatch(fixed,day).kind,'sibling-cash');assert.equal(discountPolicyMatch(months,day).kind,'months');assert.equal(discountPolicyCheck(label,day,'BBQ426',{}),'OK');
 const f=fixture(),r=calculate(f);assert.equal(r.cells.L,label);assert.equal(r.cells.BO,'OK');assert.equal(r.cells.N,18415000);assert.equal(r.cells.Q,39635000);assert.equal(r.discountComponents.length,3);assert.ok(f.model.choices.L.includes(label));for(const term of [fixed,cash,months])assert.ok(f.model.choices.L.includes(term));
});
test('trailing separators, repeated labels and offer order do not multiply cash discounts or gift months',()=>{
 for(const offer of [label+';;'+fixed+';', [months,cash,fixed].join(';'),[cash,fixed,months,fixed,months].join(';')]){
  const r=calculate(fixture({offer}));assert.equal(r.cells.N,18415000);assert.equal(r.cells.Q,39635000);assert.equal(r.cells.AL,'BBQ426_CASH');assert.equal(r.discountComponents.filter(c=>c.kind==='sibling-cash').length,1);
 }
});
test('fixed Siblings recognizes only mapped amounts and currency aliases, never arbitrary amounts in a label',()=>{
 for(const amount of ['1.000.000','1,000,000','1000000'])for(const unit of ['VND','VNĐ'])assert.equal(fixedSiblingAmount(`Siblings - Siblings ${amount} ${unit} (AGLS/ATLS/IELTS)`),1000000);
 assert.equal(fixedSiblingAmount('Siblings - Siblings 800.000 VND (AGLS/ATLS/IELTS)'),800000);
 for(const unknown of ['Siblings - Siblings 2.000.000 VND (AGLS/ATLS/IELTS)','NEW CODE 1.000.000 VND','Siblings - Siblings 1.000.000 VND (OTHER)'])assert.equal(fixedSiblingAmount(unknown),null);
 const r=calculate(fixture({offer:label+';NEW CODE 1.000.000 VND'}));assert.equal(r.cells.N,null);assert.equal(r.cells.AF,'CHECK');
});
test('Q4 combinations do not inherit the expired June/July sibling program',()=>{
 const programs=matchingPrograms(label,policy.programs,day).map(p=>p.id);assert.ok(programs.includes('q4'));assert.ok(programs.includes('ref-q4'));assert.ok(!programs.includes('ref-jun-aug'));assert.ok(!programs.includes('manual'));
 const r=calculate(fixture());assert.ok(!r.promotion.checks.some(c=>c.includes('tháng 6–7')));
});
test('a known cash label computes its amount but cannot bypass Q4 package eligibility with approvals',()=>{
 const f=fixture();let r=calculate(f);assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(c=>c.startsWith('CHECK - SIBLINGS GIẢM TIỀN Q4')));
 r=calculate(f,approvals(r));assert.equal(r.cells.N,18415000);assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(c=>c.startsWith('CHECK - SIBLINGS GIẢM TIỀN Q4')));
});
test('a valid short-package Sibling New amount can pass after verification; wrong layer/type stay CHECK',()=>{
 const f=fixture({offer:fixed,pkg:'3 months',gross:10800000,discount:1000000,hours:38});let r=calculate(f);assert.equal(r.cells.N,1000000);assert.ok(r.reviewItems.some(i=>i.id==='referral'));r=calculate(f,approvals(r));assert.equal(r.cells.AF,'OK');
 for(const options of [{layer:3,gross:9900000},{type:'Renew'}]){const wrong=fixture({offer:fixed,pkg:'3 months',gross:10800000,discount:1000000,hours:38,...options});let row=calculate(wrong);row=calculate(wrong,approvals(row));assert.equal(row.cells.AF,'CHECK');}
});
test('a Promotion Month label is never added as cash and does not duplicate the Q4 loyalty award',()=>{
 const f=fixture({offer:[cash,months].join(';'),type:'Renew',discount:17415000,hours:256});let r=calculate(f);r=calculate(f,approvals(r));assert.equal(r.cells.N,17415000);assert.equal(r.cells.R,256);assert.ok(r.discountComponents.some(c=>c.kind==='months'&&c.amount===0));
});
test('CSV source normalization preserves the complete semicolon-separated PaymentList value',()=>{
 const csv='Payment code,Contract code,Student ID,Invoice date,Final payment invoice amount,Discount apply\nQA2610-PAY-003,QA2610-CT-003,QA-COMBO,10/10/2026,39635000,"'+label+'"';
 const rows=parseCsv(csv),map=autoMap(rows,'payment'),normalized=normalizeSheet(rows,'payment',map);assert.deepEqual(normalized.errors,[]);assert.equal(normalized.records[0].cells.AQ,label);
});
