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
- Gom theo CT tổng, tính học phí độc lập theo bảng giá/quy tắc và đối chiếu dòng thu, phân bổ, chuyển ra. Export không tạo tiền thu.
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
