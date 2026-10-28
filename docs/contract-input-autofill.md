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

Cần cầu nối 1.6.2 và phiên Hub của người dùng. Lượt đọc bị chặn đăng nhập hoặc lỗi kỹ thuật sẽ dừng; CT không có link/không đọc được trường được báo theo CT. Dừng giữa chừng không ghi phản hồi đến muộn vào hồ sơ khác. Thông tin đã lưu được dùng lại khi mở lại bộ nguồn cùng CT/học viên.

Kiểm thử dùng dữ liệu giả: đủ H:L từ DOM có nhãn, nguồn khóa học điền vào nhóm 01 và tính lại, độc lập với tiền thu; chống sai CT/học viên, CT cũ, trùng danh sách, dữ liệu khác nguồn, mã chưa có link và hủy giữa lượt. Phiên trình duyệt kiểm tra thực tế yêu cầu đăng nhập, nên không khẳng định đã đọc một CT thật trên tài khoản Hub.
