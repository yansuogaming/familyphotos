// AI drafts for the admin lesson studio. Endpoint: docs/api/lesson-ai.md.
// The backend calls the AI provider with the family's shared key and returns
// JSON in the LessonAiResult shape. The mock below writes plausible Vietnamese
// drafts: real content for Toán 9 (phương trình bậc nhất hai ẩn), natural
// generic content elsewhere.
import { aiApi } from "./ai";
import { ApiError, BASE, http, wait } from "./core";
import type { QuizQuestion } from "./lesson-types";
import type {
  ExampleBlock,
  LessonAiContext,
  LessonAiDifficulty,
  LessonAiRequest,
  LessonAiResult,
  MistakeBlock,
  OutlineDraftTopic,
  WarmupBlock,
} from "./lesson-ai-types";
import { slugify } from "./lessons";

const fold = (s: string) => slugify(s).replace(/-/g, " ");
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function shuffle<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Takes `count` items the admin has not seen, then fills up from `more` (or repeats). */
function take<T>(pool: T[], count: number, keyOf: (t: T) => string, avoid: Set<string>, more?: () => T): T[] {
  const fresh = pool.filter((t) => !avoid.has(fold(keyOf(t))));
  const out = fresh.slice(0, count);
  let guard = 0;
  while (out.length < count && guard++ < 60) {
    const next = more ? more() : pool[out.length % Math.max(1, pool.length)];
    if (!next) break;
    if (more && (avoid.has(fold(keyOf(next))) || out.some((x) => keyOf(x) === keyOf(next)))) continue;
    out.push(next);
  }
  return out;
}

/** Choices written with the right one first; shuffled here so the answer moves around. */
function quiz(prompt: string, choices: string[], explanation: string): QuizQuestion {
  const order = shuffle(choices.map((c, i) => ({ c, i })));
  return { id: rid("q-ai"), prompt, choices: order.map((x) => x.c), answerIndex: order.findIndex((x) => x.i === 0), explanation };
}

/* --------------------------------------------- Toán 9, phương trình hai ẩn */

type Graded<T> = { level: LessonAiDifficulty; make: () => T };

const t9Quiz: Graded<QuizQuestion>[] = [
  { level: "easy", make: () => quiz("Phương trình nào là phương trình bậc nhất hai ẩn?", ["$3x - 2y = 5$", "$x^2 + y = 1$", "$xy = 4$", "$0x + 0y = 7$"], "Dạng $ax + by = c$ với $a$ và $b$ không cùng bằng 0. Chỉ $3x - 2y = 5$ đúng dạng này.") },
  { level: "easy", make: () => quiz("Cặp số nào là nghiệm của phương trình $x + y = 5$?", ["$(2; 3)$", "$(1; 3)$", "$(4; 2)$", "$(0; 4)$"], "$2 + 3 = 5$. Các cặp còn lại cho tổng khác 5.") },
  { level: "easy", make: () => quiz("Trong phương trình $2x + 0y = 6$, hệ số $b$ bằng bao nhiêu?", ["$0$", "$2$", "$6$", "$1$"], "Hệ số của $y$ là $b = 0$. Phương trình vẫn là bậc nhất hai ẩn vì $a = 2 \\ne 0$.") },
  { level: "easy", make: () => quiz("Phương trình bậc nhất hai ẩn có bao nhiêu nghiệm?", ["Vô số nghiệm", "Đúng một nghiệm", "Đúng hai nghiệm", "Không có nghiệm nào"], "Mỗi giá trị của $x$ cho một giá trị của $y$, nên có vô số cặp nghiệm.") },
  { level: "medium", make: () => quiz("Hệ gồm $x + y = 7$ và $x - y = 1$ có nghiệm là", ["$(4; 3)$", "$(3; 4)$", "$(5; 2)$", "$(6; 1)$"], "Cộng hai phương trình: $2x = 8$ nên $x = 4$, rồi $y = 7 - 4 = 3$.") },
  { level: "medium", make: () => quiz("Nghiệm tổng quát của phương trình $2x - y = 3$ là", ["$(x; 2x - 3)$ với $x$ tuỳ ý", "$(x; 3 - 2x)$ với $x$ tuỳ ý", "$(x; 2x + 3)$ với $x$ tuỳ ý", "$(3; 2x)$ với $x$ tuỳ ý"], "Chuyển vế: $y = 2x - 3$.") },
  { level: "medium", make: () => quiz("Đường thẳng $x + 2y = 4$ cắt trục $Oy$ tại điểm nào?", ["$(0; 2)$", "$(4; 0)$", "$(2; 0)$", "$(0; 4)$"], "Trên trục $Oy$ thì $x = 0$, nên $2y = 4$ và $y = 2$.") },
  { level: "medium", make: () => quiz("Cặp số $(1; -2)$ là nghiệm của hệ nào?", ["$x + y = -1$ và $2x - y = 4$", "$x + y = 3$ và $x - y = 1$", "$x - y = -3$ và $x + y = 1$", "$2x + y = 4$ và $x - y = 0$"], "Thay vào: $1 + (-2) = -1$ và $2 \\cdot 1 - (-2) = 4$. Cả hai đều đúng.") },
  { level: "hard", make: () => quiz("Với giá trị nào của $m$ thì $(2; 1)$ là nghiệm của phương trình $mx + 3y = 7$?", ["$m = 2$", "$m = 1$", "$m = 3$", "$m = 5$"], "Thay $x = 2$, $y = 1$: $2m + 3 = 7$ nên $m = 2$.") },
  { level: "hard", make: () => quiz("Hệ gồm $x + y = 2$ và $2x + 2y = 5$ có bao nhiêu nghiệm?", ["Không có nghiệm nào", "Đúng một nghiệm", "Vô số nghiệm", "Đúng hai nghiệm"], "Nhân phương trình đầu với 2 được $2x + 2y = 4$, mâu thuẫn với $2x + 2y = 5$. Hai đường thẳng song song.") },
  { level: "hard", make: () => quiz("Lớp 9A có 40 bạn, số bạn nữ nhiều hơn số bạn nam là 4. Gọi $x$ là số bạn nam, $y$ là số bạn nữ. Hệ nào đúng?", ["$x + y = 40$ và $y - x = 4$", "$x + y = 40$ và $x - y = 4$", "$x + y = 44$ và $y = x$", "$x - y = 40$ và $x + y = 4$"], "Tổng là 40 bạn, nữ hơn nam 4 bạn nên $y - x = 4$.") },
  { level: "hard", make: () => quiz("Hệ gồm $2x - y = 1$ và $4x - 2y = 2$ có bao nhiêu nghiệm?", ["Vô số nghiệm", "Không có nghiệm nào", "Đúng một nghiệm", "Đúng hai nghiệm"], "Phương trình sau gấp đôi phương trình đầu. Hai đường thẳng trùng nhau.") },
];

