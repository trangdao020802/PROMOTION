# Giờ tặng theo Hour/week

Trong chi tiết Contract, `Extra hours · CALC` nằm ngay dưới `Total fee · CALC`. Giá trị này đổi tổng tháng tặng đủ điều kiện thành giờ, theo Hour/week của chính CT nhận tiền. `Total course hour · CALC` đã bao gồm giờ tặng.

Công thức dùng hệ số `policy.hourFactor` hiện có là 25/6 tuần/tháng:

- Giờ tặng = tổng tháng tặng × Hour/week × 25/6.
- Tổng giờ = làm tròn ((tháng gói của CT + tổng tháng tặng) × Hour/week × 25/6).

Giữ số lẻ khi tính; chỉ làm tròn tổng giờ một lần theo Audit đã thống nhất. Giao diện hiển thị tối đa hai số lẻ ở Extra hours. Ví dụ gói 24 tháng, 3 giờ/tuần, được tặng 1 tháng: giờ gốc 300, Extra hours 12,5, tổng giờ sau làm tròn 313. Với 4 giờ/tuần: giờ gốc 400, Extra hours khoảng 16,67, tổng 417.

Tháng trả thẳng, loyalty và referral lấy từ cùng bộ quy tắc giá đang dùng; mỗi quyền lợi được cộng một lần. Gói 36 chia đôi chỉ có nửa tháng trả thẳng cho từng CT khi đủ điều kiện sibling. Tháng loyalty/referral vẫn cần đúng đối tượng và căn cứ. Nguồn chính sách Q4: `2026 Price & Promotion - update 10.10.26.xlsx`, sheet `Big bang promotion 6.10 - 31.12`, B24 (cộng gộp), B25/G111 (chia đôi), C39:F39 và C56:F56 (trả thẳng).

Nhãn như `1 Months (Sep/Oct2026 - Tặng Tháng (TRẢ THẲNG) - All layer - Tặng 1 tháng)` mô tả một tháng tặng, không thay Package thành một tháng. Số tháng ghi trong nhãn được kiểm tra với rule; không tự cấp số tháng tùy ý từ nhãn. Nhãn Sep/Oct có cửa sổ tháng 9–10; không làm thay giá giảm tiền sang một kỳ khác.

`0` là không có tháng tặng áp dụng đã xác định. Thiếu giờ/tuần, chưa chốt loyalty/sibling/ngày full hoặc nhãn tháng tặng chưa có rule thì hiển thị `Chưa tính`. Duyệt kỳ trả góp không cấp quyền lợi trả thẳng. Không ghi đè tổng giờ gốc từ PaymentList/Export; chênh lệch giờ tiếp tục xuất hiện trong đối chiếu.

Các ca kiểm thử dùng dữ liệu giả, gồm 3/4 giờ mỗi tuần, tháng lẻ và nửa tháng, cộng gộp đúng điều kiện, nhãn trùng, thiếu căn cứ, sai số tháng, ngoài kỳ và đổi Hour/week. Các file chính sách và file giao dịch gốc không bị sửa.
