import React from 'react';

export default function PolicyUpdateGuide(){
 return <details className="policy-update-guide">
  <summary>Cập nhật file chính sách giá mới</summary>
  <p>Bảng giá và điều kiện khuyến mãi được phát hành cùng bộ quy tắc của ứng dụng. Tải bộ nguồn giao dịch chỉ cập nhật Export, PaymentList và Transfer.</p>
  <ol>
   <li><strong>Chuẩn bị file đã duyệt.</strong> Giữ file Excel gốc, tên sheet và căn cứ phê duyệt; ghi rõ ngày bắt đầu, ngày kết thúc, trung tâm và đối tượng áp dụng.</li>
   <li><strong>Xác định nội dung thay thế.</strong> Chỉ rõ phần thay đổi về giá, giảm tiền, tháng tặng, kỳ trả góp và điều kiện cộng gộp. Chính sách cũ vẫn cần cho giao dịch thuộc kỳ cũ.</li>
   <li><strong>Cập nhật và đối chiếu.</strong> Chuẩn hóa vào bộ quy tắc, kiểm tra hồ sơ trước và sau ngày hiệu lực rồi phát hành bản cập nhật. Khi mở lại bộ nguồn, web tính theo ngày giao dịch; điều kiện chưa đủ căn cứ tiếp tục CHECK.</li>
  </ol>
  <p className="policy-update-note">Hiện chưa hỗ trợ tự nhập file chính sách bất kỳ trên web. Khi có file mới, gửi file kèm phạm vi và ngày hiệu lực để cập nhật bộ quy tắc; không thay file giao dịch bằng file chính sách.</p>
 </details>;
}