/** "2x - 3y", "x + y", "-x + 4y". */
function lin(a: number, b: number) {
  const term = (k: number, v: string, first: boolean) => {
    const sign = k < 0 ? (first ? "-" : " - ") : first ? "" : " + ";
    const n = Math.abs(k) === 1 ? "" : String(Math.abs(k));
    return `${sign}${n}${v}`;
  };
  return `${term(a, "x", true)}${term(b, "y", false)}`;
}
const pair = (x: number, y: number) => `$(${x}; ${y})$`;
const times = (k: number, v: number) => `${k} \\cdot ${v < 0 ? `(${v})` : v}`;

function t9QuizNumeric(): QuizQuestion {
  const a = rand(1, 4) * (Math.random() < 0.3 ? -1 : 1);
  const b = rand(1, 5) * (Math.random() < 0.5 ? -1 : 1);
  const x = rand(-2, 5);
  const y = rand(-2, 5);
  const c = a * x + b * y;
  const wrong = [
    [x + 1, y],
    [x, y - 1],
    [y, x],
    [x - 1, y + 1],
  ].filter(([p, q]) => a * p + b * q !== c && !(p === x && q === y));
  const choices = [pair(x, y), ...wrong.slice(0, 3).map(([p, q]) => pair(p, q))];
  return quiz(`Cặp số nào là nghiệm của phương trình $${lin(a, b)} = ${c}$?`, choices, `Thay vào: $${times(a, x)} ${b < 0 ? "-" : "+"} ${times(Math.abs(b), y)} = ${c}$. Đúng, nên ${pair(x, y)} là nghiệm.`);
}

const t9Outcomes = [
  "Nhận biết được phương trình bậc nhất hai ẩn $ax + by = c$ và chỉ ra các hệ số $a$, $b$, $c$.",
  "Kiểm tra được một cặp số $(x_0; y_0)$ có phải là nghiệm của phương trình hay không.",
  "Viết được nghiệm tổng quát của một phương trình bậc nhất hai ẩn.",
  "Vẽ được đường thẳng biểu diễn tập nghiệm trên mặt phẳng toạ độ $Oxy$.",
  "Nhận biết được hệ hai phương trình bậc nhất hai ẩn và nghiệm của hệ.",
  "Giải được hệ bằng phương pháp thế và phương pháp cộng đại số.",
  "Nhìn hai đường thẳng, biết hệ có một nghiệm, vô nghiệm hay vô số nghiệm.",
  "Lập được hệ phương trình từ một bài toán thực tế, ví dụ bài toán mua vở và bút.",
  "Dùng máy tính cầm tay để kiểm tra lại nghiệm của hệ.",
];

const ex = (title: string, problem: string, steps: string[]): ExampleBlock => ({ type: "example", title, problem, steps });

