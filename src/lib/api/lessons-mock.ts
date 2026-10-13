// Demo lesson content for mock mode. Toán 9 follows SGK Kết nối tri thức,
// Tiếng Việt 5 keeps the topic content from mock-data.ts.
import type { LessonDetail, LessonSection, Subject, SubjectOutline, TopicSummary, Video } from "./lesson-types";
import { topicDetail, topics as tv5Topics } from "./mock-data";

const pic = (seed: string, w = 640, h = 360) => `https://picsum.photos/seed/fp-${seed}/${w}/${h}`;
const YT = {
  a: "https://www.youtube.com/embed/aqz-KE-bpKQ",
  b: "https://www.youtube.com/embed/eRsGyueVLvQ",
};

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ---------------------------------------------------------------- subjects */

const primaryLow = ["Tiếng Việt", "Toán", "Đạo đức", "Tự nhiên và Xã hội", "Âm nhạc", "Mĩ thuật", "Giáo dục thể chất"];
const primary3 = ["Tiếng Việt", "Toán", "Tiếng Anh", "Đạo đức", "Tự nhiên và Xã hội", "Tin học", "Công nghệ", "Âm nhạc", "Mĩ thuật"];
const primaryHigh = ["Tiếng Việt", "Toán", "Tiếng Anh", "Đạo đức", "Khoa học", "Lịch sử và Địa lí", "Tin học", "Công nghệ", "Âm nhạc", "Mĩ thuật"];
const secondary = ["Ngữ văn", "Toán", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lí", "Giáo dục công dân", "Tin học", "Công nghệ", "Âm nhạc", "Mĩ thuật"];
const high = ["Ngữ văn", "Toán", "Tiếng Anh", "Vật lí", "Hoá học", "Sinh học", "Lịch sử", "Địa lí", "Giáo dục kinh tế và pháp luật", "Tin học", "Công nghệ"];

function namesFor(grade: number) {
  if (grade <= 2) return primaryLow;
  if (grade === 3) return primary3;
  if (grade <= 5) return primaryHigh;
  if (grade <= 9) return secondary;
  return high;
}

export function mockSubjects(grade: number): Subject[] {
  return namesFor(grade).map((name) => ({ id: slugify(name), name, grade }));
}

/* ------------------------------------------------------------------ toán 9 */

const toan9: Subject = { id: "toan", name: "Toán", grade: 9 };

const toan9Topics: [string, string[]][] = [
  ["Phương trình và hệ hai phương trình bậc nhất hai ẩn", [
    "Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn",
    "Giải hệ hai phương trình bậc nhất hai ẩn",
    "Giải bài toán bằng cách lập hệ phương trình",
  ]],
  ["Phương trình và bất phương trình bậc nhất một ẩn", [
    "Phương trình quy về phương trình bậc nhất một ẩn",
    "Bất đẳng thức và tính chất",
    "Bất phương trình bậc nhất một ẩn",
  ]],
  ["Căn bậc hai và căn bậc ba", [
    "Căn bậc hai và căn thức bậc hai",
    "Khai căn bậc hai với phép nhân và phép chia",
    "Biến đổi đơn giản và rút gọn biểu thức chứa căn thức bậc hai",
    "Căn bậc ba và căn thức bậc ba",
  ]],
  ["Hệ thức lượng trong tam giác vuông", [
    "Tỉ số lượng giác của góc nhọn",
    "Một số hệ thức giữa cạnh, góc trong tam giác vuông và ứng dụng",
  ]],
  ["Đường tròn", [
    "Mở đầu về đường tròn",
    "Cung và dây của một đường tròn",
    "Độ dài của cung tròn. Diện tích hình quạt tròn và hình vành khuyên",
    "Vị trí tương đối của đường thẳng và đường tròn",
    "Vị trí tương đối của hai đường tròn",
  ]],
  ["Hàm số $y = ax^2$ $(a \\ne 0)$. Phương trình bậc hai một ẩn", [
    "Hàm số $y = ax^2$ $(a \\ne 0)$",
    "Phương trình bậc hai một ẩn",
    "Định lí Viète và ứng dụng",
    "Giải bài toán bằng cách lập phương trình",
  ]],
  ["Tần số và tần số tương đối", [
    "Bảng tần số và biểu đồ tần số",
    "Bảng tần số tương đối và biểu đồ tần số tương đối",
    "Bảng tần số, tần số tương đối ghép nhóm và biểu đồ",
  ]],
  ["Xác suất của biến cố trong một số mô hình xác suất đơn giản", [
    "Phép thử ngẫu nhiên và không gian mẫu",
    "Xác suất của biến cố liên quan tới phép thử",
  ]],
  ["Đường tròn ngoại tiếp và đường tròn nội tiếp", [
    "Góc nội tiếp",
    "Đường tròn ngoại tiếp và đường tròn nội tiếp của một tam giác",
    "Tứ giác nội tiếp",
    "Đa giác đều",
  ]],
  ["Một số hình khối trong thực tiễn", ["Hình trụ và hình nón", "Hình cầu"]],
  ["Hoạt động thực hành trải nghiệm", [
    "Tính chiều cao và khoảng cách bằng tỉ số lượng giác",
    "Pha chế dung dịch theo nồng độ yêu cầu",
  ]],
  ["Ôn tập cuối năm", ["Ôn tập số và đại số", "Ôn tập hình học và đo lường", "Ôn tập thống kê và xác suất"]],
];

function buildTopics(prefix: string, list: [string, string[]][]): TopicSummary[] {
  return list.map(([title, lessons], i) => ({
    id: `${prefix}-c${i + 1}`,
    index: i + 1,
    title,
    lessons: lessons.map((t, j) => ({ id: `${prefix}-c${i + 1}-b${j + 1}`, index: j + 1, title: t })),
  }));
}

/** Coordinate figure for the basketball problem (printed figure, fixed colours). */
function basketballGraph() {
  const px = (x: number) => 40 + x * 40;
  const py = (y: number) => 440 - y * 40;
  let grid = "";
  for (let x = 0; x <= 12; x++) grid += `<line x1="${px(x)}" y1="${py(-0.6)}" x2="${px(x)}" y2="${py(10.4)}" stroke="#e4e7f0"/>`;
  for (let y = 0; y <= 10; y++) grid += `<line x1="${px(-0.6)}" y1="${py(y)}" x2="${px(12.4)}" y2="${py(y)}" stroke="#e4e7f0"/>`;
  let ticks = "";
  for (let x = 1; x <= 12; x++) ticks += `<text x="${px(x)}" y="${py(0) + 18}" text-anchor="middle">${x}</text>`;
  for (let y = 1; y <= 10; y++) ticks += `<text x="${px(0) - 10}" y="${py(y) + 5}" text-anchor="end">${y}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 480" font-family="sans-serif" font-size="13" fill="#3a4466">
<rect width="560" height="480" fill="#ffffff"/>${grid}
<line x1="${px(-0.6)}" y1="${py(0)}" x2="${px(12.4)}" y2="${py(0)}" stroke="#2b3350" stroke-width="1.5"/>
<line x1="${px(0)}" y1="${py(-0.6)}" x2="${px(0)}" y2="${py(10.4)}" stroke="#2b3350" stroke-width="1.5"/>
${ticks}<text x="${px(12.3)}" y="${py(0) - 8}">x</text><text x="${px(0) + 8}" y="${py(10.2)}">y</text>
<line x1="${px(-0.5)}" y1="${py(9.5)}" x2="${px(10)}" y2="${py(-1)}" stroke="#2f4fa8" stroke-width="2.5"/>
<line x1="${px(-0.5)}" y1="${py(8)}" x2="${px(12)}" y2="${py(-1 / 3)}" stroke="#c4512a" stroke-width="2.5"/>
<text x="${px(6.4)}" y="${py(3.1)}" fill="#2f4fa8" font-weight="bold">x + y = 9</text>
<text x="${px(8.2)}" y="${py(2.5) + 4}" fill="#c4512a" font-weight="bold">2x + 3y = 23</text>
<line x1="${px(4)}" y1="${py(5)}" x2="${px(4)}" y2="${py(0)}" stroke="#2b3350" stroke-dasharray="4 4"/>
<line x1="${px(4)}" y1="${py(5)}" x2="${px(0)}" y2="${py(5)}" stroke="#2b3350" stroke-dasharray="4 4"/>
<circle cx="${px(4)}" cy="${py(5)}" r="6" fill="#c4512a" stroke="#ffffff" stroke-width="2"/>
<text x="${px(4) + 12}" y="${py(5) - 10}" font-weight="bold" fill="#2b3350">(4; 5)</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const v = (id: string, title: string, kind: Video["kind"], teacher: string, durationSec: number, url = YT.a): Video => ({
  id,
  title,
  kind,
  teacher,
  durationSec,
  thumbnailUrl: pic(`video-${id}`),
  url,
});

const lesson1Sections: LessonSection[] = [
  {
    id: "khoi-dong",
    title: "Khởi động",
    blocks: [
      { type: "paragraph", text: "Trong một trận bóng rổ, Nam ném trúng 9 quả và được tất cả 23 điểm. Mỗi quả ném trúng được 2 điểm hoặc 3 điểm." },
      {
        type: "question",
        prompt: "Mỗi loại mấy quả? Nam ném trúng bao nhiêu quả 2 điểm và bao nhiêu quả 3 điểm?",
        hint: "Gọi số quả 2 điểm là $x$, số quả 3 điểm là $y$. Em viết hai điều đã biết thành hai đẳng thức.",
        answer: "Em có hai điều: $x + y = 9$ (9 quả) và $2x + 3y = 23$ (23 điểm). Thử $x = 4$, $y = 5$: $2 \\cdot 4 + 3 \\cdot 5 = 23$. Vậy Nam ném trúng 4 quả 2 điểm và 5 quả 3 điểm. Phần 6 sẽ giải lại cho chắc.",
      },
    ],
  },
  {
    id: "kham-pha",
    title: "Khám phá",
    blocks: [
      { type: "paragraph", text: "Đẳng thức $2x + 3y = 23$ có hai chữ cần tìm là $x$ và $y$. Mỗi chữ chỉ có số mũ bằng 1. Ta gọi đó là một phương trình bậc nhất hai ẩn." },
      { type: "definition", term: "Phương trình bậc nhất hai ẩn", text: "là hệ thức dạng $ax + by = c$, trong đó $a$, $b$, $c$ là các số đã biết, $a \\ne 0$ hoặc $b \\ne 0$." },
      { type: "math", tex: "ax + by = c \\qquad (a \\ne 0 \\text{ hoặc } b \\ne 0)" },
      { type: "definition", term: "Nghiệm của phương trình", text: "Nếu $ax_0 + by_0 = c$ là đẳng thức đúng thì cặp số $(x_0; y_0)$ là một nghiệm của phương trình $ax + by = c$." },
      { type: "paragraph", text: "Phương trình bậc nhất hai ẩn luôn có vô số nghiệm. Trên mặt phẳng toạ độ $Oxy$, các điểm có toạ độ là nghiệm nằm trên một đường thẳng, gọi là đường thẳng $ax + by = c$." },
      { type: "definition", term: "Hệ hai phương trình bậc nhất hai ẩn", text: "gồm hai phương trình bậc nhất hai ẩn viết cạnh nhau, nối bằng dấu ngoặc nhọn:" },
      { type: "math", tex: "\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}" },
      { type: "definition", term: "Nghiệm của hệ", text: "là cặp số $(x_0; y_0)$ đúng với cả hai phương trình. Giải hệ là tìm tất cả các nghiệm của nó." },
    ],
  },
  {
    id: "cac-dang-bai",
    title: "Các dạng bài",
    blocks: [
      {
        type: "example",
        title: "Dạng 1. Nhận biết phương trình bậc nhất hai ẩn",
        problem: "Phương trình nào là phương trình bậc nhất hai ẩn? a) $2x - y = 1$; b) $0x + 3y = 6$; c) $x^2 + y = 4$; d) $0x + 0y = 5$.",
        steps: [
          "Kiểm tra dạng $ax + by = c$, với $a$ và $b$ không cùng bằng 0.",
          "a) $a = 2$, $b = -1$, $c = 1$. Đây là phương trình bậc nhất hai ẩn.",
          "b) $a = 0$ nhưng $b = 3 \\ne 0$. Vẫn là phương trình bậc nhất hai ẩn.",
          "c) Có $x^2$, số mũ bằng 2, nên không phải.",
          "d) Cả $a$ và $b$ đều bằng 0, nên không phải.",
        ],
      },
      {
        type: "example",
        title: "Dạng 2. Kiểm tra một cặp số có là nghiệm không",
        problem: "Cặp số $(1; 2)$ và $(4; 1)$ có phải là nghiệm của phương trình $3x - 2y = -1$ không?",
        steps: [
          "Thay $x = 1$, $y = 2$: $3 \\cdot 1 - 2 \\cdot 2 = -1$. Đúng, nên $(1; 2)$ là nghiệm.",
          "Thay $x = 4$, $y = 1$: $3 \\cdot 4 - 2 \\cdot 1 = 10 \\ne -1$. Sai, nên $(4; 1)$ không là nghiệm.",
        ],
      },
      {
        type: "example",
        title: "Dạng 3. Viết nghiệm tổng quát và vẽ đường thẳng nghiệm",
        problem: "Tìm nghiệm tổng quát của phương trình $2x - y = 3$ và biểu diễn tập nghiệm.",
        steps: [
          "Rút $y$ theo $x$: $y = 2x - 3$.",
          "Nghiệm tổng quát là $(x; 2x - 3)$ với $x$ là số tuỳ ý.",
          "Cho $x = 0$ thì $y = -3$. Cho $x = 2$ thì $y = 1$.",
          "Vẽ đường thẳng đi qua hai điểm $(0; -3)$ và $(2; 1)$. Đó là tập nghiệm.",
        ],
      },
      {
        type: "example",
        title: "Dạng 4. Kiểm tra nghiệm của hệ",
        problem: "Cặp số $(2; -1)$ có là nghiệm của hệ $\\begin{cases} 2x + y = 3 \\\\ x - 3y = 5 \\end{cases}$ không?",
        steps: [
          "Thay vào phương trình thứ nhất: $2 \\cdot 2 + (-1) = 3$. Đúng.",
          "Thay vào phương trình thứ hai: $2 - 3 \\cdot (-1) = 5$. Đúng.",
          "Cặp số đúng với cả hai phương trình nên $(2; -1)$ là nghiệm của hệ.",
        ],
      },
    ],
  },
  {
    id: "van-dung",
    title: "Vận dụng",
    blocks: [
      { type: "paragraph", text: "Nhiều bài toán thực tế có hai đại lượng chưa biết. Em gọi chúng là $x$ và $y$, rồi viết mỗi điều kiện thành một phương trình." },
      {
        type: "example",
        title: "Mua vở và bút",
        problem: "Mẹ mua 3 quyển vở và 2 cái bút hết 34 nghìn đồng. Gọi giá một quyển vở là $x$ nghìn đồng, giá một cái bút là $y$ nghìn đồng. Viết phương trình. Nếu vở giá 8 nghìn đồng thì bút giá bao nhiêu?",
        steps: [
          "Tiền vở là $3x$, tiền bút là $2y$. Ta có $3x + 2y = 34$.",
          "Thay $x = 8$: $24 + 2y = 34$, suy ra $2y = 10$.",
          "Vậy $y = 5$. Mỗi cái bút giá 5 nghìn đồng.",
        ],
      },
      {
        type: "question",
        prompt: "Lớp 9A có 40 bạn. Số bạn nữ nhiều hơn số bạn nam là 4 bạn. Gọi số bạn nam là $x$, số bạn nữ là $y$. Em lập hệ phương trình.",
        hint: "Một phương trình nói về tổng số bạn, một phương trình nói về số bạn chênh lệch.",
        answer: "$x + y = 40$ và $y - x = 4$. Cặp số $(18; 22)$ đúng với cả hai, nên lớp có 18 bạn nam và 22 bạn nữ.",
      },
    ],
  },
  {
    id: "loi-hay-mac",
    title: "Lỗi hay mắc",
    blocks: [
      {
        type: "mistake",
        wrong: "$x^2 + 2y = 5$ là phương trình bậc nhất hai ẩn.",
        right: "$x^2 + 2y = 5$ không phải phương trình bậc nhất hai ẩn.",
        why: "Ẩn $x$ có số mũ 2. Trong phương trình bậc nhất, mỗi ẩn chỉ có số mũ 1.",
      },
      {
        type: "mistake",
        wrong: "Phương trình $2x + 3y = 23$ chỉ có một nghiệm là $(4; 5)$.",
        right: "Phương trình $2x + 3y = 23$ có vô số nghiệm, ví dụ $(4; 5)$, $(1; 7)$, $(10; 1)$.",
        why: "Một phương trình hai ẩn có vô số nghiệm. Muốn chỉ còn một nghiệm, cần thêm phương trình thứ hai để thành hệ.",
      },
      {
        type: "mistake",
        wrong: "$(5; 4)$ đúng với $x + y = 9$ nên là nghiệm của hệ gồm $x + y = 9$ và $2x + 3y = 23$.",
        right: "$(5; 4)$ không phải nghiệm của hệ vì $2 \\cdot 5 + 3 \\cdot 4 = 22 \\ne 23$.",
        why: "Nghiệm của hệ phải đúng với cả hai phương trình. Đúng với một phương trình thì chưa đủ.",
      },
    ],
  },
  {
    id: "tro-lai",
    title: "Trở lại câu hỏi mở đầu",
    blocks: [
      { type: "paragraph", text: "Gọi $x$ là số quả 2 điểm, $y$ là số quả 3 điểm ($x$, $y$ là số tự nhiên). Nam ném trúng 9 quả và được 23 điểm, nên ta có hệ:" },
      { type: "math", tex: "\\begin{cases} x + y = 9 \\\\ 2x + 3y = 23 \\end{cases}" },
      { type: "paragraph", text: "Từ phương trình thứ nhất, $x$ chỉ có thể là $0, 1, 2, \\dots, 9$ và $y = 9 - x$. Thử từng giá trị vào phương trình thứ hai, chỉ có $x = 4$, $y = 5$ cho $2 \\cdot 4 + 3 \\cdot 5 = 8 + 15 = 23$." },
      { type: "image", url: basketballGraph(), alt: "Hai đường thẳng x + y = 9 và 2x + 3y = 23 trên mặt phẳng toạ độ, cắt nhau tại điểm (4; 5).", caption: "Hai đường thẳng $x + y = 9$ và $2x + 3y = 23$ cắt nhau tại điểm $(4; 5)$." },
      { type: "note", text: "Nam ném trúng 4 quả 2 điểm và 5 quả 3 điểm. Ở Bài 2, em sẽ học cách giải hệ nhanh hơn, không cần thử từng số." },
    ],
  },
  {
    id: "ghi-nho",
    title: "Ghi nhớ",
    blocks: [
      { type: "note", text: "Phương trình bậc nhất hai ẩn có dạng $ax + by = c$, với $a$ và $b$ không đồng thời bằng 0." },
      { type: "note", text: "Cặp số $(x_0; y_0)$ là nghiệm khi thay vào được đẳng thức đúng $ax_0 + by_0 = c$." },
      { type: "note", text: "Phương trình bậc nhất hai ẩn có vô số nghiệm. Tập nghiệm là một đường thẳng." },
      { type: "note", text: "Nghiệm của hệ là nghiệm chung của cả hai phương trình." },
    ],
  },
  {
    id: "tu-kiem",
    title: "Tự kiểm",
    blocks: [
      { type: "paragraph", text: "Sáu câu ngắn để em xem mình đã hiểu bài chưa. Chọn một đáp án, máy chấm ngay." },
      {
        type: "quiz",
        questions: [
          { id: "q1", prompt: "Phương trình nào là phương trình bậc nhất hai ẩn?", choices: ["$x^2 - y = 1$", "$3x - 2y = 7$", "$xy + y = 2$", "$0x + 0y = 4$"], answerIndex: 1, explanation: "Chỉ $3x - 2y = 7$ có dạng $ax + by = c$, với $a = 3$ và $b = -2$." },
          { id: "q2", prompt: "Cặp số nào là nghiệm của phương trình $x + 2y = 5$?", choices: ["$(1; 1)$", "$(2; 2)$", "$(3; 1)$", "$(5; 1)$"], answerIndex: 2, explanation: "Thay $(3; 1)$: $3 + 2 \\cdot 1 = 5$. Đúng." },
          { id: "q3", prompt: "Phương trình $2x - y = 4$ có bao nhiêu nghiệm?", choices: ["Không có nghiệm", "Một nghiệm", "Hai nghiệm", "Vô số nghiệm"], answerIndex: 3, explanation: "Với mỗi $x$ ta tìm được $y = 2x - 4$, nên có vô số nghiệm." },
          { id: "q4", prompt: "Nghiệm tổng quát của phương trình $0x + 3y = 6$ là", choices: ["$(x; 2)$ với $x$ tuỳ ý", "$(2; y)$ với $y$ tuỳ ý", "chỉ có $(0; 2)$", "chỉ có $(2; 0)$"], answerIndex: 0, explanation: "$3y = 6$ nên $y = 2$, còn $x$ nhận giá trị bất kì. Tập nghiệm là đường thẳng $y = 2$." },
          { id: "q5", prompt: "Cặp số nào là nghiệm của hệ gồm $x + y = 9$ và $2x + 3y = 23$?", choices: ["$(5; 4)$", "$(4; 5)$", "$(3; 6)$", "$(6; 3)$"], answerIndex: 1, explanation: "$4 + 5 = 9$ và $2 \\cdot 4 + 3 \\cdot 5 = 23$. Cả hai đều đúng." },
          { id: "q6", prompt: "Một hộp có 12 viên bi xanh và đỏ. Gọi số bi xanh là $x$, số bi đỏ là $y$. Phương trình nào đúng?", choices: ["$x - y = 12$", "$xy = 12$", "$x + y = 12$", "$2x + y = 12$"], answerIndex: 2, explanation: "Tổng số bi là $x + y$, nên $x + y = 12$." },
        ],
      },
    ],
  },
];

const lesson2Sections: LessonSection[] = [
  {
    id: "kham-pha",
    title: "Khám phá",
    blocks: [
      { type: "paragraph", text: "Ở Bài 1, em thử từng số để giải bài bóng rổ. Bài này có hai cách giải hệ nhanh và chắc chắn: phương pháp thế và phương pháp cộng đại số." },
      { type: "definition", term: "Phương pháp thế", text: "Từ một phương trình, rút một ẩn theo ẩn kia, rồi thế vào phương trình còn lại để được phương trình một ẩn." },
      { type: "definition", term: "Phương pháp cộng đại số", text: "Nhân hai vế mỗi phương trình với số thích hợp để hệ số của một ẩn đối nhau, rồi cộng hai phương trình để mất ẩn đó." },
    ],
  },
  {
    id: "cac-dang-bai",
    title: "Các dạng bài",
    blocks: [
      {
        type: "example",
        title: "Giải bằng phương pháp thế",
        problem: "Giải hệ $\\begin{cases} x + y = 9 \\\\ 2x + 3y = 23 \\end{cases}$",
        steps: [
          "Từ phương trình thứ nhất: $x = 9 - y$.",
          "Thế vào phương trình thứ hai: $2(9 - y) + 3y = 23$, tức là $18 + y = 23$.",
          "Suy ra $y = 5$, rồi $x = 9 - 5 = 4$.",
          "Hệ có nghiệm duy nhất $(4; 5)$.",
        ],
      },
      {
        type: "example",
        title: "Giải bằng phương pháp cộng đại số",
        problem: "Giải hệ $\\begin{cases} 3x + 2y = 7 \\\\ 5x - 2y = 1 \\end{cases}$",
        steps: [
          "Hệ số của $y$ là $2$ và $-2$, đã đối nhau.",
          "Cộng hai phương trình: $8x = 8$, nên $x = 1$.",
          "Thay vào phương trình thứ nhất: $3 + 2y = 7$, nên $y = 2$.",
          "Hệ có nghiệm duy nhất $(1; 2)$.",
        ],
      },
    ],
  },
  {
    id: "ghi-nho",
    title: "Ghi nhớ",
    blocks: [
      { type: "note", text: "Giải xong, luôn thay nghiệm vào cả hai phương trình để kiểm tra." },
      { type: "note", text: "Hệ có thể có một nghiệm, vô số nghiệm hoặc vô nghiệm, tuỳ hai đường thẳng cắt nhau, trùng nhau hay song song." },
    ],
  },
];

/* --------------------------------------------------------- tiếng việt 5 */

const tv5: Subject = { id: "tieng-viet", name: "Tiếng Việt", grade: 5 };
const tv5Lessons = (i: number) =>
  i === 0
    ? topicDetail.notes.map((n) => n.title.replace(/^Bài \d+\.\s*/, ""))
    : ["Nhận biết và tìm hiểu", "Luyện tập và vận dụng"];

const tvLesson1Sections: LessonSection[] = [
  {
    id: "khoi-dong",
    title: "Khởi động",
    blocks: [
      {
        type: "question",
        prompt: "Em đã bao giờ nhắm mắt, bịt tai rồi lắng nghe tiếng gió chưa? Em nghe thấy gì?",
        hint: "Nghĩ tới một buổi chiều ở sân nhà, bờ ao hay bãi cỏ.",
        answer: "Không có đáp án đúng sai. Có bạn nghe tiếng lá xào xạc, có bạn nghe tiếng nước chảy. Bài đọc hôm nay kể về một trò chơi như thế.",
      },
    ],
  },
  {
    id: "kham-pha",
    title: "Khám phá",
    blocks: [
      { type: "paragraph", text: topicDetail.notes[0].keyPoint },
      { type: "definition", term: "Đọc hiểu một câu chuyện", text: "là trả lời được ba câu hỏi: truyện kể về ai, các bạn làm gì, và các bạn nhận ra điều gì." },
    ],
  },
  {
    id: "doc-them",
    title: "Đọc thêm trong SGK",
    blocks: topicDetail.sgkLessons.map((t) => ({ type: "paragraph" as const, text: t })),
  },
  {
    id: "loi-hay-mac",
    title: "Lỗi hay mắc",
    blocks: [
      {
        type: "mistake",
        wrong: "Kể lại cả câu chuyện từ đầu đến cuối khi được hỏi nội dung chính.",
        right: "Nói nội dung chính trong hai câu: truyện kể về ai, và bạn ấy nhận ra điều gì.",
        why: "Nội dung chính là ý quan trọng nhất của bài, không phải mọi chi tiết.",
      },
    ],
  },
  {
    id: "ghi-nho",
    title: "Ghi nhớ",
    blocks: [{ type: "note", text: topicDetail.outcomes[0] }],
  },
  {
    id: "tu-kiem",
    title: "Tự kiểm",
    blocks: [
      {
        type: "quiz",
        questions: [
          { id: "t1", prompt: "Các bạn nhỏ trong truyện chơi trò gì?", choices: ["Thả diều", "Bịt tai nghe gió", "Đuổi bắt", "Gấp thuyền giấy"], answerIndex: 1, explanation: "Các bạn bịt tai nghe gió bên bờ suối." },
          { id: "t2", prompt: "Sau trò chơi, các bạn thấy thế giới quanh mình thế nào?", choices: ["Buồn tẻ", "Ồn ào", "Mới lạ, thú vị", "Đáng sợ"], answerIndex: 2, explanation: "Truyện cho thấy thế giới trở nên mới lạ, thú vị khi các bạn lắng nghe." },
          { id: "t3", prompt: "Muốn nói nội dung chính của truyện, em nên làm gì?", choices: ["Kể lại từng câu", "Nói truyện kể về ai và nhận ra điều gì", "Chép lại đoạn đầu", "Đọc to cả bài"], answerIndex: 1 },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------- assemble */

const toan9Outline: SubjectOutline = {
  subject: toan9,
  topics: buildTopics("toan-9", toan9Topics),
  generalVideos: [
    v("t9-on-hk1", "Ôn tập học kì 1 Toán 9 trong 45 phút", "lecture", "Cô Nguyễn Thu Trang", 2710, YT.b),
    v("t9-trinh-bay", "Trình bày bài giải gọn và đủ ý", "solution", "Thầy Lê Văn Hùng", 864),
  ],
};

const tv5Outline: SubjectOutline = {
  subject: tv5,
  topics: buildTopics(
    "tieng-viet-5",
    tv5Topics.map((t, i) => [t.title, tv5Lessons(i)]),
  ),
  generalVideos: [v("tv5-doc-hieu", "Cách đọc hiểu một bài văn trong 5 bước", "lecture", "Cô Phạm Mai Anh", 615)],
};

export const initialOutlines: Record<string, SubjectOutline> = {
  "9:toan": toan9Outline,
  "5:tieng-viet": tv5Outline,
};

const base = (id: string, subject: Subject, title: string): LessonDetail => ({
  id,
  grade: subject.grade,
  subject,
  topic: { id: "", index: 1, title: "", count: 1 },
  index: 1,
  lessonCount: 1,
  title,
  outcomes: [],
  videos: [],
  sections: [],
  exerciseCount: 0,
  updatedAt: "2026-10-01T08:00:00",
});

export const initialLessons: Record<string, LessonDetail> = {
  "toan-9-c1-b1": {
    ...base("toan-9-c1-b1", toan9, toan9Topics[0][1][0]),
    outcomes: [
      "Nhận biết phương trình bậc nhất hai ẩn $ax + by = c$ và các hệ số $a$, $b$, $c$.",
      "Kiểm tra một cặp số $(x_0; y_0)$ có phải là nghiệm của phương trình hay không.",
      "Biểu diễn tập nghiệm của phương trình là một đường thẳng trên mặt phẳng toạ độ.",
      "Nhận biết hệ hai phương trình bậc nhất hai ẩn và nghiệm của hệ.",
    ],
    videos: [
      v("t9-c1-b1-giang", "Phương trình bậc nhất hai ẩn là gì?", "lecture", "Cô Nguyễn Thu Trang", 754),
      v("t9-c1-b1-giai", "Giải bài tập SGK trang 9 và 10", "solution", "Thầy Lê Văn Hùng", 1128, YT.b),
    ],
    sections: lesson1Sections,
    exerciseCount: 6,
    updatedAt: "2026-10-08T20:15:00",
  },
  "toan-9-c1-b2": {
    ...base("toan-9-c1-b2", toan9, toan9Topics[0][1][1]),
    outcomes: ["Giải hệ hai phương trình bậc nhất hai ẩn bằng phương pháp thế.", "Giải hệ bằng phương pháp cộng đại số."],
    videos: [v("t9-c1-b2-giang", "Hai cách giải hệ phương trình", "lecture", "Cô Nguyễn Thu Trang", 932)],
    sections: lesson2Sections,
    exerciseCount: 8,
    updatedAt: "2026-10-10T19:40:00",
  },
  "tieng-viet-5-c1-b1": {
    ...base("tieng-viet-5-c1-b1", tv5, tv5Lessons(0)[0]),
    outcomes: [...topicDetail.outcomes, "Nói được nội dung chính của truyện trong hai câu."],
    videos: [v("tv5-c1-b1", "Đọc diễn cảm: Thanh âm của gió", "lecture", "Cô Phạm Mai Anh", 486)],
    sections: tvLesson1Sections,
    exerciseCount: 4,
    updatedAt: "2026-09-30T21:05:00",
  },
  "tieng-viet-5-c1-b2": {
    ...base("tieng-viet-5-c1-b2", tv5, tv5Lessons(0)[1]),
    outcomes: ["Nêu được mỗi màu sắc trong bài thơ gợi ra hình ảnh nào."],
    sections: [
      { id: "kham-pha", title: "Khám phá", blocks: [{ type: "paragraph", text: topicDetail.notes[1].keyPoint }] },
      { id: "ghi-nho", title: "Ghi nhớ", blocks: [{ type: "note", text: "Mỗi màu sắc trong bài thơ gắn với một cảnh vật quen thuộc và tình yêu quê hương của bạn nhỏ." }] },
    ],
    exerciseCount: 3,
  },
};
