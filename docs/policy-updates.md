# Giá theo khóa và cập nhật chính sách

Bản 29/10/2026 thêm danh mục giá có cấu trúc, dùng chung cho Bảng giá, RULE và CALC. Course Fee vẫn hiển thị nguyên văn. Khóa ghép lấy chương trình, phiên bản năm, layer, giờ/tuần, loại gói và số tháng của CT. Khác chữ hoa, dấu phân cách hoặc mô tả thêm không làm mất giá. Mâu thuẫn năm/layer/giờ/gói vẫn chặn tính; không lấy tiền thu để chọn giá gần nhất.

## Những nguồn đã bổ sung

- Bảng tra cứu và báo cáo chính sách mới: gói 18 tháng đóng một lần, ATLS/AGLS, AHP Layer 2, chia đôi 18/24 tháng, trải nghiệm 1 tháng.
- Văn bản 10.10.26, sheet Vững tin đồng hành: CT kỳ 1–4 là 2 tháng, kỳ cuối 10 tháng mới xét học bổng đúng hạn; không coi cả hành trình 18 tháng là một CT kỳ 2 tháng.
- Văn bản 2023–2024, tab 2025: giá áp dụng New từ 01/11/2024, Current từ 01/12/2024. Tách giá thường 6/9/12/18/24, gói ngắn 2–5 tháng, chia đôi 12/18/24, giá tuần toàn quốc. Học bổng cũ và referral là các thành phần riêng. Giá cũ sau khi giá 2026 có hiệu lực cần xác minh căn cứ giữ giá.
- IELTS dùng gross và net đã làm tròn trong bảng chính sách. Gói 18 tháng cần phân biệt 2 khóa 144 giờ / 3 khóa 96 giờ trước khi chốt số kỳ.
- Premium dùng sheet Premium Price & Promotion 2026, tách khỏi bảng Premium Price cũ. Mức phí nhóm là cho cả lớp; không áp toàn bộ phí lớp lên một CT học viên.

Table 1 trong file tổng hợp có đoạn bị dịch cột (98–145); không đọc các ô đó như giá gốc/net. Các con số Full Experience dẫn bản 01.06.26 nằm trong bảng đề xuất. Không dùng chúng để thay bảng New Price 2024 chính thức. PaymentList là nguồn đối chiếu, không cung cấp giá hoặc mức giảm còn thiếu.

Các SKU Summer, upsell 15 tháng, VTDH2024 tiếp tục cần bản chính sách và điều kiện đúng sản phẩm/kỳ. Bảng 2025 hiện ghi VTDH dừng áp dụng từ 14/01/2026 đến khi có thông báo mới; không tự áp lộ trình VTDH2026 lên các CT cũ. Ứng dụng trả thông báo theo khóa/phạm vi cần bổ sung thay vì xác nhận giả rằng mọi chính sách đã đầy đủ.

## Tự cập nhật trên web

1. Quy tắc & voucher → Bảng giá chung hoặc RULE → Cập nhật chính sách giá trên web.
2. Tải mẫu CSV; điền đúng chương trình (`ATLS`, `AGLS`, `ATLS/AGLS`, `AHP`, `IELTS`, `PREMIUM`), năm, layer, giờ/tuần, loại gói, số tháng, giá tháng trước giảm, gross, discount, maxTerms, tháng tặng và ngày hiệu lực. `ATLS/AGLS` áp khung dùng chung. Dùng `0` khi mức giảm/kỳ/tháng tặng thực sự bằng không.
3. Điền nguồn, căn cứ duyệt, center (`*` là toàn bộ), đối tượng và nhãn Discount apply được phép. Điều kiện hồ sơ và voucher vẫn kiểm tra riêng.
4. Có thể nhập XLSX có cột chuẩn hoặc đúng sheet Bảng Tra Cứu Giá Promotion 2026. Các cột Base/Q4 được chọn rõ. Net được tính từ gross − discount, không coi công thức Excel chưa có giá trị lưu là 0. Dòng có nhiều cách hiểu phải sửa hoặc bỏ khỏi bản nháp.
5. Xem trước & kiểm tra. Thiếu đầu vào, giá âm, discount vượt gross, khóa trùng và thời kỳ/phạm vi chồng lấn sẽ chặn áp dụng.
6. Áp dụng & tính lại: lưu phiên bản và con trỏ đang dùng trong một giao dịch IndexedDB rồi mở lại bộ tính. Phần thời kỳ cũ ngoài đoạn thay thế được giữ. Tab khác ghi đồng thời sẽ bị phát hiện qua version.
7. Lịch sử phiên bản & khôi phục chuyển về bản đã lưu hoặc bộ phát hành. Xuất JSON để sao lưu/nhập ở máy khác. Đây là thay đổi trên trình duyệt hiện tại; không tự phát hành bộ giá cho các máy khác.

Không hỗ trợ diễn giải tự động một văn bản Excel/PDF bất kỳ thành quy tắc tài chính. Dùng định dạng chuẩn hoặc chuẩn hóa các cột và phạm vi trước khi áp dụng.

## Hiệu năng và phạm vi kiểm thử

Cầu nối 1.6.6 dùng GetContractDetail ở route thực sự quan sát được; thử đọc HTML tĩnh của URL CT đã xác minh trước khi phải nạp ứng dụng Hub trong khung ẩn. MutationObserver xử lý ngay khi Course info xuất hiện. Khung ẩn giữ nguyên URL/focus của tab Hub. Luồng tự gắn link và lấy Input không tạo/đổi/đóng tab; lỗi và hủy cũng không mở tab dự phòng.

Lưu từng CT tái sử dụng chỉ mục nhận diện của bộ nguồn, chỉ cập nhật nguồn khóa học/CT bị ảnh hưởng và gửi một gói nhỏ sang worker. Tiến độ vẫn lưu theo CT/học viên; thiếu dữ liệu tiếp tục ở lượt sau. Kiểm thử batch kiểm chứng một lần dựng nguồn cho nhiều CT, cùng kiểm thử HTML tĩnh, DOM mutation, nhầm học viên, hủy, timeout và không thao tác tab.

Kiểm thử cầu nối dùng dữ liệu giả; tốc độ phản hồi thực của Hub và phiên đăng nhập riêng không thể đo từ môi trường này. Người dùng cần cập nhật cầu nối 1.6.6 rồi tải lại Promotion và tab Hub đã đăng nhập.