const t9Examples: ExampleBlock[] = [
  ex("Giải hệ bằng phương pháp thế", "Giải hệ gồm $x + 2y = 5$ và $3x - y = 1$.", [
    "Từ phương trình đầu: $x = 5 - 2y$.",
    "Thế vào phương trình sau: $3(5 - 2y) - y = 1$, tức là $15 - 7y = 1$.",
    "Suy ra $y = 2$, rồi $x = 5 - 2 \\cdot 2 = 1$.",
    "Vậy hệ có nghiệm duy nhất $(1; 2)$.",
  ]),
  ex("Giải hệ bằng phương pháp cộng đại số", "Giải hệ gồm $2x + 3y = 8$ và $2x - y = 0$.", [
    "Trừ từng vế: $(2x + 3y) - (2x - y) = 8 - 0$, tức là $4y = 8$.",
    "Suy ra $y = 2$.",
    "Thay vào $2x - y = 0$: $2x = 2$, nên $x = 1$.",
    "Vậy hệ có nghiệm $(1; 2)$.",
  ]),
  ex("Bài toán mua táo và cam", "Mẹ mua 2 kg táo và 3 kg cam hết 190 nghìn đồng. Lần sau mẹ mua 1 kg táo và 2 kg cam hết 110 nghìn đồng. Tìm giá mỗi ki-lô-gam.", [
    "Gọi giá 1 kg táo là $x$, giá 1 kg cam là $y$ (nghìn đồng, $x > 0$, $y > 0$).",
    "Ta có hệ: $2x + 3y = 190$ và $x + 2y = 110$.",
    "Từ phương trình sau: $x = 110 - 2y$. Thế vào: $2(110 - 2y) + 3y = 190$, nên $y = 30$.",
    "Khi đó $x = 110 - 2 \\cdot 30 = 50$.",
    "Vậy táo giá 50 nghìn đồng, cam giá 30 nghìn đồng một ki-lô-gam.",
  ]),
  ex("Viết nghiệm tổng quát", "Viết nghiệm tổng quát của phương trình $3x - y = 2$ rồi tìm hai nghiệm cụ thể.", [
    "Chuyển vế: $y = 3x - 2$.",
    "Nghiệm tổng quát: $(x; 3x - 2)$ với $x$ tuỳ ý.",
    "Chọn $x = 0$ được $(0; -2)$. Chọn $x = 1$ được $(1; 1)$.",
  ]),
  ex("Nhận ra hệ vô nghiệm", "Không giải, cho biết hệ gồm $x - 2y = 3$ và $2x - 4y = 1$ có bao nhiêu nghiệm.", [
    "Nhân phương trình đầu với 2: $2x - 4y = 6$.",
    "So với phương trình sau $2x - 4y = 1$: vế trái giống nhau, vế phải khác nhau.",
    "Hai đường thẳng song song, nên hệ vô nghiệm.",
  ]),
  ex("Tìm hệ số để hệ có nghiệm cho trước", "Tìm $a$ và $b$ để hệ gồm $ax + y = 5$ và $x + by = 4$ có nghiệm $(2; 1)$.", [
    "Thay $x = 2$, $y = 1$ vào phương trình đầu: $2a + 1 = 5$, nên $a = 2$.",
    "Thay vào phương trình sau: $2 + b = 4$, nên $b = 2$.",
    "Vậy $a = 2$ và $b = 2$.",
  ]),
];

function t9ExampleNumeric(): ExampleBlock {
  const x = rand(1, 6);
  const y = rand(1, 6);
  const s = x + y;
  const b = rand(3, 5);
  const c = 2 * x + b * y;
  return ex(`Giải hệ có tổng bằng ${s}`, `Giải hệ gồm $x + y = ${s}$ và $${lin(2, b)} = ${c}$.`, [
    `Từ phương trình đầu: $x = ${s} - y$.`,
    `Thế vào phương trình sau: $2(${s} - y) + ${b}y = ${c}$, tức là $${2 * s} + ${b - 2 === 1 ? "" : b - 2}y = ${c}$.`,
    `Suy ra $y = ${y}$, rồi $x = ${s} - ${y} = ${x}$.`,
    `Thử lại: $2 \\cdot ${x} + ${b} \\cdot ${y} = ${c}$. Vậy hệ có nghiệm $(${x}; ${y})$.`,
  ]);
}

const mk = (wrong: string, right: string, why: string): MistakeBlock => ({ type: "mistake", wrong, right, why });

