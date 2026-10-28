# Đọc nền và tiếp tục lấy Input · cầu nối 1.6.4

1. Cập nhật cầu nối 1.6.4, tải lại Promotion và các tab Hub. Đăng nhập chỉ tại Hub khi cần.
2. Lọc các CT cần đọc rồi bấm **Tự lấy Input**. Chọn **Đọc lại cả CT đã đủ Input** nếu muốn đối chiếu lại tất cả CT đang lọc.
3. Mỗi CT được mở trong tab nền, giữ nguyên tab người dùng đang thao tác. Cầu nối quan sát request **GetContractDetail?contractId=...** của chính trang Hub, đọc **ListCourseInfo**, rồi tự đóng tab khi xong. Không cần mở F12 thủ công.
4. Sau khi dữ liệu CT được lưu và tính lại, tiến độ hoàn tất mới được ghi. Nếu hết giờ, dừng hoặc đóng trang, bấm **Tiếp tục lấy Input** để đọc các CT chưa hoàn tất. Chế độ đọc lại toàn bộ được khôi phục khi mở lại trang.
5. Trường đã lấy được được giữ khi lần đọc sau thiếu một trường. CT chỉ đọc được một phần tiếp tục chờ bổ sung; dữ liệu mâu thuẫn vẫn phải đối chiếu. Hoàn tất lấy Input không phải duyệt voucher, policy hay kết quả tiền.
6. Chọn **Tạo lượt đọc mới** khi muốn đọc lại từ đầu theo lựa chọn đang có. Thao tác này giữ file nguồn, Input và chỉnh sửa đã lưu.

## Phạm vi dữ liệu

`contractId` chỉ lấy từ URL chi tiết đã được xác minh và phải khớp request được quan sát. Không ghép số cuối mã CT để tạo ID hoặc đoán đường dẫn API. Bộ quan sát chỉ nhận đúng origin Hub và route có tên GetContractDetail cho CT đang yêu cầu; không tự gửi thêm request API, không đọc cookie/mật khẩu, không bấm Update trên Hub.

ListCourseInfo được chiếu thành các trường có tên rõ: PriceName, tên gói, tên/số giờ mỗi tuần, Giftcode đầy đủ và nhãn Discount apply, cùng ProductGroupName / ContractTypeName khi có. PriceId, HowweekId và ProductPackageId không dùng để suy tên hoặc giá trị. Course fee là số tiền, không phải tên bảng giá. Chỉ một Course info được xác định duy nhất mới được dùng. Mã CT / Student code khác, ID không khớp hoặc nhiều khóa học tiếp tục CHECK.

Nếu JSON thiếu tên trường, dùng Course info có nhãn trên cùng CT đã xác minh. Bộ đọc vẫn kiểm tra CT và Student ID khi có. Không chuyển tiếp toàn bộ JSON, địa chỉ, người bán, thông tin đăng nhập hoặc chứng từ không cần thiết sang Promotion.

## Lưu và tiếp tục

Tiến độ lưu trong IndexedDB của cùng trình duyệt và cùng miền web, tách theo bộ nguồn, CT, Student ID và các trường cần đọc. Chỉ nguồn Input đã lưu đúng phiên bản mới được đánh dấu hoàn tất. Nguồn thiếu trường, phản hồi đến muộn, lỗi đăng nhập hoặc lỗi lưu không được coi là hoàn tất. Các tab cùng sửa tiến độ phải dùng kiểm tra phiên bản để tránh ghi đè nhau.

Nếu Hub hết phiên, lượt đọc dừng và báo đăng nhập; không tự chuyển sang tab đăng nhập. Người dùng mở Hub, đăng nhập rồi quay lại bấm tiếp tục. Khi đổi trình duyệt/miền hoặc xóa dữ liệu trình duyệt, tiến độ cục bộ không tự chuyển sang.

## Kiểm chứng

Kiểm thử JSON/DOM và Chrome API dùng dữ liệu giả: GET/XHR đúng ID, phản hồi trước khi trang hiển thị, giới hạn dữ liệu chuyển tiếp, không tự gửi thêm request, không kích hoạt tab khi thành công/lỗi/đăng nhập, tiếp tục sau timeout và sau khi tạo lại giao diện, chế độ đọc lại toàn bộ, giữ nguồn đọc dở, đúng học viên và phiên bản nguồn. Chưa xác nhận phản hồi API trên tài khoản Hub thật trong môi trường kiểm thử.

Đã kiểm tra giao diện với 3 CT giả, bật đọc lại toàn bộ, giả lập timeout tại CT thứ hai rồi tải lại trang. Tiến độ và chế độ được khôi phục; lần tiếp tục chỉ đọc CT thứ hai và thứ ba. Bộ đếm CT thứ nhất giữ nguyên 1 lượt. Toàn bộ 142 kiểm thử đạt.
