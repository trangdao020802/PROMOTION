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

Xem [căn cứ công thức và phạm vi kiểm tra](docs/audit-v7-rules.md). Kiểm thử dùng dữ liệu giả cho CT trung gian, các giới hạn gộp, giá theo kỳ, gói lẻ, voucher, giờ học và duyệt. Trước đợt sửa giá tháng chưa giảm, đối chiếu giá gốc trên 95 dòng Audit từng khớp 95/95; đây là mốc lịch sử, không phải tiêu chuẩn của toàn bộ bộ tính hiện tại; đây không phải khẳng định mọi trạng thái AF trong Excel đã được sao chép hoặc toàn bộ policy thực tế đã được chuẩn hóa.

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

Cầu nối Hub 1.6.4 tự tra Giftcode đầy đủ tại `/giftcode/manage`, mở link chi tiết có trong kết quả và xác nhận đúng mã trong List gift code. Voucher còn thiếu sẽ tự điền khi mở hồ sơ nếu cầu nối sẵn sàng; có nút Tìm & tự điền từ Hub để đọc lại. Student ID/tên lấy từ CT đang mở và phải khớp thông tin riêng trên Hub nếu có. Phạm vi, ngày hiệu lực, kiểu/mức giảm, sàn/trần, căn cứ và link/thời điểm nguồn được lưu cùng voucher. Kiểm tra trạng thái duyệt rồi bấm Lưu voucher & tính lại. Không tự duyệt ngoại lệ hoặc bấm Create/Update trên Hub. Cần cập nhật tiện ích và đăng nhập Hub trên máy người dùng. Chi tiết tại `docs/hub-voucher-import.md`; kiểm thử dùng dữ liệu/DOM giả, chưa xác nhận đọc tài khoản Hub thật trong phiên này.

Bản 1.6.3 đọc đơn vị ngay cạnh Discount amount: `15 %` là 15%, `2.000.000 đ` là số tiền 2.000.000 VND. Không có đơn vị rõ thì dừng tự điền. Center ưu tiên cột Center code của đúng mã hoặc bảng Center code tại trang chi tiết, đọc tiếp nếu phân trang; không thay bằng North/South khi đã có mã center. Cần cập nhật cầu nối rồi bấm Tìm & tự điền từ Hub để sửa lại voucher đã đọc trước đó, kiểm tra và Lưu voucher & tính lại.

Discount Big Bang Sep giảm tiền lấy cột K theo Layer/giờ/gói trước bảng bổ sung Audit. Chứng từ tháng 10 giữ đúng số giảm, vẫn kiểm tra thời kỳ và điều kiện riêng. Case Layer 1, 3 giờ/tuần, 36 tháng chia đôi: 58.050.000 − 18.000.000 = 40.050.000 trước Giftcode (BẢNG GIÁ!G31/K31/L31). Chi tiết: `docs/big-bang-september-discount.md`.

Gói lẻ dùng đơn giá tháng **chưa giảm** từ bảng giá thường gói 3T để nhân số tháng. Rule 51–56 hiển thị giá đã sửa; giữ giá trải nghiệm cũ trong metadata để truy vết. Layer 1, 3 giờ/tuần: 3.600.000/tháng, 2 tháng 7.200.000. Discount và Giftcode tính riêng. Xem `docs/monthly-gross-price.md`.

Discount apply giữ nguyên chuỗi PaymentList và đọc riêng từng nhãn phân cách bằng `;`. Nhận Siblings 1.000.000/800.000, giảm theo gói và tặng tháng, không cộng trùng hoặc dùng thời hạn tháng 6–7 cho nhãn Q4. Hiển thị đầy đủ các nhãn dưới ô nhập. Vẫn kiểm tra loại/gói, layer, học viên và xác minh riêng. Xem `docs/discount-apply-combinations.md`.


## Bảng giá, quy tắc và voucher thống nhất