const t9Mistakes: MistakeBlock[] = [
  mk("$x^2 + y = 3$ là phương trình bậc nhất hai ẩn vì có hai ẩn $x$ và $y$.", "$x^2 + y = 3$ không phải phương trình bậc nhất hai ẩn.", "Bậc nhất nghĩa là mỗi ẩn có số mũ bằng 1. Ở đây $x$ có số mũ 2."),
  mk("Nghiệm của phương trình $x + y = 5$ là $x = 2$.", "Một nghiệm của $x + y = 5$ là cặp số $(2; 3)$.", "Nghiệm của phương trình hai ẩn là một cặp số, phải ghi đủ cả $x$ và $y$."),
  mk("Từ $2x - y = 3$ suy ra $y = 3 - 2x$.", "Từ $2x - y = 3$ suy ra $y = 2x - 3$.", "Chuyển vế thì phải đổi dấu. Thử lại với $x = 0$: $-y = 3$ nên $y = -3$."),
  mk("Cộng hai phương trình $x + y = 4$ và $x - y = 2$ được $2x = 2$.", "Cộng hai phương trình được $2x = 6$, nên $x = 3$.", "Khi cộng đại số phải cộng cả vế phải: $4 + 2 = 6$."),
  mk("Giải hệ $x + y = 4$, $x - y = 2$ được $x = 3$ là xong bài.", "Tìm tiếp $y = 1$ rồi kết luận hệ có nghiệm $(3; 1)$.", "Nghiệm của hệ là một cặp số. Thiếu $y$ thì bài chưa xong."),
  mk("Hệ gồm $x + y = 1$ và $2x + 2y = 2$ vô nghiệm vì hai phương trình khác nhau.", "Hệ này có vô số nghiệm.", "Phương trình sau gấp đôi phương trình đầu, nên hai đường thẳng trùng nhau."),
];

const wq = (prompt: string, hint: string, answer: string): WarmupBlock => ({ type: "question", prompt, hint, answer });

const t9Warmups: WarmupBlock[] = [
  wq("Một hộp có 10 chiếc bút gồm bút xanh và bút đỏ. Mỗi loại có thể có bao nhiêu chiếc?", "Gọi số bút xanh là $x$, bút đỏ là $y$. Em có $x + y = 10$.", "Có nhiều cách, ví dụ $(1; 9)$, $(4; 6)$, $(7; 3)$. Một điều kiện thì chưa đủ để biết chính xác, cần thêm một thông tin nữa."),
  wq("Vé xem phim giá 50 nghìn đồng cho trẻ em và 80 nghìn đồng cho người lớn. Nhà Lan trả 260 nghìn đồng. Nhà Lan có mấy trẻ em, mấy người lớn?", "Gọi số vé trẻ em là $x$, người lớn là $y$: $50x + 80y = 260$. Thử $y = 1, 2, 3$.", "Thử $y = 2$ được $50x = 100$, nên $x = 2$. Nhà Lan có 2 trẻ em và 2 người lớn."),
  wq("Tổng hai số là 12, hiệu của chúng là 4. Hai số đó là gì?", "Gọi hai số là $x$ và $y$: $x + y = 12$ và $x - y = 4$.", "Hai số là 8 và 4. Thử lại: $8 + 4 = 12$ và $8 - 4 = 4$."),
  wq("Điểm $A(2; 1)$ có nằm trên đường thẳng $x + 2y = 4$ không?", "Thay $x = 2$, $y = 1$ vào vế trái rồi so với 4.", "$2 + 2 \\cdot 1 = 4$. Đúng bằng 4 nên điểm $A$ nằm trên đường thẳng."),
  wq("Vừa gà vừa chó có 36 con, đếm được 100 chân. Có bao nhiêu con mỗi loại?", "Gọi số gà là $x$, số chó là $y$. Viết một đẳng thức về số con, một đẳng thức về số chân.", "$x + y = 36$ và $2x + 4y = 100$. Giải ra $x = 22$, $y = 14$: 22 con gà và 14 con chó."),
];

