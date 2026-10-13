# API nội dung trang công khai (site)

Chữ và ảnh của trang chủ (`/`), trang đăng nhập (`/login`) và trang đăng ký (`/register`). Quản trị viên sửa ở `/admin/content`.

Kiểu dữ liệu: `src/lib/api/site-types.ts` (`SiteContent`, `SiteImage`, `SiteAlbumPhoto`, `SiteSection`). Frontend gọi qua `siteApi` trong `src/lib/api/site.ts`. Nội dung mặc định (giống hệt bản đang chạy) nằm ở `src/lib/api/site-defaults.ts` (`defaultSite`), backend nên dùng đúng bản này làm dữ liệu khởi tạo.

## Quyền

- `GET /site`: công khai, không cần đăng nhập (trang chủ và trang đăng nhập đọc nó).
- `PUT /site`, `POST /site/reset`: chỉ role `admin`. Chưa đăng nhập trả `401`, không phải admin trả `403` kèm `{ "message": "Chỉ quản trị viên được làm việc này." }`.

## Endpoint

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/site` | | `SiteContent` |
| PUT | `/site` | `SiteContent` (toàn bộ, không phải patch) | `SiteContent` đã lưu, có `updatedAt` (ISO) và `updatedBy` (tên người sửa) |
| POST | `/site/reset` | | `SiteContent` mặc định |

## Ràng buộc backend nên kiểm tra

- `landing.album` đúng 4 phần tử, `login.coverPhotos` đúng 3, `landing.privacy.points` đúng 3.
- Chữ không rỗng. Tiêu đề tối đa 90 ký tự, đoạn văn tối đa 280, ghi chú ảnh và tiêu đề ngắn tối đa 40. `landing.heroHighlight` rỗng hoặc nằm nguyên văn trong `landing.heroTitle`. Sai thì trả `400` kèm `message`.
- `url` của ảnh là URL ảnh trong thư viện (`POST /admin/media`, xem `docs/api/admin.md`); `mediaId` là id của ảnh đó, để thư viện biết ảnh đang được dùng ở đâu. Không nhận data URL ở bản thật.
- Ghi một dòng vào nhật ký thay đổi (`/admin/audit`) mỗi lần lưu hoặc khôi phục.
- Nên cho phép CDN cache `GET /site` ngắn (ví dụ 60 giây) và xoá cache khi lưu.

## Cách frontend hiển thị

Server render luôn dùng `defaultSite` để trang tĩnh không đổi bố cục. Ở trình duyệt, `useSiteContent()` gọi `GET /site` một lần rồi thay bằng nội dung đã lưu. Lưu ở trang quản trị thì các trang công khai đang mở trong cùng tab đổi theo ngay.
