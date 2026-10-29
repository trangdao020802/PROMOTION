import test from 'node:test';
import assert from 'node:assert/strict';
import {courseRequest,coursePayload,parseCoursePage,contractInputPlan,fillContractInputs,missingContractInputs,courseLabel,courseFailure} from '../src/core/hub-course.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';
import {buildModel} from '../src/local/model.mjs';
import {policyData} from '../scripts/policy-data.mjs';
import {parseDate} from '../src/core/source-parser.mjs';
const expected={ct:'QA2610-CT-000004',student:'QA-INPUTS',url:'https://hub24.apollo.vn:7777/contract/detail/12345'};
const payload={...expected,courseFee:'ATLS - New Price 2026 - Layer 1',hoursPerWeek:'3 hrs/week',package:'2 months',giftcode:'0',discount:'0',groupKoc:'ATLS',contractType:'New'};
const row=(id=expected.ct,student=expected.student)=>({id:'CT::'+id,ct:id,kind:'contract',cells:{F:student,contractTotal:id,H:null,I:null,J:null,K:null,L:null,U:0,V:0}});
function fixture({pkg='2 months',gross=7200000,discount=0,totalHours=25,offer='0',giftcode='0'}={}){
 const day=parseDate('2026-10-10'),c={B:'CENTER GIẢ KIỂM THỬ',C:'QA1',D:'QA2610-PAY-004',E:expected.ct,R:expected.student,S:'DỮ LIỆU GIẢ KIỂM THỬ',O:day,P:'QA004',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'',AA:'',AB:'',AQ:'',AO:'',AH:'Online Payments',AJ:'',AC:gross,AD:discount,AE:0,AF:gross-discount,AG:totalHours},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:parseDate('2026-10-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:expected.ct,student:expected.student,target:c.AF,paid:c.AF,totalHours,contractType:'New',center:'QA1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 return {engine:new AuditEngine(buildModel(bundle,policyData())),source:{...payload,package:pkg,discount:offer,giftcode}};
}
test('Contract inputs require observed detail URL, exact CT title and matching Student ID',()=>{
 const page={url:expected.url,titles:['Contract '+expected.ct],pairs:[{label:'Student ID',value:expected.student},{label:'Price name *',value:payload.courseFee},{label:'Hour/week',value:'3 hrs/week'},{label:'Package before discount',value:'2 months'},{label:'Giftcode No.',value:'0'},{label:'Discount apply',value:'0'}]};
 const result=parseCoursePage(page,expected);assert.equal(result.payload.courseFee,payload.courseFee);assert.equal(result.payload.giftcode,'0');assert.equal(result.payload.discount,'0');
 assert.equal(parseCoursePage({...page,titles:['Contract QA2610-CT-009999']},expected).error,'identity');
 assert.equal(parseCoursePage({...page,pairs:[...page.pairs,{label:'Student code',value:'QA-OTHER'}]},expected).error,'conflict');
 for(const url of ['https://example.com/contract/detail/12345','https://hub24.apollo.vn:7777/contract/list?ct='+expected.ct,'https://hub24.apollo.vn:7777/contract/detail/12345?token=x'])assert.equal(courseRequest({...expected,url}),null);
 assert.equal(coursePayload({...payload,student:'QA-OTHER'},expected),null);
});
test('Package Before wins over generic/after; full discount combinations and giftcode are retained',()=>{
 const label='2026 October - Promotion Discount - 24 months - From 06/10;2026 October - Promotion Month - 24 months';
 const r=parseCoursePage({url:expected.url,titles:[expected.ct],pairs:[{label:'Package',value:'27 months'},{label:'Package Before Discount',value:'24 months'},{label:'Package After Discount',value:'27 months'},{label:'Giftcode No',value:'QA-FULL-CODE'},{label:'Discount apply',value:label}]},expected).payload;
 assert.equal(r.package,'24 months');assert.equal(r.discount,label);assert.equal(r.giftcode,'QA-FULL-CODE');
 assert.equal(parseCoursePage({url:expected.url,titles:[expected.ct],pairs:[{label:'Price name',value:'A'},{label:'Course fee KOC',value:'B'}]},expected).error,'conflict');
});
test('the bulk plan uses unique final contracts, skips deposits and does not guess a course from received cash',()=>{
 const a=row(),b={...row('QA2610-CT-000005'),cells:{...row().cells,contractTotal:'QA2610-CT-000005',H:'Fee',I:'3 hrs/week',J:'12 months',U:1}},deposit={...row(),kind:'unlinked',ct:null};
 assert.deepEqual(missingContractInputs(a),['H','I','J']);assert.deepEqual(missingContractInputs(b),['L']);assert.equal(contractInputPlan([a,a,b,deposit]).length,2);
 assert.equal(contractInputPlan([a,row(expected.ct,'OTHER')]).length,0);
 const complete={...row(),cells:{...row().cells,H:'Fee',I:'3 hrs/week',J:'12 months'}};assert.equal(contractInputPlan([complete]).length,0);assert.equal(contractInputPlan([complete],{refresh:true}).length,1);
});
test('bulk reading reuses a link or resolves and saves it, then saves correctly scoped inputs once',async()=>{
 const calls=[];const io={loadLink:async ct=>(calls.push('load'),null),lookup:async ct=>(calls.push('lookup'),{ct,url:expected.url}),saveLink:async link=>(calls.push('link'),link),read:async target=>(calls.push('read'),payload),save:async(r,p)=>{calls.push('save');assert.equal(p.ct,r.ct);assert.equal(p.student,r.cells.F);}};
 const r=await fillContractInputs([row()],io);assert.deepEqual(calls,['load','lookup','link','read','save']);assert.equal(r[0].status,'saved');assert.ok(r[0].fields.includes('discount'));
 calls.length=0;await fillContractInputs([row()],{...io,loadLink:async()=>({ct:expected.ct,url:expected.url})});assert.deepEqual(calls,['read','save']);
});
test('mismatched or cancelled Hub replies never save inputs for another CT/student',async()=>{
 let saves=0;const io={loadLink:async()=>({url:expected.url}),read:async()=>({...payload,student:'OTHER'}),save:async()=>saves++};
 const bad=await fillContractInputs([row()],io);assert.equal(saves,0);assert.equal(bad[0].status,'check');
 const abort=new AbortController();await fillContractInputs([row()],{...io,signal:abort.signal,read:async()=>{abort.abort();return payload;}});assert.equal(saves,0);
});
test('known missing CT links are reported per contract and cannot copy values from another row',async()=>{
 let reads=0,saves=0;const result=await fillContractInputs([row()],{loadLink:async()=>null,lookup:async()=>{throw Object.assign(Error('Không có CT trong danh sách'),{code:'index_unresolved'});},read:async()=>{reads++;return payload;},save:async()=>saves++});assert.equal(reads,0);assert.equal(saves,0);assert.equal(result[0].status,'check');
});
test('Hub inputs fill group 01 and recalculate money independently; receipt fields and amounts stay original',()=>{
 const {engine,source}=fixture();const before=engine.calculate({id:'CT::'+expected.ct});assert.equal(before.cells.Q,null);
 engine.setCourseSources([source]);const after=engine.calculate({id:'CT::'+expected.ct});assert.equal(after.cells.H,payload.courseFee);assert.equal(after.cells.I,'3 hrs/week');assert.equal(after.cells.J,'2 months');assert.equal(after.cells.M,7200000);assert.equal(after.cells.Q,7200000);assert.equal(after.cells.AF,'OK');
 for(const key of ['D','E','T','U','V','W'])assert.equal(after.cells[key],before.cells[key]);assert.equal(after.receipts.length,before.receipts.length);assert.deepEqual(after.receipts[0].cells,{H:null,I:null,J:null});
});
test('discount and full giftcode can be read; policy approvals are still independent from the new inputs',()=>{
 const {engine,source}=fixture({pkg:'12 months',gross:38700000,discount:3870000,totalHours:163,offer:'Q4 2026 Promotion Discount - 12 months',giftcode:'QA-UNAPPROVED'});engine.setCourseSources([source]);const r=engine.calculate({id:'CT::'+expected.ct});assert.equal(r.cells.K,'QA-UNAPPROVED');assert.equal(r.cells.L,source.discount);assert.equal(r.cells.N,3870000);assert.equal(r.cells.O,null);assert.equal(r.cells.AF,'CHECK');
});
test('saved decorated Hub discounts populate detail column L as names and preserve manual edits',()=>{
 const name='2026 October - Promotion Discount - 12 months',{engine,source}=fixture({pkg:'12 months',gross:38700000,discount:3870000,totalHours:150});
 // Existing saved sources predate the parser update and need no extra Hub read.
 engine.setCourseSources([{...source,discount:'10.00% ('+name+')'}]);
 const record={id:'CT::'+expected.ct},row=engine.calculate(record);
 assert.equal(row.cells.L,name);assert.equal(row.cells.N,3870000);
 const manual='2026 October - Promotion Referral - 1 month add-on';
 assert.equal(engine.calculate(record,{L:manual}).cells.L,manual);
 const group=engine.groups.get(record.id);group.courseCandidates.push({L:name,ref:{file:'QA-PaymentList.csv',sheet:'CSV',row:2}});
 engine.updateCourseSource({...source,discount:'10.00% ('+name+')'});
 assert.equal(engine.calculate(record).cells.L,name);assert.ok(!group.warnings.some(w=>w.startsWith('L:')));
});
test('Hub from a retired CT or different student cannot populate the receiving CT',()=>{
 const {engine,source}=fixture();for(const bad of [{...source,ct:'QA2610-CT-009999'},{...source,student:'OTHER'}]){engine.setCourseSources([bad]);const r=engine.calculate({id:'CT::'+expected.ct});assert.equal(r.cells.H,null);assert.equal(r.cells.Q,null);assert.equal(r.cells.AF,'CHECK');}
});
test('read-only Hub Price name is distinct from the monetary Course fee shown beside it',()=>{
 const page={url:expected.url,titles:['Contract '+expected.ct],pairs:[{label:'Price name',value:payload.courseFee},{label:'Course fee',value:'7.200.000 VNĐ'},{label:'Package',value:'2 months'},{label:'Hour/week',value:'3 hrs/week'},{label:'Discount',value:'0 VNĐ'}]};
 const result=parseCoursePage(page,expected);assert.equal(result.payload.courseFee,payload.courseFee);assert.equal(result.payload.discount,null);assert.equal(courseLabel('Course fee'),null);assert.equal(courseLabel('Price name : *'),'courseFee');assert.equal(courseLabel('Hour / week'),'hoursPerWeek');
 const onlyMoney=parseCoursePage({...page,pairs:page.pairs.filter(p=>p.label!=='Price name')},expected);assert.equal(onlyMoney.payload.courseFee,null);
});
test('a labeled Contract No verifies read-only detail pages with a generic heading',()=>{
 const page={url:expected.url,titles:['Contract detail'],pairs:[{label:'Contract No.',value:expected.ct},{label:'Student ID',value:expected.student},{label:'Price name',value:payload.courseFee},{label:'Hour/week',value:'3 hrs/week'},{label:'Package',value:'2 months'}]};
 assert.equal(parseCoursePage(page,expected).payload.ct,expected.ct);
 assert.equal(parseCoursePage({...page,pairs:page.pairs.filter(p=>p.label!=='Contract No.')},expected).error,'identity');
 assert.equal(parseCoursePage({...page,titles:['Contract QA2610-CT-009999']},expected).error,'identity');
 assert.equal(parseCoursePage({...page,pairs:page.pairs.map(p=>p.label==='Student ID'?{...p,value:'QA-OTHER'}:p)},expected).error,'student');
});
test('Course info failure reports a bounded reason and field names without copying source content',()=>{
 const conflict=courseFailure('conflict',['courseFee','<input password=secret>']);assert.match(conflict.message,/nhiều giá trị/);assert.deepEqual(conflict.diagnostic.fields,['courseFee']);assert.equal(conflict.code,'course_unavailable');
 assert.match(courseFailure('student').message,/Student ID/);assert.match(courseFailure('identity').message,/Contract code/);assert.match(courseFailure('arbitrary page body').message,/Chưa tìm thấy/);assert.ok(!JSON.stringify(conflict).includes('password'));
});
