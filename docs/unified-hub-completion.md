# Nhận diện khóa học và hoàn thiện CT trong nền

## Giá và đơn vị thời lượng

Khóa học được ghép bằng chương trình, năm giá, Layer, loại gói và các thông tin có ý nghĩa như 18 tháng đóng một lần. Chữ hoa/thường, dấu tiếng Việt, khoảng trắng và dấu phân cách trong tên không tạo ra khóa giá khác. Tên không ghi chương trình dùng ATLS; tên ghi AGLS, IELTS, AHP hoặc Premium giữ đúng chương trình. Năm, Layer, giờ hoặc thời lượng thực sự mâu thuẫn vẫn CHECK.

Course fee KOC ghi gói tuần/tuần thì số lượng trong Package là số tuần. Ví dụ gói tuần với Package `2 months` từ nguồn cũ được chuẩn hóa thành `2 weeks`. Giờ cơ bản bằng 2 × Hour/week; không nhân thêm 25/6. Giá dùng bảng tuần đúng năm/phạm vi. Bảng giá và hồ sơ thể hiện Weeks, đơn giá VND/tuần, giá gốc và net theo cùng bộ chọn chính sách. Không tự lấy bảng tuần 2024 làm giá tuần 2026.

Khi nhập chính sách tuần mới, dùng `variant=weekly`, `weeks`, `packageKey` như `2 WEEKS`, giá và quyền lợi đã xác định, ngày hiệu lực, center và đối tượng. Không nhập số tháng quy đổi 0,24 / 0,48. Chính sách tháng vẫn dùng `months` và đơn giá tháng chưa giảm.

## Một lượt xử lý sau khi lấy nguồn hoặc gắn link

1. Lưu/mở bộ nguồn Export, PaymentList và Transfer sẽ dựng lại CT nhận tiền theo dữ liệu của đợt mới và ngày chốt. Bảng đối chiếu vẫn tính từ nguồn gốc.
2. Web tự tiếp tục tìm link còn thiếu và đọc Input của các CT tổng. Lượt gắn link hàng loạt cũng chuyển sang hoàn thiện các CT đang lọc sau khi lưu link.
3. Course info được đọc đúng CT / Student ID từ GetContractDetail, ListCourseInfo hoặc trang chi tiết có nhãn. Discount apply lấy tên chương trình trong ngoặc ngoài, giữ ngoặc bên trong.
4. Sau khi lưu Course info, Giftcode No còn thiếu thông tin được tra đúng mã đầy đủ; đọc đơn vị %/VND, center, ngày và học viên từ Voucher/List gift code. Lưu voucher và tính lại ngay các CT dùng mã đó.
5. Chỉ ghi hoàn tất CT sau khi nguồn Input và bước voucher đã lưu. Hết giờ hoặc dừng, CT đọc dở còn trong hàng chờ. Lần lấy tiếp bỏ qua CT đã hoàn tất trong cùng lượt. Một lượt mới sau khi lượt trước đã xong sẽ đọc lại dữ liệu mới.

Thay đổi trang Check installment/Quy tắc trong ứng dụng không hủy bộ điều khiển đang chạy. Chỉnh sửa tay vẫn được ưu tiên; nguồn khác giá trị đang giữ cần đối chiếu. Việc đọc đúng CT không suy ra rằng hai CT cùng Student ID là một CT tổng: gom tiền tiếp tục theo chứng từ và Transfer đã xác minh. CT chưa được nối duy nhất vẫn chờ kiểm tra.

## Tiền Giftcode và trạng thái duyệt

Voucher đã được đọc, có mức giảm/đơn vị và đủ căn cứ học viên, center, ngày hiệu lực thì có thể tính số tiền Giftcode ngay. Mã PENDING vẫn giữ CHECK chờ duyệt; xác định số tiền không đồng nghĩa với duyệt điều kiện. Mã sai học viên, center, ngày, trạng thái không áp dụng hoặc thiếu cơ sở phần trăm không được dùng để xác nhận tiền phải đóng. Số tiền thu trong PaymentList không cung cấp tỷ lệ hay mã còn thiếu.

## Không tạo tab Hub tự động

Cầu nối 1.6.8 dùng tab Hub đã mở và đăng nhập. Danh sách CT/DEP, Course info, voucher và cả ba báo cáo chạy trong nền. Khi cần, một iframe được quản lý trong tab đó chạy trang Hub, biểu mẫu tìm kiếm và phân trang. Không tạo/chuyển/đổi URL/đóng tab trình duyệt. Khung đọc chỉ được cấp ngữ cảnh đúng lượt, frame, document và URL của từng bước; kết quả từ frame hoặc mã khác bị từ chối.

Nếu Hub hết phiên hoặc chặn khung đọc, lượt dừng và giữ tiến độ; không mở tab thay thế. Người dùng tự đăng nhập lại trên tab Hub rồi bấm lấy tiếp. Tiện ích chỉ đọc/tìm/lọc báo cáo và voucher; không Create/Update voucher hay duyệt thay người dùng trên Hub.

## Phạm vi kiểm chứng

Kiểm thử dùng JSON/DOM và hóa đơn giả cho đọc CT, voucher, báo cáo, nhận diện gói tuần, resume và bảo toàn dòng thu/chuyển. Có kiểm tra giao diện tải ba nguồn giả và Bảng giá tuần. Phiên Hub riêng của người dùng chưa được kiểm tra trực tiếp trong môi trường này. PDF `Chinh-sach-gia-khuyen-mai-apollo-2026.pdf` được ghi nhận làm nguồn tổng hợp KOC/timeline; những mã hè/giá tuần chưa có bảng định lượng đúng phiên bản không được suy từ phần tổng hợp.
