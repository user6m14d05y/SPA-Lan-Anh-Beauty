# Hướng dẫn tạo VPS (EC2) trên AWS Free Tier

Tài liệu này tổng hợp lại toàn bộ các bước đã thực hiện để tạo tài khoản AWS, bảo mật tài khoản, tạo một VPS (EC2 instance) và kết nối SSH vào server — dùng để deploy production ở quy mô nhỏ.

---

## 1. Tổng quan về AWS Free Tier

Kể từ tháng 7/2025, AWS đổi cơ chế Free Tier:

- Tài khoản mới được cấp **$100 tín dụng** khi đăng ký.
- Có thể kiếm thêm tới **$100 nữa** (tổng tối đa **$200**) bằng cách hoàn thành 5 hoạt động: khởi tạo/tắt EC2, cấu hình RDS, deploy Lambda, thử Bedrock, tạo Budget alert.
- Thời hạn: **6 tháng hoặc đến khi hết credit**, tùy điều kiện nào đến trước.
- Có 2 loại tài khoản: **Free Plan** (tự đóng khi hết hạn/hết credit) và **Paid Plan** (có thẻ backup, không tự đóng).
- Vẫn giữ hơn 30 dịch vụ **Always Free** (miễn phí vĩnh viễn theo hạn mức hàng tháng, ví dụ Lambda, DynamoDB).

> Lưu ý: tài khoản tạo trước 15/7/2025 vẫn theo cơ chế cũ (12 tháng miễn phí theo hạn mức dịch vụ).

---

## 2. Tạo tài khoản AWS

1. Vào trang AWS Free Tier, bấm **"Tạo tài khoản miễn phí"**.
2. Nhập email, thẻ tín dụng/ghi nợ để xác minh (có thể bị tạm giữ 1 USD rồi hoàn lại), số điện thoại.
3. Hoàn tất đăng ký, nhận ngay $100 tín dụng.

---

## 3. Đổi Region gần Việt Nam

Region mặc định có thể là Sydney (xa VN, độ trễ cao). Nên đổi sang:

- **Asia Pacific (Singapore) — `ap-southeast-1`**

Cách đổi: bấm vào dropdown region ở góc trên bên phải màn hình Console > chọn Singapore.

---

## 4. Bảo mật tài khoản (làm trước khi tạo bất kỳ dịch vụ nào)

### 4.1. Bật MFA cho root user

1. Gõ **"IAM"** vào ô tìm kiếm > vào IAM Dashboard.
2. Tìm mục **"Add MFA for root user"**.
3. Chọn **"Authenticator app"**, quét mã QR bằng Google Authenticator/Authy trên điện thoại.
4. Nhập 2 mã liên tiếp để xác nhận.
5. Lưu lại **recovery codes** ở nơi an toàn.

### 4.2. Tạo IAM user riêng để làm việc hàng ngày

1. Trong IAM > **Users** > **Create user**.
2. Đặt tên (ví dụ `admin`).
3. Ở bước permissions, chọn **"Attach policies directly"** > tích **`AdministratorAccess`**.
4. Tạo password đăng nhập console cho user này.
5. Từ giờ luôn đăng nhập bằng IAM user này, **không dùng root** trừ khi thật cần thiết.

---

## 5. Thiết lập Budget Alert (cảnh báo chi phí)

1. Gõ **"Budgets"** vào ô tìm kiếm > **Create budget**.
2. Chọn **"Customize (advanced)"** > **"Cost budget"**.
3. Đặt tên budget, **Period: Monthly**, **Budget amount: Fixed**, nhập số tiền ngưỡng (ví dụ $10).
4. Ở bước **Configure alerts**:
   - **Threshold**: ví dụ `80` (đơn vị `% of budgeted amount`)
   - **Trigger**: để `Actual`
   - **Email recipients**: nhập email nhận cảnh báo
5. Bỏ qua Step 4 (Attach actions - optional) nếu chưa cần tự động dừng dịch vụ.
6. Review lại thông tin > bấm **Create budget**.

> Lỗi thường gặp: "Unable to load chart... User not enabled for cost explorer access" — đây là do Cost Explorer chưa được kích hoạt (có thể mất vài giờ), **không ảnh hưởng** đến việc tạo budget hay nhận email cảnh báo.

