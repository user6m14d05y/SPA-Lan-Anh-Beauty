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

Vào GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** và tạo 3 Secrets:

- `VPS_HOST`: IP của VPS (VD: `103.1.2.3`)
- `VPS_USERNAME`: User đăng nhập (VD: `root` hoặc `ubuntu`)
- `VPS_SSH_KEY`: Nội dung Private SSH Key (`~/.ssh/id_rsa`)

Mỗi khi bạn `git push origin main`, GitHub Actions sẽ tự động kiểm tra build và kết nối SSH để deploy code mới lên VPS mà bạn không cần thao tác gì thêm!
