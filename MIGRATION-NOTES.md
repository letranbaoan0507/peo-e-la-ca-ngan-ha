# Dữ liệu Galaxy

Source gốc lưu quà trong bucket Sites: `{id}/manifest.json`, `{id}/image-*`, `{id}/audio`. Không có D1 database. Source chỉ chứa giao diện và hiệu ứng, không chứa ảnh/nhạc do bạn upload. Nhạc mẫu được tạo bằng code, không có file nhạc mẫu bên ngoài cần tải.

Các quà đang lưu trong bucket chưa xuất được toàn bộ: Sites tools không có list/export bucket, và chưa có danh sách ID quà cũ. Script `scripts/export-old.mjs` xuất những ID bạn đang có; không tự đoán/enumerate UUID. Bản ZIP độc lập cũ trong hội thoại chỉ là bundle build và dữ liệu JSON rỗng; không dùng nó thay source gốc.

Mới: PostgreSQL lưu `galaxies.manifest`, trạng thái và metadata object; bucket riêng lưu file. Tạo upload draft, cấp URL ký cho mỗi file, xác minh dung lượng/MIME tại storage trước công bố quà. Rate limit lưu trong PostgreSQL. Draft không hoàn tất cần dọn định kỳ; không xóa quà ready. Có script cleanup chỉ dành cho draft hết hạn.

Giữ ID khi import để route `/g/:id` không đổi. Cần thay domain trong link cũ/QR cũ bằng domain mới; QR đã in vẫn trỏ domain cũ. Không tự sửa Sites hay bảo đảm domain cũ tồn tại khi dịch vụ đóng.

Chưa export/import quà cũ, chưa test storage thật, chưa triển khai Vercel. Không gọi việc build source là đã bảo toàn toàn bộ ảnh/nhạc.
