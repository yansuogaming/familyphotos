# Family Photos (frontend)

Web riêng của một gia đình: kho ảnh, chat trong nhà, góc học tập cho các con (lớp 1 đến 12), trợ lý AI và khu quản trị.

Repo này **chỉ có frontend**. Tất cả dữ liệu đi qua `src/lib/api/` và lấy từ backend ở địa chỉ `NEXT_PUBLIC_API_URL`. Repo không có dữ liệu mẫu hay tài khoản dùng thử. Chưa có backend thì các màn vẫn mở được nhưng chỉ hiện trạng thái lỗi kết nối.

## Chạy dự án

Cần Node.js 20 trở lên.

```bash
npm install
cp .env.example .env.local   # rồi điền NEXT_PUBLIC_API_URL
npm run dev          # http://localhost:3000
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy chế độ phát triển |
| `npm run build` | Build production (có kiểm tra TypeScript) |
| `npm start` | Chạy bản build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Kiểm tra kiểu |

## Công nghệ

- Next.js 16.4 (App Router, `cacheComponents`), React 19, TypeScript
- Tailwind CSS v4, token màu OKLCH trong `src/app/globals.css`
- `motion` (hiệu ứng), `katex` (công thức toán), `qrcode.react` (mã QR)
- Icon: [Morphicons](https://www.morphicons.com/) (biến hình giữa các icon) vẽ các icon nét của `lucide`, gói gọn trong `src/components/ui/icons.tsx`
- Font qua `next/font`: Bricolage Grotesque, Be Vietnam Pro, Patrick Hand (cả ba có đủ dấu tiếng Việt)

> Next.js 16 khác nhiều so với các bản cũ. Trước khi dùng API lạ, đọc tài liệu đi kèm trong `node_modules/next/dist/docs/`.

## Các trang

Mọi URL đều bằng tiếng Anh. URL tiếng Việt cũ (`/dang-nhap`, `/anh`, `/hoc/...`, `/quan-tri/...`) tự chuyển hướng sang URL mới, cấu hình trong `next.config.ts`.

| Route | Nội dung |
|---|---|
| `/` | Landing: album mở, đăng nhập QR ngay tại trang, giới thiệu các phòng |
| `/login`, `/register` | Đăng nhập (QR hoặc mật khẩu) và đăng ký. Chỉ dành cho người trong nhà và khách |
| `/photos`, `/photos/[id]` | Album của nhà và album của khách để riêng, chi tiết album, xem ảnh lớn, tải ảnh lên (có ảnh lẻ không cần album) |
| `/chat` | Chat 1-1 và nhóm: ảnh, tệp, vị trí, emoji, trả lời, cảm xúc, gọi video |
| `/learn` | Mục tiêu hằng ngày, chuỗi ngày học, bài đang học dở, mục lục |
| `/learn/theory` | Đọc bài (`?grade=9&subject=toan&lesson=...`): mục lục ẩn/hiện, toàn màn hình, video, công thức, tự kiểm |
| `/learn/practice`, `/learn/review` | Luyện tập có chấm điểm (`?lesson=`), ôn câu sai |
| `/learn/solutions` | Lời giải SGK theo bộ sách (`?exercise=`) |
| `/learn/exams`, `/learn/books` | Thư viện đề (`?exam=&take=1`), kệ sách (`?book=&page=`) |
| `/learn/tools` | Máy tính, giải phương trình, bảng công thức, đồng hồ học, đổi đơn vị (`?tool=`) |
| `/assistant` | Trợ lý AI toàn trang. Nút nổi ở góc phải có trên mọi trang trong app |
| `/settings` | Hồ sơ, bảo mật, thiết bị, API AI (khách), dung lượng, riêng tư, giao diện, thông báo |
| `/admin` | **Trang đăng nhập quản trị** (cửa riêng) |
| `/admin/dashboard` | Tổng quan |
| `/admin/content`, `/admin/library` | Chữ và ảnh của landing, đăng nhập, đăng ký; thư viện ảnh |
| `/admin/members`, `/admin/albums` | Thành viên, duyệt khách (`#requests`), mã mời (`#invites`); album |
| `/admin/lessons` | Soạn học liệu |
| `/admin/assistant` | Trợ lý AI: lời nhắc, câu gợi ý, ai được dùng, khách dùng chung API, kết nối API AI chung |
| `/admin/system` | Tên nhà, địa chỉ web, dung lượng, mã QR, chống bot (captcha, kiểm tra khi vào trang, thời hạn), nhật ký |

Quyền truy cập:
- **Các trang trong `(app)`:** cần đăng nhập. Chưa đăng nhập thì được chuyển về `/login`.
- **Khu quản trị, chưa đăng nhập:** chuyển về `/admin`.
- **Khu quản trị, đang đăng nhập bằng tài khoản khách hoặc người trong nhà:** báo lỗi "chỉ dành cho quản trị" và yêu cầu đăng xuất trước.
- **Tài khoản quản trị:** không đăng nhập được ở `/login`.

## Chống bot

