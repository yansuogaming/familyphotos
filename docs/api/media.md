# API Ảnh (album, ảnh, tim, bình luận, tải lên, chia sẻ)

Frontend gọi qua `src/lib/api/media.ts` (`mediaApi`). Kiểu dữ liệu: `src/lib/api/media-types.ts` và `Album`, `Photo` trong `src/lib/api/types.ts`.

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

`url` do backend tạo. Trang công khai cho khách mở đường dẫn này chưa có ở frontend, cần bàn thêm.

## Kỷ niệm

| Method | Path | Trả về |
|---|---|---|
| GET | `/memories/on-this-day?date=YYYY-MM-DD` | `Memory[] { yearsAgo, date, album: { id, title }, photos }`: ảnh chụp cùng ngày, cùng tháng ở các năm trước, tối đa 6 ảnh mỗi nhóm, năm gần nhất trước. Mảng rỗng thì frontend ẩn mục |

## Phân quyền ảnh (bắt buộc kiểm tra ở backend)

Mỗi album có `space`:
- `family`: album của nhà.
- `guest`: album một khách tự tạo để cất ảnh của mình.

| Người xem | Album `family` | Album `guest` của chính mình | Album `guest` của người khác |
|---|---|---|---|
| Người trong nhà, quản trị | Xem, thêm, quản lý, chia sẻ | (không có) | Chỉ xem, hiện ở mục riêng "Ảnh khách gửi" |
| Khách | Không thấy. Chỉ xem được album nhà đã chia sẻ cho đúng khách đó (`sharedWithMe: true`) | Xem, thêm, quản lý (không chia sẻ) | Không thấy |

Quy tắc:
- **Danh sách album:** `GET /albums` chỉ trả album người xem được phép thấy. Mỗi album kèm quyền của người xem: `space`, `owner?`, `sharedWithMe?`, `canUpload`, `canManage`, `canShare`, `loose?`. Frontend chỉ hiển thị theo các trường này, không tự suy quyền theo vai trò.
- **Album không được phép xem:** trả `404`, không trả `403`, để khách không biết album đó có tồn tại. Áp dụng cho `/albums/:id`, `/albums/:id/photos` và các endpoint `/photos/:id/*` của ảnh nằm trong album đó.
- **Mục "Mới thêm vào" (`GET /photos?sort=recent`) và "Ngày này năm xưa":** người trong nhà chỉ thấy ảnh trong album `family`. Khách thấy ảnh của chính mình và ảnh trong album được chia sẻ cho mình.
- **Thêm ảnh:** cần `canUpload`, nếu không thì trả `403`.
- **Ghi chú, xoá, chuyển ảnh:** cần `canManage`, nếu không thì trả `403`. Chỉ chuyển ảnh giữa hai album cùng `space`.
- **Tạo album:** `POST /albums` từ khách tạo album `guest` do khách đó làm chủ. Từ người trong nhà thì tạo album `family`.
- **Chia sẻ:** cần `canShare`. Chia sẻ cho từng khách theo tên: `PUT /albums/:id/share` nhận thêm `guestIds: string[]`.

### Ảnh lẻ (không thuộc album nào)

- **Tải lên:** `POST /photos` (multipart, trường `file`, không có `albumId`).
- **Album hệ thống:** ảnh lẻ của mỗi người nằm trong một album hệ thống `loose: true`, tên "Ảnh lẻ của <tên>". `space` của album này theo vai trò người tải lên: khách thì `guest`, người trong nhà thì `family`.
- **Khi chưa có ảnh:** không trả album này trong `GET /albums`.
