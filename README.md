# Galaxy Tình Yêu Independent

Chuyển trực tiếp từ source gốc commit `1b0e3f3f53e855a87c98e7b083ebc4f09670d0ee` (v14). `src/galaxy.js`, CSS và HTML giữ nguyên; không dựng lại hiệu ứng. Giữ `/g/:id`, lời nhắn, nhạc, ảnh phóng lớn, trái tim, sao trời và sao băng. `backup-original.tar` giữ source trước chuyển.

**Source đã build. Database/storage mới chưa được cấp cấu hình và các Galaxy cũ chưa được xuất. Chưa deploy public.**

Node.js 22.13 trở lên:

```bash
npm install
npm run dev
npm run build
npm start
```

Tạo `.env.local` từ `.env.example`, dùng giá trị của tài khoản riêng. Dev/start build và mở `http://localhost:3000`, chạy API Node tương đương các function Vercel. Production Vercel dùng `dist/` và `api/`.

Cấu trúc: `src/` source giao diện/Three.js; `api/` Node serverless; `migrations/` PostgreSQL; `scripts/` build/dev/export/import; `dist/` output; `public/assets/` dành cho asset bổ sung; `database/` tài liệu; `backups/` dữ liệu riêng, không đưa GitHub.

Biến: `APP_URL`, `DATABASE_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `RATE_LIMIT_SALT`. Salt là chuỗi ngẫu nhiên tối thiểu 32 byte, tạo trên máy bạn. Không secret nào có trong ZIP.

Tạo quà vẫn không cần account như web gốc. Link UUID là cách mở quà; người có link xem được. Không đặt bucket public: `/media/...` kiểm tra quà đã hoàn tất rồi cấp signed URL. Ảnh/nhạc gửi trực tiếp vào storage, API chỉ nhận JSON nhỏ; metadata nằm PostgreSQL, không JSON file hoặc ổ tạm Vercel.

Đọc các hướng dẫn triển khai, backup và ghi chú chuyển đổi đi kèm.