Bảng giá và bộ tính cùng dùng lịch giá có khóa loại/đời giá, Layer, giờ, gói và kỳ. Hiển thị giá tháng chưa giảm, số tháng, giá gốc, tiền giảm, net, tháng tặng, kỳ trả góp, phạm vi hỗ trợ và căn cứ từng dòng. Giá Report chỉ để so sánh.

Đã đọc 18 workbook nguồn/tham chiếu, đối chiếu 48 lộ trình với chính sách gốc. RULE có đối tượng, hiệu lực, quyền lợi, điều kiện, cộng gộp và minh chứng. Thêm kiểm tra nhiều giảm nền, sai Layer/giờ/gói, Special30/CEO, dữ kiện chia đôi mâu thuẫn và Discount + Giftcode vượt giá gốc. Voucher có chính sách và cơ sở % rõ ràng; duyệt không bỏ lỗi chính sách.

Cập nhật đồng thời reference/rules-source.json, reference/policy-register.json và reference/price-evidence.json. Tái tạo bằng chứng bằng scripts/verify-policy-sources.py khi có file đã duyệt. Chưa đủ rule vẫn CHECK. Xem [phạm vi, cách tính và 101 kiểm thử](docs/consistent-prices-and-policies.md).


## Tự lấy Input theo Contract

Trên Bảng đối chiếu, bấm **Tự lấy Input** để đọc Course fee KOC, Hour/week, Package, Giftcode No và Discount apply của các CT đang lọc. CT thiếu link sẽ tự tra danh sách Hub theo tháng giống Tự gắn link Hub. Dữ liệu được kiểm tra theo đúng CT nhận tiền / Student ID rồi lưu và tính lại; CT trung gian đã move không trở thành khóa học mới.

Mặc định xử lý CT còn thiếu Input; có thể chọn đọc lại cả CT đã đủ Input để đối chiếu hoặc Dừng lấy Input. Giữ dữ liệu gốc và chỉnh sửa tay; nguồn mâu thuẫn, thiếu minh chứng, voucher chờ duyệt và lỗi chính sách vẫn CHECK. Không thay số tiền thu, ngày/phương thức hóa đơn hoặc tự duyệt điều kiện. Cần cầu nối **1.6.4** và phiên Hub đã đăng nhập trên máy người dùng. Xem [hướng dẫn](docs/contract-input-autofill.md).

Discount amount đọc theo ký hiệu hiển thị ngay sau số: `12,5 %` điền **Tỷ lệ giảm (%) = 12,5**; `2.000.000 Đ` điền **Số tiền giảm (VND) = 2.000.000**. Không suy đơn vị từ giá trị hay tiền tố mã; đọc lại mà thiếu đơn vị sẽ xóa mức giảm Hub cũ để yêu cầu kiểm tra. 125 kiểm thử bằng dữ liệu giả đã qua; trang voucher 19880 yêu cầu đăng nhập trong phiên kiểm tra nên chưa xác nhận giá trị thật của mã này.


## Khắc phục đọc Course info trên Hub · 1.6.3

Price name là tên bảng giá điền vào Course fee KOC; Course fee ở cột tiền không phải tên bảng giá. Bộ đọc hỗ trợ nhãn và giá trị ở các cột lồng, trường Contract No./Contract code khi tiêu đề chỉ ghi Contract detail. Mã CT, URL và Student ID vẫn được kiểm tra; nhiều giá trị thật khác nhau vẫn báo mâu thuẫn. Chỉ dữ liệu Course info thay đổi mới làm đặt lại thời gian chờ ổn định.

Lỗi từng CT chỉ rõ vấn đề mã CT, học viên, trường mâu thuẫn, định dạng hoặc đang tải. Cần dừng lượt cũ, cập nhật tiện ích **1.6.3**, tải lại Promotion/Hub và chạy lại Tự lấy Input. Không thay quyền truy cập hoặc tự duyệt hồ sơ.

125 kiểm thử đã qua. Đã chạy luồng UI đọc DOM fixture theo ảnh và lưu/tính lại 2/2 CT giả; chưa kiểm chứng các CT thật trong tài khoản Hub. Xem [hướng dẫn](docs/contract-input-autofill.md) và `tests/fixtures/hub-contract-readonly.html`.


