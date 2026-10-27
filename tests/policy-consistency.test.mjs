import test from 'node:test';
import assert from 'node:assert/strict';
import {policyData} from '../scripts/policy-data.mjs';
import {PRICE_PHASES,buildPriceCatalogue,roadmapSchedule,policyRuleCatalogue} from '../src/core/price-catalog.mjs';
import {offerConsistencyChecks,voucherPolicyChecks} from '../src/core/policy-consistency.mjs';
import {AuditEngine,priceFor} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {referenceRows} from '../src/core/reference-data.mjs';
import {EMPTY_VOUCHER,VOUCHER_POLICIES,validateVoucher} from '../src/core/vouchers.mjs';
import {reviewScope} from '../src/core/reviews.mjs';
const p=policyData(),day=parseDate;
function fixture({policy=p,pkg='12 months',hours=3,layer=1,label='Q4 2026 Promotion Discount - 12 months',center='QA1',type='New',method='Online Payments',term='',date='2026-10-10',gross=38700000,discount=3870000,gift=0,net=gross-discount-gift,totalHours=163,code=''}={}){
 const c={B:'CENTER GIẢ',C:center,D:'QA2610-PAY-004',E:'QA2610-CT-004',R:'QA-CONSISTENCY',S:'DỮ LIỆU GIẢ KIỂM THỬ',O:day(date),P:'QA004',I:'Paid',F:'Payment',G:type,X:'ATLS',Z:`ATLS - New Price 2026 - Layer ${layer}`,AA:hours+' hrs/week',AB:pkg,AQ:label,AO:code,AH:method,AJ:term,AC:gross,AD:discount,AE:gift,AF:net,AG:totalHours},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-01-01',to:'2026-12-31',center:''},cutoff:day('2026-12-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:c.E,student:c.R,target:net,paid:net,courseFee:c.Z,hoursPerWeek:c.AA,package:c.AB,totalHours,contractType:type,center:c.C}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 return {engine:new AuditEngine(buildModel(bundle,policy)),id:'CT::'+c.E};
}
const calculate=(f,patch={})=>f.engine.calculate({id:f.id},patch);
const approved=r=>({reviews:Object.fromEntries(r.reviewItems.map(i=>[i.id,{approved:true,scope:i.scope}]))});
const voucher=(more={})=>({...EMPTY_VOUCHER,code:'QA-VOUCHER',label:'VOUCHER GIẢ KIỂM THỬ',studentId:'QA-CONSISTENCY',studentName:'DỮ LIỆU GIẢ KIỂM THỬ',center:'QA1',startDate:'2026-09-18',endDate:'2026-10-31',type:'percent',rate:.1,status:'APPROVED',approvalNote:'Căn cứ kiểm thử giả',...more});

