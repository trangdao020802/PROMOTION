import React from 'react';
export default function PolicyCoverage({data}:any){
 const c=data.policyCoverage;if(!c)return null;
 const prices=data.priceCatalogue??[],ready=prices.filter((r:any)=>r.status==='ready').length,missing=prices.filter((r:any)=>r.status!=='ready').length;
 return <div className="policy-coverage-panel">
  <div className="policy-coverage-heading"><strong>Bảng giá và bộ tính dùng cùng một quy tắc</strong><span>Giá tháng × số tháng = giá gốc · Giá gốc − giảm tiền = tiền sau giảm</span></div>
  <div className="policy-coverage-stats"><span><b>{c.sources}</b> file chính sách / tham chiếu đã rà</span><span><b>{c.checkedRows}</b> lộ trình đối chiếu ô nguồn</span><span><b>{ready}</b> dòng giá theo kỳ</span><span><b>{missing}</b> mục cần chính sách / điều kiện riêng</span></div>
  <p>Chọn kỳ, khóa/phiên bản, Layer, giờ và gói trước khi áp dụng. Tháng tặng, voucher và tiền thu được kiểm tra riêng. Giá quan sát từ Report không thay giá chính sách.</p>
  <details><summary>Thứ tự căn cứ và cách xử lý thiếu rule</summary><ol>{c.sourceOrder.map((s:string)=><li key={s}>{s}</li>)}</ol><p>Không khớp hoặc xung đột nguồn → CHECK. Duyệt trả góp không bỏ lỗi chính sách. Các dòng “có giá và công thức” vẫn phải kiểm tra điều kiện của từng hồ sơ.</p></details>
  {c.decisions?.length>0&&<details><summary>Đối chiếu các file chính sách mới · {c.typedRows} dòng bổ sung</summary><ul>{c.decisions.map((d:any,i:number)=><li key={i}>{d.note}</li>)}</ul><p>Khóa giá lấy chương trình, năm, layer, giờ/tuần và loại gói; tên Course Fee khác cách viết vẫn ghép được. Phiên bản khác năm và gói khác bản chất giữ riêng.</p></details>}
 </div>;
}
