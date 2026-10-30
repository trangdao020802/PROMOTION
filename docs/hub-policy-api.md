# Tự lấy bảng giá và quy tắc Hub theo Contract

Từ bản 30, cầu nối 1.6.12 đọc các dịch vụ truy vấn được xác định trong source Hub do người dùng cung cấp. Người dùng mở Hub đã đăng nhập, cập nhật cầu nối rồi bấm **Tự lấy Input theo Contract**, hoặc dùng luồng lấy nguồn / tự gắn link đang có. Không cần F12, sao chép response, nhập API key hay mở tab hợp đồng mới.

## Luồng đọc

1. Dùng Angular injector hiện có, lấy đúng UserRoleId của phiên và gọi `contractService.getContractDetail`. Xác minh CT và ID theo link đã gắn.
2. Khi detail thiếu ID nhóm người học, ngày tạo hoặc ngữ cảnh chọn giá, đọc GET `getContractInfoForUpdate({contractId})`. Không điều hướng vào trang Update, không gọi lock, không sửa model hay lưu hợp đồng.
3. Gọi song song `getCoursePrice` và `getApplicableGroupDiscount` bằng center, ProductGroup, GroupPeople, loại hợp đồng, package, HourWeek và CreatedDate thực tế. Dịch vụ thứ hai là POST truy vấn theo định nghĩa client Hub.
4. Nếu CT có Giftcode, gọi thêm GET `checkContractGiftCode` bằng đúng code, center và KidId của CT. Chỉ chiếu loại giảm, mức giảm, trần gốc và loại mã; không coi trường Max trên CT đã lưu là trần gốc.
5. Chiếu dữ liệu qua schema `apollo-hub-policy/v1`: ID, tên lựa chọn, đơn giá, thời lượng, nhóm/chi tiết khuyến mãi, Priority, SortOrder, ApplyRule, trần và quyền cộng nhóm. Không chuyển nguyên response, thông tin liên lạc, cookie, token hay role sang Promotion.
6. Lưu theo CT/học viên trong IndexedDB, giữ overlay nhập tay, tính lại CT và chênh lệch. API quá hạn 5 giây hoặc dữ liệu không đủ thì lưu phần Input đã đọc và tiếp tục CT khác. Lần lấy tiếp thử lại CT thiếu quy tắc. Giới hạn chung Course info vẫn là 14 giây; Voucher trong lượt hàng loạt vẫn là 15 giây.

Bridge vẫn dùng tab Hub đang có. Không tạo, chuyển URL, kích hoạt hay đóng tab. GetContractInfoForUpdate là dịch vụ GET lấy dữ liệu; không gọi thao tác Create/Update/Upgrade/AcquireLock của Hub. Quyền đọc phụ thuộc phiên Hub hiện tại, không thay role và không vượt kiểm soát truy cập.

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

Các trường hợp cần làm mới cấu hình đã đủ: chọn **Đọc lại cả CT đã đủ Input để đối chiếu** rồi tạo lượt đọc mới. Quy tắc chờ còn thiếu vẫn có thể lấy tiếp mà không phải đọc lại CT đã hoàn tất trong lượt.
