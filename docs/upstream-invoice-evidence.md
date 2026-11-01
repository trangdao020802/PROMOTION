# Hóa đơn thu gốc qua CT và DEP trung gian

Chứng từ bổ sung trong Liên kết CT / DEP trên Hub truy ngược từ CT tổng qua Transfer trong bộ nguồn và Moving-in đã đọc trên Hub. CT hoặc DEP trung gian có thể không phát sinh hóa đơn. Người dùng thêm mã nguồn và lưu link chi tiết khi báo cáo lịch sử không có chặng cũ; mã nhập tay chỉ hướng dẫn tìm kiếm, không xác nhận tiền.

Bridge 1.6.18 nhận đúng các cột `Moving-in from`, `Moving-in date`, `Moving-in amount` và tách các phần Payment, Moving-in, Moving-out trong cùng bảng. Cột E-Invoice trống tại chặng chuyển tiền không có nghĩa hóa đơn tại nguồn đã mất. Bộ đọc tiếp tục theo nguồn trước đó. CT và DEP đều có link riêng, được đọc trong phiên Hub đang đăng nhập qua API GET, HTML tĩnh hoặc khung nền. Không tạo, điều hướng, kích hoạt hoặc đóng tab Hub.

Đọc chứng từ tài chính kiểm tra đúng mã tài liệu, ID và URL. Học viên tại CT/DEP nguồn có thể khác học viên của CT nhận. Chỉ thông tin Paid, ngày, mã Payment, định danh hóa đơn và đường Moving được nhập; khóa học, ưu đãi, Giftcode và phê duyệt của người chuyển không ghi đè hồ sơ nhận. Đọc Input khóa học vẫn kiểm tra Student ID như trước.

Hóa đơn Hub có căn cứ bổ sung vào cùng sổ tiền với PaymentList. Đường chuyển dùng chung bộ kiểm tra ngày và ngân sách hiện có: hóa đơn phải Paid trước hoặc trong ngày chuyển; dòng tương lai bị loại theo ngày chốt; toàn bộ khoản chuyển cùng nguồn/ngày cần đủ tiền. Mỗi hóa đơn gốc giữ riêng và được tính một lần. Payment đã có trong PaymentList không được tạo thêm bản thu Hub. Chuyển giữa CT/DEP chỉ là phân bổ, không phải thu mới. Nguồn trộn nhiều hóa đơn chưa có căn cứ chia giữ số phân bổ từng hóa đơn là Chưa tính.

Sau khi lưu chứng từ, worker tải lại sổ tiền và tính các CT bằng các ô chỉnh sửa và quy tắc đang có. Giao diện cập nhật Summary, Moving, CALC/Actual và chênh lệch ngay trong trang. Các lần lưu song song xếp hàng khi tính lại. Lượt đọc dở giữ phần chứng từ đã lưu ở lần trước; danh sách mới đọc thành công mới thay thế phần tương ứng. Bộ nhớ giữ chứng từ, link và chỉnh sửa qua tải trang; không cần thao tác tải lại để cộng tiền.

Kiểm thử dùng hồ sơ giả: thu hiện tại 1.350.000, hai nguồn năm trước mỗi nguồn Paid 4.725.000, mỗi nhánh đi qua một CT/DEP trung gian. Trước bổ sung, tổng nhận 1.350.000 và hai nhánh chờ hóa đơn; sau bổ sung đủ căn cứ, tổng nhận 10.800.000, hai hóa đơn có đường hai chặng và không còn nhánh chờ. Nạp thêm PaymentList lịch sử sau đó giữ tổng tiền không đổi. Kiểm tra thêm link sai ID, Paid sau ngày chốt, thiếu hóa đơn, người trả khác học viên và giữ nguyên thông tin khóa học.

Cả hai tên miền dùng cùng mã nguồn và bản cầu nối: `https://promotion-hub-2026.quanghuym24.chatgpt.site/` và `https://promotion-hub-2026.vercel.app/`. Vercel tiếp tục triển khai từ `trangdao020802/PROMOTION`, nhánh `main`. Dữ liệu giao dịch vẫn lưu theo trình duyệt và tên miền đang mở.
