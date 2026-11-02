# Nguồn tiền từ Contract nâng cấp

Cầu nối 1.6.23 đọc liên kết có nhãn **Upgrade from contract** hoặc **Upgraded to contract**, hoặc ID nguồn từ dữ liệu Contract của Hub. Không yêu cầu xuất hiện Moving-in/out và không suy quan hệ từ mã CT, học viên hoặc tên khóa học.

Khi lấy Input hoặc đọc lại chứng từ, bộ đọc dùng phiên Hub và dịch vụ GET đang có để đọc CT nguồn trong nền. Không mở, đổi URL, chuyển hoặc đóng tab. Mã CT, ID, link chi tiết, ngày và chứng từ phải khớp; chỉ đưa các trường tài chính được cho phép về Promotion. Lỗi ở CT nguồn giữ phần đã đọc và còn trong hàng chờ.

Tiền nâng cấp là **phân bổ số dư còn lại có hóa đơn Paid gốc**, không tạo khoản thu mới. Số dư lấy từ PaymentList và chứng từ Paid đã kiểm tra trên Hub, trừ khoản hoàn/chuyển đã ghi nhận; không dùng Course fee, Final amount hoặc Not enrolled amount làm tiền thu. Liên kết Upgrade đã xác nhận chặng chuyển, không yêu cầu thêm Moving-in/out. Khi có ngày nâng cấp hoặc ngày tạo CT nhận thì dùng ngày đó. Không suy ngày từ tiền tố CT hay ngày đọc.

Nếu Hub thiếu ngày, Upgrade vẫn được phân bổ theo số dư có chứng từ tại ngày chốt bộ nguồn, khi CT nhận đã có trong báo cáo của kỳ hoặc trong chuỗi Upgrade dẫn về CT đó. Đây là giá trị tại kỳ đối chiếu, không phải ngày nâng cấp được xác minh. UI ghi **Upgrade theo kỳ · chưa có ngày cụ thể**. Không suy ngày full, thời hạn ưu đãi hay ghi danh từ mốc kỹ thuật này. Ngày mâu thuẫn hoặc ngày rõ ràng nằm sau kỳ vẫn chờ đối chiếu. Thiếu hóa đơn, nhiều CT nhận, vòng chuyển hoặc số dư không đủ vẫn không cấp thêm tiền.

GetContractDetail hoặc bản đọc bảng hiển thị có thể không có CreatedDate, trong khi ngày này đã được GetContractInfo cung cấp cho bản chính sách Hub của CT nhận. Từ v40, bộ tính dùng ngày đã lưu đó khi bản tài chính thiếu ngày, chỉ sau khi xác minh schema chính sách, mã CT, ID và link trùng khớp. Chính sách của CT khác, ngày không hợp lệ hoặc ngày ngoài kỳ không cấp tiền. Bản dữ liệu đã đọc được giữ nguyên; không ghi ngược thay đổi lên Hub.

Với lượt đọc mới, nếu CT có Upgrade from contract nhưng thiếu ngày, cầu nối gọi riêng dịch vụ GET `getContractInfoForUpdate({contractId})` của phiên Hub đang mở, tối đa 1,2 giây. Chỉ CreatedDate của đúng ID/mã CT được đưa vào chứng từ. Không cần bật lấy cấu hình giá, không gọi bảng giá/chương trình để lấy ngày, không sửa Angular model. Hết giờ giữ ngày chưa biết và bỏ qua kết quả trả muộn. Nếu dịch vụ này không có trong phiên Hub, kết quả vẫn chờ xác minh; không đoán endpoint hoặc ngày.

- PaymentList lịch sử và bản Hub cùng mã Payment không cộng hai lần.
- Đã có đường Transfer về CT tổng thì dùng đường đó; không thêm phân bổ Upgrade trùng.
- Nhiều CT nhận từ cùng nguồn, vòng liên kết, thiếu hóa đơn, tiền phát sinh sau ngày nâng cấp đã biết hoặc sau kỳ đối chiếu và số tiền mâu thuẫn tiếp tục CHECK.
- Tổng các CT dùng chung ngân sách hóa đơn gốc, không vượt số dư.
- Khi có đủ căn cứ và CT nguồn đã hết số dư, dòng khóa học được gộp vào CT tổng; chứng từ và liên kết nguồn vẫn nằm trong truy vết.

Learner Payments có thể chứa DEP thu gốc → CT ngắn hạn nhận cọc → CT Upgrade nhận tiếp. Bộ đọc lần cả chặng Upgrade trước khi tìm Moving/Deposit-to-contract; giữ nguồn DEP khi đọc tiếp từ CT cũ. Số hóa đơn lấy ở đúng Payment gốc, không gán số VAT cho dòng chuyển nội bộ. Một Payment xuất hiện lặp được ghép theo mã, ngày, Paid và số tiền; mâu thuẫn không được bỏ qua. Hai mã Payment khác nhau không bị gộp chỉ vì cùng số tiền.

Khi Deposit có dòng `Deposit to contract` và CT nhận được chỉ rõ, đây là chặng ra khỏi DEP. Dòng này không tạo thêm tiền thu. Bản đọc thiếu VAT được bổ sung từ Learner Payments đúng định danh, gồm cả link Deposit khác chữ hoa/thường nhưng cùng ID. Nếu chưa đọc được ngày, hóa đơn hoặc đường chuyển thì tiếp tục CHECK.

Ca kiểm thử giả lập: DEP thu 7.200.000đ có hóa đơn → CT cũ nhận 7.200.000đ → CT Upgrade thu thêm 27.630.000đ. Tổng nguồn vào CT Upgrade là 34.830.000đ, gồm một hóa đơn cọc và một hóa đơn thu thêm. Không cộng thành 42.030.000đ do tính lại dòng chuyển cọc. Remain amount/hours và Final Price trên Hub không tự trở thành chứng từ thu.

Trong chi tiết hồ sơ, chặng nâng cấp hiển thị **Có liên kết Upgrade trên Hub** thay cho yêu cầu Moving-out. Cập nhật cầu nối 1.6.23, tải lại Promotion và tab Hub đã đăng nhập, rồi đọc lại CT hoặc tạo lượt lấy Input mới để bổ sung dữ liệu cũ.

Nếu chứng từ và ngày CT nhận đã được lưu, tải lại Promotion và bấm **Tính lại chứng từ đã lưu**. Mỗi hóa đơn hiển thị **Đã phân bổ … vào tổng thu CT tổng** theo sổ tiền, kể cả khi chứng từ có sẵn trong PaymentList. Nếu chưa phân bổ được, lý do cụ thể xuất hiện dưới chặng Upgrade; chỉ có liên kết không có nghĩa là đã cộng tiền. Thiếu ngày CT nhận thì cập nhật cầu nối và lấy lại Input của CT tổng; thiếu hóa đơn nguồn thì dùng **Đọc lại hóa đơn**.

Kiểm thử dùng hồ sơ giả: 29.100.000đ thu mới + 9.600.000đ nguồn Upgrade = 38.700.000đ; đọc lại và nhập PaymentList lịch sử vẫn là 38.700.000đ. Nếu 3.000.000đ nguồn đã có chặng chuyển khác, chỉ 6.600.000đ được phân bổ Upgrade.
