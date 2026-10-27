import React from 'react';

export default function PolicyUpdateGuide({policy}:any){
 return <details className="policy-update-guide">
  <summary>Cập nhật file chính sách giá mới</summary>
  {policy&&<p className="policy-reference"><strong>Bộ ca đối chiếu tháng 9–10: {policy.file}</strong><br/>Ngưỡng lệch tiền: {policy.moneyTolerance.toLocaleString('vi-VN')} ₫ · Giờ học: {policy.hourTolerance} giờ. Các ca đã kiểm chứng dùng voucher % trên giá trước giảm và làm tròn tổng giờ. Audit không liệt kê đủ mọi policy; các file chính sách gốc tiếp tục là nguồn quy tắc.</p>}
  <p>Bảng giá và điều kiện khuyến mãi được phát hành cùng bộ quy tắc của ứng dụng. Tải bộ nguồn giao dịch chỉ cập nhật Export, PaymentList và Transfer.</p>
  <ol>
   <li><strong>Chuẩn bị file đã duyệt.</strong> Giữ file Excel gốc, tên sheet và căn cứ phê duyệt; ghi rõ ngày bắt đầu, ngày kết thúc, trung tâm và đối tượng áp dụng.</li>
   <li><strong>Xác định nội dung thay thế.</strong> Chỉ rõ phần thay đổi về giá, giảm tiền, tháng tặng, kỳ trả góp và điều kiện cộng gộp. Chính sách cũ vẫn cần cho giao dịch thuộc kỳ cũ.</li>
   <li><strong>Cập nhật và đối chiếu.</strong> Chuẩn hóa vào bộ quy tắc, kiểm tra hồ sơ trước và sau ngày hiệu lực rồi phát hành bản cập nhật. Khi mở lại bộ nguồn, web tính theo ngày giao dịch; điều kiện chưa đủ căn cứ tiếp tục CHECK.</li>
  </ol>
  <p className="policy-update-note">Hiện chưa hỗ trợ tự nhập file chính sách bất kỳ trên web. Khi có file mới, gửi file kèm phạm vi và ngày hiệu lực để cập nhật bộ quy tắc; không thay file giao dịch bằng file chính sách.</p>
 </details>;
}
