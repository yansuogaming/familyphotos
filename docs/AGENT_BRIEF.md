# Brief chung cho mọi agent (Family Photos frontend)

Project: D:\Codeweb\frontend-familyphoto. Next.js 16.4 App Router + React 19 + TypeScript + Tailwind v4. Đọc PRODUCT.md và PLAN.md trước. Đây KHÔNG phải Next.js bạn quen: trước khi dùng API lạ (dynamic route params, searchParams, Suspense...) đọc `node_modules/next/dist/docs/`. `cacheComponents: true` đang bật:
- `useSearchParams()` phải nằm trong `<Suspense>`.
- Route động `[id]`: page.tsx là server component mỏng, đọc tham số ở client bằng `useParams()` trong một Screen component "use client"; hoặc làm route tĩnh. Không fetch dữ liệu chưa cache trong server component.
- Layout không được bỏ render `children` (lỗi "segment dropped from rendering").

## Hướng thiết kế "Sổ nhà" (bắt buộc giữ)
Album ảnh bìa nhựa + vở ô li. Tối = bìa album xanh than, Sáng = trang vở trắng (không kem). Một màu nhấn duy nhất: cam san hô (nút chính, dấu tích đỏ kiểu cô chấm bài, ruy băng "đang ở đây").
Token Tailwind (định nghĩa trong src/app/globals.css, KHÔNG sửa file đó): bg-paper / bg-paper-2 / bg-paper-3, text-ink / text-ink-2 / text-ink-3, border-line, border-rule, bg-coral, bg-coral-strong, text-coral-ink, bg-coral-wash, text-on-coral, bg-cover / bg-cover-2, text-on-cover, text-ok, text-danger/bg-danger. Class: `.oli` (nền ô li), `.oli-margin` (lề đỏ, cần pl-20), `.memo-lines`, `.sleeve`, `.vinyl`, `.paper-shadow`, `.tabular`. Font: font-display (Bricolage Grotesque, tiêu đề), font-sans (Be Vietnam Pro), font-hand (Patrick Hand, CHỈ cho ghi chú viết tay). Bo góc: rounded-[var(--radius-paper)] (6px) cho giấy/khung; rounded-full cho nút. Easing: ease-[var(--ease-out-expo)]. Ruy băng: phần tử bg-coral với clip-path polygon có khía chữ V ở đáy (xem TopBar.tsx, SettingsScreen.tsx).

## Thành phần có sẵn (dùng lại, KHÔNG sửa; cần thay đổi thì ghi trong báo cáo)
- ui/Button: Button, ButtonLink, IconButton, buttonClass(variant, size, extra). variant primary|secondary|ghost, size sm|md|lg.
- ui/Field (label trên, hint/error dưới), ui/Switch (SwitchRow), ui/Avatar, ui/ThemeToggle, ui/QrLogin.
- settings/shared: Section, Block, ToastProvider + useToast, formatBytes, formatDateTime.
- album/PhotoSleeve, album/AlbumCover, album/PhotosScreen (export LoadError({onRetry, what})).
- learn/Math (Math, RichText: text có $TeX$ inline), learn/StudyModeTabs, learn/DailyTicks, learn/AreaIndex.
- lib/hooks/useApi(loadFn, deps) -> {status: loading|error|ready, data, reload}; lib/hooks/useMediaQuery; lib/session (useSession, session.set/clear/updateUser); lib/theme.
- lib/api/core: BASE, isMock, http, fake, wait, persisted(key, initial) (store localStorage cho mock), ApiError.
- lib/api/lesson-types.ts: schema bài học dùng chung (Subject, SubjectOutline, TopicSummary, LessonSummary, LessonDetail, LessonSection, LessonBlock, QuizQuestion, Video). KHÔNG đổi schema; cần thêm trường thì đề xuất trong báo cáo.

