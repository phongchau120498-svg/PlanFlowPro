# MOAW MOAWS — Cấu trúc dự án

Toàn bộ code đã được tách thành các file riêng theo chức năng. Dưới đây là **bản đồ "muốn sửa cái gì → vào file nào"**.

## Cây thư mục

```
moaw-moaws/
├── index.html                  ← Khung HTML, link tất cả CSS/JS
├── css/
│   ├── base.css                ← Biến màu, font, reset, typography
│   ├── components.css          ← Button, fade-up, hamburger, focus, nav-anim
│   ├── header.css              ← Header sticky + 2 overlay
│   ├── hero.css                ← Banner ảnh lớn đầu trang
│   ├── products.css            ← 3 ô sản phẩm + crossfade + popup giá
│   ├── gallery.css             ← Mosaic ảnh
│   ├── brand-story.css         ← Logo khổng lồ
│   └── footer.css              ← Footer 3 cột + accordion mobile
├── js/
│   ├── header.js               ← Auto hide/show + menu overlay + search overlay
│   ├── animations.js           ← Fade-up khi scroll + stagger logo khổng lồ
│   ├── products.js             ← Crossfade ảnh sản phẩm + add to cart
│   ├── newsletter.js           ← Form đăng ký Supabase
│   └── main.js                 ← Smooth scroll + utility chung
└── README.md                   ← (Bạn đang đọc)
```

## Bản đồ "Muốn sửa X → Vào file Y"

### Đổi MÀU SẮC, FONT chữ
→ `css/base.css` — phần `:root { --cream: ... }` và Tailwind config trong `index.html`

### Đổi NỘI DUNG (text, copy, hình ảnh)
→ `index.html` — toàn bộ nội dung hiển thị nằm ở đây, mỗi section có comment phân tách rõ:
- `SECTION 0 · HEADER` — menu, logo, icon
- `SECTION 1 · HERO BANNER` — heading, subhead, button, ảnh nền hero
- `SECTION 2 · 3 SẢN PHẨM` — tên sản phẩm, giá, ảnh sản phẩm
- `SECTION 3 · BANNER BỘ SƯU TẬP` — heading, mô tả, ảnh nền
- `SECTION 4 · GALLERY` — link ảnh mosaic
- `SECTION 5 · BRAND STORY` — manifesto
- `SECTION 6 · FOOTER` — links, social, newsletter

### Đổi HEADER (auto hide/show, menu, search)
- Style: `css/header.css`
- Logic: `js/header.js` — chỉnh ngưỡng scroll (mặc định ẩn khi xuống >8px, hiện khi lên >5px)
- Markup: `index.html` — block `<header id="header">`

### Đổi HIỆU ỨNG HOVER 3 ô sản phẩm
- Style crossfade + popup giá: `css/products.css`
- Logic tap trên mobile: `js/products.js`
- Markup từng ô: `index.html` — phần `<article class="hero-prod-card">`

### Đổi HEADING / NỘI DUNG hero banner
→ `index.html` — section `id="hero"` (tìm `SECTION 1`)

### Đổi ẢNH MOSAIC gallery
→ `index.html` — section `id="gallery"` (tìm `SECTION 4`). Có 2 grid riêng cho desktop và mobile.

### Đổi LOGO KHỔNG LỒ ở section about
- Kích thước: `css/brand-story.css`
- Hiệu ứng từng chữ: `js/animations.js` (chỉnh `delayBase`)
- Manifesto text: `index.html` — section `id="about"`

### Đổi API keys, Supabase, thanh toán, mật khẩu admin
→ Chỉnh **một file** `.env` (sao chép từ `.env.example`), rồi chạy:
```bash
npm run build:config
```
Sinh ra `js/config.js` — mọi file JS/HTML đọc qua `moawConfig()`.

**Lần đầu:** `cp .env.example .env` → điền secrets → `npm run build:config`

**Deploy VPS:** copy `.env` lên server (không commit Git), `deploy.sh` tự chạy build trước khi rsync.

`RESEND_API_KEY` chỉ đặt trong `.env` (tham chiếu) và **Supabase Edge Function Secrets** — không lên web.

### Đổi FOOTER (cột links)
→ `index.html` — section `<footer>` (tìm `SECTION 6`). Mỗi cột là một `<details>` block, mobile sẽ tự thành accordion.

### Đổi animation FADE-UP khi scroll
→ `js/animations.js` — chỉnh `threshold` trong IntersectionObserver
→ `css/components.css` — chỉnh `.fade-up { transition: ... }`

## Cách chạy thử

### Cách 1: Mở trực tiếp file (đơn giản nhất)
Double-click `index.html` để mở bằng trình duyệt.
**Lưu ý:** Một số tính năng (form Supabase) cần kết nối mạng.

