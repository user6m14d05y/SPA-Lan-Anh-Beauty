# 📝 Tính Năng Blog & Nhật Ký Cập Nhật 14/09/2026 (Blog Feature & Daily Change Log)

Tài liệu tổng hợp toàn bộ công việc triển khai ngày **14/09/2026** trên branch `thanhbt/feat`: module **Blog full-stack** (Backend + Frontend), fix lỗi hiển thị mã Booking, và các tinh chỉnh UI Admin đồng bộ theme.

---

## 📌 Tổng Quan Công Việc Trong Ngày

| # | Hạng mục | Phạm vi | Trạng thái |
|---|---|---|---|
| 1 | **Module Blog (Backend)** | Models, Migrations, Seeder, Controller, Service, Routes, Elasticsearch, Rate Limiter, Error Handler | ✅ Hoàn tất |
| 2 | **Module Blog (Frontend)** | Trang client `/blog`, `/blog/:slug`, trang quản trị Admin, SEO Preview Modal, API service, routing | ✅ Hoàn tất |
| 3 | **Fix lỗi mã Booking** | Trang `admin/bookings` — sort NaN + tràn cột ID | ✅ Hoàn tất |
| 4 | **UI Admin đồng bộ theme** | Services, Contacts, Appointments, Chat, Staffs, CustomSelect, icons | ✅ Hoàn tất |
| 5 | **Config** | `eslint.config.js`, icon `EyeOff` | ✅ Hoàn tất |

