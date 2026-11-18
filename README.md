## Truy nguồn DEP qua CT Upgrade · v41 / cầu nối 1.6.23

Upgrade được xem là chặng chuyển đã xác nhận, không đòi thêm Moving-in/out. Nếu thiếu ngày nhưng CT nhận thuộc bộ nguồn của kỳ và có hóa đơn Paid gốc, bộ tính phân bổ số dư tại kỳ đối chiếu. Ngày nâng cấp vẫn để chưa biết; không dùng ngày chốt kỳ làm ngày full hoặc duyệt điều kiện khuyến mãi. Chứng từ đã lưu đủ để tính lại, không bắt kết nối Hub chỉ để đọc lại Moving-out.

Learner Payments truy ngược cả Upgrade và Deposit-to-contract; giữ hóa đơn DEP khi đọc tiếp CT cũ, bổ sung số VAT vào chứng từ đã lưu đúng mã/ID. Chuyển cọc là phân bổ ra khỏi DEP, không phải lần thu thứ hai. Link `/Deposit/detail` và `/deposit/detail` được khớp theo cùng ID đã xác minh. Chi tiết nguồn hiển thị riêng số hóa đơn Paid gốc và lý do chờ kiểm tra.

Thông báo thiếu cầu nối phân biệt trình duyệt đang dùng với tiện ích trên máy tính. Chưa bật kết nối plugin cho khách truy cập: phiên phát triển chưa có công cụ kiểm tra plugin được Sites cho phép và chưa tìm được connector Hub Apollo Việt Nam. Không dùng Apollo.io thay thế hoặc dùng tài khoản chủ web cho khách. [Luồng tiền](docs/hub-upgrade-funding.md) · [Kết nối trình duyệt và tài khoản](docs/visitor-hub-connections.md).

## Cộng tiền Upgrade từ chứng từ đã lưu · v40

Khi GetContractDetail thiếu ngày, cầu nối 1.6.22 đọc riêng ngày tạo CT nhận từ dịch vụ GetContractInfoForUpdate đang có của Hub, kể cả khi tắt lấy chính sách giá. Sổ tiền cũng tận dụng ngày từ chính sách đã lưu sau khi khớp mã CT, ID và link. Hóa đơn Paid gốc được phân bổ vào CT tổng một lần, kể cả đã có PaymentList lịch sử; khoản đã chuyển nơi khác không được dùng lại. Chi tiết hồ sơ hiển thị số tiền thực sự được phân bổ và lý do còn CHECK. Cập nhật cầu nối, tải lại Hub/Promotion và đọc lại CT tổng nếu thiếu ngày; dữ liệu đã đủ thì bấm **Tính lại chứng từ đã lưu**. [Căn cứ và cách tính](docs/hub-upgrade-funding.md).

## Kiểm tra chính sách cập nhật và giờ tặng · v39

Chặn dòng giá có khóa Package khác số tháng/tuần, gồm cả bản cũ đã lưu; không dùng gói 18 tháng dưới khóa 36. Discount trùng mức nền/trộn kỳ chờ sửa nhãn, số tháng tặng sai chờ tính giờ. Gói 36 chia đôi Q4 tặng đúng 2 tuần trả thẳng theo B25/G111; Bảng giá, RULE, CALC và mẫu XLSX dùng chung đơn vị. Trường `straightWeeks` và ô Tuần tặng trả thẳng cho phép cập nhật chính sách mới ngay trên web. [Cách cập nhật](docs/policy-updates.md) · [Giờ tặng](docs/extra-hours.md).

## Sửa giá gốc khi thêm Discount · v38

Package quyết định số tháng mua; nhãn `36/36 siblings` không còn tự đổi gói `36 months` thành 18 tháng. Bộ chọn dùng chung cho Bảng giá, RULE và CALC, kiểm riêng gói chia đôi, các mốc 01/10, 06/10, 31/12 và mâu thuẫn Layer/giờ/gói trong Discount. Chi tiết hồ sơ hiện phép nhân giá gốc và kỳ áp dụng. Xem [căn cứ và ví dụ tính](docs/price-package-policy.md).

