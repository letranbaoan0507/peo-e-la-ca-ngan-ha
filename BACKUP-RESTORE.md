# Backup Galaxy

## Xuất quà cũ

Cần các UUID trong link `/g/:id` đã tạo. Trên máy của bạn:

```bash
OLD_GALAXY_URL=https://YOUR-OLD-SITE node scripts/export-old.mjs UUID-1 UUID-2
```

Trên PowerShell đặt `$env:OLD_GALAXY_URL='https://YOUR-OLD-SITE'` rồi `node scripts/export-old.mjs UUID-1 UUID-2`. Script tải manifest và ảnh/nhạc vào `backups/`; không sửa Sites. Nếu site yêu cầu đăng nhập, dùng trình duyệt đã được cấp quyền để tải file; script không vượt xác thực.

## Import

Chạy SQL schema trước, cấu hình `.env.local` rồi:

```bash
node --env-file=.env.local scripts/import-old.mjs
```

Script kiểm tra UUID, object key và dung lượng, giữ ID/route, từ chối ghi đè quà có sẵn. Nếu upload lỗi giữa chừng, object chưa có manifest ready sẽ không truy cập được; xử lý object dang dở riêng trước retry. Chỉ nghiệm thu khi tất cả manifest và file đã được đối chiếu.

## Sau khi chuyển

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file=galaxy-db.dump
rclone copy YOUR-STORAGE:galaxy /PATH/TO/BACKUP/objects --progress
```

Restore vào database trống với `pg_restore --no-owner --no-acl --dbname="$DATABASE_URL" galaxy-db.dump`; copy object sang bucket mới, sửa biến môi trường và redeploy. Giữ secret riêng, không đưa dump/file upload vào GitHub. Có thể chuyển Vercel sang máy chủ Node dùng `npm start` mà không đổi domain data trong manifest vì media dùng đường dẫn tương đối.

ZIP hiện chưa chứa quà/upload cũ. Giữ Sites cũ cho đến khi kiểm chứng xong.
