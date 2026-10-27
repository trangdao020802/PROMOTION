# Promotion Studio · Apollo 2026

Web đối chiếu học phí, khuyến mãi và trả góp từ Export Payment ByCourse, PaymentList và Transfer. Mã nguồn chạy độc lập trên hosting tĩnh, không cần ChatGPT Sites hoặc máy chủ API.

## Chạy tại máy

Cài Node.js 22 trở lên và Python 3. Trong thư mục repo:

```sh
npm ci
npm run build
npm test
npm run preview
```

Mở `http://localhost:4173/`. Bản web để triển khai nằm trong `dist/`. Nếu lệnh Python khác, đặt biến môi trường `PYTHON` cho build.

## Chức năng

- Nhập XLSX/CSV/TSV gồm ba loại nguồn; Audit được đọc từ sheet nguồn, không lấy kết quả Excel đã tính sẵn. Có thể bổ sung PaymentList lịch sử.
- Xác định CT tổng theo luồng Transfer đã có căn cứ. CT trung gian chuyển hết vào CT cuối cùng của học viên được gộp vào lịch sử, không hiện thành khóa học riêng; gói/giờ và chỉnh sửa dùng CT cuối. Chuyển một phần, khác học viên, thiếu căn cứ, nhiều nhánh hoặc luồng vòng tiếp tục được kiểm tra riêng. Export không tạo tiền thu.
- Sửa Course fee KOC, Hour/week, Package, Giftcode và Discount; Enter/rời ô tự tính lại và lưu.
- Voucher mới giữ chờ duyệt; kiểm tra học viên, trung tâm, hiệu lực, mức giảm và căn cứ.
- Duyệt riêng CEO/RCM, sibling, loyalty, ghi danh và thông số gốc. Tích hiện **Đã duyệt**. Duyệt ngoại lệ trả góp là cột riêng. KẾT QUẢ được tổng hợp sau duyệt; nếu còn lỗi có cột **Lý do CHECK còn lại**.
- Moving dùng thẻ xanh bốn cột như ảnh mẫu, mở/đóng lịch sử dọc cho từng hóa đơn. Payment info giữ từng hóa đơn gốc một lần, ngày/phương thức/EPP gốc và luồng DEP → CT trung gian → CT nhận tiền. Chuyển nội bộ không cộng thành tiền thu mới.
- Lưu/mở lại đợt nguồn, tải file gốc và xuất CSV theo bộ lọc; bộ lọc xuống hàng và căn thẳng khi màn hình hẹp.

## Dữ liệu

File giao dịch, chỉnh sửa, dấu duyệt, voucher, minh chứng và link Hub được lưu bằng IndexedDB trong trình duyệt đang dùng. Chúng không được upload lên GitHub hay máy chủ web. Không có đồng bộ tài khoản/thiết bị. Dữ liệu không tự chuyển sang miền khác; khi chuyển hosting cần tải lại bộ nguồn trên miền mới. Xóa dữ liệu trình duyệt sẽ xóa dữ liệu cục bộ.

`reference/rules-source.json` chứa bảng giá và quy tắc đã chuẩn hóa dùng cho build. Repo không chứa báo cáo giao dịch, danh sách học viên, mật khẩu hoặc lịch sử Git của bản Sites.

## Cập nhật file chính sách giá mới

Hiện web chưa tự nhập file chính sách bất kỳ. **Tải bộ nguồn** chỉ cập nhật dữ liệu giao dịch từ Export / PaymentList / Transfer. Khi có chính sách mới:

