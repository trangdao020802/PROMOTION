# Bộ ca đối chiếu Audit v7 – tháng 9 và 10

Nguồn: `Audit_Promotion_2026_v7_Giftcode_Fix.xlsx`.
SHA-256: `a95c5b012e095e2ea995aabdb950dae00aa6fb846eaf9fea6b7d77cbfc5d69df`.

Audit chỉ tổng hợp các policy tháng 9–10 và những ca có trong PaymentList; đây không phải danh mục rule đầy đủ. Bảng giá, lộ trình và các file chính sách gốc tiếp tục là nguồn quy tắc. Bảng RULE của Audit bổ sung ca đã thống nhất và kiểm tra hồi quy, không xóa các rule ngoài phạm vi này. Khi không tìm thấy rule trong Audit, bộ tính tiếp tục tra nguồn đã chuẩn hóa khác; không coi việc vắng mặt là policy bị cấm. File giao dịch, kết quả từng học viên và danh sách voucher có tên học viên không được đưa vào mã nguồn công khai.

| Nội dung | Căn cứ trong Audit | Cách áp dụng |
| --- | --- | --- |
| Giá gốc / giá theo kỳ | RULE A3:I56, K3:AR134; CHECK M | Tra đúng layer, giờ/tuần, package và ngày; không lấy tiền đã thu làm giá |
| Gói lẻ | Bảng giá chung: giá gốc RULE_ATLS; Lộ trình BẢNG GIÁ cột F gói 3T | Đơn giá 1 tháng **chưa giảm** × số tháng khi chưa có giá gói riêng. Không nhân từ giá trải nghiệm trong Audit RULE 51–56. Discount/Giftcode kiểm riêng; giữ kiểm kỳ và không nội suy ưu đãi dài hạn |
| Chuyển kỳ 06/10 | RULE Z83:Z84 và các dòng BBQ426/OCT26 | Chọn đúng bảng và mức giảm trước/sau ngày hiệu lực |
| Voucher % | CHECK O; HUONG_DAN B4 | Làm tròn giá trước giảm × tỷ lệ; áp dụng sàn/trần với voucher phần trăm; voucher số tiền giữ giá trị cố định |
| Phải đóng | CHECK Q | max(0, giá gốc − discount − giftcode). Web đối chiếu ở cấp CT tổng: tiền chuyển đã nằm trong tổng thu nên không trừ lần nữa |
| Tổng giờ | CHECK R; RULE Z113 | ROUND((tháng khóa học + tháng tặng đủ điều kiện) × giờ/tuần × 25/6, 0) |
| Sai số | HUONG_DAN B9; CHECK AF | Tiền ≤ 1.000 ₫, giờ ≤ 1; phép kiểm ngân sách nguồn và chống tính trùng vẫn dùng 1 ₫ |
| Gói chia đôi | CHECK AK, M, BD; RULE dòng 40; chính sách gốc Q4 dòng 25/111 | Chỉ dùng lịch chia đôi khi Package xác định rõ: 18 months siblings hoặc 36 SPLIT là 18 tháng/con. Nhãn Discount 36/36 siblings không được đổi Package 36 months thành 18 tháng; vẫn cần duyệt quan hệ và full cùng ngày cho gói chia đôi |
| Loyalty | RULE Z87:Z88; CHECK BB, BD | Đúng 30 triệu cần xác minh; không mặc định 0. Trên ngưỡng và ngừng ≤120 ngày mới chốt tháng tặng |
| Loại ưu đãi | CHECK AL/N/BA/BB/BC | Tặng tháng/trả thẳng/referral không tự biến thành giảm tiền. Q4 không có On Top 5% |
| Trả góp | CHECK S/AE | Kỳ là số nguyên dương; trả thẳng không mang kỳ trả góp. Duyệt vượt kỳ không bỏ qua lỗi policy/voucher |
| Thời hạn | RULE AU:BG | Kiểm ngày, phương thức và thời hạn cọc → full khi đủ dữ liệu; trường hợp cần căn cứ tiếp tục chờ duyệt |
| VTDH | CHECK BD | Có policy riêng; không áp bảng Q4 thông thường chỉ vì package ghi 18 tháng |

