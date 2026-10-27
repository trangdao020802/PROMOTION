from pathlib import Path
import json, zipfile, os
from urllib.parse import urlsplit
root=Path(__file__).resolve().parents[1]
site=os.environ.get('SITE_ORIGIN','https://promotion-hub-2026.roundskunk11.chatgpt.site').rstrip('/')
parts=urlsplit(site)
if parts.scheme!='https' or not parts.netloc or parts.path or parts.query or parts.fragment or parts.username or parts.password:
 raise ValueError('SITE_ORIGIN must be an HTTPS origin without a path.')
site_match=site+os.environ.get('BASE_PATH','/')+'*'
files=['background.js','core.js','course-core.js','voucher-core.js','report-core.js','index-core.js','promotion.js','hub.js','hub-course.js','hub-voucher.js','hub-index.js','hub-reports.js','index-bootstrap.js','index-tap.js']
manifest={'manifest_version':3,'name':'Promotion Studio · Apollo HUB Bridge','version':'1.6.1','minimum_chrome_version':'111','description':'Đọc Voucher, danh sách CT/DEP, Course info và báo cáo được yêu cầu trên Apollo HUB.','permissions':['storage','tabs'],'host_permissions':[site+'/*','https://hub24.apollo.vn/*'],'background':{'service_worker':'background.js'},'content_scripts':[
 {'matches':[site_match],'js':['core.js','report-core.js','index-core.js','course-core.js','voucher-core.js','promotion.js'],'run_at':'document_start','all_frames':False},
 {'matches':['https://hub24.apollo.vn/*'],'js':['core.js','report-core.js','index-core.js','course-core.js','voucher-core.js','index-bootstrap.js'],'run_at':'document_start','all_frames':False},
 {'matches':['https://hub24.apollo.vn/*'],'js':['hub.js','hub-course.js','hub-voucher.js','hub-index.js','hub-reports.js'],'run_at':'document_idle','all_frames':False},
 {'matches':['https://hub24.apollo.vn/contract/list*'],'js':['index-core.js','index-tap.js'],'run_at':'document_start','world':'MAIN','all_frames':False}]}
readme='''CẦU NỐI PROMOTION STUDIO 1.6.1

Chỉ dùng cho website https://promotion-hub-2026.roundskunk11.chatgpt.site và Apollo HUB https://hub24.apollo.vn:7777.

1. Giải nén ZIP vào một thư mục riêng.
2. Mở chrome://extensions hoặc edge://extensions, bật Chế độ dành cho nhà phát triển.
3. Chọn Tải tiện ích đã giải nén (Load unpacked), chọn thư mục có manifest.json.
4. Tải lại Promotion Studio và các tab Apollo HUB. Bấm Kiểm tra cầu nối.
5. Bạn tự đăng nhập HUB trong tab HUB. Cầu nối đọc khi bạn yêu cầu báo cáo, tìm link, Course info hoặc mở Voucher còn thiếu thông tin.
6. Voucher: mở chi tiết CT, nhập Giftcode No. Student ID/tên học viên lấy từ CT; mã còn thiếu sẽ tự tra Hub khi cầu nối sẵn sàng. Có thể bấm Tìm & tự điền từ Hub để đọc lại. Cầu nối nhập mã đầy đủ vào ô tìm trên /giftcode/manage, mở link chi tiết từ dòng kết quả và kiểm tra đúng mã trong List gift code. Không suy mức giảm hay học viên từ Code prefix.
7. Đơn vị % hoặc VND/VNĐ/đ/₫ lấy cạnh Discount amount. Center lấy từ cột Center code, đọc tiếp khi bảng có phân trang. Thiếu đơn vị hoặc chưa đủ danh sách center thì dừng, không đoán kiểu giảm hay phạm vi.
8. Kiểm tra các ô tự điền, trạng thái duyệt và bấm Lưu voucher & tính lại. Cầu nối không tự duyệt ngoại lệ và không bấm Create/Update trên Hub.

Không nhập tài khoản/mật khẩu vào Promotion Studio. Mã nguồn giữ các kiểm tra origin, document, mã CT/DEP, ngày tháng và URL chi tiết. Không đoán ID hợp đồng; trường hợp không có kết quả vẫn cần xác minh thủ công.

Dữ liệu nhận được được lưu tại trình duyệt Promotion Studio. Tiện ích không tự đồng bộ nội dung các hợp đồng và không sửa dữ liệu trên HUB.
'''
readme=readme.replace('https://promotion-hub-2026.roundskunk11.chatgpt.site',site)
target=root/'dist/downloads/promotion-hub-bridge.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
 z.writestr('HUONG_DAN.txt',readme)
 for name in files:
  content=(root/'reference/hub'/name).read_text().replace('https://promotion-installment.trangdao2802.chatgpt.site',site)
  z.writestr(name,content)
print('Built origin-scoped HUB bridge from the supplied source.')
