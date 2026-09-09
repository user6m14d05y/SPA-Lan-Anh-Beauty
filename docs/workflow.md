# 🔄 Quy Trình Hoạt Động Hệ Thống (System Workflows)

Tài liệu này giải thích chi tiết các workflow chính trong hệ thống **SPA Lan Anh Beauty**.

---

## 1. Quy Trình Phát Triển & Khởi Chạy (Development Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor Developer
    participant DockerCompose as Docker Compose
    participant MySQL as MySQL Service
    participant Backend as Backend Container
    participant Frontend as Frontend Container

    Developer->>DockerCompose: docker compose up -d --build
    DockerCompose->>MySQL: Khởi chạy Container MySQL (Healthcheck)
    MySQL-->>DockerCompose: Healthcheck Status: Healthy (08:00)
    DockerCompose->>Backend: Build & Run Express Server (Port 5000)
    DockerCompose->>Frontend: Build & Run Vite Dev Server (Port 5173)
    Frontend-->>Developer: Truy cập http://localhost:5173
```

- **Môi trường phát triển:** Docker Compose quản lý 3 containers (`mysql`, `backend`, `frontend`).
- **Hot-reloading:** Source code được bind mount (`./frontend:/app` và `./backend:/app`), cho phép tự động reload khi chỉnh sửa file mà không cần rebuild container.
- **Dữ liệu MySQL:** Lưu trữ bền vững tại Docker Named Volume `mysql_data`.

---

## 2. Quy Trình Xác Thực & Phân Quyền (Auth & RBAC Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor AdminStaff as Admin / Staff
    participant LoginUI as Trang Login (/admin/login)
    participant AuthCtx as AuthContext (React)
    participant Backend as Backend API (/api/users/login)
    participant ProtectedRoute as ProtectedRoute Component

    AdminStaff->>LoginUI: Nhập Email/Phone & Password
    LoginUI->>Backend: POST /api/users/login
    Backend-->>LoginUI: Trả về User Data + Access Token + Refresh Token
    LoginUI->>AuthCtx: Lưu Token vào LocalStorage & Cập nhật User State
    AuthCtx-->>ProtectedRoute: Cung cấp Auth state (isAuthenticated = true, role = ADMIN)
    ProtectedRoute-->>AdminStaff: Cho phép vào Dashboard (/admin)
```

- **Các Vai Trò (Roles):**
  - `ADMIN`: Toàn quyền quản trị hệ thống (Tài khoản, Nhân viên, Dịch vụ, Lịch hẹn, Cấu hình).
  - `STAFF`: Quản lý Lịch hẹn, Khách hàng, Chat tư vấn và xem danh sách Dịch vụ.
  - `CUSTOMER`: Người dùng công khai trên website.
- **Bảo Vệ Route:** Component `<ProtectedRoute roles={['ADMIN', 'STAFF']}>` chặn các truy cập trái phép và tự động chuyển hướng về `/admin/login`.

---

## 3. Quy Trình Đặt Lịch Hẹn (Booking Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Hàng
    participant ClientUI as Trang Đặt Lịch (/booking)
    participant Backend as Backend API (/api/bookings)
    participant DB as Database MySQL
    participant MailService as Email Service (Nodemailer)

    Customer->>ClientUI: Chọn Dịch vụ, Ngày, Khung giờ, Thông tin cá nhân
    ClientUI->>Backend: POST /api/bookings
    Backend->>DB: Kiểm tra khung giờ trùng (Slots availability)
    alt Khung giờ khả dụng
        Backend->>DB: Tạo bản ghi Booking (Status: PENDING)
        Backend-->>MailService: Gửi email xác nhận đặt lịch cho khách
        Backend-->>ClientUI: Trả về thành công + Mã đặt lịch
        ClientUI-->>Customer: Hiển thị thông báo thành công
    else Trùng khung giờ hoặc Ngày nghỉ
        Backend-->>ClientUI: Báo lỗi "Khung giờ đã đầy hoặc spa nghỉ"
    end
```

---

## 4. Quy Trình Chat Tư Vấn: AI Chatbot & Live Chat (Chat Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Hàng
    participant Widget as Chat Widget (MainLayout)
    participant Backend as Backend API / Socket.io
    participant Gemini as Google Gemini AI
    actor Staff as Nhân Viên (Admin /chat)

    alt Tab 1: Chatbot AI (Tự động)
        Customer->>Widget: Nhập câu hỏi (Ví dụ: "Giá gói trị mụn?")
        Widget->>Backend: POST /api/chatbot/message
        Backend->>Gemini: Prompt chứa ngữ cảnh SPA + câu hỏi
        Gemini-->>Backend: Phản hồi thông minh
        Backend-->>Widget: Trả về câu trả lời tự động
    else Tab 2: Chat Trực Tiếp với Nhân Viên
        Customer->>Widget: Chọn tab "Nhân viên Tư vấn"
        Widget->>Backend: Socket.io Emit "chat:customer:join" (VisitorId)
        Backend-->>Staff: Socket.io Broadcast cuộc trò chuyện mới
        Staff->>Backend: Staff trả lời tin nhắn
        Backend-->>Widget: Socket.io Push tin nhắn tới Khách hàng
    end
```

---

## 5. Quy Trình Quản Lý Danh Mục & Dịch Vụ (Catalog Workflow)

- **Danh mục Dịch vụ (Categories):** Cấu trúc cây (Tree Hierarchy) hỗ trợ danh mục cha - con.
- **Dịch vụ Nổi Bật (`isFeatured`):** Các dịch vụ được đánh dấu `isFeatured = true` trong Admin sẽ tự động xuất hiện trên **Hero Banner** ở trang chủ Client.
