# 🚀 Hướng Dẫn Deploy Production Trên VPS (VPS Deployment Guide)

Tài liệu này hướng dẫn chi tiết các bước đưa hệ thống **SPA Lan Anh Beauty** lên máy chủ VPS (Ubuntu / Debian) bằng Docker Compose, SSL HTTPS và GitHub Actions CI/CD.

---

## 🛠️ 1. Chuẩn Bị VPS

### Yêu Cầu Tối Thiểu
- **OS:** Ubuntu 20.04 / 22.04 LTS hoặc Debian 11/12
- **Cấu hình:** 1 CPU, 2GB RAM, 20GB SSD
- **Tên miền (Domain):** Đã trỏ A-record về IP của VPS (VD: `lananhbeauty.com`)

---

## ⚡ 2. Cài Đặt Ban Đầu Trên VPS (Một lần duy nhất)

SSH vào VPS của bạn và chạy lệnh sau:

```bash
# Clone dự án về VPS (Thư mục /var/www/SPA-Lan-Anh-Beauty)
git clone https://github.com/your-username/SPA-Lan-Anh-Beauty.git /var/www/SPA-Lan-Anh-Beauty
cd /var/www/SPA-Lan-Anh-Beauty

# Phân quyền thực thi cho các script trong scripts/
chmod +x scripts/*.sh

# Chạy script tự động cài Docker, UFW Firewall và Tạo 2GB Swap Memory
./scripts/setup-vps.sh
```

---

## ⚙️ 3. Cấu Hình Biến Môi Trường (`.env`)

Tạo file `.env` tại thư mục gốc của VPS:

```bash
cp .env.example .env
nano .env
```

Điền các thông số Production bảo mật:
```env
MYSQL_ROOT_PASSWORD=Password_MySQL_Sieu_Bao_Mat_2026
DB_NAME=spa_lan_anh_prod
DB_USER=spa_admin
DB_PASS=Password_User_Bao_Mat_2026

PORT=5000
JWT_SECRET=Chuoi_Bi_Mat_JWT_Ngau_Nhien_64_Ky_Tu

# Email SMTP (Gmail App Password hoặc Mailgun/SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=spalananh@gmail.com
SMTP_PASS=app_password_here
SMTP_FROM="Lan Anh Beauty <spalananh@gmail.com>"

# Gemini AI API Key
GEMINI_KEY=your_gemini_api_key
```

---

## 🚀 4. Khởi Chạy Deploy Production

Chạy script deploy sản xuất:

```bash
./scripts/deploy.sh
```

Script sẽ tự động:
1. Git pull code mới nhất.
2. Build các container production (`spa_prod_mysql`, `spa_prod_backend`, `spa_prod_frontend`, `spa_prod_nginx`).
3. Chạy Database Migrations tự động.
4. Dọn dẹp Docker images rác.

---

## 🔒 5. Cài Đặt SSL HTTPS Miễn Phí (Let's Encrypt / Certbot)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 💾 6. Cấu Hình Tự Động Backup CSDL MySQL (Cronjob)

Mở cronjob trên VPS:
```bash
crontab -e
```
Thêm dòng sau để tự động sao lưu CSDL lúc **02:00 sáng mỗi ngày**:
```cron
0 2 * * * /var/www/SPA-Lan-Anh-Beauty/scripts/backup-db.sh >> /var/log/spa_backup.log 2>&1
```

---

## 🤖 7. Cấu Hình Tự Động Deploy Với GitHub Actions CI/CD

File workflow: `.github/workflows/deploy.yml`

### Các GitHub Secrets cần cấu hình trên Repo:
- `VPS_HOST`: IP của VPS (VD: `103.1.2.3`)
- `VPS_USERNAME`: User đăng nhập (VD: `root` hoặc `ubuntu`)
- `VPS_SSH_KEY`: Nội dung Private SSH Key (`~/.ssh/id_rsa`)
- `VPS_PORT`: `22` (Mặc định)
- `DEPLOY_PATH`: `/var/www/spa-lan-anh-beauty`

Mỗi khi bạn `git push origin main` hoặc merge PR vào `main`, GitHub Actions sẽ tự động:
1. SSH vào VPS và kéo mã nguồn mới nhất (`git fetch origin main && git reset --hard origin/main`).
2. Rebuild các Docker Container (với Node 22 Alpine hỗ trợ ES Modules).
3. **Tự động chạy Migration & Seeder CSDL** (với cơ chế thử lại 20 lần cho đến khi MySQL sẵn sàng; nếu thất bại sẽ bắt lỗi `exit 1` rõ ràng trên GitHub Actions).

---

## 💡 8. Quy Tắc Viết DB Migration An Toàn (Idempotent Migration)

Để tránh ngắt tiến trình `db:migrate` trên Production do lỗi trùng tên cột/index (`Duplicate column name`):
1. **Node 22 & ES Module**: Backend Docker container sử dụng Node 22 (`FROM node:22-alpine`) kèm `NODE_OPTIONS=--experimental-require-module` để `sequelize-cli` nạp mượt các file migration dạng `export default`.
2. **Kểm tra trước khi thêm cột/index**: Các file migration thêm cột cần dùng `describeTable` để kiểm tra sự tồn tại của cột trước khi gọi `queryInterface.addColumn`:
   ```javascript
   const tableInfo = await queryInterface.describeTable('bookings');
   if (!tableInfo.customerEmail) {
     await queryInterface.addColumn('bookings', 'customerEmail', { ... });
   }
   ```