1. Cung cấp file Excel đã duyệt, ngày hiệu lực từ/đến, trung tâm/đối tượng áp dụng và phần chính sách được thay thế. Giữ căn cứ sheet/dòng và phiên bản cũ cho giao dịch kỳ cũ.
2. Chuẩn hóa dữ liệu giá/lộ trình và căn cứ vào `reference/rules-source.json`; không lấy số quan sát của báo cáo giao dịch làm giá được duyệt.
3. Cập nhật khoảng ngày và cách chọn giá trong `src/local/calculation.mjs` (`priceFor`). Nếu thay điều kiện, giảm tiền, tháng tặng hoặc cộng gộp thì cập nhật thêm `src/core/promotions.mjs` / `src/core/verification.mjs`. Đổi bảng giá không tự chứng minh công thức ưu đãi cũ còn đúng.
4. Thêm các ca kiểm thử trước/đúng/sau ngày hiệu lực, đối chiếu hồ sơ mẫu của kỳ cũ và mới; chạy build/test rồi commit, push `main` và deploy.

Trên giao diện có hướng dẫn tại **Quy tắc & voucher → Bảng giá chung / RULE → Cập nhật file chính sách giá mới**. Bạn có thể gửi file mới cùng thông tin hiệu lực trong cuộc trò chuyện để cập nhật bộ quy tắc và xuất bản bản mới.

## Bộ ca Audit tháng 9–10 và nguồn chính sách

`Audit_Promotion_2026_v7_Giftcode_Fix.xlsx` là bộ ca đã thống nhất cho tháng 9–10 có trong PaymentList, **không phải toàn bộ danh mục rule thực tế**. Các bảng giá, lộ trình và chính sách gốc vẫn được giữ; rule vắng trong Audit tiếp tục tra các nguồn đã chuẩn hóa khác.

Dữ liệu tham chiếu nằm tại `reference/rules-source.json` → `auditPolicy` (kèm tên file và SHA-256). Ngưỡng tiền 1.000 ₫ và cơ sở voucher % trên giá trước giảm áp dụng trong phạm vi ca Audit tháng 9–10; không tự thay tham số kỳ khác. Tổng giờ làm tròn theo công thức kiểm chứng. Không chứa danh sách học viên, kết quả giao dịch hay voucher cá nhân của file Audit.

Xem [căn cứ công thức và phạm vi kiểm tra](docs/audit-v7-rules.md). Kiểm thử dùng dữ liệu giả cho CT trung gian, các giới hạn gộp, giá theo kỳ, gói lẻ, voucher, giờ học và duyệt. Đối chiếu giá gốc trên 95 dòng có số trong Audit khớp 95/95; đây không phải khẳng định mọi trạng thái AF trong Excel đã được sao chép hoặc toàn bộ policy thực tế đã được chuẩn hóa.

## Hosting miễn phí

### GitHub Pages

Repo có workflow `Deploy GitHub Pages`. Trong repo: **Settings → Pages → Source → GitHub Actions**, rồi **Actions → Deploy GitHub Pages → Run workflow**. Workflow build với đường dẫn `/PROMOTION/`; URL dự kiến là `https://trangdao020802.github.io/PROMOTION/` sau khi GitHub báo deploy thành công. Để tự deploy mỗi lần push main, tạo repository variable `ENABLE_PAGES=true` sau khi bật Pages.

Workflow `CI` tự build và chạy test khi push lên `main`.

### Cloudflare Pages

Connect repo này, chọn framework **None**, build command `npm run build`, output directory `dist`, Node.js 22. Được cấp subdomain `*.pages.dev`. Đặt `BASE_PATH=/`; `SITE_ORIGIN` là origin HTTPS thực tế nếu dùng tên miền riêng. Build tự nhận `CF_PAGES_URL` khi có.

### Netlify

Import repo này; `netlify.toml` đã khai báo build `npm run build` và publish `dist`. Được cấp subdomain `*.netlify.app`. Build nhận biến `URL` của Netlify để tạo đúng cầu nối.

Các địa chỉ trên là subdomain miễn phí của nhà cung cấp; tên miền riêng như `.com` cần mua riêng.

## Hub bridge