## Nguồn tiền Upgrade · cầu nối 1.6.21

Đọc Upgrade from contract / Upgraded to contract từ API và nhãn có link trên Hub, truy CT nguồn trong nền rồi phân bổ số dư có hóa đơn Paid vào CT tổng kể cả không có Moving-in/out. Không cộng trùng PaymentList/Transfer; liên kết vòng, nhiều CT nhận hoặc thiếu ngày/chứng từ giữ CHECK.

## Sửa kết nối Giftcode · dùng chung cầu nối 1.6.21

Voucher dùng cùng phiên bản và link tải với Input, gắn link và báo cáo. Bỏ yêu cầu 1.6.14 ghi cứng; phân biệt lỗi chưa kết nối với Hub đang bận hoặc thiếu tab Hub, giữ dữ liệu đang nhập. Nếu đã cài 1.6.21 chỉ cần tải lại Promotion, không cài thêm tiện ích cũ. [Chi tiết](docs/hub-voucher-import.md).

## Cập nhật 1.6.20 · Dừng đúng CT gốc, đọc PDF E-Invoice trực tiếp

Ẩn khối nhập thêm nguồn ở CT có khoản thu gốc và không có Moving-in; tách Moving-out khỏi Payment. Đọc link `/Downloads/EInvoice/<FKey>.pdf` trong nền từ cả API và DOM, không bắt buộc CenterId; đọc lại bản lưu thiếu, giữ dữ liệu đã có. Cập nhật cầu nối 1.6.20 rồi tải lại Promotion và tab Hub. [Chi tiết](docs/invoice-evidence.md).

## Cập nhật 1.6.19 · Số hóa đơn và Learner Payments

Đọc lịch sử Payments theo Lead/Kid của CT, truy CT/DEP nguồn khác học sinh và đọc số hóa đơn, ngày phát hành, tổng tiền từ E-Invoice PDF trong nền. Giữ riêng UUID, không cộng lại transfer; dữ liệu đã lưu được giữ khi đọc thiếu. Cập nhật cầu nối 1.6.19, tải lại Promotion và tab Hub. Xem [hướng dẫn chứng từ](docs/invoice-evidence.md).

# Promotion Studio · Contract audit

This site implements the user's eight-step workflow: import Export ByCourse, PaymentList and Transfer; recalculate at parent-contract grain; edit H:L; maintain a voucher registry; record verification and evidence; approve only installment-period exceptions; keep verified Hub detail URLs; reopen periods and export the current filter.

## Source and data boundaries

The supplied dashboard/CSS are adapted under `src/supplied/`. The original cash reconciliation, contract grouping, course-source resolution, voucher validation and verification modules are retained under `src/core/`. `IndependentCalculator` uses source-backed price and policy schedules from the supplied roadmap and reference price workbook. Unknown, conflicting, unsupported or insufficiently evidenced rules remain CHECK with missing calculated values; collected cash never supplies a calculated tuition price.

Runtime source files, datasets, edits, vouchers, evidence and Hub links are stored in IndexedDB on the visitor's browser. The `localFetch` adapter services the dashboard's operations locally; private report and evidence bytes are not sent to an application server. Browser/device clearing removes local work. This is not cross-device account synchronization.

Only UI assets, policy/price reference tables and the origin-scoped Hub extension ZIP are published. The previous static transaction snapshots and raw Excel downloads have been removed from the hosted output. Source history is retained in Git.

## Audit semantics