const t9Outline: OutlineDraftTopic[] = [
  { title: "Phương trình và hệ hai phương trình bậc nhất hai ẩn", lessons: ["Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn", "Giải hệ hai phương trình bậc nhất hai ẩn", "Giải bài toán bằng cách lập hệ phương trình"] },
  { title: "Phương trình và bất phương trình bậc nhất một ẩn", lessons: ["Phương trình quy về phương trình bậc nhất một ẩn", "Bất đẳng thức và tính chất", "Bất phương trình bậc nhất một ẩn"] },
  { title: "Căn bậc hai và căn bậc ba", lessons: ["Căn bậc hai và căn thức bậc hai", "Khai căn bậc hai với phép nhân và phép chia", "Biến đổi đơn giản và rút gọn biểu thức chứa căn thức bậc hai", "Căn bậc ba và căn thức bậc ba"] },
  { title: "Hệ thức lượng trong tam giác vuông", lessons: ["Tỉ số lượng giác của góc nhọn", "Một số hệ thức giữa cạnh, góc trong tam giác vuông và ứng dụng"] },
  { title: "Đường tròn", lessons: ["Mở đầu về đường tròn", "Cung và dây của một đường tròn", "Độ dài của cung tròn. Diện tích hình quạt tròn và hình vành khuyên", "Vị trí tương đối của đường thẳng và đường tròn", "Vị trí tương đối của hai đường tròn"] },
  { title: "Hàm số $y = ax^2$ ($a \\ne 0$). Phương trình bậc hai một ẩn", lessons: ["Hàm số $y = ax^2$ ($a \\ne 0$)", "Phương trình bậc hai một ẩn", "Định lí Viète và ứng dụng", "Giải bài toán bằng cách lập phương trình"] },
  { title: "Tần số và tần số tương đối", lessons: ["Bảng tần số và biểu đồ tần số", "Bảng tần số tương đối và biểu đồ tần số tương đối", "Bảng tần số, tần số tương đối ghép nhóm và biểu đồ"] },
  { title: "Xác suất của biến cố trong một số mô hình xác suất đơn giản", lessons: ["Phép thử ngẫu nhiên và không gian mẫu", "Xác suất của biến cố liên quan tới phép thử"] },
  { title: "Đường tròn ngoại tiếp và đường tròn nội tiếp", lessons: ["Góc nội tiếp", "Đường tròn ngoại tiếp và đường tròn nội tiếp của một tam giác", "Tứ giác nội tiếp", "Đa giác đều"] },
  { title: "Một số hình khối trong thực tiễn", lessons: ["Hình trụ và hình nón", "Hình cầu"] },
  { title: "Toán thực tế: tiền điện, tiền nước và lãi suất", lessons: ["Đọc hoá đơn tiền điện bậc thang", "Tính lãi suất tiết kiệm", "Lập hệ phương trình từ bài toán mua bán"] },
  { title: "Ôn thi vào lớp 10: Đại số", lessons: ["Rút gọn biểu thức chứa căn", "Hệ phương trình và bài toán lập hệ", "Phương trình bậc hai và định lí Viète"] },
  { title: "Ôn thi vào lớp 10: Hình học", lessons: ["Hệ thức lượng trong tam giác vuông", "Chứng minh tứ giác nội tiếp", "Bài toán đường tròn tổng hợp"] },
  { title: "Bất đẳng thức và giá trị lớn nhất, nhỏ nhất", lessons: ["Chứng minh bất đẳng thức đơn giản", "Tìm giá trị lớn nhất, nhỏ nhất của biểu thức"] },
];

/* ------------------------------------------------------- any other lesson */