Cả captcha và kiểm tra khi vào trang đều dùng Cloudflare Turnstile. Nếu chưa đặt `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, app ẩn widget và không gửi `captchaToken`. Hai phần:
- **Captcha:** ở đăng nhập, đăng ký và đăng nhập quản trị. Token được gửi lên backend trong trường `captchaToken`.
- **Kiểm tra khi vào trang:** người dùng mở trang nào thì kiểm tra ngay tại trang đó, nếu lần xác minh trước đã quá thời hạn. Admin đặt thời hạn (mặc định 20 phút) trong `/admin/system`.

Chi tiết cho backend: [docs/api/security.md](docs/api/security.md).

## Trợ lý AI và API AI

| Người dùng | Dùng API nào |
|---|---|
| Quản trị, người trong nhà | API AI chung của nhà, admin cấu hình ở `/admin/assistant` |
| Khách | Tự thêm API AI của mình ở `/settings#ai`. Admin có thể bật "Khách dùng chung API AI của nhà" |

Khoá API chỉ được gửi lên. Backend lưu mã hoá và chỉ trả về 4 ký tự cuối để hiển thị (ví dụ `....4f2c`). Chi tiết: [docs/api/ai.md](docs/api/ai.md).

## Cấu trúc thư mục

```
src/
  app/
    (auth)/        đăng nhập, đăng ký
    (app)/         các phòng trong nhà (TopBar + nút trợ lý AI)
    (admin)/       khu quản trị
    page.tsx       landing
  components/
    admin/ album/ ai/ auth/ brand/ chat/ learn/ settings/ shell/ ui/
  lib/
    api/           toàn bộ lớp dữ liệu (xem bên dưới)
    hooks/         useApi, useMediaQuery, useNow
    session.ts     người đang đăng nhập (chỉ để vẽ giao diện, không giữ token)
    theme.ts       sáng / tối / theo máy
docs/api/          hợp đồng API cho từng mảng
```

## Nối backend

1. Chép `.env.example` thành `.env.local`, rồi điền:
   ```
   NEXT_PUBLIC_API_URL=https://api.example.com
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
   ```
2. Mỗi mảng có một module trong `src/lib/api/`, mọi hàm đều gọi `http(...)` trong `core.ts`. Kiểu dữ liệu nằm trong các file `*-types.ts`.
3. Backend làm đúng hợp đồng là frontend chạy được, không phải sửa giao diện.

| Module | Hợp đồng |
|---|---|
| `client.ts` (`api`): đăng nhập, QR, tài khoản, cài đặt | [API_CONTRACT.md](API_CONTRACT.md) |
| `media.ts` (`mediaApi`): album, ảnh, tim, bình luận | [docs/api/media.md](docs/api/media.md) |
| `chat-ext.ts` (`chatExtApi`): chat, đính kèm, nhóm, gọi | [docs/api/chat.md](docs/api/chat.md) |
| `lessons.ts` (`lessonsApi`): mục lục, bài học, tìm kiếm | [docs/api/lessons.md](docs/api/lessons.md) |
| `practice.ts` (`practiceApi`): luyện tập, đề thi, sách | [docs/api/practice.md](docs/api/practice.md) |
| `site.ts` (`siteApi`): chữ và ảnh của trang công khai | [docs/api/site.md](docs/api/site.md) |
| `admin.ts` (`adminApi`): quản trị | [docs/api/admin.md](docs/api/admin.md) |
| `public-config.ts`: cấu hình công khai do admin đặt | `GET /config/public` |
| `security.ts` (`securityApi`): kiểm tra người thật | [docs/api/security.md](docs/api/security.md) |
| `ai.ts` (`aiApi`): API AI chung và riêng | [docs/api/ai.md](docs/api/ai.md) |

Quy ước chung:
- Xác thực bằng cookie httpOnly, frontend gửi `credentials: "include"`. Phản hồi `401` làm frontend đăng xuất phía giao diện.
- Lỗi trả về `{ "message": "..." }` bằng tiếng Việt. Frontend hiển thị nguyên văn câu này.
- Nội dung bài học tuân theo schema trong `src/lib/api/lesson-types.ts`. Công thức viết dạng TeX đặt giữa hai dấu `$`.

## Thiết kế

Hướng thiết kế tên là **"Sổ nhà"**: album ảnh bìa nhựa ghép với vở ô li.
- **Chế độ tối:** bìa album xanh than.
- **Chế độ sáng:** trang vở trắng.
- **Màu nhấn:** chỉ một màu, cam san hô, dùng cho nút chính, dấu tích kiểu cô chấm bài và dải ruy băng "đang ở đây".

Tài liệu và quy ước:
- [PRODUCT.md](PRODUCT.md): bối cảnh sản phẩm.
- [docs/FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md): token, thành phần dùng chung, quy tắc giao diện và cách thêm một mảng API.

Một số quy tắc chính:
- Chỉ dùng token màu, không hard-code màu.
- Giao diện sáng và tối đều phải đẹp.
- Không dùng em-dash trong chữ hiển thị.
- Mọi màn dữ liệu có đủ trạng thái đang tải, rỗng và lỗi.
- Icon chỉ lấy từ `@/components/ui/icons` (Morphicons + Lucide). Icon cần đổi hình theo trạng thái thì dùng `<Morph icon={...} />`.
- Hiệu ứng phải tôn trọng cài đặt `prefers-reduced-motion`.
