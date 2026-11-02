# Giá gốc, Package và thời kỳ ưu đãi

Course fee KOC, Hour/week và Package xác định khóa giá. Discount apply chỉ chọn chương trình, mức giảm và điều kiện theo thời kỳ; không thay khóa học, số tháng mua hoặc tự chuyển sang VTDH/chia đôi. Chữ hoa, dấu tiếng Việt và khoảng trắng được chuẩn hóa trước khi so khóa.

## Gói thường và gói chia đôi

| Package đã xác định | Số tháng của hồ sơ | Khóa giá |
| --- | ---: | --- |
| 36 months | 36 | 36 |
| 18 months siblings | 18 | 36 SPLIT |
| 36 SPLIT / 36 tháng (chia đôi) | 18 | 36 SPLIT |
| 36 months siblings | 36 | 72 SPLIT; chưa có lịch giá được duyệt |

Ví dụ kiểm thử dùng ATLS 2026 Layer 1, 4 giờ/tuần, Package 36 months và nhãn `2026 October - Promotion Discount - 36/36 siblings - From 06/10`: giá tháng 4.300.000 × 36 = 154.800.000; giảm 30% = 46.440.000; sau giảm, trước voucher = 108.360.000 VND. Không dùng số tiền 77.400.000 trên Report để đổi thành 18 tháng.

Nếu Package thực sự là 18 months siblings thì giá gốc 77.400.000, giảm 23.220.000 và còn 54.180.000 VND. Quan hệ, CT đối ứng và cùng ngày full vẫn được xác minh riêng.

Khi cập nhật giá trên web, khóa Package cũng phải khớp số tháng/tuần nhập vào. Dòng ghi khóa `36` nhưng giá tháng × 18 tháng bị từ chối; bản cũ đã lưu sai cũng bị chặn khi tính lại. Tương tự với khóa chia đôi, Weeks, phiên bản Summer và Premium.

## Căn cứ nguồn

- `2026 Price & Promotion - update 10.10.26.xlsx`, sheet `Big bang promotion 6.10 - 31.12`: B23 là thời kỳ 06/10–31/12/2026; B25/G111 quy định chia đôi là đơn giá gói 36 × 18 tháng/con. Bảng chuẩn Layer 1, 4 giờ có C32=36, C33=4.300.000, C34=154.800.000, C36=30%, C37=108.360.000.
- `Học phí tháng 10_2026.xlsx`, sheet `10.1 Layer 1 - HV New`: L8=36, L9=4.300.000, L10=30%, L11=`L9*L8*L10`=46.440.000, L12=`L9*L8-L11`=108.360.000. Đây là đối chiếu độc lập cho ví dụ trên.
- `Lo_trinh_san_pham_CTKM_ATLS_2026.xlsx`, sheet `BẢNG GIÁ`: khóa `1|4|36` dùng 36 tháng; khóa `1|4|36 SPLIT` dùng 18 tháng. Cột E/F/G lưu số tháng, giá tháng chưa giảm và giá gốc. H/I/J là nền; K/L/N là Big Bang Sep; P/Q/S là 01–05/10; U/V/Z là Q4.

Chính sách gốc có thời hạn và phạm vi cụ thể được ưu tiên. Lộ trình và dữ liệu giá chuẩn hóa phải khớp nguồn. Audit và số tiền quan sát trên PaymentList/Report không tạo quy tắc giá mới.

## Chọn đúng kỳ

| Kỳ | Bắt đầu | Kết thúc | Nguồn mức giảm |
| --- | --- | --- | --- |
| Giá nền 2026 | 01/03 New, 17/03 Current | 30/09/2026 | Sheet `2026 ATLS Price đến 3092026` |
| Big Bang Sep được chọn rõ | 01/09/2026 | 30/09/2026 | Giảm VND cố định theo gói; không thay bằng tỷ lệ Q4 |
| Nền tháng 10 | 01/10/2026 | 05/10/2026 | Sheet `Thông tin khác (Trả góp,AHP,Đặc` |
| Big Bang Q4 | 06/10/2026 | 31/12/2026 | Sheet `Big bang promotion 6.10 - 31.12` |