function generic(ctx: LessonAiContext) {
  const T = ctx.lessonTitle?.trim() || `bài ${ctx.subjectName}`;
  const P = ctx.topicTitle?.trim();
  const S = ctx.subjectName;
  const quizzes: (() => QuizQuestion)[] = [
    () => quiz(`Khi bắt đầu bài “${T}”, em nên làm gì trước tiên?`, ["Đọc phần Khởi động và thử tự trả lời", "Chép ngay phần Ghi nhớ vào vở", "Bỏ qua phần ví dụ cho nhanh", "Làm phần Tự kiểm trước khi đọc bài"], "Phần Khởi động giúp em nhớ lại điều đã biết và tò mò về bài mới."),
    () => quiz(`Gặp một từ mới trong bài “${T}”, cách học nào tốt nhất?`, ["Đọc lại câu chứa từ đó rồi giải thích bằng lời của em", "Bỏ qua và đọc tiếp", "Học thuộc từng chữ của định nghĩa", "Đợi đến giờ kiểm tra mới hỏi"], "Tự giải thích bằng lời của mình giúp em hiểu thật, không chỉ thuộc."),
    () => quiz(`Học xong bài “${T}”, việc nào giúp em nhớ lâu nhất?`, ["Tự làm lại một ví dụ mà không nhìn lời giải", "Đọc lại cả bài thật nhanh một lần", "Tô màu toàn bộ bài", "Chỉ xem lại video"], "Tự làm lại buộc em nhớ ra cách làm, nhờ vậy nhớ lâu hơn đọc lại."),
    () => quiz(`Em làm sai một câu Tự kiểm của bài “${T}”. Em nên làm gì?`, ["Đọc phần giải thích rồi tìm lại chỗ trong bài nói về ý đó", "Chọn bừa đến khi đúng", "Bỏ qua câu đó", "Làm sang bài khác luôn"], "Câu sai cho em biết chỗ cần đọc lại. Đó là phần có ích nhất của bài kiểm tra."),
    () => quiz(`Phần “Lỗi hay mắc” trong bài ${S} giúp em điều gì?`, ["Nhận ra cách làm sai thường gặp để tránh", "Biết điểm của các bạn", "Có thêm bài tập về nhà", "Học thuộc đáp án"], "Biết trước chỗ dễ sai thì khi làm bài em sẽ cẩn thận đúng chỗ."),
    () => quiz(`Muốn kể lại bài “${T}” cho bạn, em nên làm thế nào?`, ["Nói 2 đến 3 ý quan trọng nhất, kèm một ví dụ", "Đọc to cả bài", "Chỉ nói tên bài", "Cho bạn xem đáp án Tự kiểm"], "Chọn ý chính và lấy ví dụ cho thấy em đã hiểu bài."),
    () => quiz(`Đọc đề một câu hỏi về “${T}”, việc đầu tiên nên làm là gì?`, ["Gạch chân điều đề bài hỏi", "Viết ngay đáp án đầu tiên nghĩ ra", "Đọc lướt phần cuối đề", "Xem đáp án của bạn bên cạnh"], "Nhiều câu sai vì hiểu nhầm đề, không phải vì không biết kiến thức."),
  ];
  if (P) {
    quizzes.push(() => quiz(`Bài “${T}” thuộc chủ đề nào?`, [P, "Ôn tập cuối năm", `Làm quen với môn ${S}`, "Bài đọc thêm"], `Bài này nằm trong chủ đề “${P}”.`));
  }
  const outcomes = [
    `Nói được ý chính của bài “${T}” bằng lời của em.`,
    `Nêu được một ví dụ trong đời sống có liên quan tới bài “${T}”.`,
    "Làm được các bài tập cơ bản của bài và tự kiểm tra lại kết quả.",
    "Nhận ra và sửa được một lỗi hay gặp khi làm bài.",
    P ? `Liên hệ được bài này với các bài khác trong chủ đề “${P}”.` : "Liên hệ được bài này với bài em học trước đó.",
    "Tự đặt được một câu hỏi về bài và tìm câu trả lời trong bài.",
    "Trình bày bài làm gọn gàng, đủ các bước.",
  ];
  const examples = [
    ex("Ví dụ: tìm ý chính", `Đọc lại phần Khám phá của bài “${T}”. Nêu ý chính trong một câu.`, ["Đọc chậm từng đoạn, gạch chân từ khoá.", "Gộp các từ khoá thành một câu ngắn.", "So câu của em với phần Ghi nhớ. Thiếu ý nào thì bổ sung."]),
    ex("Ví dụ: vận dụng vào đời sống", `Nêu một tình huống ở nhà hoặc ở trường có liên quan tới bài “${T}”.`, ["Nghĩ về những việc em làm hằng ngày.", "Chọn một việc có liên quan tới nội dung bài.", "Giải thích vì sao việc đó liên quan, dùng ít nhất một từ khoá của bài."]),
    ex("Ví dụ: so sánh với bài trước", P ? `So sánh điều em học ở bài “${T}” với bài trước trong chủ đề “${P}”.` : `So sánh điều em học ở bài “${T}” với bài em học trước đó.`, ["Viết ra hai ý chính của bài trước.", "Viết ra hai ý chính của bài này.", "Gạch nối những ý giống nhau, khoanh tròn ý mới."]),
    ex("Ví dụ: tự đặt câu hỏi", `Đặt hai câu hỏi về bài “${T}” rồi tự trả lời.`, ["Một câu hỏi bắt đầu bằng “Vì sao”.", "Một câu hỏi bắt đầu bằng “Nếu... thì...”.", "Tìm câu trả lời trong bài. Câu nào chưa trả lời được thì ghi lại để hỏi thầy cô."]),
  ];
  const mistakes = [
    mk(`Học thuộc lòng phần Ghi nhớ của bài “${T}” là đủ.`, "Hiểu ý của phần Ghi nhớ và tự nêu được một ví dụ.", "Thuộc mà không hiểu thì gặp câu hỏi khác đi một chút sẽ không làm được."),
    mk("Đọc đề lướt một lần rồi làm ngay.", "Đọc đề hai lần, gạch chân điều đề bài hỏi.", "Nhiều câu sai vì hiểu nhầm đề, không phải vì không biết kiến thức."),
    mk("Làm xong không kiểm tra lại.", "Dành một phút đọc lại bài làm và thử lại kết quả.", "Lỗi nhỏ như chép sai số hay thiếu chữ rất dễ sửa nếu em đọc lại."),
    mk("Bỏ qua các ví dụ, chỉ đọc phần lí thuyết.", "Đọc kĩ ví dụ, che lời giải rồi tự làm lại.", "Ví dụ cho thấy cách dùng kiến thức. Tự làm lại giúp em biết mình hiểu đến đâu."),
  ];
  const warmups = [
    wq(`Em đã từng nghe hoặc gặp “${T}” ở đâu chưa?`, "Nghĩ về sách, ti vi hoặc những việc ở nhà.", "Không có đáp án duy nhất. Em ghi lại ý của mình, đọc xong bài thì xem ý đó đúng đến đâu."),
    wq(`Theo em, vì sao chúng ta cần học bài “${T}”?`, "Nghĩ xem điều này giúp được việc gì ở nhà hoặc ở trường.", "Mỗi bạn có thể có lí do khác nhau. Cuối bài, em quay lại câu này và bổ sung câu trả lời."),
    wq(`Đoán xem bài “${T}” sẽ có những ý nào.`, "Nhìn tên bài và các tiêu đề phần.", "Viết ra 2 đến 3 ý em đoán. Học xong, đánh dấu những ý em đoán đúng."),
    wq(P ? `Nhắc lại một điều em nhớ nhất ở bài trước trong chủ đề “${P}”.` : "Nhắc lại một điều em nhớ nhất ở bài học trước.", "Mở vở xem lại phần Ghi nhớ nếu cần.", "Điều em nhớ có thể giúp em hiểu bài hôm nay nhanh hơn."),
  ];
  return { quizzes, outcomes, examples, mistakes, warmups };
}

