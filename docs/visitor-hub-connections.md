# Tài khoản Hub và trình duyệt

Promotion hiện dùng dữ liệu nguồn và bộ nhớ riêng của trình duyệt. Cầu nối 1.6.23 đọc bằng phiên Hub đang đăng nhập trong chính trình duyệt đó. Tiện ích Chrome trên máy tính không tự được cài trong trình duyệt đám mây. Đăng nhập ChatGPT hoặc có plugin trong ChatGPT chưa tạo ra cầu nối Hub trên trang Promotion.

Nếu trình duyệt có hỗ trợ tiện ích, tải cầu nối trong Cài đặt chung → Tự gắn link Hub, cài/cập nhật và tải lại Promotion cùng tab Hub. Nếu phiên trình duyệt không cho cài tiện ích, tự lấy Hub chưa khả dụng trong phiên đó; có thể tải Export, PaymentList và Transfer từ tài khoản Hub của mình và nhập bằng Tải bộ nguồn. Lỗi kết nối không xóa dữ liệu hoặc đổi kết quả đã lưu.

Kết nối ứng dụng cho từng khách truy cập cần một connector thực sự hỗ trợ Hub Apollo Việt Nam, được Sites xác nhận cho phép, rồi khai báo và gọi phía server bằng kết nối/đồng ý của khách. Website hiện là static và chưa có các khai báo đó. Phiên phát triển không cung cấp `sites_list_plugin_eligibility`; tìm plugin chỉ thấy Apollo.io, một sản phẩm khác. Vì vậy bản này chưa bật hoặc giả lập kết nối plugin cho khách truy cập. Không có tài khoản Hub dùng chung, proxy cookie, token trong mã nguồn hay nút báo đã kết nối khi chưa xác thực.