> Lỗi threshold không nhận giá trị: click vào ô, xóa hết, gõ lại số bằng tay, click ra ngoài để xác nhận.

### Kiểm tra credit còn lại

Vào **Billing and Cost Management** (click tên tài khoản góc trên phải) > mục **Credits** để xem số dư và hạn sử dụng.

---

## 6. Tạo EC2 instance (VPS)

> EC2 instance chính là "VPS" của AWS — một server ảo riêng, có IP riêng, toàn quyền SSH vào cài đặt.

1. Gõ **"EC2"** vào ô tìm kiếm > **Launch instance**.
2. **Name**: đặt tên instance (ví dụ `my-server`).
3. **Application and OS Images**: chọn **Ubuntu** (bản LTS mới nhất), kiểm tra badge **"Free tier eligible"**.
4. **Instance type**: chọn **`t2.micro`** hoặc **`t3.micro`** (nằm trong Free Tier).
5. **Key pair**: bấm **"Create new key pair"**, đặt tên, chọn định dạng **`.pem`**, bấm Create — file tự động tải về máy.
   - ⚠️ File này chỉ tải được **1 lần duy nhất**, mất là không lấy lại được.
6. **Network settings** > Edit > **Firewall (security groups)** > chọn **"Create security group"**, thêm 3 rule:
   - **SSH** (port 22) — Source: **My IP** (an toàn hơn Anywhere)
   - **HTTP** (port 80) — Source: **Anywhere** (0.0.0.0/0)
   - **HTTPS** (port 443) — Source: **Anywhere** (0.0.0.0/0)
7. **Configure storage**: để mặc định **8 GiB gp3** (trong Free Tier, miễn phí tới 30GB/tháng). File systems: **None**.
8. Bấm **Launch instance**, chờ 1-2 phút cho tới khi trạng thái chuyển thành **"Running"**.
9. Lấy **Public IPv4 address** của instance để dùng cho bước SSH.

---

## 7. Kết nối SSH vào server

### 7.1. Di chuyển file .pem vào đúng chỗ

Nên đặt file `.pem` trong thư mục `.ssh` của Windows user:

```
C:\Users\<tên-user>\.ssh\<tên-key>.pem
```

Lệnh di chuyển (chạy trong CMD):

```
move "C:\Users\<user>\Downloads\<key>.pem" "C:\Users\<user>\.ssh\<key>.pem"
```

### 7.2. Sửa permissions file .pem trên Windows (bắt buộc)

Nếu gặp lỗi **"UNPROTECTED PRIVATE KEY FILE"**, chạy lần lượt (mỗi lệnh Enter riêng):

```
icacls "C:\Users\<user>\.ssh\<key>.pem" /inheritance:r
icacls "C:\Users\<user>\.ssh\<key>.pem" /grant:r <tên-user-Windows>:R
```

Kiểm tra lại quyền:

```
icacls "C:\Users\<user>\.ssh\<key>.pem"
```

### 7.3. Lệnh SSH đầy đủ

```
ssh -i "C:\Users\<user>\.ssh\<key>.pem" ubuntu@<Public-IP>
```

> Lưu ý quan trọng: username SSH luôn là **`ubuntu`** (vì dùng AMI Ubuntu) — **không phải** tên tài khoản Windows hay tên bạn đặt lúc đăng ký AWS.

---

## 8. Rút gọn lệnh SSH bằng file config

Thay vì gõ lệnh dài mỗi lần, tạo file config để chỉ cần gõ `ssh <tên-alias>`.

1. Tạo thư mục `.ssh` nếu chưa có:
   ```
   mkdir %USERPROFILE%\.ssh
   ```
2. Tạo file config bằng CMD (an toàn hơn Notepad — tránh lỗi dán dính dòng):
   ```
   echo Host vps-aws> C:\Users\<user>\.ssh\config
   echo     HostName <Public-IP>>> C:\Users\<user>\.ssh\config
   echo     User ubuntu>> C:\Users\<user>\.ssh\config
   echo     IdentityFile C:\Users\<user>\.ssh\<key>.pem>> C:\Users\<user>\.ssh\config
   ```
   - Dấu `>` (đơn) ghi đè, tạo dòng đầu tiên.
   - Dấu `>>` (đôi) thêm vào cuối file, không xóa nội dung cũ.
   - ⚠️ Chạy **từng dòng riêng biệt**, không copy nhiều dòng dán cùng lúc vào CMD — dễ bị dính lại thành 1 dòng gây lỗi.
   - File phải tên đúng là **`config`**, **không có đuôi `.txt`** (lỗi hay gặp khi tạo bằng Notepad).