## Đọc Input trong nền và tiếp tục sau khi hết giờ · 1.6.4

Cầu nối quan sát request GetContractDetail?contractId= của chính tab Hub đang được yêu cầu, đọc ListCourseInfo và dùng Course info có nhãn để bổ sung trường thiếu. Không dựng route API hoặc suy tên từ PriceId, HowweekId, ProductPackageId. Tab CT, danh sách và tìm link chạy nền, tự đóng và không giành tab đang dùng; hết phiên đăng nhập sẽ dừng và yêu cầu mở Hub chủ động.

Tiến độ lưu sau mỗi CT đã lưu đủ trường, tách theo bộ nguồn / CT / Student ID. Hết giờ, dừng hoặc tải lại trang rồi bấm Tiếp tục sẽ bỏ qua CT đã hoàn tất, kể cả lượt đã chọn đọc lại toàn bộ. Trường đọc dở được giữ và tiếp tục bổ sung. Tạo lượt đọc mới bắt đầu lại tiến độ, giữ các dữ liệu đã lưu. Lấy xong Input không tự duyệt chính sách, voucher hoặc chênh lệch tiền.

142 kiểm thử đạt. Giao diện đã thử 3 CT giả: ngắt tại CT thứ hai, tải lại trang, tiếp tục đúng 2 CT còn lại; CT thứ nhất chỉ đọc 1 lần. JSON/API, DOM và Chrome API trong bài thử là mô phỏng; chưa xác nhận phản hồi API tài khoản Hub thật. Xem [hướng dẫn](docs/silent-input-resume.md). Cần cập nhật tiện ích 1.6.4 rồi tải lại Promotion và Hub.


## Không tạo tab mới khi lấy link / Input · 1.6.5

Tự gắn link CT/DEP, tìm một mã và Tự lấy Input dùng tab Hub có sẵn, không tạo, chuyển, đổi URL hay đóng tab đó. Mở hoặc tải lại Hub và đăng nhập trước. Chưa có tab sẵn sàng thì báo lỗi để kiểm tra. GetContractDetail chỉ dùng route thực tế đã quan sát; ID lấy từ link đã xác minh. Khung đọc ẩn trong tab Hub bổ sung danh sách / DOM khi cần và được dọn sau lượt đọc. Hub chặn khung thì dừng, không mở tab thay thế.

Tiến độ CT đã lưu được giữ; hết giờ hoặc hủy rồi bấm lấy tiếp sẽ bỏ qua CT đã đủ. 153 kiểm thử đạt, gồm Chrome API cấm create/update/remove ở cả ba luồng, sai agent, sai CT/học viên, thiếu tab, hủy, timeout và chuyển trang. Kiểm tra giao diện dùng dữ liệu giả; chưa xác nhận frame/API tài khoản Hub thật. Cập nhật tiện ích **1.6.5**, tải lại Promotion và các tab Hub. Chi tiết tại [hướng dẫn](docs/silent-input-resume.md).


## Tìm kiếm và chọn tất cả trong bộ lọc

Bảng đối chiếu dùng biểu tượng kính lúp; bấm để mở ô tìm kiếm. Khi đóng ô, từ khóa và kết quả lọc được giữ. Bộ lọc nhiều giá trị có **Chọn tất cả**, trạng thái chọn một phần và **Chọn tất cả kết quả** khi đang tìm giá trị; các mục đã chọn ngoài kết quả tìm vẫn được giữ.


## Extra hours và tổng giờ khóa học

Chi tiết CT có **Extra hours · CALC** ngay dưới **Total fee · CALC**. Giờ tặng = tổng tháng tặng đủ điều kiện × Hour/week × hệ số 25/6 tuần/tháng. Tổng giờ khóa học đã cộng giờ tặng và chỉ làm tròn sau khi cộng; không cộng lại từng ưu đãi vào tổng đã tính. Một tháng tặng ở lớp 3 giờ/tuần là 12,5 giờ, ở lớp 4 giờ/tuần khoảng 16,67 giờ. Gói 24 tháng tương ứng có tổng 313 hoặc 417 giờ sau khi tặng một tháng.

