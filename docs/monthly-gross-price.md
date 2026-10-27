# Gói lẻ: đơn giá tháng trước giảm

## Căn cứ đã đối chiếu

File người dùng gửi `Bang_gia_chung_doi_chieu_Report (1).xlsx`, sheet `Bảng giá chung`, cột J là **Giá gốc (Amount before discount)**. Chỉ đọc các dòng có cột K ghi `RULE_ATLS`, không lấy giá phổ biến trong Report làm chính sách.

SHA-256: `ebb6a5c93a3aa95e03c318de73de87ace11b25dd1294acc02e5e7b7675ed82f7`.

Hướng dẫn ô A4: gói 2/4 tháng hoặc gói có hậu tố dùng đơn giá tháng của gói 3T × số tháng. Đối chiếu với Lộ trình `BẢNG GIÁ` cột F của gói 3T:

| Layer | Giờ/tuần | Đơn giá tháng chưa giảm | Giá 2 tháng | Ô nguồn J gói 2T / 3T |
| --- | ---: | ---: | ---: | --- |
| 1 | 3 | 3.600.000 | 7.200.000 | J47 / J49 |
| 2 | 3 | 3.450.000 | 6.900.000 | J66 / J68 |
| 3 | 3 | 3.300.000 | 6.600.000 | J79 / J81 |
| 1 | 4 | 4.800.000 | 9.600.000 | J57 / J171 |
| 2 | 4 | 4.600.000 | 9.200.000 | J184 / J186 |
| 3 | 4 | 4.400.000 | 8.800.000 | J199 / J90 |

## Sửa quy tắc

Audit RULE 51–56 lưu giá trải nghiệm 3.600.000 (4 giờ) và 2.600.000 (3 giờ). Không dùng các số đã ưu đãi đó làm giá gốc để nhân số tháng.

`src/core/monthly-price.mjs` lấy đơn giá chưa giảm theo đúng layer/giờ. Phải có duy nhất dòng gói 3T với G = F × 3 và các nguồn đã chuẩn hóa không mâu thuẫn. Thiếu hoặc trùng/mâu thuẫn nguồn thì chưa tính giá, giữ CHECK.

Gói chưa có bảng riêng dùng giá gốc = đơn giá tháng × số tháng. Không tự nhân một khoản giảm tháng từ Audit hoặc tự áp ưu đãi dài hạn. Discount/Giftcode tiếp tục đi qua quy tắc riêng; ưu đãi gói lẻ chưa có rule thì chưa tính tiền giảm và giữ CHECK. Điều kiện New của giá trải nghiệm không được gắn sang giá thường cho Renew. Giữ phạm vi ngày tham chiếu và kỳ trả góp gói lẻ 0.

Các gói đã có lịch giá riêng, VTDH, siblings/chia đôi và giá cũ không chuyển sang phép nhân giá gói lẻ.

`reference/rules-source.json` bổ sung 6 đơn giá `monthlyRates` có căn cứ. Cả bảng bổ sung Audit và bảng RULE hiển thị được chuẩn hóa lại 51–56, có ghi CHƯA GIẢM, số cũ giữ trong `monthlyPriceSource.corrections`. 16 dòng giá 2T trong bảng tham chiếu được điền từ đúng các giá gốc RULE_ATLS trong file mới. Không sửa workbook người dùng và không đưa các sheet giao dịch lên web/GitHub.

## Kiểm tra

76 kiểm thử tự động bao gồm sáu tổ hợp layer/giờ, ATLS/AGLS, gói 1/2/4/5 tháng, Audit cũ bị thay bằng giá sau giảm, nguồn trùng/mâu thuẫn/thiếu, Renew, lịch giá dài riêng và khoản giảm chưa có rule. Case giả 3 giờ/tuần Layer 1, 2 tháng: giá gốc 7.200.000; voucher 10% đã duyệt giảm 720.000 một lần, còn 6.480.000. Toàn bộ kiểm tra Big Bang Sep, gộp CT, chứng từ và duyệt cũ tiếp tục chạy.

Trình duyệt kiểm thử đã nạp 3 CSV giả bằng luồng Tải bộ nguồn, mở CT và xác minh Course info 7.200.000, Discount/Giftcode 0, tổng 25 giờ, Summary khớp 7.200.000. Ảnh: `reference/qa/monthly-gross-price.jpg`. Dữ liệu kiểm thử chỉ lưu trên origin preview.
