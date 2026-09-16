# Hướng Dẫn Tăng Cường Bảo Mật Máy Chủ AWS EC2 & Hạ Tầng (AWS EC2 Security Hardening Guide)

**Dự án:** SPA Lan Anh Beauty  
**Chủ đề:** Quy trình & Chuẩn bảo mật máy chủ EC2, Docker và hạ tầng AWS  
**Ngày cập nhật:** 16/09/2026  

---

## 📋 1. Quản Lý Truy Cập Mạng (Network & Security Groups)

### 1.1 Giới Hạn Cổng SSH (Port 22)
* **Khuyên dùng:** Không mở cổng `22` (SSH) rộng rãi cho toàn bộ Internet (`0.0.0.0/0`).
* **Phương án 1 (IP Whitelisting):** Chỉ cho phép truy cập SSH từ địa chỉ IP tĩnh cố định của Quản trị viên.
* **Phương án 2 (AWS SSM Session Manager - Được khuyến nghị):** 
  - Tắt mở cổng 22 công khai trên Security Group.
  - Cài đặt `amazon-ssm-agent` trên máy chủ EC2 và gán IAM Role `AmazonSSMManagedInstanceCore` cho Instance.
  - Kết nối quản trị máy chủ qua AWS Systems Manager Console hoặc AWS CLI một cách an toàn mà không cần mở bất kỳ cổng truy cập từ xa nào.

### 1.2 Danh Sách Cổng Được Mở / Bị Chặn Trên Máy Chủ EC2

Trên Security Group và Docker, ứng dụng tuân thủ nguyên tắc mở cổng tối thiểu (Least Privilege Network Access):

| Cổng (Port) | Dịch Vụ | Phạm Vi (Scope) | Trạng Thái Public | Ghi Chú Bảo Mật |
| --- | --- | --- | --- | --- |
| **80** | Nginx Proxy (HTTP) | Public (`0.0.0.0/0`) | 🟢 **MỞ PUBLIC** | Tự động chuyển hướng (Redirect) 301 sang HTTPS. |
| **443** | Nginx Proxy (HTTPS) | Public (`0.0.0.0/0`) | 🟢 **MỞ PUBLIC** | Cổng duy nhất nhận kết nối mã hóa SSL/TLS cho Web & Webhooks. |
| **3306 / 3307** | MySQL Database | Nội bộ Docker (`127.0.0.1`) | 🔴 **CHẶN HOÀN TOÀN** | Chỉ giao tiếp nội bộ với `spa_prod_backend`. Không expose ra ngoài. |
| **6379** | Redis Cache & Queue | Nội bộ Docker (`127.0.0.1`) | 🔴 **CHẶN HOÀN TOÀN** | Chỉ phục vụ cache và hàng đợi cho `spa_prod_backend`. Không expose ra ngoài. |
| **5000** | Express Backend API | Nội bộ Docker | 🔴 **CHẶN HOÀN TOÀN** | Được Nginx Proxy lại qua cổng 443. Không mở trực tiếp cổng 5000. |
| **5173** | Vite / Client App | Nội bộ Docker | 🔴 **CHẶN HOÀN TOÀN** | Được Nginx Proxy lại qua cổng 443. |

---

## 🛡️ 2. Bảo Mật Môi Trường Docker (Docker Production Hardening)

### 2.1 Phân Tích Cấu Hình Docker Compose Production vs Development

Dự án có 2 tệp cấu hình Docker Compose chính:
1. **`docker-compose.yml` (Dùng cho Development / Local):**
   - Mở cổng `3307:3306` (MySQL) để dev dùng HeidiSQL / DBeaver kết nối trực tiếp.
   - Mở cổng `5000:5000` (Backend) và `5173:5173` (Frontend) cho Hot-Reload.
2. **`docker-compose.prod.yml` (Dùng cho Production / AWS EC2):**
   - **MySQL (`spa_prod_mysql`):** Loại bỏ hoàn toàn khối `ports:`. Chỉ dùng Docker internal network.
   - **Redis (`spa_prod_redis`):** Không dùng `ports:`. Chỉ dùng Docker internal network (`expose: - "6379"`).
   - **Backend (`spa_prod_backend`):** Chỉ dùng `expose: - "5000"`.
   - **Frontend (`spa_prod_frontend`):** Chỉ dùng `expose: - "5173"`.
   - **Nginx (`spa_prod_nginx`):** Dịch vụ duy nhất giữ `ports: - "80:80"` và `- "443:443"`.