Tháng trả thẳng / loyalty / referral theo cùng bảng chính sách, không tự cấp theo số bất kỳ trong nhãn. Gói 36 chia đôi có nửa tháng trả thẳng cho mỗi CT khi đủ điều kiện. Nhãn `1 Months (Sep/Oct2026 ... Tặng 1 tháng)` mô tả tháng tặng, không biến Package thành một tháng. Thiếu dữ liệu / căn cứ thì **Chưa tính**; số 0 là không có tháng tặng đã xác định. Giữ tổng giờ nguồn từ Export/PaymentList để đối chiếu chênh lệch. 169 kiểm thử đạt, gồm 16 ca mới cho giờ tặng; đã kiểm tra giao diện bằng 2 CT giả 3/4 giờ/tuần. Xem [cách tính giờ tặng](docs/extra-hours.md).


## Lấy Input nhanh và cập nhật chính sách ngay trên web

Cầu nối 1.6.6 đọc nền trong tab Hub hiện có, ưu tiên API/HTML đã xác minh và theo dõi DOM để giảm chờ. Lưu từng CT dùng lại chỉ mục nguồn; không dựng lại toàn bộ luồng tiền. Tiến độ tiếp tục sau khi dừng/hết giờ.

Giá ghép bằng khóa chương trình, năm, layer, giờ và loại gói; không cần Course Fee trùng nguyên văn. Bổ sung 160 dòng chính sách có cấu trúc cho giá lịch sử2024, gói chia đôi, VTDH2026, trải nghiệm, IELTS, Premium và giá tuần. Quy tắc cũ/mới và điều kiện của từng CT được kiểm tra riêng.

Quy tắc & voucher → Bảng giá chung / RULE → Cập nhật chính sách giá trên web: tải mẫu CSV hoặc nhập XLSX/JSON, xem trước, kiểm tra và áp dụng. Có lịch sử phiên bản, khôi phục, xuất JSON; dữ liệu chính sách cập nhật lưu tại trình duyệt. Xem [nguồn, cách cập nhật và giới hạn đã xác minh](docs/policy-updates.md).


## Discount apply lấy từ Hub

Cầu nối 1.6.7 lấy tên chương trình trong cặp ngoặc ngoài cùng của Discount. Ví dụ `10.00% (2026 October - Promotion Discount - 12 months)` tự điền `2026 October - Promotion Discount - 12 months` vào Chi tiết hồ sơ → Discount apply. Giữ nguyên ngoặc bên trong như `(TRẢ THẲNG)`, ghép nhiều chương trình bằng dấu chấm phẩy và loại mục trùng. Dữ liệu DOM, API và nguồn Hub đã lưu dùng cùng bộ đọc; chỉnh sửa tay vẫn được ưu tiên. Số tiền Discount đứng riêng không được xem là tên chương trình.

Tải cầu nối mới, giải nén, tải lại tiện ích ở chrome://extensions hoặc edge://extensions rồi tải lại Promotion và tab Hub. Kiểm chứng bằng 200 kiểm thử tự động, gồm đủ ba ví dụ yêu cầu; dữ liệu kiểm thử Hub là giả lập.


## Bảng giá và bộ tính dùng cùng một quy tắc

Bảng giá chung, RULE và bộ tính theo Contract cùng gọi một hàm chọn chính sách. Giá, số tháng, mức giảm, net, tháng tặng, kỳ trả góp và trạng thái thiếu chính sách được đối chiếu bằng cùng đầu vào. Kiểm thử so khớp toàn bộ 445 dòng của bộ chính sách hiện tại; 205 kiểm thử tự động đạt.

