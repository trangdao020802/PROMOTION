# Đọc số hóa đơn từ Hub · cầu nối 1.6.19

Trong chi tiết hồ sơ, mở **Liên kết CT / DEP trên Hub**, gắn link nguồn và bấm **Đọc lại hóa đơn**. Cập nhật tiện ích lên 1.6.19 rồi tải lại Promotion và tab Hub đang đăng nhập trước khi đọc.

- Link **Learner name** được xác định bằng LeadId và KidId của chính CT đang đọc. Cầu nối gọi GET `leadService.getKidPayments({kidId,p,ps})`, đọc các trang trong giới hạn và dùng lại kết quả trong một phút cho cùng learner/role.
- Chỉ CT/DEP có đường Moving tới hồ sơ hiện tại được đưa về Promotion. Khoản nhận chuyển tiền không tạo hóa đơn thu mới. Hóa đơn của học sinh khác không được tìm bằng learner của CT nhận: truy tiếp CT/DEP nguồn.
- GET `depositService.printEInvoice({key,centerId,version})` trả về PDF cho đúng EInvoiceFKey của Payment. Bộ đọc PDF chạy trong nền ở tab Hub có sẵn; không mở trình xem, tab mới, không sửa scope hoặc bấm tạo/cập nhật hóa đơn.
- Số hóa đơn giữ nguyên chữ số, ví dụ `0000424`. UUID EInvoiceFKey được lưu riêng. Ngày phát hành và tổng tiền PDF được lưu riêng với ngày hoàn tất và tiền Paid. Không lấy mã CT, số tiền hoặc UUID làm số hóa đơn.
- Sai số hóa đơn, ngày hoặc tiền giữa các nguồn được giữ để CHECK. PDF chưa đọc được không xóa dữ liệu cũ. Bấm đọc lại để thử phần còn thiếu; không tự nhận ô trống là 0.
- Bản đọc PDF tối đa 8 MiB, 4 trang và có thời gian chờ. Các file chỉ là ảnh hoặc bị khóa sẽ tiếp tục thiếu số hóa đơn để kiểm tra. Link PDF ngoài Hub chỉ đọc được khi máy chủ cho phép CORS; không yêu cầu mở rộng quyền truy cập trình duyệt.

Chỉ số hóa đơn, ngày, tiền và căn cứ tài chính cần thiết được gửi về Promotion. Toàn bộ PDF, tên/địa chỉ người mua và link PDF có thể chứa chữ ký truy cập không được lưu vào Promotion. PDF.js được đóng gói cùng tiện ích; không tải mã thực thi từ CDN khi đọc hóa đơn.

Các kiểm thử dùng dữ liệu giả và PDF thật do bộ kiểm thử tạo. Kiểm thử Hub có đăng nhập cần thực hiện trên trình duyệt đang có phiên của người dùng; không coi kết quả giả lập là xác nhận hồ sơ thật.
