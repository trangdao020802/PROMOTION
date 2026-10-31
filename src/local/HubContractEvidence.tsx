import React from 'react';
import {validateHubContract} from '../core/hub-contract.mjs';
const money=(v:any)=>typeof v==='number'?v.toLocaleString('vi-VN')+' ₫':'Chưa có';
export default function HubContractEvidence({facts}:any){
 if(!validateHubContract(facts))return null;
 const payments=facts.payments;
 return <details className="payment-trace-notes hub-contract-evidence">
  <summary>Thông tin CT tổng trên Hub · {facts.ct}</summary>
  <p className="source-note">Lần đọc: {new Date(facts.capturedAt).toLocaleString('vi-VN')}. Thông tin Hub dùng đối chiếu; tiền thu và phân bổ tiếp tục lấy từ Export, PaymentList và Transfer.</p>
  <h4>Discount info · ListDiscount</h4>
  {facts.discounts===null?<p>Chưa đọc đủ danh sách ưu đãi.</p>:facts.discounts.length?<ul>{facts.discounts.map((d:any,i:number)=><li key={i}><strong>{d.label}</strong>{d.type===1&&d.percent!==null?' · '+d.percent+'%':d.type===2&&d.amount!==null?' · '+money(d.amount):d.type===3&&d.months!==null?' · '+d.months+' tháng tặng':''}</li>)}</ul>:<p>Hub xác nhận không có ưu đãi áp dụng.</p>}
  <h4>Lịch thanh toán · GetContractPayment / ListPayment</h4>
  {payments.state!=='read'?<p>Chưa đọc đủ lịch thanh toán; Input đã đọc vẫn được lưu. Bấm lấy tiếp để thử lại.</p>:!payments.rows.length?<p>API lịch thanh toán trả về danh sách rỗng.</p>:<div className="ledger-scroll"><table className="payment-table"><thead><tr><th>Payment code</th><th>Loại / phương thức</th><th>Ngày dự kiến / hoàn tất</th><th>Số tiền kế hoạch</th><th>Còn lại</th><th>Trạng thái</th></tr></thead><tbody>{payments.rows.map((p:any)=><tr key={p.id}><td>{p.code||'Chưa có mã'}</td><td>{p.type}<small>{p.method}</small></td><td>{p.scheduledDate||'Chưa có'}<small>{p.completeDate||'Chưa hoàn tất'}</small></td><td>{money(p.amount)}</td><td>{money(p.remaining)}</td><td>{p.complete===true?'Đã hoàn tất':p.complete===false?'Chưa hoàn tất':'Chưa rõ'}</td></tr>)}</tbody></table></div>}
 </details>;
}