> ⚠️ **Lưu ý triển khai Production:** Khi lệnh chạy trên EC2, luôn đảm bảo chỉ sử dụng tệp production:
> ```bash
> docker compose -f docker-compose.prod.yml up -d --build
> ```

### 2.2 Cập Nhật Bản Vá Định Kỳ (OS Patch Management)
Thực hiện cập nhật các bản vá an ninh cho hệ điều hành Linux (Ubuntu/Debian/Amazon Linux) theo định kỳ:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

### 2.3 Quản Lý Quyền Thực Thi Docker (Container Security)
* Không chạy ứng dụng Node.js/Express bằng tài khoản `root` bên trong Container.
* Sử dụng directive `USER node` trong `Dockerfile` production.
* Giới hạn tài nguyên (CPU/RAM limits) cho từng Container trong `docker-compose.prod.yml` để tránh tấn công chiếm dụng tài nguyên máy chủ EC2 (`cpus: '0.8'`, `memory: 512M`).

### 2.4 Bảo Vệ Bí Mật & Biến Môi Trường (Secret Management)
* Phân quyền cho tệp cấu hình chứa thông tin nhạy cảm (`.env`):
  ```bash
  chmod 600 .env
  ```
* Không bao giờ commit tệp `.env` lên Git repository.
* Đảm bảo web server (Nginx/Express) không phục vụ trực tiếp các tệp ẩn (`.env`, `.git`) ra bên ngoài.

---

## 🌐 3. Cấu Hình Reverse Proxy (Nginx) & Tường Lửa Ứng Dụng (WAF)

### 3.1 Bổ Sung Các HTTP Security Headers Trên Nginx
Thêm các Header an toàn vào cấu hình Nginx (`scripts/nginx.conf`):
```nginx
# Ngăn chặn Clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Chống MIME-sniffing
add_header X-Content-Type-Options "nosniff" always;

# Kích hoạt XSS Protection trên trình duyệt cũ
add_header X-XSS-Protection "1; mode=block" always;

# Ẩn thông tin phiên bản Nginx
server_tokens off;
```

### 3.2 Tích Hợp Cloudflare / AWS WAF
* Trỏ tên miền qua **Cloudflare** hoặc **AWS WAF** phía trước EC2.
* Bật tính năng **Always Use HTTPS**, **Automatic HTTPS Rewrites**, và **Bot Fight Mode**.
* Bật quy tắc WAF ngăn chặn các cuộc tấn công phổ biến: SQL Injection (SQLi), Cross-Site Scripting (XSS), Remote Code Execution (RCE).

---

## 🔐 4. Quản Lý Quyền Hạn AWS IAM (Identity and Access Management)

### 4.1 Sử Dụng IAM Roles Thay Vì Long-Lived Access Keys
* Gán **IAM Role** trực tiếp cho máy chủ EC2 thay vì lưu trữ static AWS Access Key / Secret Key trong mã nguồn ứng dụng.
* Sử dụng dịch vụ **AWS Secrets Manager** hoặc **Systems Manager Parameter Store** để quản lý các thông tin cấu hình nhạy cảm.

---

## 📊 5. Giám Sát, Nhật Ký & Phát Hiện Bất Thường (Monitoring & Logging)

1. **AWS CloudTrail:** Bật theo dõi toàn bộ nhật ký thao tác trên tài khoản AWS.
2. **Amazon GuardDuty:** Kích hoạt dịch vụ phát hiện đe dọa thông minh của AWS để tự động cảnh báo khi có hành vi SSH lạ, quét cổng, hoặc kết nối tới các IP độc hại.
3. **Quản lý Log Nginx & Docker:** Thường xuyên rà soát log truy cập bất thường:
   ```bash
   docker logs --tail 100 -f spa_prod_backend
   sudo tail -f /var/log/nginx/access.log
   ```

---
*Tài liệu được lưu trữ tại `docs/aws/huong-dan-bao-mat-ec2-aws.md` phục vụ công tác vận hành và bảo trì an toàn máy chủ dự án SPA Lan Anh Beauty.*
