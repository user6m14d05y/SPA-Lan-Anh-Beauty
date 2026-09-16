# Báo Cáo Đánh Giá An Toàn Thông Tin & Khắc Phục Lỗ Hổng (Ethical Hacker Security Audit Report)

**Dự án:** SPA Lan Anh Beauty  
**Đơn vị đánh giá:** Ethical Hacker & Security Auditor  
**Ngày thực hiện:** 16/09/2026  
**Trạng thái:** Đã vá các phát hiện và kiểm tra xác nhận lần 2 (16/09/2026)  

---

## 📋 1. Tóm Tắt Tổng Quan (Executive Summary)

Quá trình rà soát an toàn mã nguồn (**Static Application Security Testing - SAST**) trên toàn bộ hệ thống Backend (Node.js/Express) và Frontend (React/Vite) của dự án **SPA Lan Anh Beauty** đã ghi nhận **7 lỗ hổng bảo mật** có mức độ nguy hiểm từ Trung bình đến Nghiêm trọng.

Trong đó, nổi bật nhất là các lỗ hổng xác thực Webhook thanh toán SePay và Endpoint thử nghiệm công khai có thể cho phép người dùng xấu tự ý kích hoạt hoàn thành thanh toán cho đơn hàng mà không cần giao dịch thực tế.

---

## 🚨 2. Danh Sách Lỗ Hổng Bảo Mật Chi Tiết

| STT | Tên Lỗ Hổng | Mức Độ | Thành Phần Ảnh Hưởng | Tác Động Dự Kiến |
| --- | --- | --- | --- | --- |
| 1 | **Webhook Authentication Bypass** | 🚨 **CRITICAL** | `backend/src/controllers/paymentController.js` | Giả mạo gói tin IPN để duyệt thanh toán ảo cho đơn đặt lịch. |
| 2 | **Unauthenticated Payment Simulation** | 🚨 **CRITICAL** | `backend/src/routes/payment.Routes.js` | Bất kỳ ai cũng có thể gọi API kích hoạt thành công đơn hàng. |
| 3 | **Automatic Last Pending Order Fallback** | 🚨 **CRITICAL** | `backend/src/controllers/paymentController.js` | Tự động duyệt đơn mới nhất nếu không khớp được nội dung chuyển khoản. |
| 4 | **Overly Permissive CORS Policy** | 🔶 **HIGH** | `backend/src/index.js` | Cho phép mọi Origin đọc và thực hiện yêu cầu kèm Credentials (CSRF/CORS attack). |
| 5 | **File Upload Extension & MIME Spoofing** | 🔶 **HIGH** | `backend/src/middlewares/uploadMiddleware.js` | Nguy cơ Stored XSS hoặc tải lên tệp thực thi độc hại vào `/uploads/img/`. |
| 6 | **Hardcoded Secrets Fallback** | 🔷 **MEDIUM** | `paymentController.js`, `rateLimitMiddleware.js` | Sử dụng Secret mặc định lộ trong mã nguồn nếu thiếu `.env`. |
| 7 | **Missing Rate Limiting on Login** | 🔷 **MEDIUM** | `backend/src/routes/user.Routes.js` | Nguy cơ bị tấn công dò quét mật khẩu (Brute-force / Credential Stuffing). |

---

## 🔍 3. Phân Tích Chi Tiết & Giải Pháp Khắc Phục (Defensive Remediation)

### Lỗ Hổng 1: Webhook Authentication Bypass [CRITICAL]
* **Vị trí code:** `backend/src/controllers/paymentController.js` (dòng 15 - 25)
* **Nguyên nhân:** Biểu thức logic `(!authHeader && !querySecret)` làm cho các yêu cầu không có Header `Authorization` hoặc Query Parameter `secret` nghiễm nhiên trả về `isAuthorized = true`.
* **Giải pháp khắc phục:**
  - Bắt buộc kiểm tra Header `Authorization` hoặc Query Secret phải tồn tại VÀ khớp với `SEPAY_API_KEY` / `SEPAY_SECRET_KEY` được định nghĩa trong `.env`.

### Lỗ Hổng 2: Unauthenticated Payment Simulation Endpoint [CRITICAL]
* **Vị trí code:** `backend/src/routes/payment.Routes.js` (dòng 16)
* **Nguyên nhân:** Route `POST /api/payment/simulate-success` được mở công khai mà không có middleware xác thực (`verifyToken`, `requireRole('ADMIN')`).
* **Giải pháp khắc phục:**
  - Áp dụng các middleware bảo vệ `verifyToken` và `requireRole('ADMIN')` cho route này, hoặc vô hiệu hóa route trong môi trường Production.

### Lỗ Hổng 3: Automatic Last Pending Order Fallback [CRITICAL]
* **Vị trí code:** `backend/src/controllers/paymentController.js` (dòng 115 - 122)
* **Nguyên nhân:** Nếu nội dung chuyển khoản không tìm thấy mã đơn hàng hay SĐT, controller tự động lấy đơn hàng `PENDING` mới nhất để duyệt `CONFIRMED`.
* **Giải pháp khắc phục:**
  - Loại bỏ hoàn toàn logic fallback này. Yêu cầu giao dịch phải khớp đúng mã đơn hàng hoặc SĐT khách hàng mới tiến hành duyệt tự động.

