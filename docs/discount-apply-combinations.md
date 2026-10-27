# Discount apply: giữ nguyên chuỗi PaymentList, đọc từng ưu đãi

## Lỗi đã xác định

Chuỗi trong ảnh người dùng đã có trong ô nhập. Nhãn `Siblings - Siblings 1.000.000 VND (AGLS/ATLS/IELTS)` chưa được nhận diện nên điều kiện “mọi ưu đãi có rule” thất bại và Discount/Total fee bị để Chưa tính. Bộ nhận diện trên cả chuỗi còn trộn nhãn giảm tiền, tặng tháng và từ “siblings” trong tên gói; có thể ghép nhầm chương trình Referral/Sibling tháng 6–7 vào tháng 10.

## Thay đổi

- Giữ nguyên AQ của PaymentList thành L trên CT, kể cả thứ tự và dấu `;` cuối. Danh sách gợi ý giữ cả chuỗi đầy đủ và thêm từng nhãn đã đọc từ nguồn.
- `discountOffers` tách `;`, bỏ mục trống và nhãn lặp khi tính. Không lấy tên gói trong Discount để cộng thêm một khóa học hoặc thêm giá lần nữa.
- Nhận diện riêng hai nhãn Siblings số tiền đã có nguồn: 1.000.000 và 800.000 VND, kể cả VNĐ và cách viết dấu phân cách thông dụng. Không áp số tiền bất kỳ chỉ vì xuất hiện trong tên.
- Chọn rule giảm tiền theo gói làm chính sách chính. Tặng tháng không cộng vào tiền giảm; loyalty/sibling/ghi danh vẫn phải đủ điều kiện.
- Chương trình Q4 áp dụng riêng theo từng nhãn, không kéo theo chương trình Referral/Sibling tháng 6–7 đã hết hạn.
- Course info hiển thị đầy đủ từng nhãn dưới ô nhập, kèm loại ưu đãi, khoản tiền và cảnh báo điều kiện cụ thể khi có.

## Số tiền và tính hợp lệ là hai kiểm tra riêng

Với dữ liệu giả cùng cấu hình ảnh (ATLS Layer 1, 3 giờ/tuần, 18 months siblings), ba nhãn được nhận diện:

| Nhãn | Thành phần tính |
| --- | ---: |
| Siblings - Siblings 1.000.000 VND (AGLS/ATLS/IELTS) | Khoản giảm tiền ghi trong nhãn: 1.000.000 |
| 2026 October - Promotion Discount - 36/36 siblings - From 06/10 | Giảm theo gói Q4: 17.415.000 |
| 2026 October - Promotion Month - 36 months siblings | Không cộng vào tiền giảm; tháng tặng kiểm tra riêng |

Phép tính theo các khoản được ghi: 58.050.000 − 17.415.000 − 1.000.000 = 39.635.000, chưa có Giftcode. Đây không phải tự xác nhận hợp lệ mọi ưu đãi trong chuỗi.

Nguồn chính sách gốc `2026 Price & Promotion - update 10.10.26.xlsx`, sheet `Big bang promotion 6.10 - 31.12`:

- Dòng 24: được cộng gộp Referral/Sibling theo điều kiện.
- Dòng 25: học phí 36T chia đôi, trả thẳng 0,5 tháng và loyalty cho current theo căn cứ riêng.
- Dòng 99–101: Sibling New từ 12 tháng áp dụng ưu đãi tháng; gói 3/6/9 áp dụng khoản giảm tiền 1 triệu/800 nghìn, có anh/chị/em còn học/ngừng ≤120 ngày.

Vì vậy case chia đôi mang nhãn Siblings giảm tiền vẫn có CHECK về loại/gói ưu đãi. Duyệt hồ sơ/quan hệ/trả góp không xóa lỗi chính sách này. Mức sai layer, học viên không phải New, hai mức Siblings đồng thời và khoản chưa có rule vẫn được kiểm tra. Không biến dữ liệu quan sát PaymentList thành căn cứ phê duyệt.

## Kiểm tra

84 kiểm thử tự động đạt: nhập CSV giữ đủ chuỗi; các nhãn và dấu `;` cuối; trùng/thay thứ tự; không cộng hai lần; không chuyển tháng thành tiền; nhận đúng VND/VNĐ; không tự suy khoản lạ; không dùng thời hạn tháng 6–7; giữ lỗi policy sau khi duyệt; case Sibling New 3T hợp lệ có thể OK sau xác minh; tổng giờ/loyalty không bị nhân đôi.

Dữ liệu gốc và các chỉnh sửa L đã lưu vẫn được giữ. Người dùng tải lại trang và mở CT để chạy bộ tính mới; không cần cập nhật cầu nối Hub cho thay đổi này.

Kiểm thử trình duyệt: nạp ba CSV giả qua Tải bộ nguồn, mở CT và xác nhận nguyên chuỗi ba nhãn, tiền giảm 18.415.000, phải đóng 39.635.000, vẫn CHECK về gói tiền Siblings/điều kiện khác. Danh sách ba ưu đãi và cảnh báo không chen lấn khi mở toàn màn hình. Ảnh `reference/qa/discount-apply-combination.jpg`. Các file CSV giả không nằm trong bản web.