Build tạo `dist/downloads/promotion-hub-bridge.zip` từ mã nguồn tại `reference/hub`. Cấu hình `SITE_ORIGIN` đúng origin HTTPS của website và `BASE_PATH` đúng đường dẫn trước khi build. Cài/cập nhật extension ZIP mới khi đổi miền. Người dùng tự đăng nhập Apollo Hub và bấm lấy dữ liệu; tiện ích không đọc cookie/mật khẩu và không ghi lên Hub. Đã kiểm tra bằng dữ liệu giả; tích hợp tài khoản Hub thật cần kiểm tra trong phiên của bạn.

## Cấu trúc

- `src/core`: phân bổ, tính toán, điều kiện, voucher, duyệt và tổng hợp kết quả.
- `src/local`: IndexedDB, API cục bộ, worker và các phần giao diện.
- `src/supplied`: giao diện, CSS và parser gốc được điều chỉnh.
- `scripts`: build, đóng gói bridge và preview tại máy.
- `tests`: kiểm tra dữ liệu giả cho tính toán, luồng tiền, duyệt và phạm vi xuất bản.

Nguồn tham khảo hosting: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages · https://developers.cloudflare.com/pages/get-started/git-integration/ · https://docs.netlify.com/start/quickstarts/deploy-from-repository/


## Phân loại RULE và kiểm Giftcode

Quy tắc giá và Voucher dùng hai mô hình/bảng riêng: lưu voucher sẽ dựng lại danh sách mã đã nhập, không giữ lẫn các dòng BASE OCT/BASE 2026. Center Times City `HN24.TCY` trong voucher được đối chiếu với `HN24.TC` của PaymentList/Export; học viên, ngày hiệu lực, mức giảm và căn cứ duyệt vẫn kiểm riêng.


## Đối chiếu CALC với tổng thu CT

Cột đối chiếu tiền theo CT so trực tiếp `Phải đóng theo CT (CALC)` (Q) với `Tổng thu / phân bổ CT` (W). Hai số khớp theo ngưỡng kỳ thì trả `OK`, kể cả khi còn cảnh báo nguồn/Export; cảnh báo giữ trong truy vết. Ô trống không được coi là 0. Thiếu/thừa tiền và các kiểm tra Giftcode, policy, trả góp, khóa học, duyệt vẫn độc lập.


## Tự điền Voucher từ Hub

Cầu nối Hub 1.6.1 tự tra Giftcode đầy đủ tại `/giftcode/manage`, mở link chi tiết có trong kết quả và xác nhận đúng mã trong List gift code. Voucher còn thiếu sẽ tự điền khi mở hồ sơ nếu cầu nối sẵn sàng; có nút Tìm & tự điền từ Hub để đọc lại. Student ID/tên lấy từ CT đang mở và phải khớp thông tin riêng trên Hub nếu có. Phạm vi, ngày hiệu lực, kiểu/mức giảm, sàn/trần, căn cứ và link/thời điểm nguồn được lưu cùng voucher. Kiểm tra trạng thái duyệt rồi bấm Lưu voucher & tính lại. Không tự duyệt ngoại lệ hoặc bấm Create/Update trên Hub. Cần cập nhật tiện ích và đăng nhập Hub trên máy người dùng. Chi tiết tại `docs/hub-voucher-import.md`; kiểm thử dùng dữ liệu/DOM giả, chưa xác nhận đọc tài khoản Hub thật trong phiên này.

Bản 1.6.1 đọc đơn vị ngay cạnh Discount amount: `15 %` là 15%, `2.000.000 đ` là số tiền 2.000.000 VND. Không có đơn vị rõ thì dừng tự điền. Center ưu tiên cột Center code của đúng mã hoặc bảng Center code tại trang chi tiết, đọc tiếp nếu phân trang; không thay bằng North/South khi đã có mã center. Cần cập nhật cầu nối rồi bấm Tìm & tự điền từ Hub để sửa lại voucher đã đọc trước đó, kiểm tra và Lưu voucher & tính lại.
