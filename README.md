# 🌟 SPA Lan Anh Beauty

Hệ thống quản lý và đặt lịch hẹn cho Spa cao cấp, được xây dựng với kiến trúc Client - Admin - Backend riêng biệt và triển khai bằng Docker.

## 📂 Cấu Trúc Dự Án

```text
SPA-Lan-Anh-Beauty/
├── backend/                # Node.js (Express, Socket.io, Sequelize) - Xử lý logic & API
├── client/                 # React.js (Giao diện cho Khách hàng - Client)
├── admin/                  # React.js (Giao diện cho Quản lý / Nhân viên SPA)
├── docker-compose.yml      # Cấu hình Docker (chạy MySQL, Backend, Frontend...)
└── README.md               # Tài liệu dự án
```

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

Để chạy dự án trên máy của bạn, vui lòng làm theo các bước sau:

### Bước 1: Chuẩn bị mã nguồn
* Clone dự án từ Git hoặc Download file `.zip` và giải nén.

### Bước 2: Cấu hình Môi trường (Environment)
* Truy cập vào thư mục `backend/`.
* Copy file `.env.example` và đổi tên bản sao thành `.env`.
* Mở file `.env` và cấu hình lại thông tin kết nối Database cho phù hợp với máy của bạn.

### Bước 3: Khởi chạy với Docker
Mở Terminal/PowerShell tại thư mục gốc của dự án và chạy lần lượt các lệnh sau:

1. **Tạo Volume cho MySQL** (Giữ lại dữ liệu khi tắt container):
   ```bash
   docker volume create mysql_data
   ```

2. **Build và khởi chạy toàn bộ hệ thống**:
   ```bash
   docker-compose up --build -d
   ```

### Bước 4: Truy cập Ứng Dụng
Sau khi Docker chạy xong, bạn có thể truy cập qua trình duyệt:
* 🌍 **Trang Khách hàng (Client):** `http://localhost:5173`
* ⚙️ **Trang Quản trị (Admin):** `http://localhost:5174`
* 🔌 **Backend API:** `http://localhost:5000` (hoặc `8000` tùy cấu hình)
