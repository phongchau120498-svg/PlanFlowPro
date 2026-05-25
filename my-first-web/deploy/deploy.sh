#!/usr/bin/env bash

# deploy.sh — Tự động cập nhật dự án trên VPS chạy Linux (Nginx)
# Script này được thiết kế để chạy trực tiếp trên VPS.

set -e

WEB_ROOT="/var/www/moawmoaws"
NGINX_CONF_PATH="/etc/nginx/sites-available/moawmoaws"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/moawmoaws"

echo "==========================================="
echo "🚀 Bắt đầu quá trình cập nhật Moaw Moaws..."
echo "==========================================="

# 1. Kéo code mới nhất từ Git Repo
if [ -d ".git" ]; then
    echo "⬇️ Đang kéo mã nguồn mới nhất từ Git..."
    git pull origin main
else
    echo "⚠️ Thư mục hiện tại không chứa repo Git. Hãy đảm bảo chạy script này trong thư mục chứa dự án."
    exit 1
fi

# 2. Sinh js/config.js từ .env (bắt buộc trên VPS)
if [ ! -f ".env" ]; then
    echo "❌ Thiếu file .env. Trên VPS: cp .env.example .env && điền secrets, rồi chạy lại."
    exit 1
fi
echo "⚙️ Đang build js/config.js từ .env..."
node scripts/build-config.mjs

# 3. Đồng bộ mã nguồn tĩnh vào thư mục Web Root
echo "📦 Đang đồng bộ hóa file tĩnh vào ${WEB_ROOT}..."
sudo mkdir -p "${WEB_ROOT}"

# Copy toàn bộ file tĩnh (chừa các file cấu hình cục bộ và hệ thống)
sudo rsync -av --delete \
    --exclude='.git/' \
    --exclude='.venv/' \
    --exclude='*.db' \
    --exclude='.env' \
    --exclude='.env.example' \
    --exclude='resend_config.txt' \
    --exclude='scripts/' \
    --exclude='my-brain/' \
    --exclude='deploy/' \
    ./ "${WEB_ROOT}/"

# 3. Phân quyền truy cập chính xác cho Web Server
echo "🔑 Thiết lập phân quyền truy cập cho Nginx..."
sudo chown -R www-data:www-data "${WEB_ROOT}"
sudo chmod -R 755 "${WEB_ROOT}"

# 4. Kiểm tra cấu hình Nginx
if [ -f "deploy/nginx.conf" ]; then
    echo "⚙️ Kiểm tra và cập nhật file cấu hình Nginx..."
    
    # Copy file cấu hình nếu chưa tồn tại
    if [ ! -f "${NGINX_CONF_PATH}" ]; then
        sudo cp deploy/nginx.conf "${NGINX_CONF_PATH}"
        echo "✅ Đã tạo cấu hình Nginx tại: ${NGINX_CONF_PATH}"
    fi

    # Tạo link kích hoạt nếu chưa liên kết
    if [ ! -f "${NGINX_ENABLED_PATH}" ]; then
        sudo ln -sf "${NGINX_CONF_PATH}" "${NGINX_ENABLED_PATH}"
        echo "✅ Đã kích hoạt cấu hình trong sites-enabled"
    fi
fi

# 5. Khởi động lại Nginx để cập nhật thay đổi
echo "🔄 Đang kiểm tra cú pháp và reload Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "==========================================="
echo "🎉 Hoàn tất deploy! Website đã sẵn sàng phục vụ các bestie. 🌸"
echo "==========================================="
