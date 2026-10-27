# Tự điền Voucher từ Hub

Cầu nối 1.6.1 dùng phiên Hub của người dùng trên Chrome/Edge. Website không đọc trực tiếp cookie hay mật khẩu và không gọi API đăng nhập. Trình duyệt kiểm thử hiện yêu cầu đăng nhập; kiểm tra tự động sử dụng dữ liệu giả và trang DOM mô phỏng, không xác nhận đã đọc tài khoản Hub thật.

## Luồng sử dụng

1. Cập nhật tiện ích cầu nối 1.6.1, tải lại Promotion và các tab Hub.
2. Mở chi tiết CT, nhập Giftcode No. Student ID, tên học viên, center lấy từ các trường của CT đang mở khi sổ voucher còn trống. Nếu mở từ bảng Voucher, chỉ ghép hồ sơ khi mã có đúng một CT trong bộ nguồn.
3. Voucher còn thiếu tự tra khi mở hồ sơ và cầu nối sẵn sàng. Nút **Tìm & tự điền từ Hub** đọc lại theo yêu cầu.
4. Cầu nối mở `/giftcode/manage`, nhập mã đầy đủ vào ô tìm, mở rộng Apply date được nhận diện và bấm Search. Chỉ theo link chi tiết có trong dòng Voucher trả về.
5. Trang chi tiết phải xác nhận mã đầy đủ trong **List gift code** hoặc trường Giftcode No riêng. Code prefix và ô tìm kiếm không phải bằng chứng ghép mã. Nếu List gift code là link đọc riêng, chỉ theo link có trong trang và có ID cùng Voucher; giữ các thông số đã đọc từ trang cha. Danh sách phân trang được tìm bằng bộ lọc của chính bảng giftcode.
6. Giá trị tự điền gồm tên voucher, phạm vi, ngày hiệu lực, kiểu/mức giảm, sàn/trần, mô tả và người tạo có trong Hub. Đọc ký hiệu ngay cạnh **Discount amount**: `15 %` → Phần trăm, tỷ lệ 15%; `2.000.000 đ` → Số tiền, 2.000.000 VND. Chấp nhận `%`, VND, VNĐ, đ, Đ và ₫; không tự xem số không có đơn vị là tiền. Không lấy đơn vị ở Minimum/Maximum hoặc suy từ tên/mã. Nếu không xác định rõ đơn vị thì dừng tự điền và báo cần kiểm tra.
7. **Center / phạm vi** ưu tiên cột **Center code** của đúng dòng Giftcode đầy đủ; nếu dòng không có thì lấy danh sách Center code trong trang chi tiết, đọc tiếp các trang của chính bảng center. Nhiều mã được phân cách bằng dấu phẩy, tối đa 2.000 ký tự. Chỉ khi không có cột mã mới dùng Center/Region được chọn hoặc phạm vi ở dòng Voucher. Danh sách chưa đọc đủ sẽ dừng, không lưu một phần làm toàn bộ phạm vi. Student ID/tên riêng trên Hub, nếu có, phải khớp CT.
8. Link chi tiết, mã đã đối chiếu, trạng thái Hub và thời điểm đọc được giữ trong hồ sơ. Mã trong bảng Voucher mở lại link đã xác minh. Kiểm tra trạng thái duyệt và bấm **Lưu voucher & tính lại** để lưu.

## Phạm vi và tính nhất quán

- Chỉ thao tác Search và tìm trong List gift code; không bấm Create/Update, sửa Voucher, dùng mã hay chuyển tiền trên Hub.
- Link chi tiết được đọc từ kết quả, không dựng ID số từ mã. Chỉ chấp nhận các route đọc chi tiết của Giftcode tại origin Hub `https://hub24.apollo.vn:7777`.
- Mã không khớp, nhiều kết quả, học viên khác, dữ liệu mâu thuẫn, chưa đăng nhập hoặc chưa đọc đủ sẽ dừng tự điền và giữ bản nháp.
- Hub Active/Being applied không tự trở thành duyệt ngoại lệ. Hồ sơ mới hoặc giá trị áp dụng thay đổi vẫn Chờ bổ sung/duyệt. Hồ sơ đã duyệt được giữ duyệt khi thông tin áp dụng không thay đổi. Hub không áp dụng thì ghi Không áp dụng.
- Trạng thái CEO/RCM, ghi danh, sibling, loyalty và trả góp tiếp tục kiểm tra riêng.
- Cầu nối dùng một lượt Hub tại một thời điểm; đóng hồ sơ hoặc bấm Dừng tìm sẽ hủy lượt đang đọc.

Kiểm thử bao gồm đọc điều khiển có nhãn trên trang chi tiết, nhập mã và Apply date ở trang quản lý, ghép đúng full code, dữ liệu cố định/phần trăm, Student ID khác, phản hồi cũ/sai mã, origin/link không hợp lệ, lưu nguồn và tách trạng thái Hub khỏi phê duyệt hồ sơ.