test('all 192 dated schedule rows reconcile columns and are the exact schedules the calculator selects',()=>{
 const rows=buildPriceCatalogue(p).filter(r=>r.regime!=='reference');assert.equal(rows.length,192);assert.equal(p.priceEvidence.sources.length,18);assert.equal(p.priceEvidence.checkedRows,48);assert.equal(p.priceEvidence.conflicts,0);
 for(const r of rows){
  assert.equal(r.monthly*r.months,r.gross);assert.equal(r.gross-r.discount,r.net);assert.ok(r.group&&r.koc&&r.layer&&r.hours&&r.from&&r.to);assert.ok(r.refs.length);
  const label=r.regime==='september'?`Big Bang Sep 2026 - Giảm Tiền - Layer ${r.layer} - ${r.packageKey==='36 SPLIT'?'36 months (chia đôi)':r.packageKey+' months'} - ${r.hours}hrs/week`:'';
  const result=priceFor({policy:p},{H:r.course,I:r.hours+' hrs/week',J:r.package,D:day(r.from),L:label},{group:'ATLS',contractType:'New'});
  for(const key of ['gross','discount','months','monthly','maxTerms'])assert.equal(result[key],r[key],r.id+' '+key);
 }
});
test('price conflicts and duplicated keys never fall through to Audit, Report or a first-match price',()=>{
 for(const mutate of [q=>q.roadmap.push({...q.roadmap[0]}),q=>q.roadmap[0].G++,q=>q.roadmap[0].U++,q=>q.roadmap[0].B=2,q=>q.roadmap[0].F=1,q=>q.priceEvidence.roadmap[0].values.G++]){
  const q=structuredClone(p);mutate(q);const r=roadmapSchedule(q,{layer:1,hours:4,pkg:36,phase:'q4'});assert.equal(r.gross,null);assert.equal(r.discount,null);assert.ok(r.issue.startsWith('CHECK - BẢNG GIÁ KHÔNG THỐNG NHẤT'));
  const f=fixture({policy:q,pkg:'36 months',hours:4});let row=calculate(f);row=calculate(f,approved(row));assert.equal(row.cells.M,null);assert.equal(row.cells.AF,'CHECK');
 }
});
test('reference views use canonical typed columns; financial rules cannot appear as vouchers',()=>{
 const prices=buildPriceCatalogue(p),rules=policyRuleCatalogue(p,prices),data={priceCatalogue:prices,ruleCatalogue:rules,customVouchers:[]};
 assert.equal(referenceRows(data,'master'),prices);assert.equal(referenceRows(data,'prices'),rules);assert.deepEqual(referenceRows(data,'vouchers'),[]);assert.ok(rules.some(r=>r.ruleKey==='CEO_RCM'));assert.ok(rules.some(r=>r.ruleKey==='VTDH_SEPARATE'&&r.status==='missing'));
 assert.deepEqual(p.policyRegister.voucherPolicies.map(r=>r.id).sort(),Object.keys(VOUCHER_POLICIES).sort());
});
test('old Report-based prices stay observations, with no transfer to the approved gross field',()=>{
 const rows=buildPriceCatalogue(p),old=rows.find(r=>r.year===2024&&r.observedPrice>0);assert.ok(old);assert.equal(old.gross,null);assert.equal(old.discount,null);assert.equal(old.status,'missing');assert.ok(old.masterRefs.length);
 const q=structuredClone(p);for(const r of q.priceEvidence.master)r.observedGross=1;assert.equal(roadmapSchedule(q,{layer:1,hours:3,pkg:36,phase:'q4'}).gross,116100000);
});
test('two primary cash offers from the same period remain CHECK after every approval',()=>{
 const f=fixture({label:'Q4 2026 Promotion Discount - 12 months;2026 October - Promotion Discount - 12 months - From 06/10'});let r=calculate(f);assert.equal(r.cells.N,3870000);r=calculate(f,approved(r));assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(s=>s.includes('NHIỀU ƯU ĐÃI GIẢM NỀN')));
});
test('explicit Layer, hour and package contradictions remain visible after approvals',()=>{
 for(const label of ['Q4 2026 Promotion Discount - Layer 2 - 12 months','Q4 2026 Promotion Discount - 12 months - 4hrs/week','Q4 2026 Promotion Discount - 24 months']){
  const f=fixture({label});let r=calculate(f);r=calculate(f,approved(r));assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(s=>/LAYER TRONG|GIỜ TRONG|GÓI TRONG/.test(s)));
 }
 assert.deepEqual(offerConsistencyChecks({L:'2026 October - Promotion Discount - 36/36 siblings - From 06/10',D:day('2026-10-10')},{method:'Online Payments'},{pkg:'36 SPLIT',layer:1,hours:3}),[]);
});
test('a valid Special30 case uses its own eligibility and reconciles after scoped evidence approval',()=>{
 const f=fixture({pkg:'6 months',hours:4,label:'Special Support RGI/TPU/LNQ/LBB',center:'KG01.RGI',gross:28800000,discount:8640000,totalHours:100});let r=calculate(f);assert.equal(r.cells.N,8640000);r=calculate(f,approved(r));assert.equal(r.cells.AF,'OK');
});
test('Special30 wrong package, current LBB, wrong hours and conflicting Q4 offers cannot be approved away',()=>{
 for(const options of [{pkg:'12 months'},{center:'HCM01.LBB',type:'Renew'},{hours:3,center:'HCM01.LBB'},{label:'Special Support RGI/TPU/LNQ/LBB;Q4 2026 Promotion Discount'}]){
  const f=fixture({pkg:'6 months',hours:4,center:'KG01.RGI',label:'Special Support RGI/TPU/LNQ/LBB',...options});let r=calculate(f);r=calculate(f,approved(r));assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(s=>s.startsWith('CHECK - SPECIAL30')));
 }
});
test('voucher policy is an explicit field; a CEO-looking code never proves eligibility',()=>{
 const a={cells:{B:'QA1',D:day('2026-10-10'),K:'CEOAP-LOOKING'},context:{group:'ATLS',method:'Online Payments'},pricing:{pkg:6,hours:3},account:{},voucher:voucher({code:'CEOAP-LOOKING'})};
 assert.ok(!voucherPolicyChecks(a).some(s=>s.includes('CEO')));
 const checks=voucherPolicyChecks({...a,voucher:voucher({policyId:'ceo',rate:.3})});assert.ok(checks.some(s=>s.startsWith('XÁC MINH - CEO')));
});
test('CEO checks rate, package, stacking, known stop gap, date and installment separately from voucher approval',()=>{
 const base={cells:{B:'QA1',D:day('2026-10-10'),K:'QA-VOUCHER',L:''},context:{group:'ATLS',method:'Online Payments'},pricing:{pkg:6,hours:3},account:{},voucher:voucher({policyId:'ceo',rate:.3})};
 for(const modified of [{voucher:voucher({policyId:'ceo',rate:.2})},{pricing:{pkg:24,hours:3}},{cells:{...base.cells,L:'Q4 2026 Promotion Discount'}},{patch:{verification:{stoppedDays:121}}},{cells:{...base.cells,D:day('2026-11-01')}},{context:{group:'ATLS',method:'Installment',term:'6 month'}}])assert.ok(voucherPolicyChecks({...base,...modified}).some(s=>s.startsWith('CHECK - CEO')));
});
test('voucher basis is explicit, changes calculation and trace, while default combined basis requires verification',()=>{
 const f=fixture({code:'QA-VOUCHER',gift:3483000,net:31347000});f.engine.setVouchers([voucher({percentBasis:'after-discount'})]);let r=calculate(f);assert.equal(r.cells.O,3483000);assert.ok(r.cells.AN.includes('Giftcode % trên giá gốc trừ Discount'));assert.ok(!r.promotion.checks.some(s=>s.includes('CƠ SỞ % GIFTCODE')));
 f.engine.setVouchers([voucher({percentBasis:'gross'})]);r=calculate(f);assert.equal(r.cells.O,3870000);assert.notEqual(r.cells.AB,0);
 f.engine.setVouchers([voucher()]);r=calculate(f);assert.ok(r.promotion.checks.some(s=>s.includes('CƠ SỞ % GIFTCODE')));
});
test('a policy/basis change invalidates its old review scope, and unknown policy/basis cannot be saved',()=>{
 const row={cells:{C:'QA-CT',F:'QA-S',D:1},context:{voucherPolicyScope:'old'}};assert.notEqual(reviewScope(row),reviewScope({...row,context:{voucherPolicyScope:'new'}}));
 assert.ok(validateVoucher(voucher({policyId:'unknown'})));assert.ok(validateVoucher(voucher({percentBasis:'guess-from-code'})));assert.equal(validateVoucher(voucher({percentBasis:'gross',policyId:'ceo',rate:.3})),null);
});
test('loyalty approvals still calculate after a voucher has an explicit policy or percent basis',()=>{
 const f=fixture({pkg:'24 months',type:'Renew',label:'Q4 2026 Promotion Discount - 24 months',gross:77400000,discount:20898000,gift:5650200,code:'QA-VOUCHER',totalHours:350});
 f.engine.setVouchers([voucher({percentBasis:'after-discount'})]);let r=calculate(f);assert.equal(r.cells.R,null);r=calculate(f,approved(r));assert.equal(r.cells.R,350);assert.equal(r.cells.AF,'OK');
});
test('discount plus voucher over gross remains CHECK even if the net amount clamps at zero',()=>{
 const f=fixture({code:'QA-VOUCHER',gift:38700000,net:0});f.engine.setVouchers([voucher({rate:1,percentBasis:'gross'})]);let r=calculate(f);r=calculate(f,approved(r));assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(s=>s.includes('VƯỢT GIÁ GỐC')));
});
test('September Tặng tháng retains the fixed cash schedule and separately adds the direct month once',()=>{
 const f=fixture({pkg:'24 months',date:'2026-09-15',label:'Big Bang Sep 2026 - Tặng tháng - Layer 1 - 24 months - 3hrs/week',gross:77400000,discount:21000000,totalHours:313});const r=calculate(f);assert.equal(r.cells.N,21000000);assert.equal(r.cells.Q,56400000);assert.equal(r.cells.R,313);
 const paidByInstallment=fixture({pkg:'24 months',date:'2026-09-15',label:'Big Bang Sep 2026 - Tặng tháng - Layer 1 - 24 months - 3hrs/week',method:'Installment',term:'12 month'});assert.ok(calculate(paidByInstallment).promotion.checks.some(s=>s.includes('YÊU CẦU TRẢ THẲNG')));
});
test('September short packages do not acquire a nonexistent Big Bang entitlement',()=>{
 const f=fixture({pkg:'6 months',date:'2026-09-15',label:'Big Bang Sep 2026 - Giảm Tiền - Layer 1 - 6 months - 3hrs/week'});let r=calculate(f);r=calculate(f,approved(r));assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(s=>s.includes('BIG BANG SEP CHỈ ÁP DỤNG')));
});
test('known contradictory split facts survive approval instead of disappearing as an evidence checkbox',()=>{
 const base={cells:{B:'QA1',D:day('2026-10-10'),F:'QA-S',L:''},context:{group:'ATLS'},pricing:{pkg:'36 SPLIT'},account:{}};
 for(const verification of [{siblingRelationship:'no'},{partnerCourse:'IELTS'},{partnerStudentId:'QA-S'},{ownFullDate:'2026-10-10',partnerFullDate:'2026-10-11'}])assert.ok(voucherPolicyChecks({...base,patch:{verification}}).some(s=>s.startsWith('CHECK - GÓI CHIA ĐÔI')));
});
