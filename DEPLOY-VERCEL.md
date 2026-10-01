# Deploy Galaxy

1. Tạo Supabase project riêng; chạy `migrations/001_initial.sql` trong SQL Editor của database trống. Dùng connection URL PostgreSQL/pooler của bạn làm `DATABASE_URL`.
2. Tạo bucket **private** `galaxy`. Lấy S3 endpoint, region và tạo S3 credentials từ Storage settings. Đặt biến theo `.env.example` trong Vercel. Có thể thay bằng S3/R2/B2 riêng nếu API tương thích.
3. Kiểm tra CORS: origin Vercel/localhost, GET/HEAD/PUT, headers Content-Type/Range/x-amz-*, expose Content-Length/Content-Range/ETag. Supabase có CORS mặc định; kiểm tra upload thực tế.
4. Tạo GitHub repository riêng, dùng `git init`, `git add .`, `git commit`, thêm remote của bạn rồi `git push`. `.gitignore` bỏ `.env*`, backups và snapshot gốc. Không upload thủ công thư mục backups vì upload giao diện web không áp gitignore.
5. Vercel → Add New → Project → Import GitHub repository. Framework Other, build `npm run build`, output `dist`. `api/` được deploy thành Node functions. Root là thư mục có package.json. Thêm biến môi trường rồi Deploy.
6. Đặt `APP_URL` đúng origin domain Vercel được cấp, redeploy. Không cần domain riêng. Không tự đặt URL giả trong code.
7. Kiểm tra tạo quà có ảnh + nhạc, mở `/g/:id` trên thiết bị khác, refresh, redeploy rồi mở lại. Bấm vào ảnh và kiểm tra tim/sao băng. Dữ liệu nằm ngoài Vercel nên không mất khi redeploy.

Provider có giới hạn quota/gói cước. Giữ giới hạn gốc 12 ảnh (2 MiB/ảnh), nhạc 15 MiB và tổng 25 MiB để tránh chi phí phát sinh. Không có credentials dịch vụ riêng hoặc deploy thật trong phiên này.
