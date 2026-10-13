# API Ảnh (album, ảnh, tim, bình luận, tải lên, chia sẻ)

Frontend gọi qua `src/lib/api/media.ts` (`mediaApi`). Kiểu dữ liệu: `src/lib/api/media-types.ts` và `Album`, `Photo` trong `src/lib/api/types.ts`. Khi chưa đặt `NEXT_PUBLIC_API_URL`, dữ liệu mẫu nằm ở `src/lib/api/media-mock.ts` (thay đổi lưu trong localStorage, khoá `fp-mock:media:*`).

Quy ước chung giống `API_CONTRACT.md`: JSON, ngày ISO 8601, cookie httpOnly, lỗi trả `{ message }` tiếng Việt. Khách (`role: "guest"`) chỉ được đọc; mọi thao tác ghi trả `403`.

## Album

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/albums` | | `Album[]`, mới nhất trước. `photoCount` là số ảnh hiện có |
| GET | `/albums/:id` | | `AlbumDetail` (thêm `description?`, `createdBy`, `contributors` xếp theo số ảnh góp, `share`). Không có thì `404` |
| POST | `/albums` | multipart: `title`, `takenFrom`, `takenTo`, `cover?` (tệp ảnh) | `Album` |
| GET | `/albums/:id/photos?limit=36&cursor=` | | `PhotoPage { items, nextCursor, total }`. Cũ đến mới theo `takenAt`. `nextCursor: null` là hết |
| POST | `/albums/:id/photos` | multipart: `file` (một ảnh mỗi lần) | `Photo`. Frontend dùng XHR để hiện tiến trình, huỷ được giữa chừng |

Giới hạn tải lên phía frontend: JPG, PNG, WEBP, GIF, HEIC/HEIF, tối đa 25 MB mỗi ảnh (`UPLOAD_LIMIT_BYTES`). Backend nên kiểm tra lại và trả `413` hoặc `415` kèm `message`.

## Ảnh

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/photos?sort=recent` | | `Photo[]`, ảnh mới thêm |
| PATCH | `/photos/:id` | `{ memo }` (chuỗi rỗng là xoá ghi chú, tối đa 80 ký tự) | `Photo` |
| POST | `/photos/delete` | `{ ids: string[] }` | `204` |
| POST | `/photos/move` | `{ ids: string[], albumId }` | `204` |
| POST | `/photos/download` | `{ ids: string[] }` | `{ url, fileName }`: đường dẫn tệp nén, sống ngắn. Frontend chuyển trang tới `url` |
| GET | `/photos/:id/original` | | Tệp gốc (header `Content-Disposition: attachment`) |

## Tim và bình luận

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/photos/:id/social` | | `PhotoSocial { photoId, likeCount, likedByMe, likedBy, comments }` |
| PUT | `/photos/:id/like` | | `PhotoSocial` (đã thả tim) |
| DELETE | `/photos/:id/like` | | `PhotoSocial` (đã bỏ tim) |
| POST | `/photos/:id/comments` | `{ text }` (tối đa 300 ký tự) | `PhotoComment` |

## Chia sẻ album cho khách

| Method | Path | Body | Trả về |
|---|---|---|---|
| PUT | `/albums/:id/share` | `ShareInput { expiresInDays: 7 \| 30 \| null, allowDownload }` | `AlbumShare { url, createdAt, expiresAt, allowDownload }`. Gọi lại thì giữ `url`, đổi tuỳ chọn |
| DELETE | `/albums/:id/share` | | `204`, đường dẫn cũ hết hiệu lực |

`url` do backend tạo (mock đang dùng dạng `/khach/album/<id>-<mã>`). Trang công khai cho khách mở đường dẫn này chưa có ở frontend, cần bàn thêm.

## Kỷ niệm

| Method | Path | Trả về |
|---|---|---|
| GET | `/memories/on-this-day?date=YYYY-MM-DD` | `Memory[] { yearsAgo, date, album: { id, title }, photos }`: ảnh chụp cùng ngày, cùng tháng ở các năm trước, tối đa 6 ảnh mỗi nhóm, năm gần nhất trước. Mảng rỗng thì frontend ẩn mục |