## Quy tắc (taste-skill + impeccable, đã cài ở .claude/skills)
- Chữ hiển thị tiếng Việt có dấu, câu ngắn, rõ, trẻ em đọc hiểu. TUYỆT ĐỐI không dùng em-dash (—) hay en-dash (–) trong chữ hiển thị; dùng dấu chấm, phẩy, gạch ngang thường (-).
- Không eyebrow (nhãn nhỏ viết hoa phía trên tiêu đề). Không đánh số section trừ khi thứ tự có ý nghĩa. Không lưới thẻ giống hệt nhau (icon + tiêu đề + mô tả). Không thẻ lồng thẻ. Không gradient text, không viền trái màu dày hơn 1px, không glow neon, không emoji, không icon tự vẽ. Mọi URL, tham số và mục neo bằng tiếng Anh.
- Icon: chỉ từ `@/components/ui/icons` (Morphicons vẽ icon Lucide). Icon đổi theo trạng thái dùng `<Morph icon={cond ? icons.A : icons.B} />` để có hiệu ứng biến hình.
- Mọi màn dữ liệu có đủ: loading (skeleton đúng hình), rỗng (hướng dẫn cách thêm), lỗi (LoadError + Tải lại). Form: label trên, lỗi dưới ô, kiểm tra trước khi gửi, trạng thái đang gửi.
- Sáng và tối đều phải đẹp: chỉ dùng token, không hard-code màu (trừ bề mặt cố định như mã QR).
- WCAG AA, mục bấm >= 40px, focus nhìn thấy được, aria đúng (tablist, dialog, switch, menu...). Dialog: đóng bằng Esc, bẫy focus hợp lý, trả focus.
- Chuyển động: chỉ `motion/react`, ease out mũ, không bounce, tôn trọng `useReducedMotion`. Không `window.addEventListener("scroll")` (dùng IntersectionObserver).
- React 19 lint `react-hooks/set-state-in-effect`: không gọi setState đồng bộ trong useEffect. Dùng state dẫn xuất, useSyncExternalStore, hoặc setState trong callback của promise/sự kiện.
- Responsive: mỗi bố cục nhiều cột phải có phương án < 768px rõ ràng. Trên điện thoại có thanh tab dưới cùng cao 64px (main có pb-20).

## Dữ liệu và bàn giao backend
- Tạo module riêng: `src/lib/api/<ten>.ts` export `<ten>Api`, kiểu ở `src/lib/api/<ten>-types.ts`, mock ở `src/lib/api/<ten>-mock.ts`. Mỗi hàm: `if (BASE) return http(...)`, ngược lại trả mock bằng `fake(...)` (dùng `persisted` nếu cần thay đổi được giữ lại sau khi tải lại).
- Ghi endpoint vào `docs/api/<ten>.md` (tiếng Việt, bảng Method | Path | Body | Trả về, như API_CONTRACT.md).
- KHÔNG sửa: src/lib/api/client.ts, types.ts, mock-data.ts, core.ts, lesson-types.ts, API_CONTRACT.md, globals.css, src/app/layout.tsx, src/app/(app)/layout.tsx, và file thuộc agent khác. Cần sửa thì mô tả trong báo cáo, lead sẽ tích hợp.
- Dữ liệu demo: tên người Việt hư cấu, số liệu tự nhiên (không 99.99%), ảnh `https://picsum.photos/seed/fp-<chuoi>/<w>/<h>` (đã cho phép trong next.config).

## Kiểm tra trước khi báo xong
- `npx tsc --noEmit` và `npx eslint <các thư mục của bạn>` phải sạch.
- Quét gạch dài: `node -e "const fs=require('fs'),p=require('path');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(p.join(d,e.name)):[p.join(d,e.name)]);for(const f of w('src'))fs.readFileSync(f,'utf8').split('\n').forEach((l,i)=>/[–—]/.test(l)&&console.log(f+':'+(i+1)))"`
- KHÔNG chạy `next build`, `next dev`, `next start` (các agent khác đang làm cùng thư mục; lead sẽ build và chụp màn hình). Hook thiết kế của impeccable tự chạy khi bạn sửa file: xử lý cảnh báo nó đưa ra.
- Báo cáo cuối (ngắn): file đã tạo/sửa, route mới, endpoint mới, việc lead cần tích hợp, phần còn thiếu.
