# Chống bot: Cloudflare Turnstile

Frontend: `src/lib/api/security.ts`, `src/components/security/*`.

## Cấu hình

| Biến | Ở đâu | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Frontend (`.env.local`) | Site key của Turnstile. Không đặt thì frontend dùng widget demo |
| `TURNSTILE_SECRET_KEY` | Backend | Secret key, dùng để gọi `siteverify` |

Khi phát triển trên máy, có thể dùng test key luôn qua của Cloudflare: site key `1x00000000000000000000AA`, secret key `1x0000000000000000000000000000000AA`.

Mỗi token chỉ dùng được một lần. Backend kiểm tra token bằng `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` với `secret`, `response` (là token) và `remoteip`. Nên đối chiếu thêm trường `action`: frontend gửi `login`, `register`, `admin-login` hoặc `page`.

## Captcha khi đăng nhập, đăng ký

Ba endpoint `POST /auth/login`, `POST /auth/register` và `POST /admin/auth/login` nhận thêm trường `captchaToken` trong body.

- Khi `captchaOnAuth` đang bật mà token thiếu hoặc không hợp lệ: trả `400` kèm `{ "message": "Hãy xác minh bạn không phải người máy." }`.
- Sau mỗi lần gửi thất bại, frontend tự tạo lại widget để lấy token mới.

## Kiểm tra khi vào trang

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/security/human-check` | `{ token, path }` | `{ validUntil }` (epoch ms), đồng thời set cookie httpOnly `fp_human` có hạn `botCheckMinutes` phút |

Cách chạy:
- Khi người dùng mở **bất kỳ trang nào**, frontend kiểm tra hạn của lần xác minh trước. Hết hạn thì hiện màn "Kiểm tra nhanh" ngay trên trang đó.
- Màn này chỉ là phần nhìn thấy. Backend phải chặn thật: các API cần kiểm tra cookie `fp_human` và trả `401` kèm `code: "human_check_required"` khi cookie đã hết hạn.
- Có thể bật thêm Cloudflare WAF (Managed Challenge, Bot Fight Mode) ở tầng edge.

## Thiết lập do admin đặt

Các thiết lập nằm trong `SystemSettings` (`PUT /admin/system`). Trang công khai đọc qua `GET /config/public`.

| Trường | Mặc định | Ý nghĩa |
|---|---|---|
| `captchaOnAuth` | `true` | Captcha ở đăng nhập, đăng ký, đăng nhập quản trị |
| `botCheckEnabled` | `true` | Kiểm tra khi vào trang |
| `botCheckMinutes` | `20` | Số phút một lần xác minh còn hiệu lực |
