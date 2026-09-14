# 🌟 SPA Lan Anh Beauty - Hệ Thống Quản Lý & Đặt Lịch Spa Cao Cấp

![NodeJS](https://img.shields.io/badge/Node.js-v20-green?logo=nodedotjs)
![React](https://img.shields.io/badge/React-v19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-v8-purple?logo=vite)
![Express](https://img.shields.io/badge/Express.js-v4-black?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-v8.0-orange?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-WSL%20Compose-2496ED?logo=docker)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions)

Hệ thống quản lý và đặt lịch hẹn toàn diện cho **SPA Lan Anh Beauty**, được thiết kế theo kiến trúc hiện đại gộp ứng dụng **Frontend (Client + Admin)** và **Backend RESTful API + Realtime Socket.io**, đóng gói tối ưu trên **Docker** và hỗ trợ **CI/CD Deploy VPS**.

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```text
SPA-Lan-Anh-Beauty/
├── .github/workflows/      # ⚙️ GitHub Actions CI/CD Pipeline (ci.yml)
├── backend/                # Express.js API, Socket.io, Sequelize ORM, Gemini Chatbot
├── frontend/               # React 19 + Vite (Gộp Client tại / và Admin tại /admin)
│   ├── public/             # Logo.png, icons.svg
│   └── src/
│       ├── components/     # client/, admin/, shared/
│       ├── context/        # AuthContext.jsx
│       ├── layouts/        # MainLayout.jsx (Client) & AdminLayout.jsx (Admin)
│       ├── pages/          # client/ pages & admin/ pages
│       ├── styles/         # TailWind & HSL Luxury Spa theme
│       ├── App.jsx         # Unified Routing
│       └── icons.jsx       # Consolidate icon system
├── scripts/                # 🛠️ Script tự động hóa VPS & Production
│   ├── setup-vps.sh        # Cài Docker, Firewall & Swap cho VPS Ubuntu
│   ├── deploy.sh           # Script deploy 1-click
│   ├── backup-db.sh        # Tự động backup CSDL MySQL
│   ├── nginx.conf          # Cấu hình Nginx Reverse Proxy SSL
│   └── docker-compose.prod.yml # Production Docker compose setup
├── docs/                   # 📚 Tài liệu kỹ thuật chi tiết
│   ├── architecture.md     # Kiến trúc hệ thống & Tech stack
│   ├── workflow.md         # Quy trình hoạt động (Booking, Auth, Chat, Catalog)
│   ├── api-guide.md        # API Routes & Schemas reference
│   ├── docker-optimization.md # Tối ưu hóa Docker Image & Layer caching
│   ├── sso-review.md       # Đánh giá & Hướng dẫn cài đặt OAuth2 SSO (Google/Facebook)
│   └── production-deployment.md # Hướng dẫn deploy VPS sản xuất chi tiết
├── docker-compose.yml      # Cấu hình Docker Dev Services (mysql, backend, frontend)
└── README.md               # Tài liệu dự án
```

---

## 🌐 Các Điểm Truy Cập Hệ Thống

| Dịch vụ | URL | Mô tả |
|---|---|---|
| 🌍 **Trang Khách hàng (Client)** | `http://localhost:5173/` | Trang chủ, Xem dịch vụ, Đặt lịch trực tuyến, Chatbot AI / Live Chat |
| ⚙️ **Trang Quản trị (Admin)** | `http://localhost:5173/admin` | Quản lý Lịch hẹn, Khách hàng, Dịch vụ, Tài khoản, Chat tư vấn |
| 🔑 **Đăng nhập Admin** | `http://localhost:5173/admin/login` | Trang đăng nhập dành cho Quản trị viên & Nhân viên |
| 🔌 **Backend API** | `http://localhost:5000/api` | RESTful API Endpoints |
| ⚡ **Socket.io Realtime** | `http://localhost:5000` | Websocket server cho Live Chat tư vấn |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Môi Trường Dev

### Bước 1: Cấu hình Môi trường (`.env`)
Đảm bảo file `.env` tại thư mục gốc có đầy đủ các thông số cần thiết (xem mẫu tại `.env.example`).

### Bước 2: Khởi chạy với Docker
Tại thư mục gốc dự án, thực hiện lệnh:

```bash
docker compose up -d --build

# Chờ MySQL healthy rồi chạy schema/seed trong container backend.
# Nếu đang dùng Windows + WSL, thêm tiền tố wsl như bên dưới:
wsl docker compose exec backend npm run db:migrate
wsl docker compose exec backend npm run db:seed
```

---

## 🚀 Deployment Production trên VPS & GitHub CI/CD

Để đưa dự án lên máy chủ VPS (Ubuntu/Debian) bằng 1 lệnh duy nhất hoặc tự động hóa qua GitHub Actions CI/CD, tham khảo tài liệu:
👉 **[docs/production-deployment.md](file:///c:/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/docs/production-deployment.md)**

---

## 📚 Tài Liệu Kỹ Thuật Chi Tiết trong `docs/`

1. 🏗️ **[docs/architecture.md](file:///c:/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/docs/architecture.md)** — Chi tiết kiến trúc hệ thống, Sơ đồ luồng dữ liệu, Tech stack.
2. 🔄 **[docs/workflow.md](file:///c:/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/docs/workflow.md)** — Quy trình Đặt lịch (Booking Flow), Phân quyền RBAC (`ADMIN`/`STAFF`), Live Chat & Gemini AI Chatbot.
3. 🔌 **[docs/api-guide.md](file:///c:/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/docs/api-guide.md)** — Danh sách API Endpoints & Cấu trúc cơ sở dữ liệu Sequelize.
4. 🐳 **[docs/docker-optimization.md](file:///c:/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/docs/docker-optimization.md)** — Các phương pháp tối ưu dung lượng Image, Docker Layer Caching và `.dockerignore`.
5. 🔑 **[docs/sso-review.md](file:///c:/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/docs/sso-review.md)** — Đánh giá hiện trạng SSO và hướng dẫn tích hợp Google Identity Services (GIS).
6. 🚀 **[docs/production-deployment.md](file:///c:/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/docs/production-deployment.md)** — Hướng dẫn Deploy VPS, Cài đặt SSL Let's Encrypt, Nginx Reverse Proxy & Cronjob Backup.

---

## 🛡️ Bản Quyền
© 2026 **Lan Anh Beauty SPA**. All rights reserved.
