# Tự lấy Input theo Contract

Trên Bảng đối chiếu, **Tự lấy Input theo Contract** xử lý các CT nhận tiền đang lọc còn thiếu đầu vào. Có thể tích **Đọc lại cả CT đã đủ Input để đối chiếu**. Lượt đọc chụp danh sách CT lúc bắt đầu, xử lý tuần tự và có nút Dừng.

1. Dùng link chi tiết đã lưu. Nếu chưa có, đọc danh sách Hub theo tháng như Tự gắn link; chỉ dùng cặp mã–URL được xác minh, không dựng ID số.
2. Mở đúng CT nhận cuối, kiểm tra mã CT trong tiêu đề và Student ID nếu trang cung cấp. Không dùng CT đã chuyển hết hoặc DEP chưa gắn CT làm khóa học đích.
3. Lấy các trường có nhãn rõ ràng, lưu nguồn theo CT/học viên, cập nhật nhóm 01 và tính lại bằng bảng giá/quy tắc.

| Nhóm 01 | Trường trên Hub |
| --- | --- |
| H · Course fee KOC | Price name / Course fee KOC |
| I · Hour/week | Hour/week / Hours per week |
| J · Package | Package Before Discount; ưu tiên hơn Package chung; không dùng Package After Discount |
| K · Giftcode No | Giftcode No đầy đủ; không suy từ tiền tố |
| L · Discount apply | Các nhãn ưu đãi của CT, giữ chuỗi nhiều ưu đãi |

Group KOC / Contract type được lấy khi có trường tương ứng và nguồn CT còn thiếu. Giá gốc, tiền giảm, voucher và tiền phải đóng vẫn tính độc lập; ngày/VAT/tiền của hóa đơn, lịch sử transfer và file gốc không bị ghi lại bằng dữ liệu khóa học Hub.

Đầu vào đã có, chỉnh sửa tay và dấu duyệt theo phạm vi CT được giữ. Nguồn mới khác dữ liệu cũ tạo cảnh báo/mâu thuẫn để đối chiếu; không âm thầm thay giá trị. Nhập mới Giftcode tạo hồ sơ voucher chờ bổ sung/duyệt. Tự lấy Input không tự duyệt voucher, điều kiện khuyến mãi hoặc ngoại lệ trả góp. Thiếu rule/điều kiện vẫn CHECK.

Cần cầu nối 1.6.6 và tab Hub có sẵn đã đăng nhập; không tạo, đổi URL, chuyển hay đóng tab trình duyệt. Dùng phiên Hub của người dùng. Lượt đọc bị chặn đăng nhập hoặc lỗi kỹ thuật sẽ dừng; CT không có link/không đọc được trường được báo theo CT. Dừng giữa chừng không ghi phản hồi đến muộn vào hồ sơ khác. Thông tin đã lưu được dùng lại khi mở lại bộ nguồn cùng CT/học viên.

Kiểm thử dùng dữ liệu giả: đủ H:L từ DOM có nhãn, nguồn khóa học điền vào nhóm 01 và tính lại, độc lập với tiền thu; chống sai CT/học viên, CT cũ, trùng danh sách, dữ liệu khác nguồn, mã chưa có link và hủy giữa lượt. Phiên trình duyệt kiểm tra thực tế yêu cầu đăng nhập, nên không khẳng định đã đọc một CT thật trên tài khoản Hub.

Sửa lỗi đọc HTML thay JSON ngày 28/10/2026: phần đọc/lưu link trong nút Tự lấy Input dùng cùng API cục bộ với Tự gắn link Hub. Các đường `/api/hub-links` được xử lý trong trình duyệt, không gửi lên hosting tĩnh. Kiểm thử nút thực tế với phản hồi HTML giả từ hosting xác nhận cả dùng link cũ và tự tìm/lưu link mới đều không gọi API mạng. Lượt bị dừng báo rõ số CT đã xử lý trên tổng CT đã chọn.

Đã chạy giao diện với 2 CT giả và cầu nối Hub mô phỏng: tự tìm/lưu cả hai link, nhận H:L, lưu nguồn vào IndexedDB và tính lại 2/2 CT. Tại bản 1.6.3, 125 ca kiểm thử đạt; không dùng tài khoản Hub thật cho bài kiểm tra này.


## Sửa bộ đọc Course info trên trang chỉ xem — 28/10/2026

Cầu nối 1.6.3 đọc **Price name** vào Course fee KOC. Trường **Course fee** ở cột tiền không phải tên bảng giá và không tham gia chọn giá. Bộ đọc hỗ trợ nhãn/giá trị ở hai cột, nhãn nằm trong cột con, ô điều khiển có liên kết nhãn và Contract No./Contract code bên ngoài tiêu đề. URL CT và Student ID vẫn được kiểm tra độc lập; hai tên bảng giá khác nhau vẫn là mâu thuẫn.

Chờ ổn định dựa trên các trường đọc được, không dựa vào mọi thay đổi DOM của widget khác. Lỗi cho biết thiếu mã CT, Student ID khác, trường mâu thuẫn, định dạng chưa hợp lệ hoặc trang chưa tải xong; không lấy giá trị tiền hay tổng giờ để suy tên bảng giá/giờ tuần. Cần cập nhật tiện ích 1.6.3, tải lại Promotion và Hub rồi chạy lại Tự lấy Input.

Bố cục kiểm thử tại `tests/fixtures/hub-contract-readonly.html` được dựng từ ảnh tham chiếu và dùng hoàn toàn dữ liệu giả. Phiên Hub thật chưa được đăng nhập trong môi trường kiểm thử.

Kiểm tra trình duyệt 1.6.3 dùng chính `coursePageFromDocument` để đọc DOM thật của fixture hai cột: 2/2 CT giả được điền H:L, lưu và tính lại. Đây là Hub mô phỏng, chưa xác minh các CT thật đã nêu trong báo lỗi.


## Đọc nền và tiếp tục sau khi hết giờ · 1.6.4

Xem [hướng dẫn đọc nền và lưu tiến độ](silent-input-resume.md). Sau mỗi CT đã lưu đủ các trường cần lấy, web ghi nhận hoàn tất trên trình duyệt. Bấm lấy lại hoặc mở lại trang sẽ bỏ qua CT đó; chế độ Đọc lại cả CT đã đủ Input cũng được khôi phục. CT đọc dở hoặc lỗi vẫn còn trong hàng chờ. Tạo lượt đọc mới bắt đầu lại theo lựa chọn hiện tại và giữ dữ liệu đã lưu.
