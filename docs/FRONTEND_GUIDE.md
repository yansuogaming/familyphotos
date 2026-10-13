# Hướng dẫn phát triển frontend (Family Photos)

Next.js 16.4 App Router, React 19, TypeScript, Tailwind v4. Đọc [PRODUCT.md](../PRODUCT.md) trước.

## Next.js 16 và `cacheComponents`

Next.js 16 khác các bản cũ. Trước khi dùng API lạ (params của route động, searchParams, Suspense...), đọc tài liệu đi kèm trong `node_modules/next/dist/docs/`. Dự án bật `cacheComponents: true`, nên:
- `useSearchParams()` và `usePathname()` trong route động phải nằm trong `<Suspense>`.
- Route động `[id]`: `page.tsx` là server component mỏng. Tham số đọc ở client bằng `useParams()` trong một Screen component có `"use client"`.
- Không fetch dữ liệu chưa cache trong server component. Không gọi `Date.now()` khi render phía client (dùng hook `useNow`).
- Layout không được bỏ render `children`. Muốn ẩn thì vẫn render, chỉ ẩn đi (xem `RequireSession`, `AdminGate`).

## Hướng thiết kế "Sổ nhà"

Album ảnh bìa nhựa ghép với vở ô li.
- **Tối:** bìa album xanh than.
- **Sáng:** trang vở trắng (không kem).
- **Màu nhấn:** chỉ một màu, cam san hô. Dùng cho nút chính, dấu tích kiểu cô chấm bài và ruy băng "đang ở đây".

Token Tailwind (định nghĩa trong `src/app/globals.css`):
- **Nền:** `bg-paper`, `bg-paper-2`, `bg-paper-3`, `bg-cover`, `bg-cover-2`.
- **Chữ:** `text-ink`, `text-ink-2`, `text-ink-3`, `text-on-cover`, `text-on-coral`.
- **Viền:** `border-line`, `border-rule`.
- **Màu nhấn:** `bg-coral`, `bg-coral-strong`, `text-coral-ink`, `bg-coral-wash`.
- **Trạng thái:** `text-ok`, `text-danger`, `bg-danger`.

Class dùng chung:
- `.oli`: nền ô li.
- `.oli-margin`: lề đỏ, cần `pl-20`. Trên điện thoại lề tự thu lại.
- `.memo-lines`, `.sleeve`, `.vinyl`, `.paper-shadow`, `.tabular`.

Font:
- `font-display` (Bricolage Grotesque): tiêu đề.
- `font-sans` (Be Vietnam Pro): chữ thường.
- `font-hand` (Patrick Hand): chỉ dùng cho ghi chú viết tay.

Hình dạng và chuyển động:
- Bo góc `rounded-[var(--radius-paper)]` (6px) cho giấy và khung, `rounded-full` cho nút.
- Easing `ease-[var(--ease-out-expo)]`.
- Ruy băng là phần tử `bg-coral` với `clip-path` có khía chữ V ở đáy (xem `TopBar.tsx`).

## Thành phần dùng chung

- `ui/Button`: `Button`, `ButtonLink`, `IconButton`, `buttonClass(variant, size, extra)`. `variant`: `primary`, `secondary`, `ghost`. `size`: `sm`, `md`, `lg`.
- `ui/Field`, `ui/Switch` (`SwitchRow`), `ui/Avatar`, `ui/ThemeToggle`, `ui/QrLogin`, `ui/Image` (bọc `next/image`, host lạ tự `unoptimized`).
- `ui/Toaster`: `notify` (Sonner). Trong trang cài đặt dùng `useToast()` từ `settings/shared`.
- `settings/shared`: `Section`, `Block`, `formatBytes`, `formatDateTime`.
- `album/PhotoSleeve`, `album/AlbumCover`, `album/PhotosScreen` (export `LoadError({ onRetry, what })`).
- `learn/Math` (`Math`, `RichText`: chữ có `$TeX$`), `learn/StudyModeTabs`, `learn/DailyTicks`, `learn/AreaIndex`.
- `security/Turnstile`: `Turnstile`, `useCaptcha`, `HumanCheck`.
- Hook trong `lib/hooks`:
  - `useApi(loadFn, deps)` trả `{ status: loading | error | ready, data, reload }`.
  - `useMediaQuery`, `useNow`.
