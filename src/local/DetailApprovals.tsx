import React,{useState} from 'react';
import ReviewApprovalCell from './ReviewApprovalCell.tsx';
import {updateReview,reviewMessages} from '../core/reviews.mjs';
import {voucherCode,voucherInput,voucherMissing} from '../core/vouchers.mjs';
import {withVoucherProfile,voucherRecordProfile} from '../core/hub-voucher.mjs';

export default function DetailApprovals({row,disabled,onEdit,voucher,onVoucherSave}:any){
 const [saving,setSaving]=useState(false),[error,setError]=useState('');
 if(row.kind!=='contract')return null;
 const locked=disabled||saving,installment=String(row.cells.AG??'').toUpperCase()==='APPROVED';
 const code=voucherCode(row.cells.K),value=voucher?voucherInput(withVoucherProfile(voucher,voucherRecordProfile(row))):null;
 const sourceApproved=!value&&row.cells.CI==='OK',voucherApproved=sourceApproved||value&&['APPROVED','CLOSED'].includes(value.status);
 const voucherProblem=value?!['PENDING','APPROVED','CLOSED'].includes(value.status)?'Voucher đang bị từ chối hoặc không áp dụng.':voucherMissing(value):sourceApproved?'Đã xác nhận theo hồ sơ Voucher trong nguồn.':'Bổ sung mức giảm, phạm vi và hiệu lực của mã bên dưới trước khi duyệt.';
 const items=[...new Map((row.reviewItems??[]).map((item:any)=>[item.id,item])).values()] as any[];
 const saveVoucher=async(approved:boolean)=>{
  if(locked||!value||!onVoucherSave||approved&&voucherProblem)return;
  setSaving(true);setError('');
  try{await onVoucherSave({...value,status:approved?'APPROVED':'PENDING'},voucher.version??0);}
  catch(e:any){setError(e.message||'Chưa lưu được duyệt voucher.');}
  finally{setSaving(false);}
 };
 return <section className="detail-approvals" aria-label="Duyệt và xác nhận hồ sơ">
  <h3>Duyệt & xác nhận</h3>
  <p className="evidence-caption">Tích từng mục sau khi đã đối chiếu căn cứ. Thay đổi tự lưu và tính lại, đồng bộ với bảng đối chiếu. Duyệt điều kiện không bỏ qua chênh lệch tiền.</p>
  <p className="approval-case">Hồ sơ được xác nhận: <strong>{row.cells.G}</strong> · Student ID <strong>{row.cells.F}</strong> · CT <strong>{row.ct||row.cells.contractTotal||row.cells.C}</strong>.</p>
  {row.cells.L&&row.cells.L!=='0'?<details className="approval-programs"><summary>Ưu đãi đang đối chiếu</summary><ul>{String(row.cells.L).split(';').filter(Boolean).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul></details>:null}
  <div className="detail-approval-list">
   {items.map((item:any)=><div className="detail-approval-item" key={item.id}>
    <div><strong>{item.label}</strong><ul>{(item.details??reviewMessages(item.messages??[item.description])).map((message:string,i:number)=><li key={i}>{message}</li>)}</ul></div>
    <ReviewApprovalCell row={row} id={item.id} disabled={locked} onChange={(approved:boolean)=>onEdit('reviews',updateReview(row,item.id,approved))}/>
   </div>)}
   {installment||row.cells.AE==='CHECK - VƯỢT KỲ'?<div className="detail-approval-item"><div><strong>Ngoại lệ vượt kỳ trả góp</strong><p>Xác nhận cho phép kỳ {row.context?.term||row.cells.Y||'đang áp dụng'} vượt giới hạn {row.cells.S??'của chính sách'}. Các lỗi phương thức, chính sách và chênh lệch vẫn được kiểm tra.</p></div>
    <label className={'approval '+(installment?'approved':'')}><input type="checkbox" checked={installment} disabled={locked} aria-label={'Duyệt vượt kỳ – '+row.cells.G} onChange={e=>onEdit('approved',e.target.checked)}/><span>{installment?'Đã duyệt':'Chờ duyệt'}</span></label>
   </div>:null}
   {code?<div className="detail-approval-item"><div><strong>Voucher · {code}</strong><p>Áp dụng cho {row.cells.G} · {row.cells.F} theo Giftcode No của CT này. {voucherProblem||'Xác nhận mức giảm, phạm vi, ngày hiệu lực và căn cứ của mã.'}</p></div>
    <label className={'approval '+(voucherApproved?'approved':'')}><input type="checkbox" checked={!!voucherApproved} disabled={locked||!value||!onVoucherSave||!voucherApproved&&!!voucherProblem} aria-label={'Duyệt voucher '+code+' – '+row.cells.G} onChange={e=>void saveVoucher(e.target.checked)}/><span>{saving?'Đang lưu…':voucherApproved?'Đã duyệt':'Chờ duyệt'}</span></label>
   </div>:null}
  </div>
  {error?<p className="verification-error" role="alert">{error}</p>:null}
 </section>;
}
