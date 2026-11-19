export const GLOSSARY=[
 {id:'loyalty',label:'Loyalty',meaning:'Ưu đãi khách hàng thân thiết',
  description:'Ưu đãi dành cho học viên hiện tại. Số tháng tặng được xét theo gói học, lịch sử học phí, thời gian ngừng học và chính sách đang áp dụng.',aliases:['Loyalty']},
 {id:'prior-fees',label:'Loyal fee / priorFees',meaning:'Học phí đã đóng trước đợt tái phí',
  description:'Tổng học phí đã đóng trước đợt đang xét, dùng làm căn cứ xét Loyalty. Điền theo lịch sử thanh toán đã đối chiếu của đúng học viên.',aliases:['Loyal fee','loyalfee','loyalty fee','loyaltyFee','loyaltyFees','loyalty_fees','priorFees','Học phí đã đóng trước đợt này']},
 {id:'sibling',label:'Sibling / Siblings',meaning:'Ưu đãi anh chị em ruột',
  description:'Ưu đãi theo quan hệ anh chị em ruột. Gói chia đôi cần đối chiếu học viên, hợp đồng đối ứng và điều kiện thanh toán của cả hai.',aliases:['Sibling','Siblings']},
 {id:'referral',label:'Referral',meaning:'Ưu đãi giới thiệu học viên mới',
  description:'Quyền lợi khi giới thiệu học viên mới. Mức giảm hoặc tháng tặng được xét theo điều kiện của chương trình và hồ sơ giới thiệu.',aliases:['Referral']},
 {id:'ontop',label:'On Top',meaning:'Ưu đãi cộng thêm',
  description:'Ưu đãi bổ sung được cộng theo thứ tự, mức trần và điều kiện của chính sách tương ứng.',aliases:['On Top']},
 {id:'calc',label:'CALC',meaning:'Giá trị do web tính',
  description:'Giá trị tính từ bảng giá, quy tắc khuyến mãi, đầu vào của hợp đồng và các điều kiện đã xác minh.',aliases:['CALC','Calculated']},
 {id:'actual',label:'Actual',meaning:'Số liệu thực tế tại nguồn',
  description:'Giá trị đọc từ Hub hoặc các báo cáo đã nhập, dùng để đối chiếu với kết quả web tính.',aliases:['Actual']},
 {id:'diff',label:'DIFF',meaning:'Chênh lệch',
  description:'Khoản chênh lệch giữa các giá trị đang đối chiếu. Số 0 thể hiện chỉ tiêu đó khớp. Xem tên cột để biết chỉ tiêu được so sánh.',aliases:['DIFF']},
 {id:'check',label:'CHECK',meaning:'Còn mục cần kiểm tra',
  description:'Hồ sơ còn chênh lệch, thiếu dữ liệu, thiếu căn cứ hoặc chờ duyệt điều kiện. Xem phần lý do CHECK và chi tiết kiểm tra của hồ sơ.',aliases:['CHECK']},
 {id:'course',label:'Course info / Course fee KOC',meaning:'Thông tin khóa học và bảng giá đã chọn',
  description:'Tên bảng giá của khóa học, kết hợp giờ mỗi tuần và gói học để chọn đúng công thức tính học phí.',aliases:['Course fee KOC','Course info','Course fee']},
 {id:'koc',label:'KOC / Group KOC',meaning:'Loại hoặc nhóm khóa học',
  description:'Nhóm khóa học được ghi trên Hub, ví dụ ATLS, AGLS hoặc IELTS. Thông tin này dùng để đối chiếu bảng giá và chính sách phù hợp.',aliases:['Group KOC','KOC']},
 {id:'layer',label:'Layer',meaning:'Nhóm giá',
  description:'Nhóm giá 1, 2 hoặc 3 ghi trong tên bảng giá. Chọn đúng Layer của hợp đồng khi đối chiếu học phí.',aliases:['Layer']},
 {id:'hours',label:'Hour/week',meaning:'Số giờ học mỗi tuần',
  description:'Cường độ học của khóa, thường là 3 hoặc 4 giờ mỗi tuần. Dùng để chọn giá và quy đổi thời lượng học.',aliases:['Hour/week','Hours/week']},
 {id:'package',label:'Package',meaning:'Gói học',
  description:'Thời lượng đăng ký của hợp đồng. Đọc đúng đơn vị tháng, tuần hoặc giờ được ghi trong gói.',aliases:['Package']},
 {id:'discount',label:'Discount / Discount apply',meaning:'Ưu đãi giảm học phí theo chương trình',
  description:'Discount apply là tên các chương trình áp dụng. Discount amount là giá trị giảm. Khi đọc Hub, kiểm tra đơn vị % hoặc VND bên cạnh số.',aliases:['Discount apply','Discount amount','Discount']},
 {id:'giftcode',label:'Giftcode / Voucher',meaning:'Mã ưu đãi',
  description:'Mã ưu đãi cần đối chiếu đầy đủ mã, mức giảm, học viên, trung tâm, thời hạn và căn cứ duyệt của hồ sơ.',aliases:['Giftcode No','Giftcode','Voucher']},
 {id:'full',label:'Full payment / ngày full',meaning:'Đóng đủ học phí và ngày đóng đủ',
  description:'Thời điểm các khoản thu hoặc phân bổ hợp lệ đạt số tiền cần đóng của hợp đồng. Ngày này dùng để xét thời hạn và điều kiện ưu đãi.',aliases:['Full payment','ngày full','full phí','full']},
 {id:'epp',label:'EPP',meaning:'Kỳ hết học phí hiện tại',
  description:'Tháng hoặc kỳ hết học phí được ghi trong hồ sơ học viên, dùng để đối chiếu đối tượng của chương trình khuyến mãi.',aliases:['EPP']},
 {id:'approval',label:'CEO / RCM / GCM',meaning:'Cấp có thẩm quyền phê duyệt',
  description:'Người hoặc cấp quản lý phê duyệt chính sách, hồ sơ hay ngoại lệ. Kiểm tra người duyệt, ngày duyệt và đúng học viên trong minh chứng.',aliases:['CEO','RCM','GCM']},
 {id:'contract',label:'Contract / CT tổng',meaning:'Hợp đồng và hợp đồng nhận tiền cuối cùng',
  description:'Contract là hợp đồng học phí. CT tổng là hợp đồng đang được đối chiếu, nhận các khoản thu trực tiếp và tiền chuyển vào có đủ căn cứ.',aliases:['Contract tổng','Contract total','CT tổng','Contract']},
 {id:'deposit',label:'Deposit / DEP',meaning:'Hồ sơ đặt cọc',
  description:'Hồ sơ ghi nhận khoản cọc. Khi tiền cọc được chuyển vào hợp đồng, web truy lại hóa đơn thu gốc và liên kết phân bổ.',aliases:['Deposit','DEP']},
 {id:'moving',label:'Moving-in / Moving-out / Transfer',meaning:'Chuyển tiền vào hoặc ra giữa các hồ sơ',
  description:'Moving-in là chuyển vào, Moving-out là chuyển ra, Transfer là giao dịch chuyển. Web lần theo hóa đơn gốc để phân bổ đúng số tiền.',aliases:['Moving-in','Moving-out','Transfer']},
 {id:'upgrade',label:'Upgrade',meaning:'Nâng cấp gói học',
  description:'Liên kết nâng gói từ hợp đồng cũ sang hợp đồng nhận. Web dùng liên kết và chứng từ để truy khoản tiền đã chuyển.',aliases:['Upgrade']},
 {id:'payment',label:'Payment / PaymentList',meaning:'Chứng từ và báo cáo thanh toán',
  description:'Payment là dòng giao dịch trên Hub. PaymentList là báo cáo dùng để đối chiếu loại giao dịch, trạng thái thanh toán, ngày và hóa đơn gốc.',aliases:['PaymentList','Payment']},
 {id:'invoice',label:'E-Invoice / VAT Invoice No.',meaning:'Hóa đơn điện tử và số hóa đơn',
  description:'Thông tin hóa đơn dùng xác minh khoản thu gốc, gồm số hóa đơn, ngày và số tiền trên chứng từ.',aliases:['VAT Invoice No.','VAT Invoice No','E-Invoice','VAT']},
 {id:'export',label:'Export / Export ByCourse',meaning:'Báo cáo thông tin hợp đồng theo khóa học',
  description:'Nguồn đối chiếu giá trị hợp đồng, khóa học, tổng giờ và thông tin học viên trong đợt dữ liệu đang mở.',aliases:['Export ByCourse','Export']},
 {id:'extra-hours',label:'Extra hours / Total course hour',meaning:'Giờ tặng và tổng giờ học',
  description:'Extra hours là giờ tặng đủ điều kiện. Total course hour là tổng thời lượng học được tính cho hợp đồng, gồm phần giờ tặng đã xác minh.',aliases:['Total course hour','Total hour of contract','Extra hours']},
 {id:'summary',label:'Summary',meaning:'Tóm tắt đối chiếu hợp đồng',
  description:'Tóm tắt số tiền cần đóng, số đã thu hoặc phân bổ và chênh lệch của hợp đồng đang xem.',aliases:['Summary']},
 {id:'rule',label:'RULE / Policy',meaning:'Quy tắc và chính sách áp dụng',
  description:'Căn cứ xác định giá, mức giảm, thời lượng tặng, giới hạn trả góp và điều kiện áp dụng cho từng hồ sơ.',aliases:['RULE','Policy']},
];

const aliases=new Map(GLOSSARY.flatMap(entry=>entry.aliases.map(alias=>[alias.toLocaleLowerCase('vi'),entry])));
const escaped=[...aliases.keys()].sort((a,b)=>b.length-a.length).map(alias=>alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
const pattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+escaped.join('|')+')(?![\\p{L}\\p{N}_])','giu');
export function glossaryParts(value){
 const text=String(value??''),parts=[];let start=0;
 for(const match of text.matchAll(pattern)){
  if(match.index>start)parts.push({text:text.slice(start,match.index)});
  parts.push({text:match[0],term:aliases.get(match[0].toLocaleLowerCase('vi'))});start=match.index+match[0].length;
 }
 if(start<text.length)parts.push({text:text.slice(start)});
 return parts;
}
