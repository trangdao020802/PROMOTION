# Bảng giá, quy tắc và voucher

Bảng giá và bộ tính cùng gọi `roadmapSchedule` trong `src/core/price-catalog.mjs`. Khóa gồm loại/đời giá, Layer, giờ, gói và kỳ chính sách. Group/KOC được trình bày đầy đủ; nhiều KOC cùng giá không bị chọn một cách tùy ý.

Đã đọc 16 workbook dự án và hai bản bảng giá/lộ trình bổ sung. `reference/price-evidence.json` lưu tên file, SHA-256, ô giá đã đối chiếu và tổng hợp sheet Bảng giá chung; không chứa sheet giao dịch, danh sách học viên hoặc sổ voucher cá nhân. 48 lộ trình khớp giá tháng/Q4 và các khoản tiền Big Bang Sep gói dài trong chính sách gốc. Hai file lộ trình khớp các cột được dùng. 192 dòng biểu diễn bốn kỳ, gồm 18 dòng gói 3/6/9 của Sep ghi rõ không áp dụng chương trình; 174 dòng có giá/công thức phù hợp về cấu trúc. Điều kiện từng học viên vẫn kiểm tra riêng.

| Nguồn | Giá tham chiếu | Nguồn giá | Report quan sát |
| --- | --- | --- | --- |
| Bảng giá chung gốc | J: Audit; H có thể lấy từ Report | I | K |
| Bảng giá chung bổ sung | J | K | L |
| Lộ trình BẢNG GIÁ | F × E = G | Ô nguồn/văn bản theo kỳ | Không dùng để tính |

Lộ trình nền dùng H/I/J; Sep dùng K/L/N; tháng 10 dùng P/Q/S; Q4 dùng U/V/Z. M/R/W là tháng trả thẳng, X loyalty, Y referral Q4. Tiền, tháng tặng và kỳ trả góp có đơn vị riêng. Mỗi dòng kiểm tra khóa/cột, giá tháng × số tháng = giá gốc, giá gốc − giảm = net, giới hạn kỳ, nguồn duy nhất và giá chuẩn hóa khớp bằng chứng. Trùng/mâu thuẫn làm phép tính phụ thuộc để trống và CHECK; không rơi xuống Audit/Report để che lỗi.

`reference/policy-register.json` trình bày ngày, đối tượng, lợi ích, điều kiện, cộng gộp, minh chứng và sheet/dòng. Audit tháng 9–10 chỉ là bộ ca kiểm chứng. Giá 2024/IELTS/Summer/Premium/VTDH, mã gói đặc biệt và giá chỉ có từ Report không tự nhận công thức ATLS 2026. Các rule Giftcode suy từ tiền tố trong workbook tham chiếu không được dùng để tự cấp tỷ lệ hoặc chứng minh điều kiện.

Các kiểm tra bổ sung:

- Nhiều ưu đãi giảm nền cùng kỳ; Layer/giờ/gói ghi trong nhãn khác khóa thực tế.
- Special30: center, ATLS, New/Current, giờ, gói 6/9 và duyệt gói 3; Current LBB không đủ phạm vi. Không cộng ưu đãi khác ngoài điểm giới thiệu; Flash 26/08 có ngoại lệ riêng.
- CEO gắn từ trường chính sách voucher: ATLS 30%/IELTS 45%, gói, kỳ áp dụng/full, ngừng học, cộng gộp và ngoại lệ trả góp 3 tháng. EPP/RCM cần căn cứ đúng học viên.
- Sibling giảm tiền theo Layer/New/gói; khoản cố định trừ sau lũy tiến. Quan hệ được xác nhận là không đủ, cùng Student ID, sai khóa đối ứng hoặc full khác ngày vẫn CHECK sau duyệt.
- Big Bang Sep Tặng tháng giữ khoản giảm tiền của chương trình rồi cộng tháng trả thẳng một lần; gói ngắn không có quyền lợi Sep.
- Tổng Discount + Giftcode vượt giá gốc vẫn CHECK, kể cả khi net hiển thị 0.

Voucher có `policyId` và `percentBasis`. Chọn giá gốc hoặc giá gốc trừ Discount theo căn cứ mã; mặc định giữ cách tính cũ để tương thích nhưng cần xác minh khi cộng Discount. Chính sách/cơ sở được sửa làm đổi phạm vi duyệt cũ. Hồ sơ cũ được giữ nguyên; chưa phân loại không tự biến thành một chương trình chuyên biệt. Approved trả góp chỉ xử lý ngoại lệ vượt kỳ; không xóa lỗi chính sách/tiền/voucher.

Sau khi chuẩn hóa chính sách đã duyệt, chạy `python scripts/verify-policy-sources.py <source_dir> [new_master.xlsx] [new_roadmap.xlsx]` để tái tạo bằng chứng. Script chỉ đọc workbook. Cập nhật lộ trình, register, bằng chứng và ngày hiệu lực cùng nhau; giữ nguồn cũ cho kỳ cũ. Tải bộ nguồn giao dịch không thay chính sách.

101 kiểm thử đạt: toàn bộ 192 dòng giá, nguồn sửa/trùng/mâu thuẫn, Report không trở thành giá chính sách, Special30/CEO, voucher %, phạm vi duyệt, chia đôi và các sửa CT/thu tiền trước đây. Kiểm tra UI dùng danh mục giá và dữ liệu giả. Khớp 48 dòng giá không chứng minh mọi sản phẩm hoặc mọi kết quả PaymentList đều đúng; hồ sơ sai phải giữ khác biệt để phát hiện.