`12 months (S26-2)` được nhận diện là 12 tháng với mã `S26-2|12M`, tách khỏi `S26|12M` và gói 12 tháng thường. Khi chưa có chính sách đúng phiên bản, số tiền trong bảng tham chiếu/Report chỉ nằm trong căn cứ; các trường tài chính và tháng tặng chưa xác định không bị điền thành 0. Cập nhật chính sách đúng ngày, center và đối tượng sẽ áp dụng đồng thời ở Bảng giá, RULE và CT phù hợp. Xem [cách cập nhật](docs/policy-updates.md).


## Gói tuần và luồng Hub hợp nhất 1.6.8

Nhận diện Course fee theo chương trình/năm/Layer/loại gói và các dữ kiện rõ như 18 tháng đóng một lần. Chuẩn hóa chữ hoa/thường, dấu tiếng Việt, dấu phân cách và khoảng trắng; thiếu tên chương trình mặc định ATLS. Course fee gói tuần dùng Weeks, số tuần × Hour/week và đúng bảng giá tuần, không đổi thành số tháng lẻ.

Tải/mở nguồn mới và hoàn tất gắn link hàng loạt tự chuyển sang hoàn thiện CT nhận tiền: tìm link còn thiếu → lấy Course info → tra đủ Giftcode No → lưu Voucher → tính tiền phải đóng và chênh lệch → lưu tiến độ từng CT. Voucher PENDING đã có căn cứ Hub và đủ dữ liệu có thể tính số tiền nhưng vẫn CHECK chờ duyệt. Thông tin tay, tiền thu và luồng Transfer được giữ.

Báo cáo, Voucher, link CT/DEP và Input đều dùng tab Hub hiện có, không tạo/đổi/chuyển/đóng tab trình duyệt. Cập nhật cầu nối 1.6.8 rồi tải lại Promotion và tab Hub đã đăng nhập. 219 kiểm thử tự động đạt; đã kiểm tra giao diện bằng ba nguồn giả và bảng Weeks. Hub có xác thực được kiểm chứng bằng fixture, chưa dùng phiên riêng thực tế. Xem [luồng hoàn thiện và kiểm chứng](docs/unified-hub-completion.md).


## Bản 27 · Discount theo CT tổng và duyệt trong Chi tiết hồ sơ

Cầu nối 1.6.9 đọc Discount/Giftcode ở cấp CT tổng và khóa học, hỗ trợ CourseInfos/Discounts dạng JSON; giá, giờ và gói có trước không kết thúc sớm lượt đọc ưu đãi. Lượt đã lưu từ bộ đọc cũ được đọc lại để cập nhật mã còn thiếu. Không dùng tiền thu để suy ra tên ưu đãi hoặc tự áp mức giảm.

Chi tiết hồ sơ → Duyệt & xác nhận có đầy đủ các mục duyệt áp dụng, ngoại lệ trả góp và duyệt Voucher khi đủ hồ sơ. Tích/bỏ tích tự lưu, tính lại và đồng bộ với bảng; kiểm tra chênh lệch tiền vẫn độc lập. 231 kiểm thử đạt; giao diện đã kiểm tra lưu, bỏ duyệt và mở lại sau tải trang bằng dữ liệu giả. Phiên Hub riêng được kiểm tra bằng fixture GET/DOM, chưa truy cập trực tiếp.

Xem [luồng và phạm vi kiểm chứng](docs/unified-hub-completion.md) và [ảnh mục duyệt](reference/qa/detail-approvals-v27.jpg). Cập nhật cầu nối 1.6.9 rồi tải lại Promotion và Hub trước khi lấy lại Input.


Bản 28 dùng cầu nối 1.6.10: hỗ trợ đúng hai địa chỉ đã xác minh của cùng Site (`promotion-hub-2026.quanghuym24.chatgpt.site` và địa chỉ cũ `promotion-hub-2026.roundskunk11.chatgpt.site`), giữ kiểm tra origin của từng yêu cầu. GiftCode/GiftCodeId được Hub trả rõ là rỗng xác nhận không có voucher; trường bị thiếu hoặc có ID/tiền giảm đối nghịch vẫn chờ đọc. 233 kiểm thử đạt; cập nhật cầu nối rồi tải lại Promotion và Hub.
