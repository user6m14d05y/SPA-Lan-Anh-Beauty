# 🚀 Hướng Dẫn Tự Động Deploy Dự Án SPA Lan Anh Beauty Lên AWS EC2 Qua GitHub Actions (CI/CD)

Tài liệu này hướng dẫn chi tiết về cơ chế **tự động hóa 100%** quá trình triển khai dự án lên máy chủ **AWS EC2 (Ubuntu 26.04 / 24.04 / 22.04 LTS)** bằng GitHub Actions và Docker Compose mà **không cần thao tác thủ công trên VPS**.

---

## 📌 1. Tổng Quan Quy Trình Triển Khai

Mỗi khi bạn thực hiện `git push` code lên nhánh `main` (hoặc kích hoạt thủ công trong tab Actions), GitHub Actions sẽ tự động SSH vào máy chủ AWS EC2 và thực thi toàn bộ các bước sau:

```mermaid
graph TD
    A[Push Code / Trigger GitHub Actions] --> B[GitHub Actions Runner]
    B --> C[SSH vào AWS EC2 Server]
    C --> D{Kiểm tra Docker}
    D -- Chưa có --> E[Tự cài Docker & Docker Compose]
    D -- Đã có --> F{Kiểm tra Swap Memory}
    E --> F
    F -- Chưa có --> G[Tự tạo 2GB Swap Memory]
    F -- Đã có --> H{Kiểm tra Repo}
    G --> H
    H -- Chưa clone --> I[Git Clone về /var/www/spa-lan-anh-beauty]
    H -- Đã clone --> J[Git Fetch & Reset về origin/main]
    I --> K[Cập nhật file .env từ ENV_FILE_CONTENT Secret]
    J --> K
    K --> L[Docker Compose Build & Up -d]
    L --> M[Chạy Database Migration: npm run db:migrate]
    M --> N[Prune Docker images thừa & Hoàn tất]
```

---

## 🔑 2. Danh Sách GitHub Secrets Đã Cấu Hình

Vào GitHub Repo ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions**:

| Tên Secret | Ý nghĩa | Trạng thái |
| :--- | :--- | :--- |
| **`VPS_HOST`** | Public IPv4 Address của máy chủ AWS EC2 | ✅ Đã cấu hình |
| **`VPS_USERNAME`** | Username SSH (Mặc định: `ubuntu`) | ✅ Đã cấu hình |
| **`VPS_SSH_KEY`** | Nội dung file Private Key (`.pem`) | ✅ Đã cấu hình |
| **`VPS_PORT`** | Cổng SSH (Mặc định: `22`) | ✅ Đã cấu hình |
| **`ENV_FILE_CONTENT`** | Nội dung hoàn chỉnh của file `.env` Production | ✅ Đã cấu hình |

---

## 🛠️ 3. Cấu Hình File Workflow (`.github/workflows/deploy.yml`)

File cấu hình CI/CD tự động nằm tại vị trí:
`[deploy.yml](file:///.github/workflows/deploy.yml)`

Nó chứa đầy đủ logic tự phục hồi (Self-healing), tự cài đặt môi trường nếu máy chủ EC2 mới tinh chưa có gì.

---

## ⚡ 4. Cách Kích Hoạt Deploy

### Cách 1: Tự động (Khuyên dùng)
Chỉ cần thực hiện push code lên branch `main`:
```bash
git add .
git commit -m "feat: cap nhat tinh nang moi"
git push origin main
```

### Cách 2: Kích hoạt thủ công bằng tay
1. Truy cập vào GitHub Repository trên trình duyệt.
2. Chuyển sang tab **Actions**.
3. Chọn Workflow **CD - Deploy to Production AWS EC2 / VPS**.
4. Nhấn nút **Run workflow** ➔ Chọn branch `main` ➔ Bấm **Run workflow**.

---

## 🌐 5. Cấu Hình Tên Miền (Domain) & SSL HTTPS (Certbot)

