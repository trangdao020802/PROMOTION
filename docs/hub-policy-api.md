# Đọc CT tổng và bổ sung quy tắc Hub

Từ bản 31, cầu nối 1.6.13 đọc các dịch vụ truy vấn được xác định trong source Hub do người dùng cung cấp. Người dùng mở Hub đã đăng nhập, cập nhật cầu nối rồi bấm **Tự lấy Input theo Contract**, hoặc dùng luồng lấy nguồn / tự gắn link đang có. Không cần F12, sao chép response, nhập API key hay mở tab hợp đồng mới.

## Luồng đọc CT tổng

1. Duyệt lần lượt CT/học viên trong bộ lọc theo thứ tự bảng, dùng link chi tiết CT nhận tiền đã lưu; chỉ tra danh sách theo tháng nếu thiếu link.
2. Tìm Angular injector của Hub trong trang hiện tại hoặc các iframe cùng origin đã có. Dùng `contractService` và UserRoleId thật của phiên, không lấy scope bất kỳ hay gán vào model. Nếu không có injector, chỉ dùng GET đã quan sát; không đoán quyền/role.
3. Gọi `getContractDetail` và `getContractPayment({contractId})` song song. Lịch thanh toán có ngân sách 2 giây, nằm trong giới hạn đọc CT 14 giây. Mảng ListPayment rỗng trong detail là placeholder, không phải bằng chứng không có thanh toán.
4. Lấy ListCourseInfo/CourseInfos và tất cả ListDiscount/Discounts của CT, kể cả wrapper `data`, `item`, `$vm.contractInfo`. GroupDiscountName + DiscountName thành tên đầy đủ; số %/tháng/VND được giữ riêng làm căn cứ. Tên ưu đãi có mức giảm bọc ngoài vẫn lấy tên trong ngoặc, giữ ngoặc bên trong tên chương trình.
5. Chỉ chuyển các trường có danh sách cho phép qua schema `apollo-hub-contract/v1`: danh sách ưu đãi và lịch thanh toán theo CT. Không chuyển thông tin liên lạc, tài khoản ngân hàng, giấy tờ, cookie, token hay nguyên JSON. Mã CT/ID/học viên phải khớp trước khi lưu.
6. Lưu từng CT rồi tính lại bằng bảng giá, quy tắc và Export/PaymentList/Transfer hiện có. Khác thứ tự/cách viết của cùng tập ưu đãi không làm trống Discount apply. Nếu ưu đãi mới trên Hub khác báo cáo cũ, hiện giá trị CT tổng và giữ cả hai căn cứ cùng cảnh báo. Nhập tay có giá trị vẫn ưu tiên.
7. `Tạo lượt đọc mới` khởi chạy ngay từ CT đầu của bộ lọc và đọc lại cả năm trường đầu vào. Revision `contract-lists-v2` không dùng lại checkpoint cũ. Bấm lấy tiếp bỏ qua CT đã xong; thiếu ưu đãi/lịch thanh toán vẫn nằm trong danh sách chờ. `lastReadMissing` ngăn giá trị cũ được giữ lại bị nhận nhầm là response mới đã đủ. Lỗi riêng từng CT/quá hạn chuyển sang CT tiếp; lỗi phiên đăng nhập, kết nối cầu nối, lưu xung đột hoặc người dùng dừng thì dừng lượt.

ListPayment trên Hub là căn cứ lịch thanh toán, không được cộng vào tiền đã thu hay dùng thay hóa đơn trong ba báo cáo. CALC không sao chép Price, DiscountAmount hoặc FinalPrice đã lưu trên CT.

## Cấu hình giá Hub là tùy chọn

Mặc định không gọi lại danh mục giá cho từng CT. Bật **Đọc thêm cấu hình giá và khuyến mãi từ Hub** khi cần bổ sung; việc này không trở thành điều kiện để lưu Input hoặc hoàn thành lượt đọc:

- Khi thiếu ngữ cảnh, GET `getContractInfoForUpdate({contractId})` cung cấp GroupPeople/CreatedDate/ID sản phẩm. Không điều hướng trang Update, không gọi AcquireLock.
- Truy vấn song song `getCoursePrice` và `getApplicableGroupDiscount` bằng ngữ cảnh thật. Truy vấn thứ hai là POST chỉ đọc theo client Hub.
- Nếu có Giftcode, `checkContractGiftCode` lấy đơn vị, mức giảm và trần gốc. Giữ luồng tra Voucher hiện có khi cần hồ sơ chi tiết.
- Schema `apollo-hub-policy/v1` giữ cấu hình có phạm vi CT. Ngân sách cấu hình tối đa 5 giây trong giới hạn CT; thiếu cấu hình vẫn lưu Input và dùng chính sách hiện có. Snapshot cũ có ràng buộc phù hợp được giữ qua lượt chỉ đọc Input.

