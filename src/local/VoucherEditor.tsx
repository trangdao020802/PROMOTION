import React,{useCallback,useEffect,useRef,useState} from 'react';
import {voucherInput,VOUCHER_POLICIES} from '../core/vouchers.mjs';
import {HUB_VOUCHERS,voucherRequest,withVoucherProfile,mergeHubVoucher,voucherDetailURL} from '../core/hub-voucher.mjs';
import {readHubVoucher} from './hub-voucher-bridge.mjs';
import {assetPath} from './paths.mjs';

const hubStatus:any={ACTIVE:'Đang áp dụng',CLOSED:'Đã đóng / đã sử dụng',INACTIVE:'Không áp dụng',UNKNOWN:'Chưa rõ'};
export default function VoucherEditor({initial={},profile={},disabled=false,onSave,onCancel,onDirty}:any){
 const base=JSON.stringify(voucherInput(initial));
 const[draft,setDraft]=useState(()=>withVoucherProfile(voucherInput(initial),profile)),[saving,setSaving]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[failure,setFailure]=useState(''),[bridgeNeeded,setBridgeNeeded]=useState(false),[conflict,setConflict]=useState(false);
 const ref=useRef(draft),controller=useRef<AbortController|null>(null),attempted=useRef('');ref.current=draft;
 const dirty=JSON.stringify(draft)!==base,locked=disabled||saving||busy;
 useEffect(()=>{controller.current?.abort();controller.current=null;setBusy(false);setDraft(withVoucherProfile(voucherInput(initial),profile));setFailure('');setMessage('');setConflict(false);attempted.current='';},[initial.code,initial.version,profile.ct,profile.studentId]);
 useEffect(()=>{onDirty?.(dirty||saving||busy);return()=>onDirty?.(false);},[dirty,saving,busy,onDirty]);
 useEffect(()=>{if(!dirty)return;const prevent=(e:any)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',prevent);return()=>window.removeEventListener('beforeunload',prevent);},[dirty]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const lookup=useCallback(async(automatic=false)=>{
  const current=ref.current;if(!voucherRequest({code:current.code})||disabled||saving||controller.current)return;
  controller.current?.abort();const task=new AbortController();controller.current=task;
  setBusy(true);setFailure('');setBridgeNeeded(false);setMessage('Đang kết nối Hub…');
  try{
   const payload=await readHubVoucher(current.code,{signal:task.signal,onProgress:setMessage});
   if(task.signal.aborted)return;
   setDraft(mergeHubVoucher(ref.current,payload,profile));const number=(n:number)=>n.toLocaleString('vi-VN',{maximumSignificantDigits:15});setMessage(payload.type==='percent'?'Đã đọc Discount amount '+number(payload.rate*100)+' % → Tỷ lệ giảm (%) = '+number(payload.rate*100)+'. Bấm Lưu voucher & tính lại.':payload.type==='amount'?'Đã đọc Discount amount '+number(payload.amount)+' đ → Số tiền giảm (VND) = '+number(payload.amount)+'. Bấm Lưu voucher & tính lại.':'Hub chưa có Discount amount đủ rõ; cần bổ sung trước khi duyệt.');
  }catch(e:any){if(e.code!=='cancelled'){setBridgeNeeded(e.code==='bridge');setMessage(automatic&&e.code==='bridge'?'Cập nhật cầu nối Hub 1.6.10 để tự tra Voucher.':e.message);if(e.code!=='bridge')setFailure(e.message);}}
  finally{if(controller.current===task){controller.current=null;setBusy(false);}}
 },[disabled,saving,profile.ct,profile.studentId,profile.studentName,profile.center,profile.centerName]);
 useEffect(()=>{
  if(disabled||!initial.code||draft.hubUrl||draft.status!=='PENDING'||attempted.current===initial.code||!['label','studentId','studentName','center','startDate','endDate','type'].some(k=>!draft[k]))return;
  attempted.current=initial.code;const timer=setTimeout(()=>void lookup(true),300);return()=>clearTimeout(timer);
 },[initial.code,initial.version,disabled,lookup]);
 const change=(key:string,value:any)=>setDraft((old:any)=>key==='code'&&value!==old.code?old.hubUrl?withVoucherProfile(voucherInput({code:value}),profile):{...old,code:value,status:'PENDING',hubUrl:'',hubCheckedAt:'',hubStatus:''}:{...old,[key]:value});
 const save=async()=>{setSaving(true);setFailure('');setConflict(false);try{setDraft(voucherInput(await onSave(draft,initial.version??0)));setMessage('Đã lưu voucher và tính lại.');}catch(e:any){setFailure(e.message||'Chưa lưu được voucher.');setConflict(!!e.conflict);}finally{setSaving(false);}};
 const input=(key:string,label:string,extra:any={})=><label key={key}><span>{label}</span><input {...extra} value={draft[key]??''} disabled={locked||key==='code'&&!!initial.code} onChange={e=>change(key,e.target.value)}/></label>;
 const numberInput=(key:string,label:string,max=1e13)=><label key={key}><span>{label}</span><input type="number" min="0" max={max} step="any" value={draft[key]??''} disabled={locked} onChange={e=>change(key,e.target.value===''?null:Number(e.target.value))}/></label>;
 const source=voucherDetailURL(draft.hubUrl);
 return <section className="voucher-editor" aria-label="Bổ sung voucher">
  <div className="verification-heading"><h3>{initial.version?'Voucher đã nhập':'Bổ sung voucher mới'}</h3><span className="policy-badge partial">{initial.version?'Phiên bản '+initial.version:'Chưa lưu'}</span></div>
  <p className="evidence-caption">Thông tin học viên lấy từ hồ sơ CT đang mở. Mã đầy đủ được tra tại Voucher và List gift code trên Hub; đơn vị % hoặc đ lấy cạnh Discount amount, center lấy từ cột Center code; ngày và căn cứ lấy từ trang chi tiết.</p>
  <div className="voucher-hub-tools">
   <button type="button" className="secondary-button" disabled={locked||!voucherRequest({code:draft.code})} onClick={()=>void lookup(false)}>{busy?'Đang tìm trên Hub…':'Tìm & tự điền từ Hub'}</button>
   {busy&&<button type="button" className="quiet-button" onClick={()=>{controller.current?.abort();setMessage('Đã dừng tra Voucher.');}}>Dừng tìm</button>}
   <a href={source||HUB_VOUCHERS} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{source?'Mở chi tiết Voucher trên Hub':'Mở danh sách Voucher trên Hub'}</a>
   <button type="button" className="quiet-button" disabled={!draft.code} onClick={()=>void navigator.clipboard.writeText(draft.code).then(()=>setMessage('Đã sao chép Giftcode đầy đủ.')).catch(()=>setFailure('Chưa sao chép được mã.'))}>Sao chép mã</button>
  </div>
  {message&&<p className="voucher-hub-message" role="status">{message}</p>}
  {bridgeNeeded&&<details className="voucher-bridge-help"><summary>Cập nhật cầu nối để tự tìm Voucher</summary><p>Tải bản 1.6.10, giải nén và tải lại tiện ích tại chrome://extensions hoặc edge://extensions. Sau đó tải lại Promotion và các tab Hub, đăng nhập Hub rồi bấm Tìm & tự điền từ Hub.</p><a href={assetPath('downloads/promotion-hub-bridge.zip')+'?v=1.6.10'} download>Tải cầu nối Hub 1.6.10</a></details>}
  {source&&<p className="evidence-caption">Nguồn Hub: <a href={source} target="_blank" rel="noopener noreferrer">{draft.code}</a> · {hubStatus[draft.hubStatus]||'Chưa rõ'}{draft.hubCheckedAt?' · đọc lúc '+new Date(draft.hubCheckedAt).toLocaleString('vi-VN'):''}. Dữ liệu tự điền cần được lưu; trạng thái duyệt của hồ sơ kiểm tra riêng.</p>}
  <div className="verification-grid">
   {input('code','Giftcode No *',{maxLength:150,placeholder:'Nhập mã chính xác',onBlur:()=>{if(!initial.code&&voucherRequest({code:ref.current.code}))void lookup(false);},onKeyDown:(e:any)=>{if(e.key==='Enter'){e.preventDefault();void lookup(false);}}})}{input('label','Tên / mô tả voucher',{maxLength:200})}
   {input('studentId','Student ID *',{maxLength:200})}{input('studentName','Tên học viên *',{maxLength:200})}
   {input('center','Center / phạm vi *',{maxLength:2000,placeholder:'Mã từ cột Center code trên Hub, phân cách bằng dấu phẩy'})}
   <label><span>Trạng thái</span><select value={draft.status} disabled={locked} onChange={e=>change('status',e.target.value)}><option value="PENDING">Chờ bổ sung / duyệt</option><option value="APPROVED">Đã duyệt</option><option value="CLOSED">Đã đóng · có duyệt</option><option value="REJECTED">Từ chối</option><option value="INACTIVE">Không áp dụng</option></select></label>
   {input('startDate','Từ ngày *',{type:'date'})}{input('endDate','Đến hết ngày *',{type:'date'})}
   <label><span>Chính sách áp dụng</span><select value={draft.policyId??'case-specific'} disabled={locked} onChange={e=>change('policyId',e.target.value)}>{Object.entries(VOUCHER_POLICIES).map(([id,label])=><option key={id} value={id}>{String(label)}</option>)}</select></label>
   <label><span>Cơ sở tính voucher %</span><select value={draft.percentBasis??'policy-default'} disabled={locked||draft.type==='amount'} onChange={e=>change('percentBasis',e.target.value)}><option value="policy-default">Theo bộ ca đối chiếu · cần xác minh nếu cộng Discount</option><option value="gross">Giá gốc trước Discount · theo căn cứ của mã</option><option value="after-discount">Giá gốc − Discount · theo căn cứ của mã</option></select></label>
   <label><span>Loại giảm *</span><select value={draft.type} disabled={locked} onChange={e=>change('type',e.target.value)}><option value="">Chưa xác định</option><option value="amount">Số tiền (VND)</option><option value="percent">Phần trăm</option></select></label>
   {draft.type==='percent'?<label><span>Tỷ lệ giảm (%) *</span><input type="number" min="0" max="100" step="any" value={draft.rate===null?'':Number((draft.rate*100).toPrecision(15))} disabled={locked} onChange={e=>change('rate',e.target.value===''?null:Number(e.target.value)/100)}/></label>:numberInput('amount','Số tiền giảm (VND) *')}
   {numberInput('minimum','Mức sàn (VND)')}{numberInput('maximum','Mức trần (VND) · 0 = không giới hạn')}
  </div>
  <p className="evidence-caption">Chọn chính sách theo hồ sơ của mã, không theo tiền tố Giftcode. Duyệt voucher xác nhận hồ sơ mã; các kiểm tra sai gói, sai đối tượng, cộng trùng và ngoài hạn vẫn giữ CHECK.</p>
  <label className="verification-note"><span>Căn cứ / phê duyệt và điều kiện áp dụng *</span><textarea rows={3} maxLength={2000} value={draft.approvalNote} disabled={locked} onChange={e=>change('approvalNote',e.target.value)} placeholder="Ghi tài liệu/người duyệt/ngày duyệt và điều kiện của mã này…"/></label>
  {failure&&<div className="verification-error" role="alert"><p>{failure}</p>{conflict&&<button className="secondary-button" onClick={()=>window.location.reload()}>Tải bản voucher mới</button>}</div>}
  <div className="verification-footer"><span>{initial.updatedAt?'Lưu lần cuối '+new Date(initial.updatedAt).toLocaleString('vi-VN'):'Các mục * cần đủ trước khi duyệt.'}</span>{onCancel&&<button type="button" className="quiet-button" disabled={locked} onClick={onCancel}>Đóng chỉnh sửa</button>}<button type="button" className="primary-button" disabled={locked||!dirty&&!!initial.version} onClick={()=>void save()}>{saving?'Đang lưu…':'Lưu voucher & tính lại'}</button></div>
 </section>;
}
