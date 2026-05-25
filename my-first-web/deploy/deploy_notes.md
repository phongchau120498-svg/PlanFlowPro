# Deploy notes — Bước 1 (VPS Ubuntu + Node.js)

## Stack dự án

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | HTML/CSS/JS tĩnh, Tailwind CDN, Supabase REST (client) |
| Backend | **Node.js 18+** + **Express** (`server.js`) |
| Brain / nội dung nội bộ | SQLite `brain.db` (bảng `knowledge`, `business`, `brand_voice`) |
| Email | Supabase Edge Function + Resend (key trên Supabase, không trên VPS web) |

Express phục vụ file tĩnh, route `/admin`, và API `/api/brain/*`.

---

## Git / GitHub

- Repo local: **đã là git repo**
- Remote hiện tại: `https://github.com/phongchau120498-svg/my-first-web`
- Repo tên `my-website`: **chưa tạo** (máy dev chưa cài `gh` CLI). Có thể tạo thủ công trên GitHub rồi `git remote add website <url>` hoặc đổi tên repo trên GitHub.

---

## Biến môi trường trên VPS (file `.env`)

Tạo từ mẫu:

```bash
cp .env.example .env
nano .env
```

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `PORT` | Khuyến nghị | Cổng Node listen (mặc định `3000`) |
| `NODE_ENV` | Khuyến nghị | `production` |
| `BRAIN_DB_PATH` | Khuyến nghị | Đường dẫn `brain.db`, mặc định `./my-brain/brain.db` |
| `SUPABASE_URL` | Có | URL project Supabase |
| `SUPABASE_ANON_KEY` | Có | Anon / publishable key |
| `SUPABASE_LEADS_TABLE` | Có | Thường là `leads` |
| `PAYMENT_BANK_ID` | Có | Mã ngân hàng VietQR |
| `PAYMENT_ACCOUNT_NO` | Có | Số tài khoản |
| `PAYMENT_ACCOUNT_NAME` | Có | Tên chủ TK |
| `ADMIN_PASSWORD` | Có | Mật khẩu admin + header API ghi brain |
| `ZALO_LINK` | Không | Link Zalo |
| `WAITLIST_FORM_URL` | Không | Google Form waitlist |
| `RESEND_API_KEY` | Không trên web | Chỉ đặt trong Supabase Edge Function Secrets |

**Không commit** `.env`, `js/config.js`, `brain.db`.

---

## Cổng & lệnh chạy server

```bash
# Lần đầu trên VPS
cd /var/www/moawmoaws   # hoặc thư mục clone repo
cp .env.example .env && nano .env

npm ci
npm run build:config    # sinh js/config.js từ .env

# Khởi tạo brain.db (nếu chưa có)
cd my-brain && python3 init_brain_db.py && cd ..

# Chạy thử
npm start
# → Listen: process.env.PORT || 3000
# → http://SERVER_IP:3000
# → Admin: http://SERVER_IP:3000/admin
# → API:   http://SERVER_IP:3000/api/health
```

Production (systemd hoặc pm2):

```bash
PORT=3000 NODE_ENV=production npm start
```

Nginx reverse proxy (khuyến nghị): proxy `80/443` → `127.0.0.1:3000`, bật `auth_basic` cho `/admin` (xem `deploy/nginx.conf`).

---

## API Brain (cần header ghi dữ liệu)

- `GET /api/health`
- `GET /api/brain/tables`
- `GET /api/brain/:table` — `knowledge` \| `business` \| `brand_voice`
- `GET /api/brain/:table/:id`
- `POST|PUT|DELETE` — header `X-Admin-Password: <ADMIN_PASSWORD>`

---

## Bước 2 (sau này)

SSL, systemd/pm2, Nginx proxy hoàn chỉnh, backup `brain.db`, rotate keys.