### Lỗ Hổng 4: Overly Permissive CORS Policy [HIGH]
* **Vị trí code:** `backend/src/index.js` (dòng 22 - 25)
* **Nguyên nhân:** Cấu hình `cors({ origin: true, credentials: true })` cho phép bất kỳ trang web nào gọi API và nhận credential.
* **Giải pháp khắc phục:**
  - Giới hạn danh sách trắng (Whitelist) các Domain được phép truy cập từ cấu hình môi trường `process.env.CLIENT_URL` và domain dự án chính thức.

### Lỗ Hổng 5: File Upload Extension & MIME Spoofing [HIGH]
* **Vị trí code:** `backend/src/middlewares/uploadMiddleware.js` (dòng 21 - 28)
* **Nguyên nhân:** Kiểm tra `file.mimetype` do client gửi lên (dễ bị giả mạo qua HTTP Client) và giữ nguyên phần mở rộng gốc của tệp.
* **Giải pháp khắc phục:**
  - Kiểm tra cả đuôi tệp tin thực tế (extension whitelist: `.jpg`, `.jpeg`, `.png`, `.webp`) và tiến hành tạo tên file an toàn dựa trên định dạng ảnh thực tế.

### Lỗ Hổng 6: Hardcoded Fallback Secrets [MEDIUM]
* **Vị trí code:** `paymentController.js`, `rateLimitMiddleware.js`
* **Nguyên nhân:** Đặt giá trị mặc định cho secret key (`thanhbtdev-sepay-key`, `captcha-hmac-secret`) phòng khi thiếu biến môi trường.
* **Giải pháp khắc phục:**
  - Yêu cầu ứng dụng ném lỗi ngắt khởi động (throw Error) nếu không tìm thấy các biến môi trường quan trọng trong `.env`.

### Lỗ Hổng 7: Missing Rate Limiting on Login Route [MEDIUM]
* **Vị trí code:** `backend/src/routes/user.Routes.js` (dòng 8)
* **Nguyên nhân:** Route `/api/users/login` chưa gắn Rate Limiter để hạn chế số lần thử đăng nhập sai.
* **Giải pháp khắc phục:**
  - Tạo `loginRateLimiter` hạn chế tối đa 5 lượt đăng nhập sai trong 15 phút cho mỗi IP và áp dụng vào route `/login`.

---

## ✅ 4. Kết Quả Khắc Phục & Kiểm Tra Lần 2

| Phát hiện | Trạng thái | Xác nhận |
| --- | --- | --- |
| Webhook Authentication Bypass | Đã vá | Thiếu/sai credential trả `401`; so sánh exact, không còn fallback secret |
| Unauthenticated Payment Simulation | Đã vá | Không có JWT trả `401`; route yêu cầu `ADMIN` |
| Automatic Last Pending Order Fallback | Đã vá | Đã xóa logic tự xác nhận booking `PENDING` mới nhất |
| Overly Permissive CORS | Đã vá | Origin ngoài allowlist bị từ chối; Socket.IO dùng cùng allowlist |
| File Upload MIME/Extension Spoofing | Đã vá | Kiểm tra extension, magic bytes, MIME; tên file do server sinh |
| Hardcoded Secret Fallback | Đã vá | Secret bắt buộc từ root `.env`, fail-fast khi thiếu/placeholder |
| Missing Login Rate Limiting | Đã vá | Limiter 5 lần/15 phút/IP được gắn trước route login |

Đã xác nhận bằng kiểm tra Docker:
- Backend build và syntax check thành công.
- `docker compose config --quiet` thành công.
- Root `.env` là nguồn cấu hình duy nhất; `backend/.env` và `backend/.env.example` đã được loại bỏ.
- `Origin: https://attacker.example` bị từ chối; `Origin: http://localhost:5173` được cho phép.
- Webhook không credential trả `401 Unauthorized`.
- Payment simulation không token trả `401 Unauthorized`.
- Backend khởi động thành công sau khi cài dependency và kết nối MySQL.

## 🛡️ 5. Quy Trình Kiểm Thử & Xác Nhận An Toàn (Verification Plan)

Sau khi hoàn tất cài đặt các mã sửa lỗi phòng thủ:
1. **Kiểm thử Webhook Auth:** Gửi gói tin HTTP POST tới `/api/sepay-webhook` không kèm Secret -> Đảm bảo server phản hồi `401 Unauthorized`.
2. **Kiểm thử Endpoint Thử nghiệm:** Gọi API `/api/payment/simulate-success` không có token Admin -> Đảm bảo server từ chối với `401 Unauthorized`.
3. **Kiểm thử CORS:** Gửi request với Header `Origin: https://attacker.com` -> Đảm bảo response không chứa header `Access-Control-Allow-Origin: https://attacker.com`.
4. **Kiểm thử Rate Limiting:** Thử nghiệm đăng nhập sai 6 lần liên tiếp -> Đảm bảo lượt thứ 6 bị chặn với `429 Too Many Requests`.

---
*Báo cáo được lưu trữ chính thức tại thư mục `docs/Ethical Hacker Security Auditor/` phục vụ công tác quản lý an toàn thông tin của dự án.*
