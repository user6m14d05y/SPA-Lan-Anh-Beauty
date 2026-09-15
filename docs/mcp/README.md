# Hướng Dẫn Cài Đặt & Sử Dụng MCP (Model Context Protocol)
## Dự án: SPA Lan Anh Beauty

Tài liệu này tổng hợp toàn bộ quy trình cài đặt, cấu hình và cách vận hành các **MCP Servers** (Model Context Protocol) cho dự án SPA Lan Anh Beauty, bao gồm **GitNexus MCP** (Phân tích mã nguồn) và **Chrome DevTools MCP** (Kiểm thử giao diện & API tự động).

---

## 📌 Danh Mục

1. [Tổng Quan Về MCP](#1-tổng-quan-về-mcp)
2. [GitNexus MCP Server (Code Intelligence & Knowledge Graph)](#2-gitnexus-mcp-server)
   - [Cài Đặt CLI](#21-cài-đặt-cli)
   - [Phân Tích & Index Mã Nguồn](#22-phân-tích--index-mã-nguồn)
   - [Cấu Hình MCP](#23-cấu-hình-mcp)
   - [Quy Trình Fix Bug & Test với GitNexus](#24-quy-trình-fix-bug--test-với-gitnexus)
3. [Chrome DevTools MCP Server (Kiểm Thử Trình Duyệt)](#3-chrome-devtools-mcp-server)
   - [Tính Năng Nổi Bật](#31-tính-năng-nổi-bật)
   - [Cài Đặt & Cấu Hình](#32-cài-đặt--cấu-hình)
   - [Quy Trình Kiểm Thử UI/UX](#33-quy-trình-kiểm-thử-uiux)
4. [Tích Hợp Với WSL Docker Workflow](#4-tích-hợp-với-wsl-docker-workflow)

---

## 1. Tổng Quan Về MCP

MCP (Model Context Protocol) cho phép trợ lý AI (như Claude Code, Claude Desktop, Antigravity, Cursor, Codex) truy cập trực tiếp các công cụ nâng cao trên hệ thống máy cục bộ để:
- Phân tích cây phụ thuộc và luồng thực thi code (Graph Analysis).
- Điểu khiển trình duyệt tự động để kiểm thử UI/UX và theo dõi Network/Console.
- Kiểm tra rủi ro tác động (Blast Radius / Impact Analysis) trước khi thay đổi mã nguồn.

---

## 2. GitNexus MCP Server

**GitNexus** tạo một Đồ thị Tri thức (Knowledge Graph) cho toàn bộ codebase của dự án SPA Lan Anh Beauty (cả Backend Node.js/Express và Frontend React/Vite).

### 2.1 Cài Đặt CLI

Mở terminal (PowerShell hoặc Bash) và cài đặt toàn cục:
```bash
npm install -g gitnexus
```

### 2.2 Phân Tích & Index Mã Nguồn

Tại thư mục gốc của dự án (`SPA-Lan-Anh-Beauty`), chạy lệnh phân tích:
```bash
npx gitnexus analyze
```

- **Kết quả thành công:** Lệnh sẽ tạo ra thông báo `Repository indexed successfully` kèm thống kê số nodes, edges, clusters và flows.
- **Xử lý sự cố với npm 11.x:** Nếu gặp lỗi build native binary, dùng `pnpm`:
  ```bash
  pnpm --allow-build=@ladybugdb/core --allow-build=gitnexus --allow-build=tree-sitter dlx gitnexus@latest analyze
  ```
- **Sửa lỗi Full-Text Search (FTS) (Tùy chọn):** Nếu có cảnh báo thiếu thư viện FTS, chạy:
  ```bash
  npx gitnexus analyze --repair-fts
  ```

### 2.3 Cấu Hình MCP

#### Cách 1: Tự động cấu hình (Recommended)
Chạy lệnh tự động đăng ký MCP cho các AI Editor/Agent:
```bash
npx gitnexus setup
```
Lệnh này sẽ tự động thêm cấu hình và cài 12 bộ skill vào:
- **Claude Code** (`~/.claude/skills/`)
- **Antigravity** (`~/.gemini/antigravity/skills/`)
- **Codex** (`~/.agents/skills/`)

#### Cách 2: Thêm thủ công vào file cấu hình
Nếu cần thêm vào Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`) hoặc `mcp.json`:

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

### 2.4 Quy Trình Fix Bug & Test với GitNexus

| Bước | Mục Đích | Lệnh / MCP Tool |
| :--- | :--- | :--- |
| **1. Trace Bug** | Tìm nguyên nhân lỗi và luồng thực thi | `context`, `trace`, `query` |
| **2. Impact Analysis** | Kiểm tra phạm vi ảnh hưởng trước khi sửa | `impact({ target: "symbolName", direction: "upstream" })` |
| **3. Edit Code** | Tiến hành sửa lỗi | AI Agent chỉnh sửa code |
| **4. Detect Changes** | Kiểm tra đứt gãy luồng sau khi sửa | `detect_changes({ scope: "all" })` |
| **5. Run Tests** | Kiểm chứng bằng test suite | `npm test` hoặc `wsl docker compose` |

---

## 3. Chrome DevTools MCP Server

**Chrome DevTools MCP** cho phép AI trực tiếp mở trình duyệt Chrome, tương tác với ứng dụng Web SPA Lan Anh Beauty, tự động phát hiện lỗi Console JS và lỗi API Network HTTP.

### 3.1 Tính Năng Nổi Bật
- **Điều hướng & Tương tác:** `navigate_page`, `click`, `fill_form`, `type_text`, `hover`, `press_key`.
- **Giám sát Lỗi:** `list_console_messages`, `get_network_request`.
- **Trực quan hóa:** `take_screenshot`, `resize_page`.
- **Đánh giá Hiệu năng:** `lighthouse_audit`, `performance_analyze_insight`.

### 3.2 Cài Đặt & Cấu Hình

#### Qua lệnh Claude CLI:
*(Lưu ý: Bọc câu lệnh trong dấu ngoặc kép để tránh bị lỗi parse flag `-y`)*
```powershell
claude mcp add chrome-devtools "npx -y chrome-devtools-mcp@latest"
```

#### Hoặc qua tệp cấu hình MCP (`claude_desktop_config.json` / `mcp.json`):
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

### 3.3 Quy Trình Kiểm Thử UI/UX

1. Đảm bảo ứng dụng Frontend/Backend đang chạy (qua Docker hoặc Vite dev server).
2. Yêu cầu AI Agent:
   > *"Hãy dùng Chrome DevTools MCP mở `http://localhost:5173/booking`, đặt thử một lịch hẹn và kiểm tra xem có lỗi console hoặc lỗi API 500 nào không."*

---

## 4. Tích Hợp Với WSL Docker Workflow

Dự án SPA Lan Anh Beauty sử dụng Docker Compose trong môi trường WSL.

### Thao tác vận hành thường dùng:

```bash
# 1. Khởi chạy toàn bộ hệ thống (MySQL, Backend, Frontend)
wsl docker compose up -d

# 2. Kiểm tra trạng thái các container
wsl docker ps

# 3. Theo dõi log ứng dụng
wsl docker compose logs -f backend
wsl docker compose logs -f frontend
wsl docker compose logs -f mysql

# 4. Tắt hệ thống
wsl docker compose down
```

---

*Tài liệu được khởi tạo và cập nhật tự động bởi Antigravity AI Assistant.*
