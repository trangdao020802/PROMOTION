# Discount Big Bang Sep: chọn đúng cột bảng giá

## Căn cứ

File người dùng cung cấp `Lo_trinh_san_pham_CTKM_ATLS_2026(1).xlsx`, sheet `BẢNG GIÁ`, dòng 31 (`1|3|36 SPLIT`):

| Ô | Nội dung | Giá trị VND |
| --- | --- | ---: |
| G31 | Học phí niêm yết | 58.050.000 |
| K31 | Big Bang Sep: giảm tiền cố định | 18.000.000 |
| L31 | Big Bang Sep: phải thanh toán = G31 − K31 | 40.050.000 |
| U31 | Big Bang Q4: giảm 30% = G31 × T31 | 17.415.000 |
| V31 | Big Bang Q4: phải thanh toán = G31 − U31 | 40.635.000 |

SHA-256 file đã đối chiếu: `56e1f1b2a5921faaa946be46ed0b588547ac188c6f7b5ad20eb83e3f8b39f88a`.

Các cột giá/discount/kỳ G, H, K, N, P, S, U, Z trong toàn bộ 48 dòng gói của file vừa gửi khớp dữ liệu quy tắc đã có. Lỗi nằm ở chọn chế độ tính theo ngày hóa đơn tháng 10: nhãn Big Bang Sep bị đưa sang Q4 và lấy U31. Không chỉnh file Excel hay thay chính sách Q4.

## Cách tính sau sửa

`priceFor` nhận diện chính sách giảm tiền Big Bang Sep bằng khóa `BBSEP26_CASH`, lấy dòng theo Layer × giờ/tuần × gói và đọc G/K/N từ bảng giá trước khi xét bảng bổ sung Audit. Không suy 18 triệu bằng tỷ lệ hoặc từ số tiền đã thu. `18 months siblings` ánh xạ đúng nửa gói `36 SPLIT`. Nguồn truy vết ghi ô K31 cho case này.

Mức giảm và điều kiện được kiểm tra riêng. Hóa đơn tháng 10 vẫn hiển thị khoản giảm 18 triệu theo chính sách đang chọn, đồng thời giữ CHECK về thời kỳ và những xác minh còn thiếu. Không tự duyệt sibling, ghi danh, voucher hoặc ngoại lệ trả góp. Chọn lại ưu đãi Q4 sẽ tính 17.415.000 theo đúng cột Q4. Thiếu dòng Big Bang Sep thì để trống kết quả cần tính và giữ CHECK; không dùng phần trăm Q4 hay tiền thu thay thế.

## Kiểm tra

- So khớp 48 dòng bảng giá gốc với dữ liệu quy tắc.
- Kiểm tra 48 dòng × ba ngày (15/09, 05/10, 10/10): Big Bang Sep lấy đúng K và giới hạn kỳ N.
- Kiểm tra CT giả cùng cấu hình người dùng: 58.050.000 − 18.000.000 − 0 = 40.050.000, kỳ tối đa 12. Giữ xác minh sibling và cảnh báo thời kỳ tháng 10.
- Kiểm tra chuyển nhãn sang Q4/base October/không ưu đãi và thiếu dòng nguồn.
- 70 kiểm thử tự động đạt. Kiểm thử trình duyệt nhập ba CSV giả bằng luồng Tải bộ nguồn rồi mở Course info; ảnh ở `reference/qa/bigbang-september-discount.jpg`. Dữ liệu giả chỉ lưu tại origin preview, không đóng gói vào web.

Để dùng, tải lại trang rồi mở lại bộ nguồn/hồ sơ. Không cần nhập lại số giảm hoặc cập nhật cầu nối Hub cho thay đổi này.
