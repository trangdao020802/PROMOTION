import React,{useState} from 'react';
import ReviewApprovalCell from './ReviewApprovalCell.tsx';
import {updateReview} from '../core/reviews.mjs';
import {voucherCode,voucherInput,voucherMissing} from '../core/vouchers.mjs';

export default function DetailApprovals({row,disabled,onEdit,voucher,onVoucherSave}:any){
 const [saving,setSaving]=useState(false),[error,setError]=useState('');
 if(row.kind!=='contract')return null;
 const locked=disabled||saving,installment=String(row.cells.AG??'').toUpperCase()==='APPROVED';
 const code=voucherCode(row.cells.K),value=voucher?voucherInput(voucher):null;
 const sourceApproved=!value&&row.cells.CI==='OK',voucherApproved=sourceApproved||value&&['APPROVED','CLOSED'].includes(value.status);
 const voucherProblem=value?voucherCode(value.studentId)!==voucherCode(row.cells.F)?'Student ID của voucher khác hồ sơ này.':!['PENDING','APPROVED','CLOSED'].includes(value.status)?'Voucher đang bị từ chối hoặc không áp dụng.':voucherMissing(value):sourceApproved?'Đã xác nhận theo hồ sơ Voucher trong nguồn.':'Bổ sung hồ sơ Voucher bên dưới trước khi duyệt.';
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
  <div className="detail-approval-list">
   {(row.reviewItems??[]).map((item:any)=><div className="detail-approval-item" key={item.id}>
    <div><strong>{item.label}</strong><p>{item.description}</p></div>
    <ReviewApprovalCell row={row} id={item.id} disabled={locked} onChange={(approved:boolean)=>onEdit('reviews',updateReview(row,item.id,approved))}/>
   </div>)}
   <div className="detail-approval-item"><div><strong>Trả góp · Duyệt</strong><p>Chỉ duyệt ngoại lệ vượt kỳ trả góp; các lỗi phương thức, chính sách và chênh lệch vẫn được kiểm tra.</p></div>
    <label className={'approval '+(installment?'approved':'')}><input type="checkbox" checked={installment} disabled={locked} aria-label={'Duyệt vượt kỳ – '+row.cells.G} onChange={e=>onEdit('approved',e.target.checked)}/><span>{installment?'Đã duyệt':'Chờ duyệt'}</span></label>
   </div>
   {code?<div className="detail-approval-item"><div><strong>Voucher · {code}</strong><p>{voucherProblem||'Xác nhận học viên, phạm vi, ngày hiệu lực, mức giảm và căn cứ của mã. Các kiểm tra áp dụng cho CT tiếp tục độc lập.'}</p></div>
    <label className={'approval '+(voucherApproved?'approved':'')}><input type="checkbox" checked={!!voucherApproved} disabled={locked||!value||!onVoucherSave||!voucherApproved&&!!voucherProblem} aria-label={'Duyệt voucher '+code+' – '+row.cells.G} onChange={e=>void saveVoucher(e.target.checked)}/><span>{saving?'Đang lưu…':voucherApproved?'Đã duyệt':'Chờ duyệt'}</span></label>
   </div>:null}
  </div>
  {error?<p className="verification-error" role="alert">{error}</p>:null}
 </section>;
}
