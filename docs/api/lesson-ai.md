# API soạn học liệu bằng AI

Module frontend: `src/lib/api/lesson-ai.ts` (export `lessonAiApi`). Kiểu dữ liệu: `src/lib/api/lesson-ai-types.ts`.
Dùng ở: trang soạn bài `/admin/lessons` (nút "Soạn bằng AI" ở bài đang mở, nút "Dàn ý bằng AI" ở mục lục).

Quy ước chung như `API_CONTRACT.md`: JSON UTF-8, cookie httpOnly, lỗi trả `{ "message": "..." }` bằng tiếng Việt.

## Nguyên tắc

- **Chỉ backend gọi nhà cung cấp AI**, bằng khoá chung của nhà (cấu hình ở `/admin/assistant`, xem `docs/api/ai.md`). Trình duyệt không bao giờ thấy khoá và không gọi thẳng nhà cung cấp.
- **Chỉ quản trị được gọi.** Người khác nhận `403`.
- **Không lưu gì.** Endpoint chỉ trả bản nháp. Bản nháp chỉ vào bài khi quản trị bấm "Thêm vào bài" rồi "Lưu" (`PUT /learning/lessons/:id`), hoặc vào mục lục qua `PUT .../outline` và `POST /learning/lessons`.
- **Trả JSON đúng schema** bên dưới. Backend nên yêu cầu model trả JSON theo schema (structured output / tool call), kiểm tra lại trước khi trả, và bỏ mục sai dạng. Không trả markdown, không bọc trong chuỗi.
- Chữ trong bản nháp là tiếng Việt có dấu, câu ngắn, trẻ em đọc hiểu, theo chương trình phổ thông Việt Nam. Công thức viết TeX giữa hai dấu `$...$` như phần còn lại của bài (xem `RichText`). Không dùng dấu gạch ngang dài (em-dash, en-dash).

## Endpoint

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/admin/lessons/ai/generate` | `LessonAiRequest` | `LessonAiResult` (bản nháp, không lưu) |

Lỗi:

| Mã | Khi nào | `message` ví dụ |
|---|---|---|
| `400` | `count` ngoài 1-10, `kind` lạ, thiếu `context` | "Số lượng từ 1 đến 10." |
| `403` | Không phải quản trị | "Chỉ quản trị được dùng AI soạn bài." |
| `409` | Chưa cấu hình khoá chung, hoặc khoá hỏng | "Quản trị chưa cấu hình API AI chung của nhà." |
| `429` | Hết hạn mức của nhà cung cấp | "AI đang bận, thử lại sau ít phút." |
| `502` | Nhà cung cấp lỗi hoặc trả sai dạng | "AI chưa trả lời được. Thử lại sau ít phút." |

Trước khi mở hộp soạn, frontend gọi `GET /me/ai`. Nếu `mode = "none"`, hộp soạn hiện `reason` và nút tới `/admin/assistant#api-ai`.

## Kiểu dữ liệu

```ts
type LessonAiKind = "quiz" | "outcomes" | "examples" | "mistakes" | "warmup" | "outline";
type LessonAiDifficulty = "easy" | "medium" | "hard"; // Dễ | Vừa | Khó

interface LessonAiRequest {
  kind: LessonAiKind;
  count: number;              // 1-10. Với "outline": số chủ đề
  difficulty: LessonAiDifficulty;
  notes?: string;             // ghi chú của quản trị, tối đa 600 ký tự
  context: {
    grade: number;            // 1-12
    subjectId: string;        // "toan"
    subjectName: string;      // "Toán"
    topicTitle?: string;      // có khi đang mở một bài
    lessonId?: string;
    lessonTitle?: string;
  };
  avoid?: string[];           // chữ đã có trên màn hình hoặc trong bài, AI không lặp lại
}

type LessonAiResult =
  | { kind: "quiz"; items: QuizQuestion[] }        // QuizQuestion trong lesson-types.ts
  | { kind: "outcomes"; items: string[] }          // mỗi chuỗi một mục tiêu, không có "Sau bài này em"
  | { kind: "examples"; items: { type: "example"; title: string; problem: string; steps: string[] }[] }
  | { kind: "mistakes"; items: { type: "mistake"; wrong: string; right: string; why: string }[] }
  | { kind: "warmup"; items: { type: "question"; prompt: string; hint?: string; answer: string }[] }
  | { kind: "outline"; topics: { title: string; lessons: string[] }[] };
```

Ghi chú theo loại:

- `quiz`: 2-6 lựa chọn, `answerIndex` đúng, nên có `explanation`. `id` tuỳ ý (frontend đặt lại id khi thêm vào bài). Vị trí đáp án đúng nên thay đổi giữa các câu.
- `examples`: `steps` là các bước giải, mỗi bước một câu.
- `outline`: theo lớp và môn trong `context` (bỏ qua chủ đề và bài). Không trả chủ đề trùng tên trong `avoid` (frontend gửi tên các chủ đề đã có). Mỗi chủ đề 2-5 bài.
- `count` là số mục trả về. Nếu thật sự không còn gì mới để gợi ý, được trả ít hơn (kể cả mảng rỗng).
- "Tạo lại" một thẻ: frontend gửi lại yêu cầu cũ với `count: 1` và `avoid` gồm mọi thẻ đang hiện.

Ví dụ:

```json
POST /admin/lessons/ai/generate
{
  "kind": "quiz",
  "count": 2,
  "difficulty": "medium",
  "context": { "grade": 9, "subjectId": "toan", "subjectName": "Toán",
               "topicTitle": "Phương trình và hệ hai phương trình bậc nhất hai ẩn",
               "lessonId": "toan-9-c1-b1",
               "lessonTitle": "Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn" },
  "avoid": ["Phương trình nào là phương trình bậc nhất hai ẩn?"]
}

200
{
  "kind": "quiz",
  "items": [
    { "id": "q1", "prompt": "Hệ gồm $x + y = 7$ và $x - y = 1$ có nghiệm là",
      "choices": ["$(3; 4)$", "$(4; 3)$", "$(5; 2)$", "$(6; 1)$"], "answerIndex": 1,
      "explanation": "Cộng hai phương trình: $2x = 8$ nên $x = 4$, rồi $y = 3$." }
  ]
}
```

## Phía frontend làm gì với bản nháp

- Quản trị chọn thẻ, sửa nhanh, rồi "Thêm N mục đã chọn vào bài". Câu hỏi vào khối Tự kiểm cuối bài (tạo phần "Tự kiểm" nếu chưa có), mục tiêu nối vào `outcomes`, ví dụ vào phần "Các dạng bài", lỗi vào "Lỗi hay mắc", câu khởi động vào "Khởi động" (tạo phần nếu chưa có).
- Mục thêm từ AI mang nhãn "Nháp AI" cho tới khi quản trị bấm "Duyệt". Nhãn chỉ là trạng thái giao diện trong phiên, **không** gửi lên backend; bài lưu như mọi bài khác.
- Dàn ý: chủ đề mới được thêm bằng `PUT /learning/grades/:grade/subjects/:subjectId/outline`, rồi từng bài bằng `POST /learning/lessons`. Chủ đề trùng tên với chủ đề đã có thì chỉ thêm các bài còn thiếu.