- PaymentList is cash evidence. Paid status and VAT are required for verified funding.
- Transfer moves existing funding. Unproved receipts/transfers are excluded from the displayed CT balance; source warnings remain available in the trace.
- Export is an independent comparison snapshot; it is never counted as a receipt.
- The CT amount check compares the displayed `Q` (CALC due) and `W` (funded receipts/allocations). Matching finite amounts return `OK`, even when Export or source-trace warnings differ. Missing amounts stay pending; real Q/W shortages/surpluses still block. Voucher, policy, course, installment and manual-review checks remain independent.
- A parent CT has one course row. Child receipts leave H/I/J empty; unlinked deposits cannot acquire a course by guesswork.
- Prices and discounts come from dated policy schedules. The roadmap's exact hours conversion is `(months + confirmed gift months) × weekly hours × 25/6`.
- Voucher codes encountered during import/edit create PENDING records. Approval requires the student, center, dates, value and approval basis. The September/October Audit reference cases use gross Before for percentage vouchers (CHECK_INSTALLMENT!O) and a 1,000 VND comparison threshold. Outside this reference window, the previous source-based discount basis and 1 VND comparison remain; Audit absence is not a policy ban. Scope and approval checks remain independent; hours are rounded and compared within 1 hour.
- Price rules and vouchers use separate reference models and tables. Voucher updates rebuild the displayed registry instead of preserving stale mixed policy rows. Times City voucher center `HN24.TCY` explicitly maps to PaymentList/Export `HN24.TC`; unrelated center codes, students and dates remain blocked.
- Sibling, loyalty, course-source and same-day enrollment evidence are independent gates. Missing is not zero.
- Approved affects only `CHECK - VƯỢT KỲ`. It does not bypass no-installment policies, unknown terms, price/amount differences, vouchers, eligibility or evidence checks.
- The `Duyệt điều kiện` view gives every applicable manual check its own column, including CEO/RCM, same-day enrollment, sibling and loyalty. A checked item reads `Đã duyệt`; it applies only to that condition. Reviews bind CT/student, course inputs, giftcode, promotion, EPP, full-payment date, target and net amount. Changed case inputs invalidate the old review. The former large verification form is removed; existing verification data is retained.
- Payment info uses the four-column green allocation card with a separate expandable vertical timeline for each original invoice. It displays each original invoice once, preserving its PaymentList date, payment code, method and installment term. `Luồng` expands its source DEP, intermediate CTs and receiving CT with dates and references. The allocation header sums only distinct incoming movements at the viewed CT; intermediate transfers are never extra cash. Partial mixed invoice pools remain unassigned per invoice when the source cannot prove a split.
- Edits are keyed by parent CT and student identity, so a different student cannot inherit them across periods. IndexedDB version checks avoid overwriting changes from another tab.

## Hub bridge

Bridge 1.6.3 adds Giftcode lookup and voucher autofill through the user's signed-in Hub tab. It searches the complete code in `/giftcode/manage`, follows an observed detail link and confirms that full code in List gift code before filling the form. Student identity is prefilled from the current CT and checked against any explicit Hub assignment. Source URL/time/status are persisted; a missing or changed approval remains pending. See `docs/hub-voucher-import.md`. Live authenticated Hub access was unavailable in the verification browser; automated tests use synthetic DOM, routing and payload fixtures.

The Contract input panel reads H:L in bulk for filtered receiving contracts, resolves missing links through the existing month-index workflow, saves CT/student-scoped evidence and recalculates. Existing inputs/manual edits and invoice facts are preserved; conflicting sources remain CHECK. See `docs/contract-input-autofill.md`. Bridge 1.6.5 is required for the full five-field payload and literal voucher-suffix reading.

Discount type comes from the displayed suffix beside Discount amount (`%` or VND/VNĐ/đ/₫); an unknown or conflicting unit stops autofill. Center code in the exact Giftcode row or the detail's center table takes precedence over broad Region values. All observed pages of a center table are read before returning the scope; incomplete lists stop autofill. Bridge 1.6.5 is required for these corrections.

`dist/downloads/promotion-hub-bridge.zip` is generated from the supplied helper source, scoped to this Site and Apollo HUB. Installation and Hub login remain explicit user actions. No Hub credentials are collected. Manual links are restricted to the expected HTTPS host/port and detail routes; no numeric contract IDs are synthesized. Real Hub integration is not exercised by automated QA.