### Cách 2: Live Server (khuyên dùng khi đang phát triển)
```bash
cp .env.example .env   # nếu chưa có
npm run build:config
```
- Cài extension **Live Server** trong VS Code
- Click chuột phải vào `index.html` → "Open with Live Server"
- Sau khi đổi `.env`, chạy lại `npm run build:config` rồi reload trang

### Cách 3: Python local server (không cần cài extension)
```bash
cd moaw-moaws
python3 -m http.server 8000
```
Rồi mở `http://localhost:8000` trong trình duyệt.

## Lưu ý quan trọng

**Tailwind CDN:** Đang dùng `cdn.tailwindcss.com` cho tiện. Khi deploy production thật, nên build Tailwind thành file CSS tĩnh để load nhanh hơn.

**Font Google Fonts:** Cần kết nối mạng. Có thể tự host bằng cách tải font về `fonts/` và đổi `@font-face` trong `base.css`.

**Ảnh Unsplash:** Đang dùng URL Unsplash trực tiếp. Khi launch thật, thay bằng ảnh chụp sản phẩm thật của brand.

**Cấu hình (.env):** Bắt buộc `npm run build:config` trước khi mở site hoặc deploy. Bảng leads trên Supabase cần các cột `name`, `phone`, `email`, `interest`.

## Quy ước khi sửa code

1. **Một thay đổi = một file.** Nếu cần sửa 2-3 file cùng lúc, hãy ghi chú lại.
2. **Comment rõ phần đã sửa** để dễ rollback nếu hỏng.
3. **Test trên mobile trước** (Chrome DevTools → Toggle device toolbar → iPhone SE 375px).
4. **Đụng vào `tailwind.config` trong index.html** trừ khi cần thêm token màu/font mới.

---

## 🚀 Hướng dẫn Deploy lên VPS Linux (Nginx)

Dự án này sử dụng kiến trúc **JAMstack (tĩnh hoàn toàn)** nên việc deploy lên VPS cực kỳ đơn giản và nhanh chóng thông qua máy chủ Nginx. Bạn đã được trang bị sẵn bộ công cụ deploy tự động hóa nằm trong thư mục `deploy/`.

### 📂 Thư mục chứa cấu hình deploy bổ sung:
- `deploy/nginx.conf`: Cấu hình Nginx ảo (virtual host) tối ưu hóa cache tĩnh.
- `deploy/deploy.sh`: Script bash chạy trên VPS để tự động đồng bộ code và reload server.

### 🛠️ 5 Bước Deploy nhanh lên VPS:

#### Bước 1: Trỏ DNS Tên miền
Trỏ tên miền `moawmoaws.beauty` của bạn về IP của VPS (Bản ghi `A` cho `@` và `CNAME` cho `www`).

#### Bước 2: Cài đặt Web Server trên VPS
Đăng nhập SSH vào VPS Linux của bạn và khởi tạo môi trường:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx git rsync curl -y
```

#### Bước 3: Đưa code lên VPS
Khuyên dùng phương thức đồng bộ Git Private Repo:
1. Đẩy mã nguồn hiện tại lên GitHub/GitLab.
2. Clone repo về một thư mục bất kỳ trên VPS (Ví dụ: `/home/ubuntu/moaw-first-web`).

#### Bước 4: Thiết lập Nginx & Kích hoạt Web tĩnh
Chạy lệnh sau trên VPS để thiết lập Nginx serve thư mục web root `/var/www/moawmoaws`:
```bash
# 1. Tạo thư mục chứa web root tĩnh
sudo mkdir -p /var/www/moawmoaws
sudo chown -R $USER:$USER /var/www/moawmoaws

# 2. Liên kết file cấu hình Nginx có sẵn
sudo cp deploy/nginx.conf /etc/nginx/sites-available/moawmoaws
sudo ln -sf /etc/nginx/sites-available/moawmoaws /etc/nginx/sites-enabled/

# 3. Test và reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### Bước 5: Cài đặt Chứng chỉ bảo mật SSL (HTTPS bắt buộc)
Để tích hợp HTTPS miễn phí tự động gia hạn với Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d moawmoaws.beauty -d www.moawmoaws.beauty
```

---

### ⚡ Cập nhật Website tự động bằng Deploy Script
Mỗi khi bạn có sự thay đổi code mới trên máy local và đã push lên Git, chỉ cần SSH vào thư mục chứa code trên VPS và chạy lệnh sau:
```bash
./deploy/deploy.sh
```
*Script sẽ tự động kéo code mới nhất, đồng bộ vào web root tĩnh `/var/www/moawmoaws`, phân quyền chính xác cho Nginx (`www-data`) và reload máy chủ an toàn!*