- `lib/session`: `useSession`, `session.set`, `session.clear`, `session.updateUser`. Chỉ giữ thông tin người dùng để vẽ giao diện. Xác thực là cookie httpOnly của backend.
- `lib/theme`: sáng, tối, theo máy.

## Quy tắc giao diện

- **Chữ hiển thị:** tiếng Việt có dấu, câu ngắn, rõ, trẻ em đọc hiểu. Không dùng em-dash hay en-dash, dùng dấu chấm, phẩy hoặc gạch ngang thường (-).
- **Bố cục:**
  - Không eyebrow (nhãn nhỏ viết hoa phía trên tiêu đề).
  - Không đánh số section trừ khi thứ tự có ý nghĩa.
  - Không làm lưới thẻ giống hệt nhau (icon + tiêu đề + mô tả). Không lồng thẻ trong thẻ.
- **Trang trí:** không gradient text, không viền trái màu dày hơn 1px, không glow neon, không emoji.
- **URL:** mọi URL, tham số và mục neo bằng tiếng Anh.
- **Icon:** chỉ lấy từ `@/components/ui/icons`. Icon đổi theo trạng thái dùng `<Morph icon={cond ? icons.A : icons.B} />`.
- **Trạng thái dữ liệu:** mọi màn dữ liệu có đủ:
  - Đang tải: skeleton đúng hình.
  - Rỗng: hướng dẫn cách thêm.
  - Lỗi: `LoadError` kèm nút Tải lại.
- **Form:** label trên, lỗi dưới ô, kiểm tra trước khi gửi, có trạng thái đang gửi.
- **Màu:** chỉ dùng token, không hard-code màu (trừ bề mặt cố định như mã QR).
- **Truy cập:**
  - WCAG AA, mục bấm tối thiểu 40px, focus nhìn thấy được.
  - Dùng đúng aria (tablist, dialog, switch, menu...).
  - Dialog đóng bằng Esc và trả focus khi đóng.
- **Chuyển động:**
  - Dùng `motion/react`, ease-out, không bounce, tôn trọng `useReducedMotion`.
  - Không dùng `window.addEventListener("scroll")`, dùng IntersectionObserver.
- **React 19:** lint `react-hooks/set-state-in-effect` không cho gọi setState đồng bộ trong `useEffect`. Thay vào đó dùng state dẫn xuất, `useSyncExternalStore`, hoặc setState trong callback của promise hay sự kiện.
- **Responsive:**
  - Mỗi bố cục nhiều cột phải có phương án dưới 768px.
  - Trên điện thoại có thanh tab dưới cùng cao 64px (`main` có `pb-20`).

## Thêm một mảng API

1. Tạo `src/lib/api/<ten>.ts` export `<ten>Api`. Đặt kiểu dữ liệu ở `src/lib/api/<ten>-types.ts`.
2. Mọi hàm gọi `http<T>(path, init)` trong `core.ts`. Hàm này:
   - Gửi cookie (`credentials: "include"`).
   - Ném `ApiError(status, message)` khi lỗi.
   - Phát sự kiện đăng xuất khi gặp `401`.
3. Ghi endpoint vào `docs/api/<ten>.md` bằng tiếng Việt, theo bảng `Method | Path | Body | Trả về` như `API_CONTRACT.md`.
4. Frontend không tự suy quyền. Hiển thị theo các trường quyền mà backend trả về (ví dụ `canUpload`, `canManage`).

## Kiểm tra trước khi gộp

```bash
npx tsc --noEmit
npm run lint
npm run build
```