## Build and verification

Run `npm ci`, `npm run build`, and `npm test`. The static output is `dist/` and the existing Site identity remains in `.openai/hosting.json`.

Tests cover source parsing, duplicate receipts and transfer multiplicity, historical-deposit funding, independent tuition, voucher scope, missing-versus-zero behavior, approval isolation and publication boundaries. Browser QA uses synthetic reports on the preview origin, not personal or production transactions.


## Updating approved price/policy files

Transaction source upload does not modify pricing. The reference workbooks have different, multi-sheet layouts, formulas, eligibility windows and stacking conditions; an arbitrary replacement workbook is not treated as executable policy.

1. Supply the approved original XLSX plus its effective start/end dates, centers/audience and the policy sections it replaces. Preserve source sheet/row references and prior versions for earlier transaction dates.
2. Normalize approved prices, roadmap values and source metadata into `reference/rules-source.json`. `scripts/policy-data.mjs` reads that canonical file at build time. Avoid importing student lists or transaction observations as approved prices.
   Update `reference/policy-register.json` and regenerate `reference/price-evidence.json` with `scripts/verify-policy-sources.py`. Reference views and calculations share `src/core/price-catalog.mjs`; source conflicts cannot fall through to another price.
3. Extend the dated selection in `src/local/calculation.mjs` (`priceFor`) and any changed eligibility/stacking in `src/core/promotions.mjs` and `src/core/verification.mjs`. A numerical change does not prove that the old promotion formula or conditions still apply.
4. Add representative and effective-date-boundary cases, build/test and compare known old/new contracts before committing and deploying. Keep old-date behavior and CHECK for unsupported/missing conditions.

The in-app explanation is under Quy tắc & voucher → Bảng giá chung / RULE → Cập nhật file chính sách giá mới. There is currently no arbitrary-policy-file importer.


## Audit v7 reference cases and final contract identity

Audit v7 covers September/October PaymentList cases only; it is not an exhaustive policy catalogue. Existing source-backed rule schedules remain available, and missing Audit coverage falls back to other normalized source rules. The normalized public policy tables are in `reference/rules-source.json` under `auditPolicy`, with the original workbook filename and SHA-256. No student-specific Audit results, original invoices or voucher registry are included. See `docs/audit-v7-rules.md` for formula references and verification scope.

Parent CT identity follows the verified Transfer graph as of the cutoff. A same-student CT with fully supported transfers, no remaining balance and one unambiguous active destination is folded into the receiving CT, including multi-hop chains. The retired CT remains in source history and Payment info; it is not a second editable course or an additional cash amount. Partial, unproved, cross-student, divergent or cyclic movements stay separate for review. Final-CT edits keep their own identity; retired CT edits/approvals are not inherited.

September Big Bang cash offers select the roadmap fixed-VND column K by Layer/hours/package before date-based Audit supplements. October invoices retain that amount while period/eligibility checks remain active. The reported split course uses G31=58,050,000 and K31=18,000,000, payable 40,050,000 before vouchers. See `docs/big-bang-september-discount.md`.

Regular/odd monthly packages now use the pre-discount monthly amount from the regular 3-month schedule, confirmed by the supplied reference-price workbook. Audit RULE 51–56 are normalized to those amounts, with prior trial-net values retained in correction metadata. Discounts and vouchers are calculated separately; known package schedules remain distinct. See `docs/monthly-gross-price.md`.

Discount apply retains the complete PaymentList value and parses semicolon-separated offers independently. Fixed Siblings cash labels, the primary package discount and gift-month labels are distinct; duplicates/trailing separators do not multiply benefits. Course info shows the full offers. Q4 package/type/layer/proof checks remain independent, including fixed-cash eligibility. See `docs/discount-apply-combinations.md`.

