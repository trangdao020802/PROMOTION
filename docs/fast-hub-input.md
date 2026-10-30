# Lấy Input nhanh từ CT tổng

PaymentList nạp `Giftcode No` vào AO và `Discount apply` vào AQ, rồi đưa lên K/L của CT tổng. AD/AE là số tiền Discount/Giftcode để đối chiếu, không cung cấp tên chương trình hay mã. Export ByCourse bổ sung thông tin khóa học và giá trị đối chiếu; Transfer xác định luồng tiền, không tự tạo mã ưu đãi.

Khi nguồn thiếu, gắn link hàng loạt hoặc tải nguồn sẽ chạy hoàn thiện các CT thiếu Input/Voucher. Chỉ bật `Đọc lại cả CT đã đủ Input để đối chiếu` khi muốn làm mới toàn bộ. CT đã hoàn tất trong cùng lượt được bỏ qua; ô sửa tay vẫn có ưu tiên.

## Đọc GET, không sửa model Hub

Cầu nối 1.6.11 dùng tab Hub đã đăng nhập. Khi Angular injector sẵn sàng, gọi đúng `contractService.getContractDetail` với CT đã xác minh và `sessionInfo.UserRoleId` hiện tại. Client Hub tự mang các header xác thực của nó; tiện ích không đọc hoặc chuyển token/cookie sang Promotion. URL phải được quan sát từ GET thật, đúng contractId/role của lượt đó, trước khi nhận kết quả. Không gán ListDiscount/GiftCode vào controller, không gọi `$apply`, calculateTotal hay API ghi dữ liệu trên Hub.

Nếu client chưa sẵn sàng, tái sử dụng route GET đã quan sát và userRoleId số hợp lệ, dùng cùng phiên và `X-Requested-With: XMLHttpRequest`; bỏ tham số không cần thiết và không gán cứng role/user ID. API trực tiếp có thời gian trả trước khi mở khung đọc dự phòng; khung chỉ dùng khi thiếu dữ liệu hoặc không đọc được API. Không tạo, chuyển, đổi URL hoặc đóng tab Chrome.

Response chỉ chuyển các trường đầu vào được cho phép sang Promotion. `ListDiscount` thực tế gồm hai phần: `GroupDiscountName` và `DiscountName`. Ví dụ `2026 October - Promotion Discount` + `18 months` thành `2026 October - Promotion Discount - 18 months`; chương trình tặng tháng là mục riêng, giữ một lần. GiftCode phải là mã đầy đủ; chỉ xác nhận không có mã khi nguồn trả rỗng tường minh. Không lấy tiền thu để suy mức giảm hay mã. Phép tính giá/giảm và các phê duyệt vẫn độc lập.

## Chặn chờ dài và giữ tiến độ

Course info có ngân sách 14 giây. Đọc một phần được giữ, phần thiếu tiếp tục CHECK. CT tải quá hạn được bỏ qua để xử lý CT tiếp; lỗi đăng nhập/cầu nối hoặc nguồn mâu thuẫn vẫn cần xử lý đúng phạm vi. Voucher trong lượt hàng loạt có thời hạn tuyệt đối 15 giây; thông báo tiến độ không kéo dài thời hạn đó. Dừng/hết giờ không đánh dấu CT còn thiếu là hoàn tất. Kết quả đến muộn sau khi hủy không được lưu sang CT khác.

## Căn cứ và kiểm chứng

- File người dùng cung cấp `download.txt` là HAR có 29 request; một GET Contract detail trả HTTP 200 trong 1.878 giây. Đây là một mẫu capture, không phải đo hiệu năng mọi CT hoặc đo trực tiếp CT đang được báo chậm. JSON đã chứa đủ tên nhóm/mục Discount và xác nhận không có Giftcode; bộ đọc mới chiếu đủ năm trường mà không chờ DOM.
- Mã Hub đính kèm dùng `Contract.DetailContract as $vm`, `contractInfo` và `contractService.getContractDetail`; baseService dùng `$http.get`. Script gán `scope.contractDetail` không giải quyết việc lưu vào Promotion.
- Kiểm thử dùng dữ liệu giả: import mã/tên, ghép hai phần Discount, giữ role GET, gọi client Angular một lần, không sửa scope, không mở tab/khung dự phòng khi API đã trả đủ, chặn phản hồi muộn, giới hạn chờ, chỉ lấy CT thiếu và tiếp tục CT khác. Tổng cộng 241 kiểm thử đạt.
- HAR gốc chứa dữ liệu riêng và nằm ngoài repository; không đưa vào bản phát hành, fixture công khai hay gửi tới Empire. Empire doctor/route preview bị chặn vì không truy cập được secure system keyring; chưa gọi model ngoài. Kiểm chứng bản này do Codex và bộ kiểm thử thực hiện. Phiên Hub đăng nhập riêng chưa được thử trực tiếp.