Không tạo, đổi URL, kích hoạt hay đóng tab Hub. Truy vấn phụ thuộc phiên đăng nhập hiện tại; không thay role hoặc vượt quyền truy cập.

## Bộ tính

- Giá = đơn giá từ GetCoursePrice × đúng CourseMonth hoặc CourseWeek của package theo ID. Giá/Discount/FinalPrice đã lưu trên CT không cung cấp kết quả CALC.
- Chỉ dùng snapshot khi khóa học, giờ, gói, trung tâm và nhánh trả góp khớp. Nhập tay đổi lựa chọn không nhận giá từ snapshot cũ.
- Mỗi nhóm chọn một ưu đãi; kiểm tra ApplyGroupDiscountIds của nhóm được chọn đầu tiên. Xếp Priority/SortOrder, tính default trước last; giảm % trên số còn lại. Lấy mức riêng Installment khi được cấu hình.
- Xét voucher cố định trừ trước các nhóm default, ngoại trừ GiftCodeTypeId 7/8. Voucher % theo cơ sở trước phần ưu đãi last, có trần gốc; dùng quy tắc làm tròn nghìn của source Hub. Dữ liệu voucher đang nhập mâu thuẫn với cấu hình trả về tiếp tục CHECK.
- Giờ tháng dùng thời lượng đúng PriceId/package; giữ nhánh 3/4 giờ, các ngưỡng PriceId 367/368 và giờ trừ của nhóm 83/248/261. Không nhân tuần thành tháng.
- Bảng giá và RULE bổ sung dòng **Hub · theo CT …** khi tải lại bộ tham chiếu. Chúng dùng cùng bộ chọn giá và phép tính với CALC, giữ phạm vi CT/ngày/trung tâm; không biến một trường hợp thành giá toàn hệ thống.
- Nếu giá gốc Hub khác chính sách đang áp dụng, giữ cả căn cứ và CHECK. Chính sách người dùng cập nhật theo mẫu vẫn có ưu tiên trong phạm vi đã chọn.
- Xác minh EPP, CEO/RCM, sibling, ngày full và điều kiện chính sách tiếp tục độc lập. Một response có chương trình áp dụng không tự duyệt các điều kiện hồ sơ. Phiên bản quy tắc thay đổi làm mới phạm vi duyệt; thời điểm đọc lại đơn thuần không làm mất phê duyệt.

## Phạm vi xác minh và giới hạn

Đã kiểm thử bằng response giả có cấu trúc theo source người dùng gửi, kiểm tra luồng Angular client, ràng buộc CT/học viên, quyền cộng nhóm, thứ tự, trần, nhánh trả góp, voucher, thời hạn, resume, nhập tay và đối chiếu bảng giá/CALC. Bộ kiểm thử không dùng dữ liệu cá nhân hoặc khóa đăng nhập từ HAR.

Phiên trình duyệt của tác vụ không có tab Hub đăng nhập; vì vậy chưa kiểm chứng response live, thời gian thực của CT LD2610-CT-0049940 hoặc tuyên bố đã nhập dữ liệu Hub vào trình duyệt riêng của người dùng. Bản phát hành cung cấp luồng tự lấy để chạy trên phiên Hub của người dùng.

Nhánh nâng gói/Upgrade, đơn vị giờ/gói giờ, response có cấu trúc khác và gói tuần có tháng tặng chưa đủ căn cứ quy đổi không được ép thành quy tắc chuẩn. Giữ kết quả theo nguồn chính sách đã xác minh hoặc trạng thái cần kiểm tra; không tạo số 0 hoặc phê duyệt giả. Việc lấy danh mục hiện tại không thay thế văn bản chính sách lịch sử.

Muốn làm mới toàn bộ Input: bấm **Tạo lượt đọc mới**. Muốn làm mới cả cấu hình: bật **Đọc thêm cấu hình giá và khuyến mãi từ Hub** trước khi bắt đầu. Tệp TXT ngày 31/10 là hội thoại DevTools với ví dụ ListDiscount, không cung cấp response đầy đủ của mọi CT; bản sửa kết hợp source Hub, HAR đã cung cấp và các tài nguyên chính sách có trong ứng dụng. Không đưa tệp HAR/nhật ký gốc hoặc dữ liệu cá nhân vào mã nguồn.