3. Kiểm tra nội dung:
   ```
   type C:\Users\<user>\.ssh\config
   ```
4. Từ giờ chỉ cần gõ:
   ```
   ssh vps-aws
   ```

---

## 9. Bảo mật file .pem — lưu ý quan trọng

- **Tuyệt đối không** đưa file `.pem` lên GitHub, Google Drive công khai, hay gửi qua chat không mã hóa.
- Không để trong thư mục đồng bộ tự động công khai.
- Backup file vào nơi an toàn khác (USB riêng, cloud có mã hóa, password manager).
- Nếu nghi ngờ lộ key: tạo key pair mới trong EC2, gắn vào instance, xóa key cũ (không có cách "đổi mật khẩu" như tài khoản thường).

---

## 10. Các lỗi thường gặp & cách xử lý

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `Permission denied (publickey)` | Thiếu `-i` trỏ tới file key, hoặc sai username | Dùng đúng `-i "path"` và username `ubuntu` |
| `Bad permissions... too open` | File `.pem` bị mở quyền cho nhiều user trên Windows | Chạy `icacls` để giới hạn quyền chỉ cho user hiện tại |
| `Could not resolve hostname` | File `config` sai vị trí, sai tên, hoặc nội dung bị dính 1 dòng | Đặt đúng `C:\Users\<user>\.ssh\config` (không đuôi `.txt`), mỗi directive 1 dòng riêng |
| `Unable to load chart... cost explorer access` | Cost Explorer chưa kích hoạt cho tài khoản mới | Bỏ qua, không ảnh hưởng tới budget alert |
| `Enter a threshold value` khi tạo budget | Giá trị điền sẵn chưa được "chạm" vào | Xóa và gõ lại số bằng tay, click ra ngoài ô |

---

## 11. Theo dõi Billing / Cost

Console Home có sẵn widget **"Cost and usage"** hiển thị nhanh:
- **Credits remaining**: số USD credit còn lại
- **Days remaining**: số ngày còn lại của gói Free Plan (kèm ngày hết hạn cụ thể)

Để xem chi tiết hơn, vào **Billing and Cost Management** (click tên tài khoản ở góc trên phải > chọn mục này):

| Mục | Dùng để làm gì |
|---|---|
| **Cost Explorer** | Xem biểu đồ chi phí theo thời gian, lọc theo từng dịch vụ (EC2, S3, RDS...). Tài khoản mới có thể cần đợi vài giờ để kích hoạt. |
| **Bills** | Xem hóa đơn chi tiết từng tháng, liệt kê rõ từng dịch vụ và chi phí tương ứng. |
| **Free Tier** | Xem % đã dùng hạn mức miễn phí của từng dịch vụ (ví dụ EC2 750 giờ/tháng đã dùng bao nhiêu). |
| **Credits** | Xem số dư credit chính xác và hạn sử dụng. |

> Lưu ý: **IAM không phải dịch vụ tính phí** — hoàn toàn miễn phí, chỉ dùng để quản lý quyền truy cập, nên sẽ không xuất hiện trong Cost Explorer/Bills.

**Khuyến nghị theo dõi định kỳ**: kiểm tra widget Cost and usage trên Console Home hàng tuần, và xem trang Bills vào đầu mỗi tháng để nắm rõ dịch vụ nào đang tốn chi phí nhiều nhất.

---

## 12. Việc cần làm tiếp theo

- [ ] Cài đặt môi trường trên server (Node.js/Python/Docker...)
- [ ] Pull code từ Git
- [ ] Chạy ứng dụng bằng process manager (pm2/systemd) để tự khởi động lại khi crash
- [ ] Trỏ domain về Public IP (bản ghi A)
- [ ] Cài Nginx làm reverse proxy + Let's Encrypt (Certbot) để có HTTPS miễn phí
- [ ] Bật CloudWatch giám sát, tạo backup/snapshot định kỳ
