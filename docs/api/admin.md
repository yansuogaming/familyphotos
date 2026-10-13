# API khu quản trị (admin)

Dùng cho `/admin/dashboard`. Kiểu dữ liệu: `src/lib/api/admin-types.ts`. Frontend gọi qua `adminApi` trong `src/lib/api/admin.ts`. Bài học dùng API riêng (`docs/api/lessons.md`), nội dung trang công khai xem `docs/api/site.md`.

## Quyền

- Mọi endpoint dưới `/admin/*` chỉ dành cho người dùng có `role: "admin"`.
- Chưa đăng nhập: `401`. Đã đăng nhập nhưng không phải admin: `403` kèm `{ "message": "Chỉ quản trị viên được làm việc này." }`.
- Lỗi khác trả `{ "message": "..." }` tiếng Việt, frontend hiển thị nguyên văn (ví dụ `400`, `404`, `409`, `413`).
- Mỗi thao tác ghi (POST/PATCH/PUT/DELETE) phải ghi một dòng `AuditEntry` vào nhật ký.

## Tổng quan

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/overview` | | `AdminOverview`: số người trong nhà, số con đang đi học (có `grade`), số khách, lời xin vào đang chờ, dung lượng (`usedBytes`, `quotaBytes`, 4 người dùng nhiều nhất), ảnh mới 7 ngày (`perDay` 7 số, cũ đến mới, số cuối là hôm nay), 8 hoạt động gần nhất (gồm cả việc của cả nhà như thêm ảnh, học bài, và các dòng nhật ký) |

## Thành viên

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/users` | | `AdminUser[]` (tất cả; frontend tự tìm, lọc, sắp xếp, phân trang) |
| POST | `/admin/users` | `NewUserInput { name, nickname?, email, role, grade? }` | `AdminUser`. Email trùng: `409`. Backend gửi email mời đặt mật khẩu |
| PATCH | `/admin/users/:id` | `UserPatch { name?, nickname?, role?, grade? (null để bỏ), status?: "active" \| "locked" }` | `AdminUser`. Tự khoá hoặc tự bỏ quyền admin của chính mình: `400`. Khoá thì đăng xuất mọi thiết bị của người đó |
| DELETE | `/admin/users/:id` | | `204`. Xoá chính mình: `400` |

## Khách xin vào

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/join-requests` | | `JoinRequest[]` |
| POST | `/admin/join-requests/:id/approve` | | `AdminUser` (tài khoản khách mới, `role: "guest"`) |
| POST | `/admin/join-requests/:id/reject` | | `204` |

## Mã mời

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/invites` | | `InviteCode[]` (mới trước) |
| POST | `/admin/invites` | `NewInviteInput { role: "member" \| "guest", note?, validDays, maxUses }` | `InviteCode` (backend sinh `code` dạng `NHA-1234`) |
| POST | `/admin/invites/:id/revoke` | | `InviteCode` với `revoked: true` |

Trạng thái mã do frontend suy ra: đã thu hồi (`revoked`), hết hạn (`expiresAt` đã qua), hết lượt (`uses >= maxUses`), còn lại là dùng được. `POST /auth/register` với `inviteCode` phải kiểm tra đủ các điều kiện này và tăng `uses`.

## Album

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/albums` | | `AdminAlbum[]` (có `visibility` và `createdBy`) |
| PATCH | `/admin/albums/:id` | `AlbumPatch { title?, coverUrl?, visibility? }` | `AdminAlbum` |
| DELETE | `/admin/albums/:id` | | `204` (xoá cả ảnh trong album) |
| GET | `/admin/albums/:id/photos` | | `Photo[]` |
| DELETE | `/admin/albums/:id/photos/:photoId` | | `204` (giảm `photoCount`) |

`visibility`: `{ "kind": "family" }` (chỉ người trong nhà) hoặc `{ "kind": "shared", "guestIds": ["u-co", ...] }` (người trong nhà và các khách được chọn). Khách chỉ được thấy album có id của mình trong `guestIds`, những album khác trả `403` (khớp quy ước chung ở `API_CONTRACT.md`).

## Thư viện ảnh của site

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/media` | | `MediaAsset[]` (mới trước). `usedIn`: danh sách chỗ đang dùng ảnh, ví dụ `"Trang chủ: album mở, ảnh 1"`, `"Ảnh bìa album \"Tết Bính Ngọ\""` |
| POST | `/admin/media` | multipart: `file` (JPG/PNG/WebP, tối đa 5 MB), `name`, `alt` | `MediaAsset`. Sai loại: `415`, quá lớn: `413` |
| PATCH | `/admin/media/:id` | `{ name?, alt? }` | `MediaAsset` |
| DELETE | `/admin/media/:id` | | `204`. Nếu ảnh đang dùng, backend nên thay chỗ dùng bằng ảnh mặc định |

## Trợ lý AI

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/assistant` | | `AssistantConfig { systemPrompt, suggestions[], guestsAllowed, kidDailyLimit (0 = không giới hạn), provider: "claude" \| "openai" }` |
| PUT | `/admin/assistant` | `AssistantConfig` | `AssistantConfig` |

Khung trợ lý ở mọi trang nên lấy `suggestions` từ đây (hiện đang đọc `assistantSuggestions` trong mock-data). `POST /assistant/messages` phải áp `guestsAllowed` (khách bị chặn trả `403`) và `kidDailyLimit` (quá giới hạn trả `429` kèm `message`).

## Cài đặt hệ thống và nhật ký

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/admin/system` | | `SystemSettings { familyName, quotaPerUserGb, allowGuestSelfSignup, qrTtlSeconds }` |
| PUT | `/admin/system` | `SystemSettings` | `SystemSettings` |
| GET | `/admin/audit?limit=200` | | `AuditEntry[] { id, at, actor { id, name }, action, target }` (mới trước) |

`allowGuestSelfSignup: false` thì `POST /auth/register` với `role: "guest"` mà không có mã mời trả `403`. `qrTtlSeconds` là hạn của mã QR đăng nhập (`POST /auth/qr`).
