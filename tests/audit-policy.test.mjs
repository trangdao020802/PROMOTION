import test from 'node:test';
import assert from 'node:assert/strict';
import {policyData} from '../scripts/policy-data.mjs';
import {priceFor,AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
import {voucherCode,voucherCenterApplies} from '../src/core/vouchers.mjs';
const p=policyData(),date=parseDate;
const price=(pkg,hours=4,when='2026-10-10',extra={})=>priceFor({policy:p},{H:'ATLS - New Price 2026 - Layer 1',I:hours+' hrs/week',J:pkg+' months',D:date(when),L:'',...extra},{group:'ATLS',contractType:'New'});
function fixture({pkg='24 months',hours='4 hrs/week',label='Q4 2026 Promotion Discount',method='Installment',term='12 month',net=75336000,gross=103200000,discount=27864000,gift=0,totalHours=400,when='2026-10-10',type='New',extra={}}={}){
 const cells={B:'Kiểm thử',C:'QA1',D:'QA2610-PAY-000999',E:'QA2610-CT-000999',R:'QA-RULES',S:'KIỂM THỬ RULE',O:date(when),P:'QA999',I:'Paid',F:'Payment',G:type,X:'ATLS',Z:'ATLS - New Price 2026 - Layer 1',AA:hours,AB:pkg,AQ:label,AH:method,AJ:term,AC:gross,AD:discount,AE:gift,AF:net,AG:totalHours,...extra},r={sourceKey:'p',sourceRow:2,cells};
 const b={kind:'source-bundle-v1',scope:{from:'2026-01-01',to:'2026-12-31',center:'QA1'},cutoff:date('2026-12-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:cells.E,student:cells.R,target:net,paid:net,courseFee:cells.Z,hoursPerWeek:cells.AA,package:pkg,totalHours,contractType:type,center:'QA1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 return {b,engine:new AuditEngine(buildModel(b,p))};
}
const calculate=(e,patch={})=>e.calculate({id:'CT::QA2610-CT-000999'},patch);
const allReviews=row=>Object.fromEntries(row.reviewItems.map(i=>[i.id,{approved:true,scope:i.scope}]));
test('Audit v7 price regimes change on 6 October and preserve the 25/6 hour factor',()=>{
 assert.equal(price(24,4,'2026-10-05').discount,23736000);
 assert.equal(price(24,4,'2026-10-06').discount,27864000);
 assert.equal(price(18,3).gross,56700000);assert.equal(price(18,3).discount,8505000);assert.equal(price(18,3).maxTerms,9);
 assert.equal(p.hourFactor,25/6);assert.equal(p.auditPolicy.moneyTolerance,1000);
});
test('one/two/odd-month prices multiply the regular month before discount, with explicit policy checks',()=>{
 assert.equal(price(1).gross,4800000);assert.equal(price(2).gross,9600000);assert.equal(price(2,3).gross,7200000);assert.equal(price(5,3).gross,18000000);
 assert.equal(price(2).maxTerms,0);assert.ok(price(2,4,'2026-11-01').issue.includes('NGOÀI KỲ'));
 assert.ok(price(2,4,'2026-10-10',{L:'Q4 2026 Promotion Discount'}).issue.includes('RULE RIÊNG'));
});
test('VTDH and non-ATLS long packages do not acquire ordinary Q4 terms',()=>{
 assert.equal(price(18,3,'2026-10-26',{J:'18 months (VTDH-Full)'}),null);
 const agls=price(24,4,'2026-10-10',{H:'AGLS - New Price 2026 - Layer 1'});assert.equal(agls.gross,103200000);assert.equal(agls.maxTerms,null);assert.equal(agls.discount,null);
});
test('Audit v7 rounds 13 months at 3 hours/week to 163 hours and a straight payment has zero installment months',()=>{
 const {engine}=fixture({pkg:'12 months',hours:'3 hrs/week',method:'Online Payments',term:'',gross:38700000,discount:3870000,net:34830000,totalHours:163});
 const r=calculate(engine);assert.equal(r.cells.R,163);assert.equal(r.cells.S,0);assert.equal(r.cells.AE,'OK');
});
test('Audit v7 percent vouchers use gross tuition, fixed values stay fixed, and pending vouchers keep CHECK',()=>{
 const {engine}=fixture({net:65016000,gift:10320000,extra:{AO:'QA-VOUCHER'}});
 const v={code:'QA-VOUCHER',label:'QA',studentId:'QA-RULES',studentName:'KIỂM THỬ RULE',center:'QA1',startDate:'2026-01-01',endDate:'2026-12-31',status:'APPROVED',type:'percent',rate:.1,amount:null,minimum:0,maximum:0,approvalNote:'QA căn cứ'};
 engine.setVouchers([v]);let r=calculate(engine);assert.equal(r.cells.O,10320000);assert.equal(r.cells.Q,65016000);
 engine.setVouchers([{...v,type:'amount',amount:1000000,minimum:2000000,maximum:3000000}]);r=calculate(engine);assert.equal(r.cells.O,1000000);
 engine.setVouchers([{...v,status:'PENDING'}]);r=calculate(engine);assert.equal(r.cells.O,null);assert.equal(r.cells.AF,'CHECK');assert.equal(voucherCode('0'),'');
 const described=fixture({extra:{AP:'Voucher đã ghi mô tả nhưng chưa có mã'}});r=calculate(described.engine);assert.equal(r.cells.O,null);assert.notEqual(r.cells.CI,'NO GIFTCODE');
});
test('a 1000 VND comparison difference is within the agreed threshold; 1001 VND still blocks after reviews',()=>{
 for(const difference of [1000,1001]){
  const {engine}=fixture({net:75336000-difference});let r=calculate(engine);r=calculate(engine,{reviews:allReviews(r)});
  assert.equal(r.cells.AF,difference===1000?'OK':'CHECK');
 }
});
test('installment months must be positive integers and cannot remain on a direct payment',()=>{
 let {engine}=fixture({term:'3.5 month'});assert.equal(calculate(engine).cells.AE,'CHECK - SAI KỲ TRẢ GÓP');
 ({engine}=fixture({method:'Online Payments',term:'12 month'}));assert.equal(calculate(engine).cells.AE,'CHECK - KỲ TRẢ THẲNG');
});
test('Q4 month-only offers do not become cash discounts, and On Top 5% is blocked in Q4',()=>{
 let {engine}=fixture({label:'2026 October - Promotion Month - 24 months',type:'Renew'});let r=calculate(engine);r=calculate(engine,{reviews:allReviews(r)});assert.equal(r.cells.N,0);assert.equal(r.cells.R,450);
 ({engine}=fixture({label:'Q4 2026 Promotion Discount; Big Bang Sep 2026 - On Top 5%'}));r=calculate(engine);assert.ok(r.promotion.checks.some(s=>s.includes('Q4 KHÔNG CÓ ON TOP')));
});
test('exactly 30 million requires a loyalty decision instead of silently determining zero',()=>{
 const {engine}=fixture({type:'Renew'}),proof={priorFees:30000000,stoppedDays:0,evidenceIds:['00000000-0000-4000-8000-000000000001']};
 const r=calculate(engine,{verification:proof});assert.equal(r.cells.R,null);assert.ok(r.verification.pending.some(s=>s.includes('đúng 30 triệu')));
});
test('the agreed 36/36 siblings mapping selects half the price and still requires sibling approval',()=>{
 const {engine}=fixture({pkg:'36 months',label:'2026 October - Promotion Discount - 36/36 siblings - From 06/10',gross:77400000,discount:23220000,net:54180000,totalHours:300});
 const r=calculate(engine);assert.equal(r.cells.AK,'36 SPLIT');assert.equal(r.cells.M,77400000);assert.equal(r.cells.N,23220000);assert.equal(r.cells.R,null);assert.ok(r.reviewItems.some(i=>i.id==='sibling'&&!i.approved));
});
const septemberSplit='Big Bang Sep 2026 - Giảm Tiền - Layer 1 - 36 months (chia đôi) - 3hrs/week';
test('Big Bang Sep cash offers use every roadmap fixed-amount cell, including October invoices',()=>{
 for(const row of p.roadmap){
  const label=`Big Bang Sep 2026 - Giảm Tiền - Layer ${row.B} - ${row.D==='36 SPLIT'?'36 months (chia đôi)':row.D+' months'} - ${row.C}hrs/week`;
  for(const when of ['2026-09-15','2026-10-05','2026-10-10']){
   const matched=priceFor({policy:p},{H:`ATLS - New Price 2026 - Layer ${row.B}`,I:row.C+' hrs/week',J:row.D==='36 SPLIT'?'18 months siblings':row.D+' months',D:date(when),L:label},{group:'ATLS',contractType:'New'});
   assert.equal(matched?.discount,row.K,`${row.A} · ${when}`);assert.equal(matched?.gross,row.G);assert.equal(matched?.maxTerms,row.N);assert.equal(matched?.policyKey,'BBSEP26_CASH');assert.equal(matched?.refs[0].cell,'K'+row.row);
  }
 }
});
test('the reported sibling course calculates 18 million discount and 40.05 million payable',()=>{
 for(const when of ['2026-09-15','2026-10-10']){
  const {engine}=fixture({pkg:'18 months siblings',hours:'3 hrs/week',label:septemberSplit,when,gross:58050000,discount:18000000,net:40050000,totalHours:225});
  const r=calculate(engine);assert.equal(r.cells.M,58050000);assert.equal(r.cells.N,18000000);assert.equal(r.cells.O,0);assert.equal(r.cells.Q,40050000);assert.equal(r.cells.AA,0);assert.equal(r.cells.AK,'36 SPLIT');assert.equal(r.cells.S,12);assert.ok(r.cells.AN.includes('ô K31'));
  assert.ok(r.reviewItems.some(i=>i.id==='sibling'&&!i.approved));
  if(when==='2026-10-10'){assert.equal(r.cells.AF,'CHECK');assert.ok(r.promotion.checks.some(s=>s.includes('NGOÀI THỜI KỲ')));}
 }
});
test('Q4 and base October retain their own sibling columns when the selected discount changes',()=>{
 const {engine}=fixture({pkg:'18 months siblings',hours:'3 hrs/week',label:septemberSplit,gross:58050000,discount:18000000,net:40050000});
 assert.equal(calculate(engine).cells.N,18000000);
 assert.equal(calculate(engine,{L:'2026 October - Promotion Discount - 36/36 siblings - From 06/10'}).cells.N,17415000);
 assert.equal(calculate(engine,{L:''}).cells.N,0);
 const beforeQ4=fixture({pkg:'18 months siblings',hours:'3 hrs/week',label:'2026 October - Promotion Discount - 36/36 siblings',when:'2026-10-05'});
 assert.equal(calculate(beforeQ4.engine).cells.N,13351500);
});
test('a missing September cash rule never falls through to a Q4 percentage or collected money',()=>{
 const policy=structuredClone(p);policy.roadmap=policy.roadmap.filter(r=>r.A!=='1|3|36 SPLIT');
 const {b}=fixture({pkg:'18 months siblings',hours:'3 hrs/week',label:septemberSplit,gross:58050000,discount:18000000,net:40050000});
 const r=calculate(new AuditEngine(buildModel(b,policy)));assert.equal(r.cells.M,null);assert.equal(r.cells.N,null);assert.equal(r.cells.Q,null);assert.equal(r.cells.AF,'CHECK');
});
test('missing Audit coverage still uses an independently approved price reference',()=>{
 const policy=structuredClone(p);policy.prices.push({C:'Khóa khác có bảng giá riêng',D:'2 hrs/week',E:'1 months',J:9000000,I:'Bảng giá được duyệt ngoài Audit',row:999});
 const matched=priceFor({policy},{H:'Khóa khác có bảng giá riêng',I:'2 hrs/week',J:'1 months',D:date('2026-10-10')},{group:'OTHER',contractType:'New'});
 assert.equal(matched.gross,9000000);assert.equal(matched.maxTerms,null);
});
test('Audit reference parameters do not silently replace other policy periods',async()=>{
 const {toleranceFor,voucherBasisFor}=await import('../src/core/audit-policy.mjs');
 assert.equal(toleranceFor({policy:p},date('2026-10-26')).money,1000);
 assert.equal(toleranceFor({policy:p},date('2026-08-26')).money,1);
 assert.equal(voucherBasisFor({policy:p},date('2026-10-26')),'gross');
 assert.equal(voucherBasisFor({policy:p},date('2026-08-26')),'after-discount');
});
test('the Export-ledger comparison also keeps its original threshold outside the Audit period',()=>{
 for(const when of ['2026-08-26','2026-10-26']){
  const {b}=fixture({when});b.exports[0].paid-=500;const m=buildModel(b,p),account=m.extensions.accounts.contracts[b.exports[0].ct];
  assert.equal(account.warnings.some(s=>s.includes('PAID_BY_CONTRACT')),when==='2026-08-26');
 }
});
test('Times City voucher and report center aliases match without accepting unrelated centers',()=>{
 for(const [scope,center]of [['HN24.TCY','HN24.TC'],['hn24.tc','HN24.TCY'],['HN24 . TCY','HN24.TC'],['North; HN24.TCY','HN24.TC'],['Times City','HN24.TC']])assert.equal(voucherCenterApplies(scope,center),true);
 for(const [scope,center]of [['HN24.TCY','HN25.TC'],['HN24.TCY','TC'],['HN24.TCY','HN24.TCY2'],['ALL',''],['','HN24.TC']])assert.equal(voucherCenterApplies(scope,center),false);
});
test('an approved 90% voucher for Times City calculates instead of falsely reporting wrong center',()=>{
 const {b}=fixture({pkg:'6 months',hours:'3 hrs/week',label:'',method:'Online Payments',term:'',gross:21600000,discount:0,gift:19440000,net:2160000,totalHours:75,when:'2026-10-26',extra:{C:'HN24.TC',AO:'QA-CDNORTH90-TIMESCITY'}});
 b.exports[0].center='HN24.TC';const engine=new AuditEngine(buildModel(b,p));
 const v={code:'QA-CDNORTH90-TIMESCITY',label:'QA voucher 90%',studentId:'QA-RULES',studentName:'KIỂM THỬ RULE',center:'HN24.TCY',startDate:'2026-10-26',endDate:'2026-10-26',status:'APPROVED',type:'percent',rate:.9,amount:null,minimum:null,maximum:null,approvalNote:'Căn cứ QA đã duyệt'};
 engine.setVouchers([v]);let r=calculate(engine);assert.equal(r.cells.CI,'OK');assert.equal(r.cells.O,19440000);assert.equal(r.cells.Q,2160000);
 for(const patch of [{center:'HN25.TCY'},{studentId:'QA-OTHER'},{startDate:'2026-10-27',endDate:'2026-10-27'},{status:'PENDING'}]){
  engine.setVouchers([{...v,...patch}]);r=calculate(engine);assert.notEqual(r.cells.CI,'OK');assert.equal(r.cells.O,null);assert.equal(r.cells.AF,'CHECK');
 }
});