function genericOutline(ctx: LessonAiContext): OutlineDraftTopic[] {
  const id = ctx.subjectId;
  const g = ctx.grade;
  if (id === "toan")
    return [
      { title: "Số và phép tính", lessons: ["Ôn tập và bổ sung", "Phép cộng và phép trừ", "Phép nhân và phép chia", "Luyện tập chung"] },
      { title: "Hình học và đo lường", lessons: ["Nhận biết các hình đã học", "Đo độ dài, khối lượng và thời gian", "Chu vi và diện tích"] },
      { title: "Giải toán có lời văn", lessons: ["Đọc đề và tóm tắt bài toán", "Bài toán nhiều bước", "Toán thực tế ở nhà và ở chợ"] },
      { title: "Một số yếu tố thống kê và xác suất", lessons: ["Thu thập và phân loại số liệu", "Biểu đồ cột", "Khả năng xảy ra của một sự kiện"] },
      { title: "Ôn tập cuối năm", lessons: ["Ôn tập số và phép tính", "Ôn tập hình học và đo lường", "Ôn tập giải toán"] },
    ];
  if (id === "tieng-viet" || id === "ngu-van")
    return [
      { title: "Đọc hiểu văn bản truyện", lessons: ["Nhân vật và sự việc", "Lời kể và người kể chuyện", "Bài học rút ra từ câu chuyện"] },
      { title: "Thơ và cảm xúc", lessons: ["Hình ảnh trong bài thơ", "Vần và nhịp", "Học thuộc lòng và đọc diễn cảm"] },
      { title: "Văn bản thông tin", lessons: ["Tìm thông tin chính", "Đọc bảng và sơ đồ", "Tóm tắt văn bản"] },
      { title: g <= 5 ? "Luyện từ và câu" : "Tiếng Việt thực hành", lessons: ["Từ và nghĩa của từ", "Câu và các thành phần câu", "Dấu câu"] },
      { title: "Viết", lessons: ["Viết đoạn văn", "Viết bài văn kể chuyện", "Viết bài văn miêu tả"] },
      { title: "Nói và nghe", lessons: ["Kể lại một câu chuyện", "Trao đổi ý kiến trong nhóm", "Thuyết trình ngắn"] },
    ];
  if (id === "tieng-anh")
    return [
      { title: "Unit 1. My friends", lessons: ["Vocabulary: describing people", "Grammar: present simple", "Speaking: introducing a friend"] },
      { title: "Unit 2. My home", lessons: ["Vocabulary: rooms and furniture", "Grammar: there is, there are", "Writing: my bedroom"] },
      { title: "Unit 3. School life", lessons: ["Vocabulary: school subjects", "Grammar: adverbs of frequency", "Listening: a school day"] },
      { title: "Unit 4. Food and health", lessons: ["Vocabulary: food and drinks", "Grammar: countable and uncountable nouns", "Reading: healthy habits"] },
      { title: "Unit 5. Festivals", lessons: ["Vocabulary: Tết and other festivals", "Grammar: past simple", "Project: a festival poster"] },
    ];
  if (["khoa-hoc", "khoa-hoc-tu-nhien", "tu-nhien-va-xa-hoi", "vat-li", "hoa-hoc", "sinh-hoc"].includes(id))
    return [
      { title: "Mở đầu: làm quen với cách học khoa học", lessons: ["Quan sát và đặt câu hỏi", "Dụng cụ và an toàn khi làm thí nghiệm", "Ghi chép kết quả"] },
      { title: "Chất và sự biến đổi của chất", lessons: ["Các thể của chất", "Hỗn hợp và dung dịch", "Biến đổi hoá học quanh em"] },
      { title: "Năng lượng", lessons: ["Năng lượng và các dạng năng lượng", "Ánh sáng và âm thanh", "Tiết kiệm năng lượng ở nhà"] },
      { title: "Thực vật và động vật", lessons: ["Sự sinh sản của thực vật", "Vòng đời của động vật", "Chuỗi thức ăn"] },
      { title: "Con người và sức khoẻ", lessons: ["Các cơ quan trong cơ thể", "Ăn uống cân bằng", "Phòng tránh bệnh thường gặp"] },
    ];
  if (["lich-su", "dia-li", "lich-su-va-dia-li"].includes(id))
    return [
      { title: "Địa phương em", lessons: ["Vị trí và bản đồ địa phương", "Thiên nhiên và con người", "Di tích và lễ hội"] },
      { title: "Thiên nhiên Việt Nam", lessons: ["Địa hình và khí hậu", "Sông ngòi và biển đảo", "Bảo vệ môi trường"] },
      { title: "Buổi đầu dựng nước", lessons: ["Văn Lang, Âu Lạc", "Đời sống của người Việt cổ", "Truyền thuyết và lịch sử"] },
      { title: "Bảo vệ đất nước", lessons: ["Các cuộc kháng chiến tiêu biểu", "Những anh hùng dân tộc", "Bài học từ lịch sử"] },
    ];
  return [
    { title: `Làm quen với môn ${ctx.subjectName} lớp ${g}`, lessons: ["Môn học này học gì", "Đồ dùng và cách học", "Làm quen với sách giáo khoa"] },
    { title: "Kiến thức nền tảng", lessons: ["Những khái niệm đầu tiên", "Quan sát và thực hành", "Luyện tập chung"] },
    { title: "Thực hành và vận dụng", lessons: ["Bài thực hành 1", "Bài thực hành 2", "Vận dụng vào đời sống"] },
    { title: "Dự án nhỏ", lessons: ["Lên kế hoạch dự án", "Làm và trình bày sản phẩm"] },
    { title: "Ôn tập cuối năm", lessons: ["Ôn tập học kì I", "Ôn tập học kì II"] },
  ];
}