Nhãn Q4 / From 06/10 chọn đúng cột Q4 kể cả khi hồ sơ có ngày ngoài kỳ; khi đó số tiền mang cảnh báo CHECK ngoài thời kỳ, không đổi ngầm thành mức của kỳ khác và không được duyệt thành hợp lệ bằng ô xác nhận. Nhãn September cũng giữ cột giảm VND của September khi cần kiểm tra ngoại lệ ngoài kỳ.

Nếu Layer, giờ, số tháng hoặc loại gói ghi trong Discount trái với Course fee / Hour/week / Package, giữ giá gốc theo gói mua nhưng để Discount, phải đóng và giờ liên quan ở trạng thái Chưa tính; hiện lý do CHECK. Tích duyệt điều kiện không sửa được mâu thuẫn đầu vào này.

Nhiều mức giảm nền hoặc trộn kỳ September/Q4 cũng không được chọn mức đầu tiên để tính. Discount và phải đóng chờ sửa nhãn; từng dòng căn cứ không lặp cùng một số giảm như đã áp dụng. Với số tháng tặng trái quy tắc, giữ khoản giảm tiền đã xác định nhưng để giờ tặng/tổng giờ Chưa tính.

B25/G111 quy định trả thẳng gói 36 chia đôi Q4 tặng 2 tuần/học viên. Từ v39, Bảng giá, RULE và bộ tính dùng đúng 2 tuần × Hour/week; không quy thành 0,5 tháng như giá trị xấp xỉ trong Audit/lộ trình. Tháng loyalty của Current được xét riêng theo B25/G114.

## Bảng giá và bộ tính

`priceFor()` là bộ chọn dùng chung cho Contract, Bảng giá chung và RULE. `packageIdentity()` được dùng chung cho khóa gói trong các đường tính, gồm Audit. Chi tiết hồ sơ hiện phép nhân giá gốc và kỳ áp dụng ngay dưới Discount apply.

Đợt rà soát này kiểm tra 864 giá trị của 48 tổ hợp Layer/giờ/gói qua các kỳ nền, tháng 10, Q4 với bảng gốc và 1.200 giá trị của file lộ trình, không có sai khác. 352 kiểm thử tự động đạt, gồm đối chiếu toàn bộ 192 dòng lộ trình theo bốn kỳ và mọi dòng danh mục với cùng bộ chọn. Đã kiểm tra giao diện thật bằng ba hồ sơ giả: gói 36 tháng, gói chia đôi và mã ưu đãi sai gói; sửa, lưu và tải lại trang giữ đúng kết quả. Chưa xác minh trực tiếp CT có đăng nhập trên Hub trong phiên này.

Các gói đặc thù vẫn yêu cầu nguồn đúng loại và kỳ; không nội suy từ tiền đã thu.

Khi có chính sách mới, nhập vào **Cập nhật chính sách** với khóa khóa học, giờ, Package, ngày hiệu lực, mức giảm và căn cứ duyệt. Nguồn nhập được dùng chung cho bảng giá và bộ tính; các quy tắc trùng khóa/thời kỳ hoặc thiếu công thức tiếp tục CHECK.


## Kiểm chứng v39

362 kiểm thử tự động đạt. Kiểm tra trên giao diện bằng dữ liệu giả xác nhận: duyệt gói chia đôi trả thẳng 3 giờ/tuần cho 6 giờ tặng và tổng 231 giờ; nhiều mức giảm nền chờ tính tiền; nhập dòng khóa 36 với 18 tháng báo lỗi và khóa nút Áp dụng. Phiên bản hợp lệ được xem trước với đúng 36 tháng, 2 tuần tặng và được lưu/mở lại. Kiểm tra này không dùng hoặc xác nhận hồ sơ riêng trong tài khoản Hub thật.
