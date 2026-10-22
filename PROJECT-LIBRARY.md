# Kho dự án và bản sao JSON

- Trong form: đặt tên dự án, chọn **Lưu vào kho** để giữ chữ, ảnh và tệp nhạc trên thiết bị.
- **Thiên hà đã lưu** hiển thị ảnh bìa, mở/sửa, tải JSON, xem link và tải QR dạng PNG.
- **Tải bản sao JSON** đóng gói cả ảnh và nhạc, không chỉ đường dẫn tạm. **Nhập lại dự án JSON** thêm một bản vào kho; không thay toàn bộ kho.
- Trước khi mở dự án khác hoặc tạo mới, nội dung đang sửa được giữ thành một bản trong kho. Bản nháp tự lưu trên trình duyệt.
- Với link Galaxy cũ: dán link của chính website vào **Đưa link cũ vào kho**. Website đọc lại ảnh/nhạc để tạo bản sao trên thiết bị. Không sửa hoặc xóa link gốc.
- Kho không tự đồng bộ giữa các máy. Giữ thêm file JSON trước khi xóa dữ liệu trình duyệt.

Bản cập nhật chỉ bổ sung giao diện và lưu cục bộ bằng IndexedDB `GalaxyLoveStudio`. Không đổi API, schema SQL, kho S3, tên miền hay dữ liệu trên máy chủ. Các link `/g/:id` hiện có tiếp tục hoạt động.

Kiểm tra: `npm test` và `npm run build`. Bộ kiểm tra bao gồm giữ nguyên dự án cũ, vòng sao lưu/khôi phục ảnh và nhạc, nhập thêm dự án, ảnh bìa, QR độc lập và hiển thị văn bản an toàn.