## Nhận diện Contract tổng

CT tổng được xác định từ dòng tiền đã được chứng minh, không từ việc hai dòng có cùng Student ID hoặc được sửa thành cùng khóa học. CT chuyển hết tiền đến một CT cuối duy nhất của cùng học viên được đưa vào lịch sử của CT cuối. Giá/gói và chỉnh sửa của CT cuối được giữ riêng. CT chưa chuyển hết, khác học viên, nhiều nhánh, luồng vòng hoặc thiếu hóa đơn gốc tiếp tục cần kiểm tra.

## Đối chiếu tiền theo CT

Cột đối chiếu tiền theo CT so trực tiếp Phải đóng theo CT (CALC, Q) với Tổng thu/phân bổ CT (W). Hai số đã xác định khớp theo ngưỡng kỳ thì trạng thái là OK; cảnh báo chứng từ/Export giữ trong truy vết. Ô chưa tính không được coi là 0. Thiếu/thừa tiền theo Q/W và các kiểm tra policy, voucher, khóa học, trả góp, duyệt vẫn độc lập.

## Phân loại quy tắc và Giftcode

Bảng giá chung, RULE và Voucher lấy dữ liệu từ ba cấu trúc riêng. Voucher chỉ dùng sổ mã Giftcode đã nhập, gồm cả mã đang chờ bổ sung; không chuyển nhãn chính sách như BASE OCT/BASE 2026 thành mã voucher và không giữ các dòng giá bị lẫn trong danh sách hiển thị cũ.

Times City có mã `HN24.TC` trong PaymentList/Export và `HN24.TCY` ở sổ voucher. Bộ kiểm center dùng cặp mã tương đương này, chuẩn hóa chữ hoa và khoảng trắng/dấu phân cách. Không ghép các trung tâm chỉ vì chung tiền tố hoặc hậu tố. Duyệt voucher vẫn phải đúng Student ID, thời hạn, giá trị và căn cứ; nếu center khác, thông báo hiển thị cả mã trên voucher và trên hồ sơ để đối chiếu.

## Phạm vi kiểm tra

Các ca tự động dùng dữ liệu giả: CT trung gian, nhiều bước chuyển, nguồn thiếu Export, sai ngày chốt, chuyển một phần, khác học viên, nhiều nhánh, vòng chuyển và giữ đúng khóa học CT cuối; cùng các công thức giá/voucher/giờ/ngưỡng và điều kiện ở bảng trên.

Lần đối chiếu ban đầu khớp 95/95 dòng có giá CALC dạng số theo ánh xạ của Audit tại thời điểm đó. Kết quả lịch sử này không chứng minh rằng mọi nhãn 36/36 siblings đều là Package chia đôi. Chính sách gốc và Package mua thực tế quyết định số tháng; không sửa giá để khớp tiền quan sát. Xem `price-package-policy.md`.

Kết quả trên cũng có trước bản sửa đơn giá tháng ngày 27/10. RULE 51–56 đã được chuẩn hóa sang giá tháng chưa giảm, lưu giá cũ trong metadata `monthlyPriceSource.corrections`; không giữ giá trải nghiệm đã giảm cho gói lẻ. Xem `monthly-gross-price.md`.

Kiểm tra trên không xác nhận toàn bộ 200 trạng thái AF theo học viên. Bản Excel kiểm theo từng payment, còn web tổng hợp theo CT nhận cuối. Minh chứng, RCM giữ policy cũ, dữ liệu lịch sử thiếu và policy chưa có đủ đầu vào vẫn cần xác minh; không sao chép trạng thái OK của Excel sang web.
