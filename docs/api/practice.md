# API Luyện tập, Giải bài tập, Đề thi, Sách, Tiện ích

Kiểu dữ liệu: `src/lib/api/practice-types.ts` (dựa trên `QuizQuestion`, `Subject`, `Video` trong `lesson-types.ts`). Hàm gọi: `practiceApi` trong `src/lib/api/practice.ts`. Dữ liệu mẫu: `src/lib/api/practice-mock.ts`. Quy ước chung (cookie, lỗi `{ message }`) như `API_CONTRACT.md`.

Chữ đánh dấu "rich" có thể chứa công thức TeX giữa hai dấu `$...$`.

## Câu hỏi luyện tập

`PracticeQuestion` có 3 loại, phân biệt bằng `type`:

| type | Trường riêng | Cách chấm |
|---|---|---|
| `choice` | `choices[]`, `answerIndex` (giống `QuizQuestion`) | đúng khi chọn `answerIndex` |
| `number` | `answer: number`, `tolerance?`, `unit?` | đúng khi `abs(giá trị - answer) <= tolerance` (mặc định 0). Frontend nhận "0,5", "-1", "1/2" |
| `truefalse` | `answer: boolean` | đúng khi khớp |

Mọi loại có `id`, `prompt` (rich), `steps?: string[]` (lời giải từng bước, rich), `hint?`, `explanation?`.

Câu hỏi luyện tập gửi kèm đáp án để chấm ngay trên máy (đây là chế độ tự học). Riêng đề thi có thể bỏ đáp án khỏi `GET /exams/:id` khi đang làm và chỉ trả sau khi nộp (frontend chấm bằng `isCorrect` nên nếu ẩn đáp án thì cần trả thêm `ExamResult.answers` để hiện đáp án; xem ghi chú cuối).

## Luyện tập và ôn câu sai

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/practice/catalog` | | `PracticeCatalogEntry[]`: lớp, môn, chủ đề, các bài có câu luyện (`questionCount`, `best` là điểm cao nhất trên 10) |
| GET | `/practice/sets/:id` | | `PracticeSet`. `id` trùng id bài học, ví dụ `toan-9-c1-b1`. `404` khi bài chưa có câu luyện |
| GET | `/practice/today` | | `PracticeToday { goal, done, streakDays }`. Dùng chung với ô "Mục tiêu hôm nay" ở /learn |
| POST | `/practice/answers` | `AnswerRecord { setId, questionId, correct, skipped?, mode? }` | `PracticeToday` mới. Sai thì thêm vào danh sách câu sai (tăng `wrongCount`). `mode: "review"` và đúng thì xoá khỏi danh sách |
| POST | `/practice/attempts` | `FinishRecord { setId, correct, total, wrongIds }` | `PracticeAttempt` (backend tính `score` = correct / total x 10, 1 chữ số thập phân) |
| GET | `/practice/attempts?set=:id` | | `PracticeAttempt[]`, mới nhất trước |
| GET | `/practice/mistakes` | | `Mistake[]`: câu sai chưa sửa, kèm bản sao câu hỏi, mới nhất trước |
| DELETE | `/practice/mistakes/:questionId` | | `204`. Người học tự bỏ câu khỏi danh sách |
| GET | `/practice/math/:grade` | | `MathChapter[]`: chương, dạng bài (`setId` null là đang soạn), `questionCount`, `mastered` (số câu đã từng làm đúng) |

## Giải bài tập SGK

`series`: `ket-noi` (Kết nối tri thức), `chan-troi` (Chân trời sáng tạo), `canh-dieu` (Cánh diều). `subject` là id môn (`toan`, `ngu-van`...).

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/solutions/lessons?grade=&subject=&series=` | | `SolutionLesson[] { id, title, pages: [từ, đến] }` |
| GET | `/solutions/exercises?grade=&subject=&series=&lesson=&page=` | | `ExerciseSummary[]` (lọc theo bài và trang SGK, đều không bắt buộc) |
| GET | `/solutions/exercises/:id` | | `ExerciseDetail`: đề (`problem`, rich, xuống dòng bằng `\n`), `steps: SolutionStep[] { title?, text, math? }`, `answer`, `video?` |

## Đề thi

`kind`: `giua-ky`, `cuoi-ky`, `vao-10`, `thpt`. `year` là năm bắt đầu năm học (giữa kỳ, cuối kỳ) hoặc năm thi (vào 10, THPT).

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/exams` | | `ExamSummary[]` (có `best` nếu người học đã làm). Frontend tự lọc theo lớp, môn, loại, năm. Khi thư viện lớn, thêm query `grade, subject, kind, year, page` |
| GET | `/exams/:id` | | `ExamDetail { ...ExamSummary, parts: ExamPart[] }`. Đề chỉ có PDF thì `online: false` và `parts: []` |
| POST | `/exams/:id/submissions` | `ExamSubmission { examId, answers: { [questionId]: number \| string \| boolean }, usedSec }` | `ExamResult { score, correct, total, usedSec, submittedAt }`. Điểm = tổng `pointsEach` các câu đúng, quy về thang 10 |

`pdfUrl` là link tải đề (mock dùng một file PDF mẫu).

## Sách

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/books` | | `BookSummary[]` (`kind`: `sgk` hoặc `doc-them`, `coverUrl`, `pageCount`) |
| GET | `/books/:id` | | `BookDetail`: `chapters[] { title, page }`, `pageUrlTemplate` (thay `{page}` bằng số trang, bắt đầu từ 1), `pageWidth`, `pageHeight` |
| GET | `/books/:id/bookmarks` | | `number[]` các trang đã đánh dấu, tăng dần |
| PUT | `/books/:id/bookmarks/:page` | | `number[]` sau khi bật hoặc tắt dấu trang đó |

## Tiện ích

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/formulas` | | `Formula[] { id, grade, subject, group, name, tex, note? }` cho bảng công thức |

Máy tính, giải phương trình, đồng hồ học và đổi đơn vị chạy hoàn toàn trên trình duyệt, không cần API.

## Ghi chú cho backend

- Nếu muốn giấu đáp án đề thi khi đang làm: trả `ExamDetail` không có `answerIndex` / `answer`, rồi trong `ExamResult` thêm `key: Record<questionId, AnswerValue>` và `explanations`. Báo frontend để đổi phần chấm sang dùng `key`.
- Mock lưu kết quả bằng `localStorage` (khoá `fp-mock:practice:*`), nên tải lại trang vẫn giữ câu sai, điểm, dấu trang.
