// A ChatGPT app connection and a browser extension are separate capabilities.
// Never present a missing browser bridge as an authenticated Hub connection.
export const HUB_BROWSER_GUIDANCE='Tiện ích trên Chrome máy tính không tự có trong trình duyệt đám mây. Promotion và Hub cần mở trong cùng trình duyệt có cầu nối. Nếu trình duyệt không hỗ trợ tiện ích, tải Export, PaymentList và Transfer từ tài khoản Hub của bạn rồi nhập bằng Tải bộ nguồn. Dữ liệu đã lưu được giữ.';
export const HUB_BRIDGE_MISSING='Chưa kết nối cầu nối Hub trong trình duyệt này. '+HUB_BROWSER_GUIDANCE;
