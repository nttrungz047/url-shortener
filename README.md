# URL Shortener

Dịch vụ rút gọn liên kết cá nhân — Node.js + Express + PostgreSQL, có sẵn giao diện web đơn giản.
Đây là tính năng đầu tiên của project; các tính năng khác (đăng nhập, thống kê chi tiết, QR code...) sẽ thêm sau.

## Tính năng hiện có

- Rút gọn URL, sinh mã ngẫu nhiên 6 ký tự (không nhầm lẫn 0/O, 1/I/l)
- Cho phép đặt mã riêng (custom alias)
- Redirect (302) khi truy cập link rút gọn + đếm lượt click
- Danh sách link tạo gần đây
- Giới hạn tần suất tạo link (rate limit) để chống spam
- Giao diện web tối giản, không cần framework frontend

## Cấu trúc thư mục

```
url-shortener/
├── src/
│   ├── server.js        # Khởi động Express, route redirect /:code
│   ├── db.js             # Kết nối PostgreSQL (pg Pool)
│   ├── migrate.js        # Script chạy schema.sql
│   ├── routes/links.js   # API: tạo / liệt kê / xem chi tiết link
│   └── utils/code.js     # Sinh & validate mã rút gọn
├── public/                # Frontend tĩnh (HTML/CSS/JS thuần)
├── sql/schema.sql         # Định nghĩa bảng "links"
├── .env.example
└── package.json
```

## Cài đặt & chạy local

### 1. Yêu cầu
- Node.js >= 18
- PostgreSQL đang chạy (local, Docker, hoặc dịch vụ cloud như Supabase/Railway/Render)

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

```bash
cp .env.example .env
```

Sửa `.env`, đặt `DATABASE_URL` trỏ tới database PostgreSQL của bạn. Ví dụ nếu chạy Postgres local:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/url_shortener
```

Nếu chưa có database, tạo trước:

```bash
createdb url_shortener
```

### 4. Khởi tạo bảng (migration)

```bash
npm run migrate
```

Lệnh này chạy `sql/schema.sql`, tạo bảng `links`. Chạy lại an toàn (dùng `IF NOT EXISTS`).

### 5. Chạy server

```bash
npm start
# hoặc khi phát triển, tự restart khi sửa code:
npm run dev
```

Mở trình duyệt tại **http://localhost:3000**.

## API

| Method | Endpoint            | Mô tả                                  |
|--------|---------------------|------------------------------------------|
| POST   | `/api/links`         | Tạo link mới. Body: `{ "url": "...", "code": "tuỳ-chọn" }` |
| GET    | `/api/links?limit=20`| Danh sách link tạo gần đây               |
| GET    | `/api/links/:code`   | Xem chi tiết + số click của 1 link       |
| GET    | `/:code`              | Redirect sang URL gốc (302)              |
| GET    | `/api/health`         | Health check                             |

Ví dụ tạo link bằng `curl`:

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://anthropic.com"}'
```

## Triển khai (deploy) gợi ý

- **App**: Render, Railway, Fly.io, hoặc VPS bất kỳ chạy Node.js
- **Database**: Render Postgres, Railway Postgres, Supabase, hoặc Neon (đều có gói free)
- Nhớ set `BASE_URL` trong biến môi trường thành domain thật khi deploy, để link trả về đúng địa chỉ công khai
- Nếu Postgres cloud yêu cầu SSL, set thêm `PGSSL=true`

## Việc tiếp theo (chưa làm trong bản này)

- [ ] Đăng nhập / quản lý link theo tài khoản
- [ ] Trang thống kê chi tiết (biểu đồ lượt click theo ngày, referrer, quốc gia)
- [ ] Sinh mã QR cho link rút gọn
- [ ] Đặt ngày hết hạn cho link (đã có cột `expires_at` trong DB, chưa có UI)
- [ ] Xoá / sửa link đã tạo