> **Lưu ý git:** Toàn bộ 42 file thay đổi (26 modified + 16 untracked) **chưa commit**. Danh sách file mới untracked cần `git add` đầy đủ khi commit (xem [mục 8](#️-8-checklist-trước-khi-commit)).

---

## 🏗️ 1. Kiến Trúc Module Blog — Backend

### 1.1. Cấu trúc thư mục

```
backend/src/
├── controllers/
│   └── blogController.js          # Xử lý request/response, format thống nhất { success, data, message }
├── services/
│   ├── blogService.js             # Business logic: validate, sanitize, CRUD, phân trang
│   └── elasticsearchService.js    # Tìm kiếm full-text + cursor pagination (fallback an toàn)
├── models/
│   ├── BlogCategory.js            # Chuyên mục bài viết
│   └── BlogPost.js                # Bài viết
├── routes/
│   ├── blog.Routes.js             # Định nghĩa 16 endpoint public + admin
│   └── index.js                   # Mount: router.use('/blog', blogRoutes)
├── middlewares/
│   └── rateLimitMiddleware.js     # blogViewRateLimiter (30 req/60s)
├── database/
│   ├── migrations/
│   │   ├── 20260520000100-create-blog-categories.js
│   │   └── 20260520000200-create-blog-posts.js
│   └── seeders/
│       └── 20260520000300-seed-blog.js   # 5 chuyên mục + bài viết mẫu
```

### 1.2. Database Schema

**Bảng `blog_categories`** (Model [BlogCategory.js](../backend/src/models/BlogCategory.js)):

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | INT PK AI | |
| `name` | VARCHAR(150) | Bắt buộc |
| `slug` | VARCHAR(180) | Unique, chỉ `a-z0-9-` |
| `description` | TEXT | |
| `sortOrder` | INT | Sắp xếp hiển thị, mặc định 0 |
| `isActive` | BOOLEAN | Mặc định `true` — ẩn chuyên mục mà không cần xóa |

**Bảng `blog_posts`** (Model [BlogPost.js](../backend/src/models/BlogPost.js)):

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | INT PK AI | |
| `categoryId` | INT FK → `blog_categories` | `onDelete: SET NULL` |
| `authorId` | INT FK → `users` | `onDelete: SET NULL` |
| `authorName` | VARCHAR(150) | Denormalized, mặc định `'Lan Anh Beauty'` |
| `title` | VARCHAR(255) | Bắt buộc, 5–255 ký tự |
| `slug` | VARCHAR(280) | Unique, chỉ `a-z0-9-` |
| `excerpt` | TEXT | Tự sinh từ content (240 ký tự) nếu bỏ trống |
| `content` | LONGTEXT | Bắt buộc ≥ 20 ký tự, sanitize trước khi lưu |
| `imageUrl` | VARCHAR(500) | URL `http(s)` hoặc đường dẫn `/uploads/...` |
| `status` | ENUM | `DRAFT` / `PUBLISHED` / `ARCHIVED`, mặc định `DRAFT` |
| `publishedAt` | DATE | Chỉ set khi `PUBLISHED` |
| `isFeatured` | BOOLEAN | Bài nổi bật, mặc định `false` |
| `readingTimeMinutes` | INT | 1–120, mặc định 5 |
| `viewCount` | INT | Đếm lượt xem qua endpoint `/view` |
| `sortOrder` | INT | Mặc định 0 |

**Quan hệ:** `BlogPost.belongsTo(BlogCategory)` + `BlogPost.belongsTo(User)` (alias `category`, `author`).

**Indexes trên `blog_posts`:** `categoryId`, `authorId`, `(status, publishedAt)`, `isFeatured`, `sortOrder`.

### 1.3. Quy tắc validation & bảo mật ([blogService.js](../backend/src/services/blogService.js))

- **Sanitize HTML** bằng `sanitize-html`: chỉ cho phép tag `p, br, h2-h4, strong, em, u, ul, ol, li, blockquote, a, img`; scheme chỉ `http`, `https`, `mailto` — chặn XSS từ nội dung bài viết.
- **Slug** auto-generate từ tiêu đề (bỏ dấu tiếng Việt, thay `đ` → `d`), chỉ chấp nhận `a-z0-9-`; trùng slug trả **409**.
- **Ảnh đại diện** phải là URL `http(s)://` hoặc đường dẫn `/uploads/...` (ảnh upload qua API riêng).
- **Xóa có điều kiện:**
  - Không xóa được bài `PUBLISHED` (phải chuyển về `DRAFT` trước) → lỗi 409.
  - Không xóa được chuyên mục đang có bài viết (gợi ý vô hiệu hóa) → lỗi 409.
- **Luồng trạng thái:** chuyển sang `PUBLISHED` sẽ set `publishedAt` (nếu chưa có); chuyển về `DRAFT`/`ARCHIVED` sẽ reset `publishedAt = null`.

### 1.4. Tìm kiếm: Elasticsearch + fallback DB

[elasticsearchService.js](../backend/src/services/elasticsearchService.js) triển khai chiến lược **"ES ưu tiên, MySQL dự phòng"**:

```mermaid
flowchart TD
    A[GET /blog/posts] --> B{Request public<br/>(không draft, không featured)?}
    B -- Có --> C{Elasticsearch đang chạy?<br/>timeout 300ms}
    C -- Có --> D[Tìm kiếm trên ES index 'blog_posts'<br/>hỗ trợ cursor pagination]
    C -- Không / lỗi --> E[Fallback truy vấn MySQL<br/>Op.like trên title, excerpt, content]
    B -- Không --> E
    D --> F[Trả về items + pagination]
    E --> F
```

- ES client timeout 1s, **fail im lặng** — server không crash khi ES chưa được triển khai.
- Index `blog_posts` (ES) với mapping: `title/excerpt/content` (text), `slug/categorySlug/categoryName` (keyword), `publishedAt` (date), `viewCount` (integer)...
- **Đồng bộ index:** mỗi khi bài chuyển sang `PUBLISHED` (create/update/status) → `indexPost`; rời trạng thái published hoặc xóa → `deletePost`.
- **Cursor pagination:** `encodeCursor`/`decodeCursor` (base64 JSON `[publishedAt, id]`) dùng cho cả ES và DB path — ổn định hơn offset khi dữ liệu thay đổi.

### 1.5. Rate limiting & Global Error Handler

- **[rateLimitMiddleware.js](../backend/src/middlewares/rateLimitMiddleware.js):** `blogViewRateLimiter` áp cho `POST /blog/posts/:slug/view` — **30 request / 60 giây / IP**, vượt trả `429` kèm thông báo tiếng Việt.
- **[index.js](../backend/src/index.js):** thêm **Global Error Handler** (middleware 4 tham số, đặt sau `/api` router, trước Socket.io):
  - `console.error` stack trace có prefix `[Backend Global Error]`.
  - Trả về `{ success: false, message }` với status từ `err.statusCode || err.status || 500` — thống nhất format lỗi toàn hệ thống.

### 1.6. Upload ảnh bài viết

- Endpoint `POST /blog/admin/upload-image` (multer qua `uploadMiddleware`, field name `image`) → lưu vào `uploads/img/`, trả về `{ imageUrl: '/uploads/img/<filename>' }`.
- Static serve đã có sẵn: `app.use('/uploads/img', express.static(...))`.

### 1.7. Danh sách endpoint

| Method | Endpoint | Phân quyền | Mô tả |
|---|---|---|---|
| `GET` | `/blog/categories` | Public | Chuyên mục đang hoạt động |
| `GET` | `/blog/posts` | Public | Bài đã xuất bản — `q`, `categorySlug`, `sort` (`newest`/`oldest`/`popular`), `page`, `limit` (1–100), `cursor` |
| `GET` | `/blog/posts/:slug` | Public | Chi tiết bài (`PUBLISHED` + `publishedAt` ≤ hiện tại) |
| `POST` | `/blog/posts/:slug/view` | Public (rate-limited) | Tăng `viewCount` |
| `GET` | `/blog/admin/categories` | `ADMIN` | Tất cả chuyên mục (kể cả inactive) |
| `POST` | `/blog/admin/categories` | `ADMIN` | Tạo chuyên mục |
| `PUT` | `/blog/admin/categories/:id` | `ADMIN` | Cập nhật chuyên mục |
| `DELETE` | `/blog/admin/categories/:id` | `ADMIN` | Xóa chuyên mục (chưa có bài) |
| `GET` | `/blog/admin/posts` | `ADMIN` | Mọi trạng thái + filter `status`, `sort` |
| `GET` | `/blog/admin/posts/:id` | `ADMIN` | Chi tiết bài quản trị |
| `POST` | `/blog/admin/posts` | `ADMIN` | Tạo bài viết |
| `POST` | `/blog/admin/upload-image` | `ADMIN` | Upload ảnh (multipart) |
| `PUT` | `/blog/admin/posts/:id` | `ADMIN` | Cập nhật bài viết |
| `PATCH` | `/blog/admin/posts/:id/status` | `ADMIN` | Chuyển trạng thái |
| `DELETE` | `/blog/admin/posts/:id` | `ADMIN` | Xóa bài (chưa xuất bản) |

Response danh sách: `data.items` + `data.pagination { page, limit, total, totalPages, hasMore, nextCursor, isElasticsearch }`.

---

## 🖥️ 2. Kiến Trúc Module Blog — Frontend

### 2.1. Cấu trúc file

```
frontend/src/
├── services/
│   └── blogApi.js                       # API client + normalizePost/normalizeCategory
├── components/
│   ├── admin/
│   │   ├── SeoPreviewModal.jsx          # Modal SEO preview (component riêng, tái sử dụng)
│   │   └── SeoPreviewModal.module.css
│   └── common/
│       └── CustomSelect.jsx             # Select dropdown dùng chung (mới)
├── pages/
│   ├── client/Blog/
│   │   ├── index.jsx                    # Danh sách bài viết /blog
│   │   └── Detail.jsx                   # Chi tiết bài viết /blog/:slug
│   └── admin/Blog/
│       ├── index.jsx                    # Quản lý bài viết /admin/blog
│       ├── Form.jsx                     # Thêm/sửa /admin/blog/add, /admin/blog/edit/:id
│       └── BlogForm.module.css
```

### 2.2. Routing & điều phối

- [App.jsx](../frontend/src/App.jsx): route client `blog/:slug` → `BlogDetail`; route admin `blog`, `blog/add`, `blog/edit/:id` bọc `ProtectedRoute` role `ADMIN`.
- [AdminLayout.jsx](../frontend/src/layouts/AdminLayout.jsx): menu "Bài viết" (icon List, chỉ hiển thị khi `hasRole('ADMIN')`), title "Quản lý bài viết", submenu mở theo `pathname.startsWith('/admin/blog')`.
- [MainLayout.jsx](../frontend/src/layouts/MainLayout.jsx): fetch `getBlogCategories()` riêng cho trang blog; sort switch theo `location.pathname === '/blog'` (mới nhất / phổ biến / cũ nhất); search dùng param chuẩn `q` (tự xóa param `search` legacy).

### 2.3. Trang client `/blog` ([index.jsx](../frontend/src/pages/client/Blog/index.jsx))

- Filter theo chuyên mục, sort, **search debounce 400ms** cập nhật URL param `q`.
- **Infinite scroll** bằng IntersectionObserver (sentinel ref) + `nextCursor`.
- SEO động: `updateMeta` / `updateCanonical` cập nhật `<meta>` và `<link rel="canonical">` theo filter hiện tại.

### 2.4. Trang chi tiết `/blog/:slug` ([Detail.jsx](../frontend/src/pages/client/Blog/Detail.jsx))

- Render `content` HTML qua **DOMPurify** (sanitize lần 2 ở client — phòng thủ sâu).
- SEO động hoàn chỉnh:
  - `<title>`, meta description cập nhật theo bài viết.
  - `<link rel="canonical">` trỏ đúng slug.
  - **JSON-LD schema `BlogPosting`** (`headline`, `datePublished`, `author`, `publisher: Lan Anh Beauty`) — hỗ trợ rich snippet Google.
- Tự động gọi `incrementBlogPostView(slug)` sau khi tải bài (bị giới hạn bởi rate limiter backend).

### 2.5. Form quản trị + SEO Preview Modal

**[Form.jsx](../frontend/src/pages/admin/Blog/Form.jsx):**
- Layout 2 cột: cột chính (tiêu đề, slug auto-sync khi tạo mới, excerpt, TinyMCE content, upload ảnh dropzone) + sidebar (chuyên mục, trạng thái, ảnh đại diện, thẻ SEO).
- Upload ảnh qua `uploadBlogImage(file, authFetch)` (multipart) → nhận `/uploads/img/...`.
- **Checklist SEO tự động** (5 tiêu chí, trạng thái Đạt / Cần tối ưu / Chưa có): độ dài tiêu đề (10–70), độ dài trích dẫn (50–240), có ảnh đại diện, slug chuẩn, độ dài nội dung.

**[SeoPreviewModal.jsx](../frontend/src/components/admin/SeoPreviewModal.jsx)** — component riêng theo yêu cầu dễ bảo trì:
- **Cột trái — chỉnh sửa:** trường *Tiêu đề bài viết (SEO Title)* có bộ đếm `x/70 ký tự`, và *Trích dẫn (Meta Description)* có bộ đếm `x/240 ký tự`, `maxLength 500`. Các input dùng `name="title"` / `name="excerpt"` + prop `onChange` chung (tương thích `handleChange` của Form theo `e.target.name`).
- **Cột phải — Google Preview:** mô phỏng kết quả tìm kiếm Google (favicon "L", tên site, URL `https://lananhbeauty.vn/blog/<slug>`, title xanh `#1A0DAB`, mô tả) cập nhật realtime + ảnh thumbnail.
- Đóng bằng ESC / click overlay / nút X; khóa scroll body khi mở; theme đồng bộ (nâu `#775932`, nền `#FAF7F2`, viền `#EBE4DD`, Playfair Display + Montserrat).

> ⚠️ **Thiết kế đã thay đổi trong ngày:** trường "Từ khóa chính" (focus keyword) đã bị **loại bỏ hoàn toàn** theo quyết định cuối — modal chỉ còn Tiêu đề + Trích dẫn. Backend không có cột focusKeyword nên không cần migration.

### 2.6. API client ([blogApi.js](../frontend/src/services/blogApi.js))

- Chuẩn hóa field đa nguồn: `normalizePost` ánh xạ `imageUrl/coverImageUrl`, `authorName/author.fullName`, `viewCount/views`... bất kể backend trả dạng nào.
- `normalizeListParams`: chuẩn hóa `search` → `q`, `category` → `categorySlug` (tương thích caller cũ).
- Admin function nhận `authFetch` từ AuthContext làm tham số.

### 2.7. Nâng cấp `authFetch` hỗ trợ FormData ([AuthContext.jsx](../frontend/src/context/AuthContext.jsx))

```js
const isFormData = options.body instanceof FormData;
// Chỉ set 'Content-Type': 'application/json' khi KHÔNG phải FormData
```

Browser tự set `Content-Type: multipart/form-data; boundary=...` → upload ảnh blog hoạt động đúng qua `authFetch` (đính kèm token).

---

## 🐛 3. Fix Lỗi Mã Booking Trang Admin

**File:** [Bookings/index.jsx](../frontend/src/pages/admin/Bookings/index.jsx)

| Vấn đề | Nguyên nhân | Cách fix |
|---|---|---|
| Bấm sort cột "Mã lịch hẹn" → thứ tự lung tung / NaN | Sort dùng `b.id - a.id` nhưng `id` là **chuỗi mã** `DH-XXXX-XXXX-XXXX` → phép trừ cho NaN | So sánh `new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()` (comment đánh dấu rõ: *"id là mã chuỗi nên sort theo thời gian tạo"*) |
| Mã `DH-XXXX-XXXX-XXXX` (17 ký tự) tràn cột 80px | Cột header `w-[80px]` quá hẹp | Mở rộng `w-[170px]`, bỏ `tracking-widest` ở cell ID |
| Mã xuống dòng xấu trong modal chi tiết | Thiếu nowrap | Thêm `whitespace-nowrap` cho span mã |

---

## 🎨 4. Tinh Chỉnh UI Admin Đồng Bộ Theme

Tất cả sử dụng palette dự án: nâu `#775932`, vàng gold `#C59B63`, nền kem `#FAF7F2`, viền `#EBE4DD`, hover `#F3ECE2`, font Playfair Display (tiêu đề) + Montserrat (nội dung).

| File | Nội dung |
|---|---|
| [Services/add.jsx](../frontend/src/pages/admin/Services/add.jsx) + [edit.jsx](../frontend/src/pages/admin/Services/edit.jsx) + [Services.module.css](../frontend/src/pages/admin/Services/Services.module.css) | Form thêm/sửa dịch vụ theo chuẩn card trắng viền nâu |
| [Contacts/index.jsx](../frontend/src/pages/admin/Contacts/index.jsx) | Danh sách liên hệ đồng bộ theme |
| [Appointments/index.jsx](../frontend/src/pages/admin/Appointments/index.jsx) | Trang lịch hẹn |
| [Chat.module.css](../frontend/src/pages/admin/Chat/Chat.module.css) + [Staffs.module.css](../frontend/src/pages/admin/Staffs/Staffs.module.css) | Giao diện chat + quản lý nhân viên |
| [styles/index.css](../frontend/src/styles/index.css) | Style toàn cục |
| [CustomSelect.jsx](../frontend/src/components/common/CustomSelect.jsx) | **File mới** — select component dùng chung |
| [icons.jsx](../frontend/src/icons.jsx) | Thêm icon `EyeOff` (+9 dòng) |
| Seeders dịch vụ: [seed-service-categories.js](../backend/src/database/seeders/20260512000300-seed-service-categories.js), [seed-services.js](../backend/src/database/seeders/20260512000400-seed-services.js) | Cập nhật dữ liệu dịch vụ mẫu |

---

## 🐳 5. Chạy Migration & Seeder (WSL Docker)

> Dự án chạy qua **WSL Docker** — mọi lệnh phải thực thi trong WSL, không chạy trực tiếp trên Windows.

```bash
# Vào môi trường WSL
wsl -e bash -lc "cd /mnt/c/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty"

# Chạy migration tạo bảng blog_categories + blog_posts (trong container backend)
docker compose exec backend npx sequelize-cli db:migrate

# Chạy seeder dữ liệu mẫu (5 chuyên mục + bài viết mẫu)
docker compose exec backend npx sequelize-cli db:seed --seed 20260520000300-seed-blog.js
```

**Kiểm tra nhanh:**
- `GET http://localhost:5000/api/blog/posts` → danh sách bài đã xuất bản.
- `GET http://localhost:5000/api/blog/categories` → 5 chuyên mục.
- Elasticsearch **không bắt buộc** — nếu không có ES, hệ thống tự fallback MySQL, không lỗi.

---

## 🚀 6. Gợi Ý Cấu Hình Elasticsearch (Tùy Chọn)

```env
# backend/.env
ELASTICSEARCH_NODE=http://elasticsearch:9200   # trong docker network
# hoặc http://localhost:9200 nếu chạy local
```

Nếu thêm service ES vào `docker-compose.yml`, index `blog_posts` sẽ được tạo tự động (`initIndex`) và các bài `PUBLISHED` được index khi lưu/sửa. Không có ES → mọi thứ vẫn hoạt động qua MySQL.

---

## 🧪 7. Điểm Cần Kiểm Tra Khi Regression Test

1. **Admin blog:** tạo bài mới (auto-slug), upload ảnh, lưu DRAFT → PUBLISHED → hiển thị ngay ở `/blog`.
2. **SEO Modal:** mở từ Form, sửa Tiêu đề (đếm ký tự chạy), xem Google preview cập nhật realtime, ESC đóng được.
3. **Slug trùng:** tạo 2 bài cùng slug → bài 2 nhận lỗi 409 hiển thị trên Form.
4. **Rate limit:** F5 liên tục trang chi tiết bài → sau 30 lượt/phút thấy 429 (bài vẫn hiển thị, chỉ đếm view bị chặn).
5. **Xóa có điều kiện:** cố xóa bài PUBLISHED → nhận thông báo phải chuyển về bản nháp; xóa chuyên mục có bài → nhận 409.
6. **Booking:** sort cột "Mã lịch hẹn" trên admin/bookings cho thứ tự đúng, mã không tràn cột.
7. **Search blog:** gõ từ khóa → debounce 400ms → URL có `?q=...`, kết quả lọc đúng, xóa từ khóa → về full list.

---

## 📦 8. Checklist Trước Khi Commit

- [ ] **16 file untracked mới** phải được `git add` (module blog backend 9 file + frontend 7 file) — dùng `git add -A` hoặc add từng nhóm.
- [ ] Kiểm tra `backend/.env` **không** bị track (đảm bảo `.gitignore` còn `.env`).
- [ ] Chạy ESLint frontend: `wsl -e bash -lc "cd /mnt/c/Thanhbt-dev/Project/SPA-Lan-Anh-Beauty/frontend && npx eslint src --ext .js,.jsx"`.
- [ ] Gợi ý chia commit theo nhóm: (1) booking fix, (2) blog backend, (3) blog frontend + SEO modal, (4) UI theme admin, (5) config/eslint.

**Các file modified nhưng KHÔNG thuộc ngày hôm nay** (sửa từ trước, vẫn đang chờ commit): `README.md`, `backend/package.json`, `backend/package-lock.json`, `docs/api-guide.md`, `frontend/index.html`.

---

*Cập nhật: 14/09/2026 — branch `thanhbt/feat`.*
