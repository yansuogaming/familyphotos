# API contract (frontend ↔ backend)

Nguồn chuẩn của các kiểu dữ liệu: `src/lib/api/types.ts`. Frontend gọi API qua `src/lib/api/client.ts` khi biến `NEXT_PUBLIC_API_URL` được đặt (ví dụ `https://api.example.com`).

## Quy ước chung

- JSON, UTF-8. Ngày giờ theo chuẩn ISO 8601.
- Xác thực bằng cookie httpOnly (frontend gửi `credentials: "include"`). Backend phải bật CORS với `Access-Control-Allow-Credentials: true` cho domain của frontend.
- Khi lỗi, trả về mã HTTP phù hợp kèm body `{ "message": "Câu báo lỗi tiếng Việt cho người dùng" }`. Frontend hiển thị nguyên văn `message`.
- `401`: chưa đăng nhập. `403`: là khách nhưng truy cập nội dung không được chia sẻ.

## Auth

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/auth/login` | `{ identifier, password }` (identifier là email hoặc số điện thoại) | `Session`. Chỉ nhận người trong nhà và khách. Tài khoản `admin` trả `403` |
| POST | `/admin/auth/login` | `{ identifier, password }` | `Session`. Trang `/admin` dùng endpoint này. Chỉ nhận `role: "admin"`, tài khoản khác trả `403` |
| POST | `/auth/register` | `RegisterInput { name, email, password, role, inviteCode?, captchaToken }` | `PendingSignup { id, emailHint, expiresAt, resendAt, codeLength }`. Gửi mã OTP về email, **chưa tạo tài khoản**. Email đã có tài khoản thì trả `409`. Mã mời sai thì trả `400` |
| POST | `/auth/register/verify` | `{ pendingId, code }` | `Session`. Đúng mã thì tạo tài khoản và đăng nhập luôn. Sai mã trả `400`, message có số lần thử còn lại. Hết hạn trả `410`. Sai quá 5 lần trả `429` |
| POST | `/auth/register/resend` | `{ pendingId }` | `PendingSignup` mới (mã mới). Gửi lại trước `resendAt` thì trả `429` |
| POST | `/auth/logout` | | `204` |
| GET | `/auth/me` | | `User` |

### Đăng nhập bằng QR (giống Zalo Web)

1. Trình duyệt gọi `POST /auth/qr`, nhận về `QrLoginSession { id, code, expiresAt }`. Frontend vẽ `code` thành mã QR. Mã có hạn 60 giây.
2. Trình duyệt gọi `GET /auth/qr/:id` mỗi 1,5 giây, nhận về `QrLoginState { status, approver?, session? }`.
3. App điện thoại (đã đăng nhập) quét `code` → backend chuyển sang `status: "scanned"` và gán `approver`.
4. Người dùng bấm xác nhận trên điện thoại → `status: "confirmed"`. Ở lần poll kế tiếp, backend set cookie phiên cho trình duyệt và trả về `session`.
5. Quá hạn → `status: "expired"`.

Các trạng thái: `pending | scanned | confirmed | expired`. Nếu sau này cần đổi polling sang WebSocket/SSE thì vẫn giữ nguyên cấu trúc dữ liệu này.

## Tài khoản và cài đặt

| Method | Path | Body | Trả về |
|---|---|---|---|
| PATCH | `/account/profile` | `ProfileUpdate` (`avatar`: data URL, hoặc `null` để bỏ ảnh) | `User` |
| POST | `/account/password` | `{ current, next }` | `204`. Mật khẩu cũ sai thì trả `400` kèm `message` |
| GET / PATCH | `/account/settings` | `Partial<UserSettings>` | `UserSettings` |
| GET | `/account/storage` | | `StorageUsage` (đơn vị: byte) |
| GET | `/account/devices` | | `Device[]` (`current: true` là thiết bị đang gọi API) |
| DELETE | `/account/devices/:id` | | `204` |
| DELETE | `/account/devices` | | `204`: đăng xuất mọi thiết bị trừ thiết bị hiện tại |
| GET | `/account/ai` | | `AiAccount[]`. Luồng OAuth để gắn tài khoản AI sẽ bàn sau |
| DELETE | `/account` | | `{ purgeAt }`: đưa vào hàng chờ xoá 30 ngày, đăng nhập lại thì huỷ |

Frontend lưu phiên đăng nhập trong `src/lib/session.ts`. Khi có backend, frontend gọi `GET /auth/me` lúc mở app để lấy lại thông tin người dùng.

### Đăng ký có xác nhận email

1. Người dùng điền thông tin, frontend gọi `POST /auth/register`. Backend kiểm tra captcha và dữ liệu, gửi mã 6 số về email (hạn 10 phút), rồi trả `PendingSignup`.
2. Frontend hiện màn nhập mã. Người dùng nhập mã, frontend gọi `POST /auth/register/verify`.
3. Đúng mã thì backend tạo tài khoản và set cookie phiên. Khách vào thẳng phần ảnh của riêng mình. Người trong nhà cần mã mời hợp lệ ở bước 1.
4. "Gửi lại mã" chỉ hiện sau `resendAt` (60 giây).

## Ảnh

| Method | Path | Trả về |
|---|---|---|
| GET | `/albums` | `Album[]` |
| GET | `/photos?sort=recent` | `Photo[]` |
| GET | `/albums/:id/photos` | `Photo[]` (giai đoạn sau) |
| POST | `/albums/:id/photos` | multipart upload, trả về `Photo` (giai đoạn sau) |

Ảnh nên được phục vụ qua CDN. Khi có domain CDN, cần thêm domain đó vào `images.remotePatterns` trong `next.config.ts`.

## Chat

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/conversations` | | `Conversation[]` |
| GET | `/conversations/:id/messages` | | `Message[]` (cũ → mới) |
| POST | `/conversations/:id/messages` | `{ text, attachments? }` | `Message` |

Tin nhắn realtime (WebSocket) sẽ bàn ở giai đoạn 3.

## Học

| Method | Path | Trả về |
|---|---|---|
| GET | `/learning/today` | `LearningToday` |
| GET | `/learning/areas` | `LearningArea[]` |
| GET | `/learning/grades/:grade/subjects/:subject/topics/:index` | `TopicDetail` |

## Trợ lý AI

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/assistant/messages` | `{ history: AssistantMessage[], text }` | `AssistantMessage` |

Giai đoạn 5 sẽ chuyển sang trả lời dạng stream (SSE).
