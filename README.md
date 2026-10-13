# Family Photos (frontend)

Web riêng của một gia đình: kho ảnh, chat trong nhà, góc học tập cho các con (lớp 1 đến 12), trợ lý AI và khu quản trị.

Repo này **chỉ có frontend**. Tất cả dữ liệu đi qua `src/lib/api/`. Nếu chưa đặt `NEXT_PUBLIC_API_URL`, app tự dùng dữ liệu mock nên chạy được ngay, chưa cần backend.

## Chạy dự án

Cần Node.js 20 trở lên.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy chế độ phát triển |
| `npm run build` | Build production (có kiểm tra TypeScript) |
| `npm start` | Chạy bản build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Kiểm tra kiểu |

### Tài khoản demo (chỉ dùng với mock)

Có 3 tài khoản demo: người trong nhà, khách và quản trị (vào được `/quan-tri`). Email và mật khẩu nằm trong file `DEMO_ACCOUNTS.txt`. File này không được đưa lên git, hãy xin từ người quản lý dự án.

Tài khoản demo không được hiện trên giao diện. Muốn thử đăng nhập bằng QR khi chưa có app điện thoại: mở tab "Mã QR", bấm "Demo: giả lập điện thoại quét".

Bản demo lưu các thay đổi trong `localStorage` của trình duyệt (khoá bắt đầu bằng `fp-mock:`). Muốn quay về dữ liệu gốc thì xoá các khoá này, hoặc bấm "Khôi phục mặc định" trong trang quản trị.

## Công nghệ

- Next.js 16.4 (App Router, `cacheComponents`), React 19, TypeScript
- Tailwind CSS v4, token màu OKLCH trong `src/app/globals.css`
- `motion` (hiệu ứng), `@phosphor-icons/react` (icon), `katex` (công thức toán), `qrcode.react` (mã QR)
- Font qua `next/font`: Bricolage Grotesque, Be Vietnam Pro, Patrick Hand (cả ba có đủ dấu tiếng Việt)

> Next.js 16 khác nhiều so với các bản cũ. Trước khi dùng API lạ, đọc tài liệu đi kèm trong `node_modules/next/dist/docs/` (xem `AGENTS.md`).

## Các trang

| Route | Nội dung |
|---|---|
| `/` | Landing: album mở, đăng nhập QR ngay tại trang, giới thiệu các phòng |
| `/dang-nhap`, `/dang-ky` | Đăng nhập (QR hoặc mật khẩu), đăng ký (người trong nhà cần mã mời, khách chờ duyệt) |
| `/anh`, `/anh/[id]` | Kệ album, ảnh mới, "Ngày này năm xưa", chi tiết album, xem ảnh lớn, tải ảnh lên |
| `/chat` | Chat 1-1 và nhóm: ảnh, tệp, vị trí, emoji, trả lời, cảm xúc, gọi video |
| `/hoc` | Mục tiêu hằng ngày, chuỗi ngày học, bài đang học dở, mục lục |
| `/hoc/ly-thuyet` | Đọc bài: mục lục và "Trong bài này" ẩn/hiện được, toàn màn hình, video, công thức, tự kiểm |
| `/hoc/luyen-tap`, `/hoc/on-tap` | Luyện tập có chấm điểm, ôn câu sai |
| `/hoc/giai-bai-tap` | Lời giải SGK theo bộ sách, xem từng bước |
| `/hoc/toan`, `/hoc/de-thi`, `/hoc/sach` | Dạng bài Toán, thư viện đề (làm bài có giờ), kệ sách và trình đọc |
| `/hoc/tien-ich` | Máy tính, giải phương trình, bảng công thức, đồng hồ học, đổi đơn vị |
| `/tro-ly` | Trợ lý AI toàn trang (nút nổi góc phải có ở mọi trang trong app) |
| `/cai-dat` | Hồ sơ, bảo mật, thiết bị, tài khoản AI, dung lượng, riêng tư, giao diện, thông báo |
| `/quan-tri/*` | Chỉ vai trò `admin`: tổng quan, nội dung trang (đổi ảnh và chữ ở landing, đăng nhập, đăng ký), thư viện ảnh, thành viên và mã mời, album, học liệu (soạn bài), trợ lý AI, cài đặt hệ thống |

Các trang trong `(app)` và `(admin)` yêu cầu đăng nhập. Chưa đăng nhập thì được chuyển về `/dang-nhap`.

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
    session.ts     phiên đăng nhập phía client
    theme.ts       sáng / tối / theo máy
docs/api/          hợp đồng API cho từng mảng
```

## Nối backend

1. Đặt URL backend trong `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://api.example.com
   ```
2. Mỗi mảng có một module trong `src/lib/api/`. Trong mỗi hàm: nếu có `BASE` thì gọi `http(...)`, nếu không thì trả mock. Kiểu dữ liệu nằm trong các file `*-types.ts`.
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

Quy ước chung:
- Xác thực bằng cookie httpOnly, frontend gửi `credentials: "include"`.
- Lỗi trả về `{ "message": "..." }` bằng tiếng Việt. Frontend hiển thị nguyên văn câu này.
- Nội dung bài học tuân theo schema trong `src/lib/api/lesson-types.ts`. Công thức viết dạng TeX đặt giữa hai dấu `$`.

## Thiết kế

Hướng thiết kế tên là **"Sổ nhà"**: album ảnh bìa nhựa ghép với vở ô li.
- **Chế độ tối:** bìa album xanh than.
- **Chế độ sáng:** trang vở trắng.
- **Màu nhấn:** chỉ một màu, cam san hô, dùng cho nút chính, dấu tích kiểu cô chấm bài và dải ruy băng "đang ở đây".

Tài liệu và quy ước:
- [PRODUCT.md](PRODUCT.md): bối cảnh sản phẩm.
- [PLAN.md](PLAN.md): kế hoạch.
- [docs/AGENT_BRIEF.md](docs/AGENT_BRIEF.md): token, thành phần dùng chung và các quy tắc giao diện.

Project có cài sẵn hai bộ skill thiết kế cho Claude Code: [impeccable](https://github.com/pbakaus/impeccable) (`.claude/skills/impeccable`, kèm hook tự quét lỗi thiết kế khi sửa file) và [taste-skill](https://www.tasteskill.dev/) (`.agents/skills/design-taste-frontend`). Kiểm tra thủ công bằng lệnh:

```bash
.claude/skills/impeccable/scripts/impeccable detect src
```

Một số quy tắc chính:
- Chỉ dùng token màu, không hard-code màu.
- Giao diện sáng và tối đều phải đẹp.
- Không dùng em-dash trong chữ hiển thị.
- Mọi màn dữ liệu có đủ trạng thái đang tải, rỗng và lỗi.
- Icon chỉ lấy từ Phosphor.
- Hiệu ứng phải tôn trọng cài đặt `prefers-reduced-motion`.