Sau khi app đã deploy thành công và truy cập được qua IP của EC2, bạn trỏ domain về IP và cài SSL miễn phí:

1. **Trỏ bản ghi DNS (A-Record):**
   - Type: `A`
   - Name: `@` (hoặc `spa`)
   - Value: `<PUBLIC_IP_CUA_AWS_EC2>`

2. **Cài đặt SSL HTTPS miễn phí (Certbot):**
   SSH vào EC2 (`ssh vps-aws`) và chạy 1 lệnh duy nhất:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d test.yourdomain.com
   ```

---

## 📊 6. Lệnh Kiểm Tra & Khắc Phục Sự Cố Trên AWS EC2

Khi cần kiểm tra trạng thái dịch vụ trên máy chủ:

```bash
# Di chuyển vào thư mục dự án trên EC2
cd /var/www/spa-lan-anh-beauty

# Xem trạng thái các container đang chạy
sudo docker compose -f docker-compose.prod.yml ps

# Xem log thực tế của Backend
sudo docker compose -f docker-compose.prod.yml logs -f backend

# Xem log của Nginx Reverse Proxy
sudo docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## ⚠️ 7. Lưu Ý Quan Trọng: Khắc Phục Lỗi `dial tcp ***:***: i/o timeout`

Nếu GitHub Actions thất bại ở bước `appleboy/ssh-action` với lỗi `dial tcp ***:***: i/o timeout`:

### Nguyên nhân:
AWS EC2 Security Group mặc định chỉ mở Port 22 SSH cho IP máy tính cá nhân (`My IP`). Khi GitHub Actions chạy từ runner đám mây, kết nối SSH sẽ bị AWS Firewall chặn lại dẫn đến timeout.

### Cách khắc phục:
1. Đăng nhập vào **AWS EC2 Console** ➔ chọn **Security Groups** của Instance.
2. Bấm nút **Edit inbound rules**.
3. Tại quy tắc **SSH (Port 22)**: Đổi **Source** từ `IP_cá_nhân/32` thành **`0.0.0.0/0`** (Anywhere IPv4).
4. Kiểm tra Secret **`VPS_HOST`** trên GitHub: Đảm bảo sử dụng **Public IPv4** của EC2 (không dùng IP nội bộ `172.31.x.x`).
5. Vào lại tab **Actions** trên GitHub ➔ Chọn workflow vừa lỗi ➔ Bấm **Re-run all jobs**.

---

## ⚠️ 8. Khắc Phục Lỗi `no space left on device` (Hết dung lượng ổ đĩa EC2)

Nếu build Docker bị lỗi `write /var/lib/containerd/... no space left on device`:

### Nguyên nhân:
Mặc định ổ đĩa EBS khi khởi tạo EC2 chỉ có **8GB**. Khi cài Docker, pull nhiều image (MySQL, Nginx, Node) và build đồng thời 2 container Frontend & Backend, bộ nhớ đệm (build cache) bị đầy.

### Cách khắc phục ngay trên EC2:
SSH vào EC2 và dọn dẹp bộ nhớ đệm Docker / APT:
```bash
sudo apt-get clean
sudo docker system prune -af --volumes
```

### Cách tăng dung lượng ổ đĩa EC2 lên 30GB (Miễn phí 100% trên AWS Free Tier):
1. Đăng nhập **AWS EC2 Console** ➔ chọn **Volumes** (ở thanh bên trái).
2. Chọn Volume của máy EC2 ➔ Bấm **Actions** ➔ **Modify Volume**.
3. Đổi kích thước (Size) từ `8` GiB lên **`30`** GiB (AWS cho miễn phí tối đa 30GB EBS) ➔ Bấm **Modify**.
4. SSH vào EC2 và chạy lệnh mở rộng phân vùng (không cần restart server):
   ```bash
   sudo growpart /dev/nvme0n1 1
   sudo resize2fs /dev/nvme0n1p1
   # Kiểm tra lại dung lượng:
   df -h
   ```


