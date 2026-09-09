#!/usr/bin/env bash
# ==============================================================================
# Script Tự Động Backup MySQL Database
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "💾 Đang sao lưu CSDL MySQL..."
docker compose exec -T mysql mysqldump -uroot -p"${MYSQL_ROOT_PASSWORD:-rootpassword}" "${DB_NAME:-spa_lan_anh}" | gzip > "$BACKUP_FILE"

echo "✅ Backup thành công: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Tự động xóa các bản backup cũ hơn 14 ngày
find "$BACKUP_DIR" -type f -name "db_backup_*.sql.gz" -mtime +14 -delete
echo "🧹 Đã dọn dẹp các bản sao lưu cũ quá 14 ngày."
