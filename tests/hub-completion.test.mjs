import test from 'node:test';import assert from 'node:assert/strict';
import {fillContractInputs,contractInputPlan} from '../src/core/hub-course.mjs';
import {completeContractVoucher,rowNeedsVoucher,newCompletionRequest} from '../src/core/hub-completion.mjs';
import {AuditEngine} from '../src/local/calculation.mjs';import {buildModel} from '../src/local/model.mjs';
import {policyData} from '../scripts/policy-data.mjs';import {dateSerial} from '../src/core/verification.mjs';
import {inputKey} from '../src/core/hub-input-progress.mjs';
const expected={ct:'QA2610-CT-000204',student:'QA-COMPLETE',url:'https://hub24.apollo.vn:7777/contract/detail/204'};
test('automatic source/link requests work in an HTTP preview without crypto.randomUUID',()=>{
 const crypto={getRandomValues:bytes=>bytes.fill(31)};const request=newCompletionRequest('dataset',crypto);assert.equal(request.scope,'dataset');assert.match(request.id,/^complete-[a-f0-9]{32}$/);
});
function fixture(identity=expected){
 const expected=identity;
 const c={B:'QA CENTER',C:'QA1',D:'QA2610-PAY-000204',E:expected.ct,R:expected.student,S:'DỮ LIỆU GIẢ',O:dateSerial('2026-10-10'),P:'QA204',I:'Paid',F:'Payment',G:'New',X:'ATLS',Z:'',AA:'',AB:'',AQ:'0',AO:'',AH:'Online Payments',AJ:'',AC:7200000,AD:0,AE:720000,AF:6480000,AG:25},r={sourceKey:'p',sourceRow:2,cells:c};
 const bundle={kind:'source-bundle-v1',scope:{from:'2026-10-01',to:'2026-10-31',center:''},cutoff:dateSerial('2026-10-31'),records:[r],cash:[r],transfers:[],exports:[{sourceKey:'e',sourceRow:2,ct:expected.ct,student:expected.student,target:6480000,paid:6480000,totalHours:25,contractType:'New',center:'QA1'}],sources:['payment','export','transfer'].map((role,fileIndex)=>({key:['p','e','t'][fileIndex],role,fileIndex,fileName:'QA-'+role+'.csv',sheetName:'CSV',headerRow:1,rowCount:1}))};
 const engine=new AuditEngine(buildModel(bundle,policyData())),record={id:'CT::'+expected.ct},vouchers=new Map(),calls=[];
 const row=engine.calculate(record),payload={...expected,courseFee:'NewPrice2026Layer1',hoursPerWeek:'3 hrs/week',package:'2 months',giftcode:'QA-FULL-10',discount:'0'};
 const source={code:'QA-FULL-10',url:'https://hub24.apollo.vn:7777/giftcode/detail/204',label:'QA 10%',center:'QA1',startDate:'2026-10-01',endDate:'2026-10-31',type:'percent',rate:.1,amount:null,minimum:0,maximum:0,status:'ACTIVE',creator:'QA',description:'QA synthetic only',studentId:expected.student,studentName:'DỮ LIỆU GIẢ',checkedAt:'2026-10-29T08:00:00.000Z'};
 const voucherIO={progress:()=>{},loadVoucher:async code=>vouchers.get(code),readVoucher:async()=>{calls.push('voucher-read');return source;},saveVoucher:async v=>{calls.push('voucher-save');vouchers.set(v.code,v);engine.setVouchers([...vouchers.values()]);return v;}};
 let link;
 const io={loadLink:async()=>link,lookup:async ct=>{calls.push('lookup');return {ct,url:expected.url};},saveLink:async value=>{calls.push('link-save');return link=value;},read:async()=>{calls.push('course-read');return payload;},save:async(row,p)=>{calls.push('source-save');engine.updateCourseSource(p);return {row:engine.calculate(record),source:{...p,version:1}};},afterSave:(row,p,saved)=>completeContractVoucher(row,p,saved,voucherIO),checkpoint:async()=>{calls.push('checkpoint');return {complete:true};}};
 return {engine,record,row,payload,source,vouchers,calls,io,voucherIO};
}
test('one link → Course info → Voucher operation fills inputs, computes payable and differences, then checkpoints',async()=>{
 const f=fixture(),before={...f.row.cells};const results=await fillContractInputs([f.row],f.io);
 assert.equal(results[0].status,'saved');assert.equal(results[0].voucher.state,'saved');assert.deepEqual(f.calls,['lookup','link-save','course-read','source-save','voucher-read','voucher-save','checkpoint']);
 const r=f.engine.calculate(f.record);assert.equal(r.cells.K,'QA-FULL-10');assert.equal(r.cells.M,7200000);assert.equal(r.cells.O,720000);assert.equal(r.cells.Q,6480000);assert.equal(r.cells.AB,0);assert.equal(r.cells.AC,0);
 for(const key of ['T','U','V','W','X'])assert.equal(r.cells[key],before[key]);
 assert.equal(f.vouchers.get('QA-FULL-10').status,'PENDING');assert.equal(r.cells.AF,'CHECK');assert.match(r.cells.CI,/CHƯA ĐƯỢC DUYỆT/);
 f.engine.setVouchers([{...f.vouchers.get('QA-FULL-10'),status:'APPROVED'}]);assert.equal(f.engine.calculate(f.record).cells.AF,'OK');
});
test('a voucher timeout leaves the CT unfinished and retry reuses its saved link and source identity',async()=>{
 const f=fixture();f.voucherIO.readVoucher=async()=>{throw Object.assign(Error('QA timeout'),{code:'timeout'});};
 const first=await fillContractInputs([f.row],f.io);assert.equal(first[0].status,'check');assert.ok(!f.calls.includes('checkpoint'));
 const partial=f.engine.calculate(f.record);assert.equal(partial.cells.K,'QA-FULL-10');assert.equal(partial.cells.O,null);
 const plan=contractInputPlan([partial],{needsVoucher:row=>rowNeedsVoucher(row,[])});assert.equal(plan.length,1);
 f.voucherIO.readVoucher=async()=>f.source;const next=await fillContractInputs(plan,f.io);assert.equal(next[0].status,'saved');assert.equal(f.calls.filter(c=>c==='lookup').length,1);
});
function batch(){
 const fixtures=[fixture({...expected,ct:'TM2610-CT-0049604',url:'https://hub24.apollo.vn:7777/contract/detail/9604'}),fixture({...expected,ct:'QA2610-CT-000205',url:'https://hub24.apollo.vn:7777/contract/detail/205'}),fixture({...expected,ct:'QA2610-CT-000206',url:'https://hub24.apollo.vn:7777/contract/detail/206'})];
 const byCT=new Map(fixtures.map(f=>[f.payload.ct,f])),completed=[];
 const io={
  loadLink:ct=>byCT.get(ct).io.loadLink(ct),lookup:ct=>byCT.get(ct).io.lookup(ct),saveLink:link=>byCT.get(link.ct).io.saveLink(link),
  read:request=>byCT.get(request.ct).io.read(request),save:(row,payload)=>byCT.get(payload.ct).io.save(row,payload),
  afterSave:(row,payload,saved)=>byCT.get(payload.ct).io.afterSave(row,payload,saved),
  checkpoint:async(row,payload,saved)=>{const result=await byCT.get(payload.ct).io.checkpoint(row,payload,saved);completed.push(inputKey(payload.ct,payload.student));return result;}
 };
 return {fixtures,io,completed,rows:()=>fixtures.map(f=>({...f.engine.calculate(f.record),ct:f.payload.ct}))};
}
test('a missing Voucher on TM2610-CT-0049604 does not stop later CTs, and retry reads only that unfinished CT',async()=>{
 for(const code of ['timeout','hub_timeout','voucher_timeout','voucher_centers','voucher_unit','voucher_code_unconfirmed','voucher_unsupported']){
  const b=batch(),first=b.fixtures[0];first.voucherIO.readVoucher=async()=>{throw Object.assign(Error('Hub chưa trả đủ thông tin Voucher; các ô đang nhập được giữ lại.'),{code});};
  const updates=[];const results=await fillContractInputs(b.rows(),{...b.io,update:r=>updates.push(r.length)});
  assert.deepEqual(results.map(r=>r.status),['check','saved','saved'],code);assert.equal(results[0].voucher.state,'unavailable');assert.match(results[0].message,/tiếp tục CT khác/);
  assert.deepEqual(updates,[1,2,3]);assert.equal(b.completed.length,2);assert.ok(!first.calls.includes('checkpoint'));
  assert.equal(first.engine.calculate(first.record).cells.K,'QA-FULL-10');assert.equal(first.engine.calculate(first.record).cells.O,null);
  const pending=contractInputPlan(b.rows(),{refresh:true,completed:b.completed,needsVoucher:r=>rowNeedsVoucher(r,[])});assert.deepEqual(pending.map(r=>r.ct),['TM2610-CT-0049604']);
  first.voucherIO.readVoucher=async()=>first.source;const retry=await fillContractInputs(pending,b.io);assert.equal(retry[0].status,'saved');assert.equal(b.completed.length,3);assert.equal(first.calls.filter(c=>c==='lookup').length,1);
 }
});
test('incomplete Voucher metadata is saved as a draft, kept pending and does not stop other CTs',async()=>{
 const b=batch(),first=b.fixtures[0];first.voucherIO.readVoucher=async()=>({...first.source,endDate:''});
 const results=await fillContractInputs(b.rows(),b.io);assert.deepEqual(results.map(r=>r.status),['check','saved','saved']);
 const draft=first.vouchers.get('QA-FULL-10');assert.equal(draft.endDate,'');assert.equal(draft.status,'PENDING');assert.equal(draft.hubUrl,first.source.url);assert.ok(rowNeedsVoucher(first.engine.calculate(first.record),[draft]));assert.ok(!first.calls.includes('checkpoint'));
 first.voucherIO.readVoucher=async()=>first.source;const retry=await fillContractInputs(contractInputPlan(b.rows(),{refresh:true,completed:b.completed}),b.io);assert.equal(retry.length,1);assert.equal(retry[0].status,'saved');assert.equal(first.vouchers.get('QA-FULL-10').endDate,'2026-10-31');
});
test('a wrong-student Voucher is skipped without changing its saved manual values or blocking other CTs',async()=>{
 const b=batch(),first=b.fixtures[0],manual={code:'QA-FULL-10',studentId:expected.student,studentName:'DỮ LIỆU GIẢ',center:'QA1',rate:.2,type:'percent',status:'PENDING'};first.vouchers.set(manual.code,manual);
 first.voucherIO.readVoucher=async()=>({...first.source,studentId:'QA-OTHER'});
 const results=await fillContractInputs(b.rows(),b.io);assert.deepEqual(results.map(r=>r.status),['check','saved','saved']);assert.match(results[0].message,/Student ID/);assert.deepEqual(first.vouchers.get(manual.code),manual);assert.ok(!first.calls.includes('checkpoint'));
});
test('connection, login, save and cancellation failures still stop the batch instead of being treated as a missing Voucher',async()=>{
 for(const code of ['bridge','hub_login','hub_tab_missing','cancelled']){
  const b=batch();b.fixtures[0].voucherIO.readVoucher=async()=>{throw Object.assign(Error('Global failure'),{code});};
  const result=await fillContractInputs(b.rows(),b.io);assert.equal(result.length,1,code);assert.ok(!b.fixtures[1].calls.includes('course-read'));assert.equal(b.completed.length,0);
 }
 const b=batch();b.fixtures[0].voucherIO.saveVoucher=async()=>{throw Object.assign(Error('Tab khác vừa sửa Voucher.'),{conflict:true});};
 assert.equal((await fillContractInputs(b.rows(),b.io)).length,1);assert.equal(b.completed.length,0);
 const course=batch();course.fixtures[0].io.read=async()=>{throw Object.assign(Error('Course timeout'),{code:'timeout'});};assert.equal((await fillContractInputs(course.rows(),course.io)).length,3);
 const stopped=batch(),controller=new AbortController();stopped.fixtures[0].voucherIO.readVoucher=async()=>{controller.abort();throw Object.assign(Error('Đã dừng.'),{code:'timeout'});};assert.equal((await fillContractInputs(stopped.rows(),{...stopped.io,signal:controller.signal})).length,0);assert.equal(stopped.completed.length,0);
});
test('manual voucher values are preserved and a different Hub value requires review',async()=>{
 const f=fixture(),prior={...f.source,hubUrl:f.source.url,hubCheckedAt:'',studentId:expected.student,studentName:'DỮ LIỆU GIẢ',rate:.2,status:'PENDING',approvalNote:'QA manual'};
 f.vouchers.set(prior.code,prior);delete prior.hubUrl;
 const result=await completeContractVoucher(f.row,f.payload,{row:{...f.row,cells:{...f.row.cells,K:prior.code}}},f.voucherIO);
 assert.equal(result.state,'review');assert.equal(f.vouchers.get(prior.code).rate,.2);assert.equal(f.vouchers.get(prior.code).status,'PENDING');
});
test('another student cannot receive the looked-up Voucher, and a cash Giftcode amount never supplies its code',async()=>{
 const f=fixture();f.voucherIO.readVoucher=async()=>({...f.source,studentId:'QA-OTHER'});
 await assert.rejects(completeContractVoucher(f.row,f.payload,{row:{...f.row,cells:{...f.row.cells,K:f.source.code}}},f.voucherIO),/Student ID/);assert.equal(f.vouchers.size,0);
 await assert.rejects(completeContractVoucher(f.row,{...f.payload,giftcode:'0'},{row:{...f.row,cells:{...f.row.cells,K:'0'}}},f.voucherIO),/chưa xác định/);
});
