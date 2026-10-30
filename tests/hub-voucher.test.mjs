import {backgroundRuntime} from './helpers/existing-hub-runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {voucherRequest,voucherDetailURL,voucherCodesURL,parseVoucherDetail,voucherPayload,withVoucherProfile,mergeHubVoucher,voucherRecordProfile,profileForVoucherCode,hubDiscountUnit,hubPercentNumber,readHubDiscountUnit} from '../src/core/hub-voucher.mjs';
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
test('the displayed Discount amount unit determines percent or VND, without a numeric default',()=>{
 const discount=(value,unit)=>{const p=page();p.pairs=p.pairs.map(pair=>/^Discount amount/.test(pair.label)?{...pair,value,unit}:pair);return parseVoucherDetail(p,{code});};
 for(const unit of ['đ','Đ','₫','VNĐ','VND','(đ)']){const p=discount('2.000.000',unit).payload;assert.equal(p.type,'amount',unit);assert.equal(p.amount,2000000,unit);assert.equal(p.rate,null);}
 for(const unit of ['%','percent','Phần trăm']){const p=discount('15',unit).payload;assert.equal(p.type,'percent',unit);assert.equal(p.rate,.15);assert.equal(p.amount,null);}
 assert.equal(discount('15','đ').payload.amount,15);
 assert.equal(discount('2.000.000','%').error,'amount');
 assert.equal(discount('2.000.000','').error,'unit');
 assert.equal(discount('15','% đ').error,'unit');
 const p=page();p.list.conditions='Minimum: 0 đ Discount amount: 2.000.000 đ Maximum: 0 đ';assert.equal(parseVoucherDetail(p,{code}).payload.rate,.15);
});
test('the trailing displayed unit owns the type and the preceding number fills its matching field',()=>{
 for(const [value,unit,type,rate,amount]of [['12,5','%','percent',.125,null],['0.15','%','percent',.0015,null],['15.000','%','percent',.15,null],['12,5 %','','percent',.125,null],['2.000.000 Đ','','amount',null,2000000],['2.000.000','Đ','amount',null,2000000],['15','Đ','amount',null,15]]){
  const p=page();p.pairs=p.pairs.map(pair=>/^Discount amount/.test(pair.label)?{...pair,value,unit}:pair);p.pairs.push({label:'Discount type',value:type==='percent'?'Fixed amount':'Percentage'});
  const payload=parseVoucherDetail(p,{code}).payload;assert.ok(payload,value+' '+unit);assert.equal(payload.type,type);assert.equal(payload.rate,rate);assert.equal(payload.amount,amount);
  const filled=mergeHubVoucher({...EMPTY_VOUCHER,code,type:type==='percent'?'amount':'percent',amount:500000,rate:.5},payload,profile);assert.equal(filled.type,type);assert.equal(filled.amount,amount);assert.equal(filled.rate,rate);
 }
 assert.equal(hubDiscountUnit('Discount amount'),'');assert.equal(hubDiscountUnit('Maximum 0 đ'),'');assert.equal(hubDiscountUnit('(Đ)'),'VND');assert.equal(hubDiscountUnit('%'),'%');assert.equal(hubPercentNumber('1,2,3'),null);
});
test('a missing current discount cannot leave the previous Hub value displayed as the new value',()=>{
 const p=page();p.pairs=p.pairs.filter(pair=>!/^Discount amount/.test(pair.label));const payload=parseVoucherDetail(p,{code}).payload;
 const filled=mergeHubVoucher({...EMPTY_VOUCHER,code,type:'percent',rate:.5,amount:null,status:'APPROVED'},payload,profile);assert.equal(filled.type,'');assert.equal(filled.rate,null);assert.equal(filled.amount,null);assert.equal(filled.status,'PENDING');
});
test('Center code overrides broad region and prefilled CT scope, using only the matched full code row',()=>{
 const p=page();p.pairs.push({label:'Center code',value:'HN15.VP, HN22.NVO'});
 let source=parseVoucherDetail(p,{code}).payload;assert.equal(source.center,'HN15.VP, HN22.NVO');
 const merged=mergeHubVoucher({...EMPTY_VOUCHER,code},source,profile);assert.equal(merged.center,source.center);assert.equal(merged.studentId,profile.studentId);
 p.giftcodes=[{code:'UNRELATED-CODE',centerCode:'HN99.OTHER'},{code,centerCode:'HN15.VP'}];source=parseVoucherDetail(p,{code}).payload;assert.equal(source.center,'HN15.VP');
 const longCenters=Array.from({length:60},(_,i)=>'QA'+(i+1)+'.TEST').join(', ');p.giftcodes=[{code}];p.pairs=p.pairs.filter(p=>p.label!=='Center code');p.pairs.push({label:'Center code',value:longCenters});
 const saved=voucherInput(mergeHubVoucher({...EMPTY_VOUCHER,code},parseVoucherDetail(p,{code}).payload,profile));assert.ok(saved.center.length>200);assert.equal(saved.center,longCenters);assert.equal(validateVoucher(saved),null);
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
function bridgeWindow({capabilities=['voucher'],wrong=false,version='1.6.10'}={}){
 const listeners=new Set(),target={location:{origin:'https://promotion-hub-2026.roundskunk11.chatgpt.site'},addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn),postMessage:m=>{
  if(m.direction!=='request'||m.action==='cancel')return;
  const reply={channel:m.channel,direction:'response',id:m.id,...m.action==='ping'?{type:'ready',version,capabilities}:{type:'voucher-result',payload:wrong?{...payload(),code:'OTHER'}:payload()}};
  queueMicrotask(()=>{for(const fn of listeners)fn({source:target,origin:target.location.origin,data:reply});});
 }};return target;
}
test('the Site bridge requires Voucher capability and validates returned identity',async()=>{
 assert.equal((await readHubVoucher(code,{window:bridgeWindow(),timeoutMs:100})).rate,.15);
 await assert.rejects(readHubVoucher(code,{window:bridgeWindow({capabilities:[]}),timeoutMs:100}),/1.6.10/);
 await assert.rejects(readHubVoucher(code,{window:bridgeWindow({version:'1.6.0'}),timeoutMs:100}),/1.6.10/);
 await assert.rejects(readHubVoucher(code,{window:bridgeWindow({version:'1.6.1'}),timeoutMs:100}),/1.6.10/);
 await assert.rejects(readHubVoucher(code,{window:bridgeWindow({version:'1.6.2'}),timeoutMs:100}),/1.6.10/);
 await assert.rejects(readHubVoucher(code,{window:bridgeWindow({wrong:true}),timeoutMs:100}),/không khớp/);
 const controller=new AbortController();controller.abort();await assert.rejects(readHubVoucher(code,{window:bridgeWindow(),signal:controller.signal,timeoutMs:100}),/Đã dừng/);
});
test('the extension binds silent Voucher replies to its one managed frame, full code and observed detail URL',async()=>{
 const r=backgroundRuntime(),manage='https://hub24.apollo.vn:7777/giftcode/manage',binding={frameJob:'qa-job',frameKey:'qa-agent'};
 const send=(m,path=manage,tab=20,extra={})=>r.send({...binding,id:'qa-job',...m},tab,path,{frameId:4,documentId:'qa-frame',...extra});
 await r.send({type:'voucher-start',id:'qa-job',voucher:{code}});assert.equal(r.store.job.kind,'voucher');
 await send({type:'context'});await send({type:'voucher-search-applied',code});
 await send({type:'voucher-detail',row:{url,label:'QA 15%',center:'North, South'}});assert.equal(r.store.job.detailUrl,url);
 await send({type:'context'},url);
 const wrong=await send({type:'voucher-codes',url:'https://hub24.apollo.vn:7777/giftcode/listgiftcode/999',pairs:page().pairs},url);assert.ok(wrong.error);assert.equal(r.store.job.stage,'voucher-detail');
 const codesUrl='https://hub24.apollo.vn:7777/giftcode/listgiftcode/12345';await send({type:'voucher-codes',url:codesUrl,pairs:page().pairs},url);assert.equal(r.store.job.stage,'voucher-codes');await send({type:'context'},codesUrl);
 await send({type:'voucher-complete',payload:payload()},codesUrl,21);assert.ok(r.store.job);
 await send({type:'voucher-complete',payload:payload()},codesUrl,20,{frameId:5});assert.ok(r.store.job);
 await send({type:'voucher-complete',payload:payload(),frameKey:'wrong'},codesUrl);assert.ok(r.store.job);
 const mismatch=await send({type:'voucher-complete',payload:{...payload(),code:'OTHER'}},codesUrl);assert.ok(mismatch.error);assert.ok(r.store.job);
 await send({type:'voucher-complete',payload:payload()},codesUrl);assert.equal(r.store.job,undefined);assert.ok(r.messages.some(m=>m.type==='voucher-result'));assert.deepEqual(r.mutations,[]);
});