The price catalogue now shows typed monthly/gross/discount/net amounts, conditional gift months, terms, effective dates, coverage and source references from the calculator's own schedule. Policy checks cover multiple base discounts, label/course contradictions, Special30/CEO eligibility, contradictory split facts and reductions above gross. Voucher policy and percent basis are explicit fields. See `docs/consistent-prices-and-policies.md` for the 18-source review, 48-price verification, boundaries and 101 tests.

Bridge 1.6.3 fixes read-only Course info: Price name is the price identity; monetary Course fee is excluded. Labeled Contract No./code can verify a generic heading; nested label/value columns and unrelated DOM activity are handled. Failure messages retain bounded reason/field diagnostics. The test HTML is synthetic; authenticated Hub records have not been verified in this environment.


Bridge 1.6.5 reuses an existing Hub tab for course, monthly index and single-link reads, without creating, navigating, activating or closing browser tabs. It learns the actual GetContractDetail route from observed traffic and performs same-origin GETs for verified detail IDs. A hidden inert iframe provides page/network/DOM fallback and is removed after reading. If no ready Hub tab exists or Hub blocks the frame, the task stops with an actionable error; there is no new-tab fallback. Numeric lookup IDs never supply names. Resume checkpoints remain intact. Voucher/report requests retain their separate explicit flows.

Input progress is stored after every successfully saved CT, scoped by dataset + CT + Student ID + required fields. Retry/reopen skips completed targets, including a refresh-all batch; partial inputs remain pending and preserve earlier source fields. Tạo lượt đọc mới deliberately resets progress without deleting inputs. See docs/silent-input-resume.md. Authenticated Hub API responses were unavailable in the verification environment; tests use synthetic JSON/DOM and Chrome API fixtures.

The reconciliation toolbar uses a search icon that opens a focused search field. Every multi-select filter includes Select all, a partial-selection state, and bulk selection of visible search matches while preserving selections outside those matches.

Course details show Extra hours immediately below Total fee. The same approved award-month accumulator drives Extra hours and Total course hour, with one final Audit rounding. See [gift-hour calculation](docs/extra-hours.md).

Bridge 1.6.7 reads the program names inside Hub Discount benefit wrappers, for example `10.00% (2026 October - Promotion Discount - 12 months)` becomes `2026 October - Promotion Discount - 12 months` in detail Discount apply. Nested name parentheses such as `(TRẢ THẲNG)` are preserved. DOM, API and saved Hub course sources use the same parser; multiple offers are retained once with semicolons. A monetary Discount total is not a program name. Manual edits retain priority. Reload the updated unpacked extension and both Promotion and Hub tabs to use the new reader.

The price catalogue, RULE and Contract calculator now call the same policy selector, including unavailable results and conditional benefits. Summer editions keep separate keys (`S26|12M` / `S26-2|12M`); the duration stays visible even when the financial policy is missing. Reference/Report amounts remain in evidence rather than becoming an approved price. A versioned policy update supplies both views for the same edition, dates, center and student type. Verification compares every catalogue row with the calculator and runs the regression suite. See [policy updates](docs/policy-updates.md).


Bridge 1.6.8 unifies background report, Contract/Deposit link, Course info and Voucher reads through an existing Hub tab. Loading a source batch or completing bulk links starts Contract completion automatically, including scoped voucher enrichment, independent payable/differences and resumable checkpoints. Weekly course names make Package a week count; prices and hours stay in Weeks without fractional months. Case/diacritic/spacing variants share explicit course keys; missing product names default to ATLS. See [completion flow and verification](docs/unified-hub-completion.md).


Bridge 1.6.9 reads master-contract Discount/Giftcode names from both contract and course data, including serialized CourseInfos/Discounts. Partial H/I/J cannot finish a read before offers render; earlier checkpoints are refreshed once. Missing offer inputs do not become zero while a Hub read is incomplete. Detail → Duyệt & xác nhận shows the same scoped condition approvals, installment approval, and validated Voucher approval used by the table. QA confirms toggle/revoke, recalculation and persistence after reload; the 12-month 3-hour example computes 3,870,000 discount, 34,830,000 payable and 163 hours. 231 tests pass; authenticated private Hub is represented by synthetic GET/DOM fixtures.

