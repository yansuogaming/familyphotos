# API bài học (Lý thuyết)

Module frontend: `src/lib/api/lessons.ts` (export `lessonsApi`). Kiểu dữ liệu: `src/lib/api/lesson-types.ts`. Mock: `src/lib/api/lessons-mock.ts`.
Dùng ở: trang đọc `/learn/theory`, trang luyện tập `/learn/practice`, trang soạn bài `/admin/lessons`.

Quy ước chung như `API_CONTRACT.md`: JSON UTF-8, cookie httpOnly, lỗi trả `{ "message": "..." }`.

## Đọc

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/learning/grades/:grade/subjects` | | `Subject[]`, các môn của lớp (1-12), theo thứ tự hiển thị |
| GET | `/learning/grades/:grade/subjects/:subjectId/outline` | | `SubjectOutline`: chủ đề, các bài trong chủ đề, `generalVideos` (Video bài giảng chung). Môn chưa có bài: `topics: []` (không trả 404) |
| GET | `/learning/lessons/:id` | | `LessonDetail`. Không có bài: `404` |
| GET | `/learning/search?q=&grade=` | | `LessonSearchHit[]` (tối đa 20). `grade` không bắt buộc: bỏ trống là tìm mọi lớp |

`LessonSearchHit = { lessonId, title, subjectName, grade, snippet }`. Frontend dựa vào `snippet` để chọn biểu tượng:
- Khớp tên chủ đề: `snippet = "Chủ đề 3. Căn bậc hai và căn bậc ba"`, `lessonId` là bài đầu của chủ đề.
- Khớp tên bài: `snippet = "Chủ đề 1, Bài 2"`.
- Khớp nội dung: `snippet` là đoạn chữ quanh chỗ khớp (khoảng 110 ký tự, có thể chứa `$TeX$`, không cắt giữa công thức).

Tìm không phân biệt hoa thường. Gõ không dấu ("phuong trinh") thì tìm cả chữ có dấu; gõ có dấu thì khớp đúng dấu.

## Soạn bài (chỉ quản trị)

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/learning/lessons` | `{ grade, subjectId, topicId, title }` | `LessonDetail` mới (nội dung rỗng), đã gắn vào cuối chủ đề |
| PUT | `/learning/lessons/:id` | `LessonDetail` | `LessonDetail` đã lưu, `updatedAt` mới |
| DELETE | `/learning/lessons/:id` | | `204`. Các bài còn lại trong chủ đề được đánh lại `index` |
| PUT | `/learning/grades/:grade/subjects/:subjectId/outline` | `SubjectOutline` | `SubjectOutline` đã lưu. Thứ tự mảng là thứ tự hiển thị; backend đánh lại `index` từ 1 |

## Ghi chú cho backend

- `LessonDetail.topic`, `index`, `lessonCount`, `prev`, `next` do backend tính từ outline (bài trước/sau có thể ở chủ đề kề bên).
- `id` bài nên ổn định vì nằm trên URL: `/learn/theory?grade=9&subject=toan&lesson=toan-9-c1-b1` và `/learn/practice?lesson=toan-9-c1-b1`.
- Trang đọc còn nhận `?grade=5&subject=tieng-viet&topic=2` (mở bài đầu của chủ đề thứ 2), dùng cho "Đang học dở" ở `/learn`.
- `subjectId` là slug không dấu của tên môn (`toan`, `tieng-viet`, `khoa-hoc-tu-nhien`...).
- Chữ có thể chứa công thức giữa hai dấu `$` (xem chú thích "rich" trong `lesson-types.ts`). Khối `math` là công thức đứng riêng một dòng, không có `$`.
- `Video.url` phải nhúng được trong `<iframe>` (ví dụ `https://www.youtube.com/embed/<id>`). Frontend tự thêm `autoplay=1&rel=0`.
- `Video.thumbnailUrl` và ảnh trong khối `image`: nên dùng host của backend; nhớ thêm host vào `images.remotePatterns` trong `next.config.ts`.
- Bài có `sections: []` hiện trạng thái "Bài này đang được soạn".
- Mock lưu thay đổi trong localStorage (`fp-mock:lessons`, `fp-mock:outlines`) nên chỉnh ở trang quản trị hiện ngay trên trang đọc.