/* ------------------------------------------------------------------- mock */

const isToan9Pt = (c: LessonAiContext) => c.grade === 9 && c.subjectId === "toan" && /hai an|he hai|he phuong trinh/.test(fold(`${c.topicTitle ?? ""} ${c.lessonTitle ?? ""}`));

/** Easier first for "easy", harder first for "hard"; the rest keeps the pool order. */
function byLevel<T>(pool: Graded<T>[], level: LessonAiDifficulty) {
  const rank: Record<LessonAiDifficulty, Record<LessonAiDifficulty, number>> = {
    easy: { easy: 0, medium: 1, hard: 2 },
    medium: { medium: 0, easy: 1, hard: 1 },
    hard: { hard: 0, medium: 1, easy: 2 },
  };
  return shuffle(pool).sort((a, b) => rank[level][a.level] - rank[level][b.level]);
}

function mockGenerate(req: LessonAiRequest): LessonAiResult {
  const n = Math.min(10, Math.max(1, Math.round(req.count || 1)));
  const avoid = new Set((req.avoid ?? []).map(fold));
  const ctx = req.context;
  const t9 = isToan9Pt(ctx);
  const g = generic(ctx);
  switch (req.kind) {
    case "quiz": {
      if (t9) {
        const made = byLevel(t9Quiz, req.difficulty).map((x) => x.make());
        return { kind: "quiz", items: take(made, n, (q) => q.prompt, avoid, t9QuizNumeric) };
      }
      const made = shuffle(g.quizzes).map((f) => f());
      return { kind: "quiz", items: take(made, n, (q) => q.prompt, avoid) };
    }
    case "outcomes":
      return { kind: "outcomes", items: take(t9 ? t9Outcomes : g.outcomes, n, (s) => s, avoid) };
    case "examples":
      return { kind: "examples", items: take(t9 ? shuffle(t9Examples) : g.examples, n, (b) => b.title, avoid, t9 ? t9ExampleNumeric : undefined) };
    case "mistakes":
      return { kind: "mistakes", items: take(t9 ? shuffle(t9Mistakes) : g.mistakes, n, (b) => b.wrong, avoid) };
    case "warmup":
      return { kind: "warmup", items: take(t9 ? shuffle(t9Warmups) : g.warmups, n, (b) => b.prompt, avoid) };
    case "outline": {
      const pool = ctx.grade === 9 && ctx.subjectId === "toan" ? t9Outline : genericOutline(ctx);
      const fresh = pool.filter((t) => !avoid.has(fold(t.title)));
      return { kind: "outline", topics: fresh.slice(0, n).map((t) => ({ title: t.title, lessons: t.lessons.slice() })) };
    }
  }
}

export const lessonAiApi = {
  /** Admin only. Drafts are not saved anywhere until the admin adds them and saves the lesson. */
  generate: async (req: LessonAiRequest): Promise<LessonAiResult> => {
    if (BASE) return http("/admin/lessons/ai/generate", { method: "POST", body: JSON.stringify(req) });
    const access = await aiApi.access();
    if (access.mode === "none") {
      await wait(300);
      throw new ApiError(409, access.reason ?? "AI chưa dùng được.");
    }
    await wait(1000);
    return structuredClone(mockGenerate(req));
  },
};
