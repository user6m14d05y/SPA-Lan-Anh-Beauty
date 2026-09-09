# 🔌 Hướng Dẫn API & Cơ Sở Dữ Liệu (API & Database Guide)

## 📌 Base URL
- **Local Dev:** `http://localhost:5000/api`
- **Socket.io Endpoint:** `http://localhost:5000`

---

## 🔑 Authentication Headers
Đối với các endpoint yêu cầu đăng nhập (`ADMIN` hoặc `STAFF`), gửi Header:
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

---

## 🗂️ Danh Sách Endpoints CHÍNH

### 1. Catalog & Services (Công khai)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/catalog/tree` | Lấy cây danh mục dịch vụ (Category Tree) |
| `GET` | `/catalog/services` | Danh sách dịch vụ (Query params: `category`, `featured=true`) |
| `GET` | `/catalog/services/:slug` | Chi tiết dịch vụ theo Slug |

### 2. User & Auth
| Method | Endpoint | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/users/login` | Public | Đăng nhập tài khoản Admin/Staff |
| `POST` | `/users/logout` | Authenticated | Đăng xuất & hủy token |
| `GET` | `/users` | `ADMIN` | Danh sách tài khoản hệ thống |
| `POST` | `/users` | `ADMIN` | Tạo tài khoản mới |
| `PUT` | `/users/:id` | `ADMIN` | Cập nhật tài khoản |
| `DELETE` | `/users/:id` | `ADMIN` | Xóa tài khoản |

### 3. Bookings & Appointments
| Method | Endpoint | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/bookings` | Public | Đặt lịch hẹn mới từ Client |
| `GET` | `/bookings` | `ADMIN`, `STAFF` | Danh sách lịch hẹn (Bộ lọc theo ngày, status) |
| `PATCH` | `/bookings/:id/status` | `ADMIN`, `STAFF` | Cập nhật trạng thái lịch hẹn |
| `DELETE` | `/bookings/:id` | `ADMIN` | Xóa lịch hẹn |

### 4. Chatbot AI
| Method | Endpoint | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/chatbot/message` | Public | Gửi câu hỏi cho Gemini AI Chatbot |

### 5. Services & Category Management (Admin)
| Method | Endpoint | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/admin/services` | `ADMIN` | Tạo dịch vụ mới |
| `PUT` | `/admin/services/:id` | `ADMIN` | Cập nhật thông tin dịch vụ |
| `DELETE` | `/admin/services/:id` | `ADMIN` | Xóa dịch vụ |
| `POST` | `/admin/categories` | `ADMIN` | Tạo danh mục dịch vụ mới |

---

## 🗄️ Database Schemas (Sequelize Models)

1. **`Users`**: `id`, `fullName`, `email`, `phone`, `password`, `role` (`ADMIN`/`STAFF`/`CUSTOMER`), `avatarUrl`, `status`.
2. **`Categories`**: `id`, `name`, `slug`, `description`, `parentId`, `order`.
3. **`Services`**: `id`, `name`, `slug`, `shortDescription`, `description`, `categoryId`, `price`, `priceLabel`, `durationMinutes`, `isFeatured`, `thumbnailUrl`, `imageUrl`, `status`.
4. **`Bookings`**: `id`, `bookingCode`, `customerName`, `customerPhone`, `customerEmail`, `serviceId`, `bookingDate`, `bookingTime`, `notes`, `status` (`PENDING`/`CONFIRMED`/`COMPLETED`/`CANCELLED`).
5. **`ClosedPeriods`**: `id`, `startDate`, `endDate`, `reason`.
6. **`Conversations` & `Messages`**: Quản lý lịch sử chat và các cuộc thoại Socket.io.
