# Hướng Dẫn Kiến Trúc, Bảo Trì & Triển Khai Production (SPA Lan Anh Beauty)

Tài liệu hướng dẫn toàn diện về kiến trúc hệ thống, quy trình bảo trì, cấu hình Nginx Single Domain và triển khai tự động lên VPS bằng GitHub Actions CI/CD.

---

## 📌 1. Tổng Quan Kiến Trúc (Architecture Overview)

Dự án được xây dựng theo mô hình **Decoupled Full-Stack Architecture** hướng module, sẵn sàng cho môi trường Production:

```
[Khách Hàng / Browser] 
          │
          ▼
 [Nginx Reverse Proxy] ──── (Port 80 / 443: lananhbeauty.thanhbtdev.id.vn)
    │           │            │                 │
    │ ( / )     │ ( /api/ )  │ ( /socket.io/ ) │ ( /sepay-webhook )
    ▼           ▼            ▼                 ▼
[Frontend]  [Backend]  [Websocket Chat] [SePay Webhook]
 (Vite/React) (Express)   (Socket.io)   (Auto Matching)
                   │
                   ▼
            [Database MySQL 8.0]
```

---

## 🌐 2. Cấu Hình Nginx Single Domain (`lananhbeauty.thanhbtdev.id.vn`)

Tất cả các dịch vụ chạy chung lượt trên 1 tên miền duy nhất thông qua Nginx Reverse Proxy (`scripts/nginx.conf`):

| Endpoint Route | Đích đến Container | Mục đích sử dụng |
| :--- | :--- | :--- |
| **`/`** | `http://frontend:5173` | Giao diện Single Page Application (Client & Admin) |
| **`/api/`** | `http://backend:5000/api/` | REST API (Booking, Auth, Catalog, Customer...) |
| **`/sepay-webhook`** | `http://backend:5000/sepay-webhook` | Webhook tự động khớp mã chuyển khoản VietQR |
| **`/uploads/`** | `http://backend:5000/uploads/` | Lưu trữ static media/hình ảnh dịch vụ |
| **`/socket.io/`** | `http://backend:5000/socket.io/` | Realtime Livechat tư vấn khách hàng |

---

## ⚙️ 3. Quản Lý Biến Môi Trường (.env)

Tất cả các thông số nhạy cảm được cấu hình thông qua file `.env` trên VPS:

* `DOMAIN_NAME`: `lananhbeauty.thanhbtdev.id.vn`
* `VITE_API_URL`: `/api`
* `MYSQL_ROOT_PASSWORD`: Mật khẩu root MySQL
* `DB_HOST`: `mysql` (Tên container trong Docker network)
* `JWT_SECRET`: Chuỗi khóa bảo mật Token mã hóa
* `SEPAY_API_KEY`: Key xác thực Webhook thanh toán
* `SEPAY_SECRET_KEY`: Secret Key xác thực Webhook

> **Lưu ý bảo mật:** File `.env` tuyệt đối **KHÔNG** commit lên Git (Đã được chặn bởi `.gitignore`).

---

## 🚀 4. Triển Khai Tự Động Với GitHub Actions (CI/CD)

File workflow: `.github/workflows/deploy.yml`

### Các bước cài đặt 1 lần duy nhất trên VPS:

```bash
# 1. Tạo thư mục và phân quyền cho user thanhbt
sudo mkdir -p /var/www/spa-lan-anh-beauty
sudo chown -R thanhbt:thanhbt /var/www/spa-lan-anh-beauty

# 2. Clone repo về VPS
cd /var/www/spa-lan-anh-beauty
git clone <URL_REPO_GITHUB_CUA_BAN> .

# 3. Tạo file .env từ file mẫu
cp .env.example .env
```

### Các GitHub Secrets cần cấu hình trên Repo:
- `VPS_HOST`: IP VPS hoặc `lananhbeauty.thanhbtdev.id.vn`
- `VPS_USERNAME`: `thanhbt`
- `VPS_SSH_KEY`: Nội dung SSH Private Key
- `VPS_PORT`: `22`
- `DEPLOY_PATH`: `/var/www/spa-lan-anh-beauty`

Mỗi khi thực hiện `git push origin main`, hệ thống tự động build Docker, cập nhật DB Migration và dọn dẹp bộ nhớ trên VPS.

---

## 🛠️ 5. Đánh Giá Khả Năng Bảo Trì & Mở Rộng (Maintainability)

1. **Khả năng mở rộng (Scalability):** Dễ dàng nâng cấp Redis Cache hoặc chia tải backend thành các Microservices độc lập khi lượng truy cập tăng đột biến.
2. **Dễ bảo trì (Maintainability):** Code tách biệt theo Service Layer, Controller Layer và Component CSS Modules cô lập.
3. **An toàn dữ liệu (Data Safety):** Dữ liệu MySQL được lưu trữ bền vững qua Docker Volume `mysql_data`.
