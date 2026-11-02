# Giờ tặng theo Hour/week

Trong chi tiết Contract, `Extra hours · CALC` nằm ngay dưới `Total fee · CALC`. Giá trị này đổi tháng và tuần tặng đủ điều kiện thành giờ, theo Hour/week của chính CT nhận tiền. `Total course hour · CALC` đã bao gồm giờ tặng.

Công thức dùng hệ số `policy.hourFactor` hiện có là 25/6 tuần/tháng:

- Giờ tặng = tổng tháng tặng × Hour/week × 25/6 + tổng tuần tặng × Hour/week.
- Tổng giờ = làm tròn (giờ gốc + giờ tặng).

Giữ số lẻ khi tính; chỉ làm tròn tổng giờ một lần theo Audit đã thống nhất. Giao diện hiển thị tối đa hai số lẻ ở Extra hours. Ví dụ gói 24 tháng, 3 giờ/tuần, được tặng 1 tháng: giờ gốc 300, Extra hours 12,5, tổng giờ sau làm tròn 313. Với 4 giờ/tuần: giờ gốc 400, Extra hours khoảng 16,67, tổng 417.

Tháng trả thẳng, loyalty và referral lấy từ cùng bộ quy tắc giá đang dùng; mỗi quyền lợi được cộng một lần. Gói 36 chia đôi Q4 tặng đúng **2 tuần trả thẳng** cho từng CT khi đủ điều kiện sibling và full. Không dùng xấp xỉ 0,5 tháng của Audit/lộ trình để nhân 25/6. Giờ tặng là 6 giờ ở lớp 3 giờ/tuần hoặc 8 giờ ở lớp 4 giờ/tuần; Current đủ điều kiện còn được xét riêng 2 tháng loyalty của chính học viên đó. Nguồn chính sách Q4: `2026 Price & Promotion - update 10.10.26.xlsx`, sheet `Big bang promotion 6.10 - 31.12`, B24 (cộng gộp), B25/G111 (chia đôi), C39:F39 và C56:F56 (trả thẳng).

Nhãn như `1 Months (Sep/Oct2026 - Tặng Tháng (TRẢ THẲNG) - All layer - Tặng 1 tháng)` mô tả một tháng tặng, không thay Package thành một tháng. Số tháng ghi trong nhãn được kiểm tra với rule; không tự cấp số tháng tùy ý từ nhãn. Nhãn Sep/Oct có cửa sổ tháng 9–10; không làm thay giá giảm tiền sang một kỳ khác.

`0` là không có giờ tặng áp dụng đã xác định. Thiếu giờ/tuần, chưa chốt loyalty/sibling/ngày full, nhãn chưa có rule hoặc số tháng tặng trái quy tắc thì hiển thị `Chưa tính`. Duyệt kỳ trả góp không cấp quyền lợi trả thẳng; duyệt điều kiện không sửa được số tháng sai trong nhãn. Không ghi đè tổng giờ gốc từ PaymentList/Export; chênh lệch giờ tiếp tục xuất hiện trong đối chiếu.

Các ca kiểm thử dùng dữ liệu giả, gồm 3/4 giờ mỗi tuần, tháng/tuần tặng, cộng gộp đúng điều kiện, nhãn trùng, thiếu căn cứ, sai số tháng, ngoài kỳ và đổi Hour/week. Bảng giá, RULE và CALC cùng giữ đơn vị tuần của Q4 chia đôi. Các file chính sách và file giao dịch gốc không bị sửa.

## Tái phí tặng tuần sau khi duyệt hồ sơ

`Học bổng tái phí - Tặng tuần - Tặng 2 tuần` là quyền lợi giờ, không phải tiền giảm hay hai tháng học. Bộ tính nhận diện riêng họ nhãn này, giữ khoản giảm nền 12 tháng độc lập và chỉ chốt giờ tặng sau khi duyệt điều kiện cho đúng CT + Student ID + bộ đầu vào. Nhãn tặng một tuần cũng được hỗ trợ khi có căn cứ duyệt riêng. Nhãn khác không tự nhận số tuần từ một chuỗi bất kỳ.

- Giờ tuần tặng = số tuần × Hour/week, không nhân 25/6.
- Extra hours = giờ tháng tặng đủ điều kiện + giờ tuần tặng đủ điều kiện.
- Tổng giờ = làm tròn (giờ gốc + Extra hours), đúng một lần.

Ví dụ dữ liệu giả: ATLS 2026 Layer 1, 12 tháng, 3 giờ/tuần, ưu đãi October 10%, trả thẳng đủ điều kiện tặng một tháng và tái phí được duyệt tặng hai tuần: giá gốc 38.700.000; Discount 3.870.000; phải đóng 34.830.000; giờ tặng 12,5 + 6 = 18,5; tổng giờ 169. Không lấy tiền thu làm công thức giảm.

Nguồn mô tả cơ chế tái phí sớm: `2026 Price & Promotion - update 10.10.26.xlsx`, sheet `2026 ATLS Price đến 3092026`, dòng 27/45 (4/3 giờ mỗi tuần), dòng 28/46 (gói chia đôi và cửa sổ lịch sử). Nguồn này yêu cầu đóng full trước hai tháng ngày hết phí và có giới hạn kỳ; không phải bằng chứng tự động áp dụng cho tháng 10. Mục Học bổng tái phí · Tặng tuần phải xác nhận ngày hết phí, ngày full, kỳ áp dụng và quyền cộng gộp; ngoài chính sách chung cần căn cứ ngoại lệ cho hồ sơ.

Giữ phạm vi duyệt theo CT/học viên và nhận lại ô duyệt chung của v33 khi chưa có ô duyệt tuần mới; lựa chọn bỏ duyệt mới luôn có ưu tiên. Hồ sơ đã duyệt có thể tính lại sau tải trang. Bỏ duyệt hoặc đổi học viên, gói, giờ, mã, ưu đãi hay ngữ cảnh tiền thì giờ chờ xác minh trở lại. Học viên New, số tuần mâu thuẫn và ưu đãi giảm tiền thiếu công thức tiếp tục CHECK; duyệt điều kiện không tự điền số tiền thiếu bằng 0. Cấu hình Hub có tên ưu đãi này cũng giữ đơn vị tuần, không coi trường GiftMonths là hai tháng.