Bridge 1.6.10 supports only the two verified publication aliases for this Site and keeps replies on the requesting origin. Explicit empty GiftCode + GiftCodeId confirms no voucher; an omitted code or a positive ID/discount amount remains pending. This avoids waiting for a Giftcode row that does not exist for a voucher-free contract. 233 tests pass.


Bridge 1.6.11 prefers the existing Hub Angular contractService GET client and its current role/authentication context, without controller-model writes or $apply. Its fallback reuses only the observed GET route plus validated userRoleId and AJAX header. GroupDiscountName + DiscountName forms the full program name. Automatic completion reads missing CTs by default; course reads have a 14-second budget and bulk vouchers a 15-second absolute deadline. 241 tests pass. The supplied HAR is kept outside the repository and never sent to an external reviewer. See [fast Hub input](docs/fast-hub-input.md).

## Hub policy API · bridge 1.6.12

The existing-tab reader now retrieves the receiving Contract's price and eligible promotion definitions through Hub's own authenticated read services. CALC uses lookup unit prices, stacking, priority, installment variants and voucher limits; saved Contract totals remain comparison values. Inputs and rule snapshots stay local to the user's browser, with resumable bounded reads and manual overrides preserved. See [the API flow, validation and limits](docs/hub-policy-api.md).

## Contract lists · bridge 1.6.13

New read immediately restarts every filtered receiving Contract, including Discount apply and Giftcode No. Detail/payment read services run in parallel through the existing authenticated Hub client, including same-origin application frames. Scoped list evidence is retained for review; timeouts continue to the next CT. The documented local prices and promotion rules calculate immediately without requiring a Hub catalogue response. See [contract lists and checkpoints](docs/hub-policy-api.md).

Validation: 267 automated tests passed, including immediate restart, missing-discount retries, authenticated clients in existing frames, payment lookup deadlines, and independent calculation from the published local policies. Private Hub login remains outside the task browser session.

## Contract memory and XLSX

Receiving CT/student course sources, manual inputs and whole-row calculation snapshots survive refresh. A saved amount is reused only for matching source, policy, voucher, approval and calculation inputs. The input panel restores its last CT/student and progress message after an interrupted refresh. Captured reports, filtered audit results, legacy source downloads and the policy template now download as real XLSX with separate columns and General numeric cells. See [memory, refresh and spreadsheet validation](docs/contract-memory-xlsx.md).

## Transfers, clear approvals and voucher profiles · bridge 1.6.14

Detail approvals use unique sibling keys, show one item per condition with separate evidence requirements and identify the current CT/student. An empty receiving course can inherit coherent same-student course inputs from proved transferred source CTs, including background Hub reads. Source references remain visible; receipts, balances and approvals are not duplicated. Voucher identity comes from the active student, with separate code/student records so another case cannot overwrite it or transfer its approval. 284 tests pass. See [behavior, provenance and verification limits](docs/transfer-course-and-voucher-profile.md).
# Cập nhật truy vết hóa đơn và duyệt tuần tặng

Cầu nối 1.6.18 đọc chứng từ thu gốc qua nhiều CT/DEP trung gian. Chứng từ Paid bổ sung vào cùng sổ tiền với PaymentList, giữ đường chuyển và không cộng lặp. Người trả tại nguồn có thể khác học viên nhận; dữ liệu khóa học được giữ riêng. Xem [hướng dẫn chứng từ bổ sung](docs/upstream-invoice-evidence.md).

Duyệt học bổng tái phí tặng tuần cập nhật Extra hours và tổng giờ ngay, giữ khoản giảm nền và phạm vi duyệt của đúng CT/học viên. Bộ kiểm thử có 319 ca; giao diện đã kiểm tra duyệt, tải lại và lưu nguồn DEP thủ công.
