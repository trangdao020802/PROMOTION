# Nguồn tiền từ Contract nâng cấp

Cầu nối 1.6.21 đọc liên kết có nhãn **Upgrade from contract** hoặc **Upgraded to contract**, hoặc ID nguồn từ dữ liệu Contract của Hub. Không yêu cầu xuất hiện Moving-in/out và không suy quan hệ từ mã CT, học viên hoặc tên khóa học.

Khi lấy Input hoặc đọc lại chứng từ, bộ đọc dùng phiên Hub và dịch vụ GET đang có để đọc CT nguồn trong nền. Không mở, đổi URL, chuyển hoặc đóng tab. Mã CT, ID, link chi tiết, ngày và chứng từ phải khớp; chỉ đưa các trường tài chính được cho phép về Promotion. Lỗi ở CT nguồn giữ phần đã đọc và còn trong hàng chờ.

Tiền nâng cấp là **phân bổ số dư còn lại có hóa đơn Paid gốc**, không tạo khoản thu mới. Số dư lấy từ PaymentList và chứng từ Paid đã kiểm tra trên Hub, trừ khoản hoàn/chuyển đã ghi nhận; không dùng Course fee, Final amount hoặc Not enrolled amount làm tiền thu. Ngày dùng ngày nâng cấp được ghi rõ hoặc ngày tạo CT nhận. Không suy ngày từ tiền tố CT hay ngày đọc.

- PaymentList lịch sử và bản Hub cùng mã Payment không cộng hai lần.
- Đã có đường Transfer về CT tổng thì dùng đường đó; không thêm phân bổ Upgrade trùng.
- Nhiều CT nhận từ cùng nguồn, vòng liên kết, thiếu ngày hoặc hóa đơn, tiền phát sinh sau ngày nâng cấp và số tiền mâu thuẫn tiếp tục CHECK.
- Tổng các CT dùng chung ngân sách hóa đơn gốc, không vượt số dư.
- Khi có đủ căn cứ và CT nguồn đã hết số dư, dòng khóa học được gộp vào CT tổng; chứng từ và liên kết nguồn vẫn nằm trong truy vết.

Trong chi tiết hồ sơ, chặng nâng cấp hiển thị **Có liên kết Upgrade trên Hub** thay cho yêu cầu Moving-out. Cập nhật cầu nối 1.6.21, tải lại Promotion và tab Hub đã đăng nhập, rồi đọc lại CT hoặc tạo lượt lấy Input mới để bổ sung dữ liệu cũ.
