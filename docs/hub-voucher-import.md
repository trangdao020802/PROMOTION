# Tự điền Voucher từ Hub

Cầu nối 1.6.0 dùng phiên Hub của người dùng trên Chrome/Edge. Website không đọc trực tiếp cookie hay mật khẩu và không gọi API đăng nhập. Trình duyệt kiểm thử hiện yêu cầu đăng nhập; kiểm tra tự động sử dụng dữ liệu giả và trang DOM mô phỏng, không xác nhận đã đọc tài khoản Hub thật.

## Luồng sử dụng

1. Cập nhật tiện ích cầu nối 1.6.0, tải lại Promotion và các tab Hub.
2. Mở chi tiết CT, nhập Giftcode No. Student ID, tên học viên, center lấy từ các trường của CT đang mở khi sổ voucher còn trống. Nếu mở từ bảng Voucher, chỉ ghép hồ sơ khi mã có đúng một CT trong bộ nguồn.
3. Voucher còn thiếu tự tra khi mở hồ sơ và cầu nối sẵn sàng. Nút **Tìm & tự điền từ Hub** đọc lại theo yêu cầu.
4. Cầu nối mở `/giftcode/manage`, nhập mã đầy đủ vào ô tìm, mở rộng Apply date được nhận diện và bấm Search. Chỉ theo link chi tiết có trong dòng Voucher trả về.
5. Trang chi tiết phải xác nhận mã đầy đủ trong **List gift code** hoặc trường Giftcode No riêng. Code prefix và ô tìm kiếm không phải bằng chứng ghép mã. Nếu List gift code là link đọc riêng, chỉ theo link có trong trang và có ID cùng Voucher; giữ các thông số đã đọc từ trang cha. Danh sách phân trang được tìm bằng bộ lọc của chính bảng giftcode.
6. Giá trị tự điền gồm tên voucher, phạm vi, ngày hiệu lực, kiểu/mức giảm, sàn/trần, mô tả và người tạo có trong Hub. Student ID/tên riêng trên Hub, nếu có, phải khớp CT. Thông tin không có được giữ trống hoặc giữ giá trị đã nhập; không suy tỷ lệ từ tên hay tiền tố mã.
7. Link chi tiết, mã đã đối chiếu, trạng thái Hub và thời điểm đọc được giữ trong hồ sơ. Mã trong bảng Voucher mở lại link đã xác minh. Kiểm tra trạng thái duyệt và bấm **Lưu voucher & tính lại** để lưu.

## Phạm vi và tính nhất quán

- Chỉ thao tác Search và tìm trong List gift code; không bấm Create/Update, sửa Voucher, dùng mã hay chuyển tiền trên Hub.
- Link chi tiết được đọc từ kết quả, không dựng ID số từ mã. Chỉ chấp nhận các route đọc chi tiết của Giftcode tại origin Hub `https://hub24.apollo.vn:7777`.
- Mã không khớp, nhiều kết quả, học viên khác, dữ liệu mâu thuẫn, chưa đăng nhập hoặc chưa đọc đủ sẽ dừng tự điền và giữ bản nháp.
- Hub Active/Being applied không tự trở thành duyệt ngoại lệ. Hồ sơ mới hoặc giá trị áp dụng thay đổi vẫn Chờ bổ sung/duyệt. Hồ sơ đã duyệt được giữ duyệt khi thông tin áp dụng không thay đổi. Hub không áp dụng thì ghi Không áp dụng.
- Trạng thái CEO/RCM, ghi danh, sibling, loyalty và trả góp tiếp tục kiểm tra riêng.
- Cầu nối dùng một lượt Hub tại một thời điểm; đóng hồ sơ hoặc bấm Dừng tìm sẽ hủy lượt đang đọc.

Kiểm thử bao gồm đọc điều khiển có nhãn trên trang chi tiết, nhập mã và Apply date ở trang quản lý, ghép đúng full code, dữ liệu cố định/phần trăm, Student ID khác, phản hồi cũ/sai mã, origin/link không hợp lệ, lưu nguồn và tách trạng thái Hub khỏi phê duyệt hồ sơ.
