# Kiểm tra

- npm install/build: đã thành công.
- Trang chủ và CSS qua HTTP local: 200.
- Route trực tiếp /g/:id: 200 (HTML; dữ liệu gift thật chưa cấu hình).
- Scan runtime source: không còn chatgpt.site, cloudflare:workers, header xác thực Sites hoặc .openai bắt buộc. Snapshot nguyên bản/tài liệu backup vẫn nhắc nền tảng cũ để đối chiếu.
- Validation và preview/create handler đã qua với jsdom; API/scene mock. Không thay source Three.js hiệu ứng gốc.
- CSS/giao diện gốc được giữ; responsive và hiệu ứng chưa có kiểm tra hình ảnh/GPU trực tiếp. Tải Chromium cho QA thất bại do gói tải trả về bị lỗi; không tuyên bố đã kiểm tra ảnh chụp.
- Chưa có test thật: Google/Supabase login, upload/storage/CORS, persistence sau redeploy và production Vercel. Chưa có tài khoản/cấu hình các dịch vụ này trong phiên.

Không tắt Sites cũ. Nghiệm thu trên domain Vercel sau khi có dữ liệu thật và hai tài khoản owner/viewer/editor (nếu ứng dụng có phân quyền).
