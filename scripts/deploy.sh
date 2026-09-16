#!/usr/bin/env bash
# ==============================================================================
# Script Deploy Production Tự Động cho SPA Lan Anh Beauty
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🔄 [1/5] Kéo mã nguồn mới nhất từ Git..."
git pull origin main

echo "🔑 [2/5] Kiểm tra file môi trường .env..."
if [ ! -f .env ]; then
    echo "❌ Không tìm thấy file .env ở thư mục gốc!"
    echo "💡 Vui lòng copy .env.example thành .env và cấu hình biến môi trường trước khi deploy."
    exit 1
fi

echo "🐳 [3/5] Build và khởi chạy Docker Production Containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker compose -f docker-compose.prod.yml restart nginx

echo "🗄️ [4/5] Chạy Database Migrations..."
for i in {1..15}; do
    if docker compose -f docker-compose.prod.yml exec -T backend npm run db:migrate; then
        echo "✅ Migration thành công."
        break
    fi
    echo "⏳ Đang chờ MySQL sẵn sàng cho migration... ($i/15)"
    sleep 3
done

echo "🌱 [4.5/5] Chạy Database Seeders..."
for i in {1..15}; do
    if docker compose -f docker-compose.prod.yml exec -T backend npm run db:seed; then
        echo "✅ Seeders thành công."
        break
    fi
    echo "⏳ Đang chờ MySQL sẵn sàng cho seeders... ($i/15)"
    sleep 3
done

echo "🧹 [5/5] Dọn dẹp Docker Images và Cache thừa..."
docker image prune -f

echo "✅ Deploy Production thành công!"
docker compose -f docker-compose.prod.yml ps
