import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {voucherRequest,voucherDetailURL,voucherCodesURL,parseVoucherDetail,voucherPayload,withVoucherProfile,mergeHubVoucher,voucherRecordProfile,profileForVoucherCode} from '../src/core/hub-voucher.mjs';
import {EMPTY_VOUCHER,voucherInput,validateVoucher} from '../src/core/vouchers.mjs';
import {readHubVoucher} from '../src/local/hub-voucher-bridge.mjs';
const code='QA-PRIVILEGE15-SEP-FULLCODE',url='https://hub24.apollo.vn:7777/giftcode/detail/12345';
const profile={ct:'QA2610-CT-001234',studentId:'QA-STUDENT-15',studentName:'HỌC VIÊN KIỂM THỬ',center:'HN24.TC',centerName:'Times City'};
const page=(extra={})=>({url,pairs:[{label:'Voucher name *',value:'Ưu đãi kiểm thử 15%'},{label:'Code prefix *',value:'QA-PRIVILEGE15-SEP'},{label:'Minimum',value:'0'},{label:'Discount amount *',value:'15',unit:'%'},{label:'Maximum',value:'0'},{label:'Start date *',value:'05/09/2026 00:00'},{label:'End date *',value:'31/12/2026 23:59'},{label:'Region',value:'Choose region'},{label:'Center',value:'Choose center'},{label:'Status',value:'Active'}],giftcodes:[{code,status:'Used'}],list:{center:'North, South',creator:'QA APPROVER'},checkedAt:'2026-10-27T05:20:00.000Z',...extra});
const payload=()=>parseVoucherDetail(page(),{code}).payload;
test('Voucher detail reads explicit rate, dates, scope and the exact full Giftcode',()=>{
 const p=payload();assert.equal(p.rate,.15);assert.equal(p.type,'percent');assert.equal(p.minimum,0);assert.equal(p.maximum,0);assert.equal(p.startDate,'2026-09-05');assert.equal(p.endDate,'2026-12-31');assert.equal(p.center,'North, South');assert.equal(p.status,'CLOSED');assert.equal(p.studentName,'');
 assert.equal(parseVoucherDetail(page({giftcodes:[]}),{code}).error,'code_unconfirmed');
 assert.equal(parseVoucherDetail(page({giftcodes:[{code:'QA-PRIVILEGE15-SEP'}]}),{code}).error,'code_unconfirmed');
 assert.equal(parseVoucherDetail(page({giftcodes:[{code:'DIFFERENT'}]}),{code}).error,'code_unconfirmed');
});
test('Giftcode prefix and voucher label never supply a missing numeric discount',()=>{
 const p=page();p.pairs=p.pairs.filter(pair=>!/^Discount amount/.test(pair.label));const r=parseVoucherDetail(p,{code});assert.equal(r.payload.type,'');assert.equal(r.payload.rate,null);assert.equal(r.payload.amount,null);
 const fixed=page();fixed.pairs=fixed.pairs.map(p=>/^Discount amount/.test(p.label)?{...p,value:'1.500.000',unit:'₫'}:p);const f=parseVoucherDetail(fixed,{code}).payload;assert.equal(f.type,'amount');assert.equal(f.amount,1500000);assert.equal(f.rate,null);
});
test('profile identity fills blank voucher fields without inventing a Hub assignment',()=>{
 const filled=withVoucherProfile({...EMPTY_VOUCHER,code},profile);assert.equal(filled.studentId,profile.studentId);assert.equal(filled.studentName,profile.studentName);assert.equal(filled.center,profile.center);
 const wrong=withVoucherProfile({...EMPTY_VOUCHER,code,studentId:'SOMEONE-ELSE'},profile);assert.equal(wrong.studentName,'');assert.equal(wrong.center,'');
 const p=voucherRecordProfile({cells:{F:profile.studentId,G:profile.studentName,B:profile.center,A:profile.centerName,contractTotal:profile.ct}});assert.deepEqual(p,profile);
 const rows=[{cells:{F:profile.studentId,G:profile.studentName,B:profile.center,A:profile.centerName,contractTotal:profile.ct,K:code}}];assert.deepEqual(profileForVoucherCode(rows,code),profile);assert.deepEqual(profileForVoucherCode([...rows,...rows],code),{});
});
test('Hub autofill preserves source link, stays pending until approval and survives voucher serialization',()=>{
 const merged=mergeHubVoucher({...EMPTY_VOUCHER,code},payload(),profile);assert.equal(merged.studentId,profile.studentId);assert.equal(merged.status,'PENDING');assert.equal(merged.rate,.15);assert.equal(merged.hubUrl,url);assert.ok(merged.approvalNote.includes(code));assert.ok(merged.approvalNote.includes('QA APPROVER'));
 const saved=voucherInput({...merged,status:'APPROVED'});assert.equal(validateVoucher(saved),null);assert.equal(saved.hubUrl,url);assert.equal(saved.hubCheckedAt,'2026-10-27T05:20:00.000Z');
 const unchanged=mergeHubVoucher(saved,payload(),profile);assert.equal(unchanged.status,'APPROVED');
 const changed=mergeHubVoucher(saved,{...payload(),rate:.2},profile);assert.equal(changed.status,'PENDING');
 const inactive=mergeHubVoucher(saved,{...payload(),status:'INACTIVE'},profile);assert.equal(inactive.status,'INACTIVE');
});
test('autofill refuses an assigned student or stale Giftcode belonging to another case',()=>{
 assert.throws(()=>mergeHubVoucher({...EMPTY_VOUCHER,code},{...payload(),studentId:'QA-OTHER'},profile),/Student ID/);
 assert.throws(()=>mergeHubVoucher({...EMPTY_VOUCHER,code},{...payload(),studentName:'HỌC VIÊN KHÁC'},profile),/Tên học viên/);
 assert.throws(()=>mergeHubVoucher({...EMPTY_VOUCHER,code,studentId:'QA-OTHER'},payload(),profile),/học viên khác/);
 assert.throws(()=>mergeHubVoucher({...EMPTY_VOUCHER,code:'OTHER'},payload(),profile),/Giftcode/);
 assert.throws(()=>mergeHubVoucher({...EMPTY_VOUCHER,code},{...payload(),url:'https://example.com/giftcode/detail/12345'},profile),/Giftcode/);
});
test('Voucher provenance allows only observed read/detail routes on the exact Hub origin',()=>{
 assert.ok(voucherRequest({code}));assert.equal(voucherRequest({code:'0'}),null);
 for(const path of ['/giftcode/detail/123','/giftcode/view/123','/giftcode/edit/123','/giftcode/update/123','/giftcode/detail?id=123'])assert.ok(voucherDetailURL(path));
 for(const path of ['/giftcode/create','/giftcode/delete/123','https://example.com/giftcode/detail/123','https://hub24.apollo.vn:10000/giftcode/detail/123','/giftcode/detail/123?token=secret'])assert.equal(voucherDetailURL(path),null);
 assert.ok(voucherCodesURL('/giftcode/listgiftcode/12345',url));assert.ok(voucherCodesURL('/giftcode/codes?giftcodeId=12345',url));assert.equal(voucherCodesURL('/giftcode/listgiftcode/99999',url),null);assert.equal(voucherCodesURL('https://example.com/giftcode/listgiftcode/12345',url),null);
 assert.equal(voucherPayload({...payload(),code:'OTHER'},{code}),null);assert.equal(voucherPayload({...payload(),rate:5},{code}),null);
});
function bridgeWindow({capabilities=['voucher'],wrong=false}={}){
 const listeners=new Set(),target={location:{origin:'https://promotion-hub-2026.roundskunk11.chatgpt.site'},addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn),postMessage:m=>{
  if(m.direction!=='request'||m.action==='cancel')return;
  const reply={channel:m.channel,direction:'response',id:m.id,...m.action==='ping'?{type:'ready',version:'1.6.0',capabilities}:{type:'voucher-result',payload:wrong?{...payload(),code:'OTHER'}:payload()}};
  queueMicrotask(()=>{for(const fn of listeners)fn({source:target,origin:target.location.origin,data:reply});});
 }};return target;
}
test('the Site bridge requires Voucher capability and validates returned identity',async()=>{
 assert.equal((await readHubVoucher(code,{window:bridgeWindow(),timeoutMs:100})).rate,.15);
 await assert.rejects(readHubVoucher(code,{window:bridgeWindow({capabilities:[]}),timeoutMs:100}),/1.6.0/);
 await assert.rejects(readHubVoucher(code,{window:bridgeWindow({wrong:true}),timeoutMs:100}),/không khớp/);
 const controller=new AbortController();controller.abort();await assert.rejects(readHubVoucher(code,{window:bridgeWindow(),signal:controller.signal,timeoutMs:100}),/Đã dừng/);
});
test('the extension binds Voucher replies to the initiating tab, full code and observed detail URL',async()=>{
 const messages=[],closed=[],store={},listeners=[];
 const chrome={storage:{session:{get:async key=>({[key]:store[key]}),set:async value=>Object.assign(store,value),remove:async key=>delete store[key]}},tabs:{create:async()=>({id:20}),update:async()=>{},remove:async id=>closed.push(id),sendMessage:async(id,m)=>messages.push({id,...m}),onRemoved:{addListener:()=>{}},onUpdated:{addListener:()=>{}}},runtime:{onMessage:{addListener:f=>listeners.push(f)}}};
 const context=vm.createContext({chrome,URL,console,Date,Promise,setTimeout,clearTimeout});context.importScripts=(...names)=>{for(const name of names){const path=new URL('../reference/hub/'+name,import.meta.url);vm.runInContext(fs.readFileSync(path,'utf8').replaceAll('https://promotion-installment.trangdao2802.chatgpt.site','https://promotion-hub-2026.roundskunk11.chatgpt.site'),context);}};
 vm.runInContext(fs.readFileSync(new URL('../reference/hub/background.js',import.meta.url),'utf8'),context);
 const send=(m,tab=10,location='https://promotion-hub-2026.roundskunk11.chatgpt.site/')=>new Promise(resolve=>listeners[0](m,{frameId:0,tab:{id:tab},documentId:'doc',url:location},resolve));
 await send({type:'voucher-start',id:'qa-job',voucher:{code}});assert.equal(store.job.kind,'voucher');assert.equal(store.job.voucher.code,code);
 await send({type:'voucher-search-applied',id:'qa-job',code},20,'https://hub24.apollo.vn:7777/giftcode/manage');
 await send({type:'voucher-detail',id:'qa-job',row:{url,label:'QA 15%',center:'North, South'}},20,'https://hub24.apollo.vn:7777/giftcode/manage');assert.equal(store.job.detailUrl,url);
 const wrong=await send({type:'voucher-codes',id:'qa-job',url:'https://hub24.apollo.vn:7777/giftcode/listgiftcode/999',pairs:page().pairs},20,url);assert.ok(wrong.error);assert.equal(store.job.stage,'voucher-detail');
 const codesUrl='https://hub24.apollo.vn:7777/giftcode/listgiftcode/12345';await send({type:'voucher-codes',id:'qa-job',url:codesUrl,pairs:page().pairs},20,url);assert.equal(store.job.stage,'voucher-codes');
 await send({type:'voucher-complete',id:'qa-job',payload:payload()},21,codesUrl);assert.ok(store.job);assert.equal(messages.some(m=>m.type==='voucher-result'),false);
 const mismatch=await send({type:'voucher-complete',id:'qa-job',payload:{...payload(),code:'OTHER'}},20,codesUrl);assert.ok(mismatch.error);assert.ok(store.job);
 await send({type:'voucher-complete',id:'qa-job',payload:payload()},20,codesUrl);assert.equal(store.job,undefined);assert.equal(messages.at(-1).type,'voucher-result');assert.deepEqual(closed,[20]);
});
