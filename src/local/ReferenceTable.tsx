import React from 'react';
import {voucherDetailURL} from '../core/hub-voucher.mjs';

const value=(v:any)=>v===null||v===undefined||v===''?'—':typeof v==='number'?v.toLocaleString('vi-VN'):String(v);
const date=(v:any)=>typeof v==='number'&&Number.isFinite(v)?new Date(Date.UTC(1899,11,30)+v*86400000).toLocaleDateString('vi-VN',{timeZone:'UTC'}):'—';
const statuses:any={PENDING:'Chờ bổ sung / duyệt',APPROVED:'Đã duyệt',CLOSED:'Đã đóng · có duyệt',REJECTED:'Từ chối',INACTIVE:'Không áp dụng'};
export default function ReferenceTable({section,rows,disabled,onVoucherEdit}:any){
 const columns=section==='master'?['Dòng','Group / KOC','Course fee KOC','Giờ/tuần','Gói','Layer','Giá tham chiếu','Nguồn giá','Giá Audit','Giá quan sát Report']
  :section==='prices'?['Dòng','Khóa chính sách','Layer','Giờ/tuần','Gói','Học phí / CALC','Ưu đãi nền / giảm tiền','Kỳ trả góp','Căn cứ / ghi chú']
  :['Dòng','Giftcode No','Học viên / Student ID','Center','Từ ngày','Đến ngày','Trạng thái','Loại giảm','Giá trị / tỷ lệ','Chỉnh sửa'];
 return <div className="reference-scroll"><table key={section} className="reference-table" aria-label={section==='vouchers'?'Danh sách voucher':section==='prices'?'Quy tắc giá':'Bảng giá chung'}>
  <thead><tr>{columns.map(label=><th key={label}>{label}</th>)}</tr></thead>
  <tbody>{rows.map((row:any,index:number)=>{
   const cells=section==='master'?[row.row,`${row.A??''} / ${row.B??''}`,row.C,row.D,row.E,row.F,row.H,row.I,row.J,row.K]
    :section==='prices'?[row.row,row.K??row.A,row.N??row.B,row.O??row.C,row.P??row.D,row.AL??row.E,row.Q??row.F,row.R??row.G,row.W??row.I]
    :[row.row,row.AH,[row.U,row.studentId].filter(Boolean).join(' · '),row.O,date(row.P),date(row.Q),statuses[row.R]??row.R,row.Z,row.Z==='PHẦN TRĂM'?`${Number(row.V??0)*100}%`:row.AA];
   return <tr key={section+':'+(section==='vouchers'?row.AH:index)}>{cells.map((cell:any,i:number)=><td key={i} title={value(cell)}>{section==='vouchers'&&i===1&&voucherDetailURL(row.hubUrl)?<a href={voucherDetailURL(row.hubUrl)!} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{value(cell)}</a>:value(cell)}</td>)}
    {section==='vouchers'&&<td><button className="quiet-button" disabled={disabled} onClick={()=>onVoucherEdit(row.AH)}>Chỉnh sửa voucher</button></td>}
   </tr>;
  })}</tbody>
 </table></div>;
}
