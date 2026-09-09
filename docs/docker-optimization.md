# 🐳 Hướng Dẫn Tối Ưu Hóa Docker (Docker Optimization Guide)

## 🎯 Mục Tiêu
Tối ưu dung lượng Docker Images, giảm thời gian build, tận dụng Docker Layer Cache tối đa và ngăn ngừa lãng phí tài nguyên hệ thống (CPU, RAM, Disk).

---

## ⚡ Các Kỹ Thuật Tối Ưu Đã Áp Dụng

### 1. Phân Tách Docker Layer Caching
Trong cả `backend/Dockerfile` và `frontend/Dockerfile`:
```dockerfile
# Bước 1: Copy file package.json trước
COPY package*.json ./

# Bước 2: Cài đặt dependencies và dọn dẹp cache của npm
RUN npm install --no-audit --prefer-offline && npm cache clean --force

# Bước 3: Copy source code sau
COPY . .
```
- **Tác dụng:** Khi thay đổi code trong `src/`, Docker không phải chạy lại lệnh `npm install`. Thời gian build lại container giảm từ 2-3 phút xuống còn dưới 3 giây.

---

## 🚫 2. Sử Dụng `.dockerignore` Ngăn Truyền File Rác
Tạo `.dockerignore` tại cả 3 cấp (`root`, `backend/`, `frontend/`):

```text
node_modules
npm-debug.log
.git
.gitignore
.env
dist
build
```
- **Tác dụng:** 
  - Ngăn không cho thư mục `node_modules` nặng hàng trăm megabyte trên máy thật (host OS) bị đẩy vào Build Context của Docker.
  - Tránh lỗi xung đột nhị phân (binary architecture incompatibilities) giữa Node.js trên Windows/macOS và Linux Alpine trong Container.
  - Giảm dung lượng Docker Context từ >800MB xuống chỉ còn dưới 15MB.

---

## 📦 3. Dùng Base Image Siêu Nhẹ (`node:20-alpine`)
- Sử dụng `node:20-alpine` giúp dung lượng base OS giảm từ ~1GB xuống chỉ còn ~170MB.
- `npm cache clean --force` xóa bỏ các file nén tạm thời sau khi cài xong node_modules.

---

## 💾 4. Quản Lý Volume & Persistence Hiệu Quả
- `mysql_data`: Docker named volume dùng lưu trữ dữ liệu MySQL bền vững mà không bị xóa khi chạy `docker compose down`.
- Anonymous Volume `/app/node_modules` trong `docker-compose.yml`:
  ```yaml
  volumes:
    - ./frontend:/app
    - /app/node_modules
  ```
  Giúp bind mount source code trên máy Host hoạt động mượt mà với Hot Reloading mà không đè lên thư mục `node_modules` bên trong container Linux.

---

## 🧹 Lệnh Dọn Dẹp Tài Nguyên Docker Định Kỳ
Để giải phóng dung lượng đĩa bị chiếm bởi các image/container cũ không dùng đến:

```bash
# Dọn dẹp containers/images/networks tạm ngưng không sử dụng
docker system prune -f

# Dọn dẹp dũng lượng build cache cũ
docker builder prune -f
```
