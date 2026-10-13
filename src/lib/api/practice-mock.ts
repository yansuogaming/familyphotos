// Demo content for practice, worked exercises, exams, books and formulas.
// Fictional schools and people; textbook-style problems are written for the demo.

import type { Subject, Video } from "./lesson-types";
import type {
  BookDetail,
  BookSummary,
  ExamDetail,
  ExamSummary,
  ExerciseDetail,
  Formula,
  Mistake,
  PracticeSet,
  SolutionLesson,
} from "./practice-types";

const subj = (id: string, name: string, grade: number): Subject => ({ id, name, grade });
const toan9 = subj("toan", "Toán", 9);
const toan5 = subj("toan", "Toán", 5);
const tv5 = subj("tieng-viet", "Tiếng Việt", 5);

// ---------------------------------------------------------------------------
// Practice sets

export const practiceSets: PracticeSet[] = [
  {
    id: "toan-9-c1-b1",
    title: "Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn",
    grade: 9,
    subject: toan9,
    topic: { index: 1, title: "Phương trình và hệ hai phương trình bậc nhất hai ẩn" },
    questions: [
      {
        type: "choice",
        id: "t9b1-q1",
        prompt: "Phương trình nào dưới đây là phương trình bậc nhất hai ẩn?",
        choices: ["$x^2 + y = 3$", "$2x - 3y = 5$", "$\\dfrac{1}{x} + y = 1$", "$xy = 4$"],
        answerIndex: 1,
        steps: [
          "Phương trình bậc nhất hai ẩn có dạng $ax + by = c$, trong đó $a$ và $b$ không đồng thời bằng $0$.",
          "$x^2 + y = 3$ có $x^2$, $\\dfrac{1}{x} + y = 1$ có ẩn ở mẫu, $xy = 4$ có tích hai ẩn. Ba phương trình này không có dạng trên.",
          "$2x - 3y = 5$ có dạng $ax + by = c$ với $a = 2$, $b = -3$, $c = 5$. Vậy chọn đáp án này.",
        ],
      },
      {
        type: "choice",
        id: "t9b1-q2",
        prompt: "Cặp số nào là nghiệm của phương trình $2x + y = 5$?",
        choices: ["$(2; 2)$", "$(3; 1)$", "$(1; 3)$", "$(0; 4)$"],
        answerIndex: 2,
        steps: [
          "Thay từng cặp số vào vế trái $2x + y$ rồi so với $5$.",
          "$(2; 2)$: $2 \\cdot 2 + 2 = 6$. $(3; 1)$: $2 \\cdot 3 + 1 = 7$. $(0; 4)$: $0 + 4 = 4$.",
          "$(1; 3)$: $2 \\cdot 1 + 3 = 5$. Đúng bằng vế phải, nên $(1; 3)$ là nghiệm.",
        ],
      },
      {
        type: "truefalse",
        id: "t9b1-q3",
        prompt: "Phương trình $0x + 3y = 6$ là phương trình bậc nhất hai ẩn.",
        answer: true,
        steps: [
          "Điều kiện là $a$ và $b$ không đồng thời bằng $0$.",
          "Ở đây $a = 0$ nhưng $b = 3 \\ne 0$, nên đây vẫn là phương trình bậc nhất hai ẩn.",
        ],
      },
      {
        type: "number",
        id: "t9b1-q4",
        prompt: "Cho phương trình $3x - y = 7$. Khi $x = 2$ thì $y$ bằng bao nhiêu?",
        answer: -1,
        steps: [
          "Thay $x = 2$ vào phương trình: $3 \\cdot 2 - y = 7$.",
          "Ta có $6 - y = 7$, suy ra $y = 6 - 7 = -1$.",
        ],
      },
      {
        type: "choice",
        id: "t9b1-q5",
        prompt: "Phương trình $x - 4y = -2$ có các hệ số $a$, $b$, $c$ là:",
        choices: ["$a = 1,\\ b = 4,\\ c = 2$", "$a = 0,\\ b = -4,\\ c = -2$", "$a = 1,\\ b = -4,\\ c = 2$", "$a = 1,\\ b = -4,\\ c = -2$"],
        answerIndex: 3,
        steps: [
          "So sánh $x - 4y = -2$ với dạng $ax + by = c$.",
          "Hệ số của $x$ là $1$, hệ số của $y$ là $-4$ (giữ cả dấu trừ), vế phải là $-2$.",
          "Vậy $a = 1$, $b = -4$, $c = -2$.",
        ],
      },
      {
        type: "truefalse",
        id: "t9b1-q6",
        prompt: "Mỗi phương trình bậc nhất hai ẩn luôn có vô số nghiệm.",
        answer: true,
        steps: [
          "Với $b \\ne 0$, chọn $x$ tuỳ ý ta luôn tính được $y = \\dfrac{c - ax}{b}$. Mỗi giá trị $x$ cho một nghiệm.",
          "Với $b = 0$ thì $a \\ne 0$, ta có $x = \\dfrac{c}{a}$ còn $y$ tuỳ ý. Vẫn có vô số nghiệm.",
        ],
      },
      {
        type: "choice",
        id: "t9b1-q7",
        prompt: "Nghiệm tổng quát của phương trình $x - y = 1$ là:",
        choices: ["$(x;\\ x + 1)$ với $x \\in \\mathbb{R}$", "$(x;\\ x - 1)$ với $x \\in \\mathbb{R}$", "$(x;\\ 1 - x)$ với $x \\in \\mathbb{R}$", "$(1;\\ y)$ với $y \\in \\mathbb{R}$"],
        answerIndex: 1,
        steps: [
          "Rút $y$ theo $x$: từ $x - y = 1$ chuyển vế được $y = x - 1$.",
          "Mỗi $x$ bất kì cho một nghiệm $(x;\\ x - 1)$. Đó là nghiệm tổng quát.",
          "Thử lại với $x = 3$: $y = 2$ và $3 - 2 = 1$. Đúng.",
        ],
      },
      {
        type: "choice",
        id: "t9b1-q8",
        prompt: "Cặp số $(2; -1)$ là nghiệm của hệ phương trình nào?",
        choices: [
          "$\\begin{cases} x + y = 3 \\\\ x - y = 1 \\end{cases}$",
          "$\\begin{cases} 2x + y = 5 \\\\ x + y = 1 \\end{cases}$",
          "$\\begin{cases} x + y = 1 \\\\ x - y = 3 \\end{cases}$",
          "$\\begin{cases} x - 2y = 0 \\\\ x + y = 1 \\end{cases}$",
        ],
        answerIndex: 2,
        steps: [
          "Một cặp số là nghiệm của hệ khi nó đúng với cả hai phương trình.",
          "Thay $x = 2$, $y = -1$: $x + y = 1$ và $x - y = 3$.",
          "Chỉ hệ $\\begin{cases} x + y = 1 \\\\ x - y = 3 \\end{cases}$ thoả cả hai. Các hệ còn lại sai ít nhất một phương trình.",
        ],
      },
      {
        type: "number",
        id: "t9b1-q9",
        prompt: "Tìm $m$ để cặp số $(1; 2)$ là nghiệm của phương trình $mx + y = 5$.",
        answer: 3,
        steps: [
          "Thay $x = 1$, $y = 2$ vào phương trình: $m \\cdot 1 + 2 = 5$.",
          "Suy ra $m = 5 - 2 = 3$.",
        ],
      },
      {
        type: "truefalse",
        id: "t9b1-q10",
        prompt: "Cặp số $(0; 0)$ là nghiệm của mọi phương trình bậc nhất hai ẩn.",
        answer: false,
        steps: [
          "Thay $(0; 0)$ vào $ax + by = c$ được $0 = c$.",
          "Điều này chỉ đúng khi $c = 0$. Ví dụ $x + y = 2$ không nhận $(0; 0)$ làm nghiệm. Vậy câu này sai.",
        ],
      },
      {
        type: "choice",
        id: "t9b1-q11",
        prompt: "Trên mặt phẳng toạ độ, tập nghiệm của phương trình $0x + y = 2$ được biểu diễn bởi:",
        choices: [
          "Đường thẳng song song với trục tung, đi qua điểm $(2; 0)$",
          "Đường thẳng đi qua gốc toạ độ",
          "Đường thẳng trùng với trục hoành",
          "Đường thẳng song song với trục hoành, cắt trục tung tại điểm $(0; 2)$",
        ],
        answerIndex: 3,
        steps: [
          "Phương trình $0x + y = 2$ nghĩa là $y = 2$ với mọi $x$.",
          "Mọi điểm có tung độ bằng $2$ tạo thành một đường thẳng nằm ngang, tức song song với trục hoành.",
          "Đường thẳng đó cắt trục tung tại $(0; 2)$.",
        ],
      },
      {
        type: "number",
        id: "t9b1-q12",
        prompt: "Mua 2 chiếc bút và 3 quyển vở hết 46 nghìn đồng, tức là $2x + 3y = 46$ ($x$ là giá bút, $y$ là giá vở). Nếu một quyển vở giá 12 nghìn đồng thì một chiếc bút giá bao nhiêu?",
        answer: 5,
        unit: "nghìn đồng",
        steps: [
          "Thay $y = 12$ vào phương trình: $2x + 3 \\cdot 12 = 46$.",
          "Ta có $2x + 36 = 46$, nên $2x = 10$.",
          "Vậy $x = 5$. Một chiếc bút giá 5 nghìn đồng.",
        ],
      },
    ],
  },
  {
    id: "toan-9-c1-b2",
    title: "Giải hệ hai phương trình bậc nhất hai ẩn",
    grade: 9,
    subject: toan9,
    topic: { index: 1, title: "Phương trình và hệ hai phương trình bậc nhất hai ẩn" },
    questions: [
      {
        type: "number",
        id: "t9b2-q1",
        prompt: "Giải hệ $\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}$. Giá trị của $x$ là bao nhiêu?",
        answer: 3,
        steps: [
          "Cộng vế theo vế hai phương trình: $(x + y) + (x - y) = 5 + 1$, tức $2x = 6$.",
          "Suy ra $x = 3$. Thay vào $x + y = 5$ được $y = 2$.",
        ],
      },
      {
        type: "choice",
        id: "t9b2-q2",
        prompt: "Nghiệm của hệ $\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}$ là:",
        choices: ["$(1; 3)$", "$(2; 3)$", "$(3; -1)$", "$(3; 1)$"],
        answerIndex: 3,
        steps: [
          "Cộng vế theo vế: $3x = 9$, nên $x = 3$.",
          "Thay $x = 3$ vào $x - y = 2$: $3 - y = 2$, nên $y = 1$.",
          "Nghiệm của hệ là $(3; 1)$.",
        ],
      },
      {
        type: "truefalse",
        id: "t9b2-q3",
        prompt: "Hệ $\\begin{cases} x + y = 2 \\\\ x + y = 3 \\end{cases}$ vô nghiệm.",
        answer: true,
        steps: [
          "Cùng một biểu thức $x + y$ không thể vừa bằng $2$ vừa bằng $3$.",
          "Trừ vế theo vế được $0 = -1$, vô lí. Vậy hệ vô nghiệm.",
        ],
      },
      {
        type: "choice",
        id: "t9b2-q4",
        prompt: "Dùng phương pháp thế, từ phương trình $x - 2y = 1$ ta rút $x$ được:",
        choices: ["$x = 2y + 1$", "$x = 1 - 2y$", "$x = 2y - 1$", "$y = 2x - 1$"],
        answerIndex: 0,
        steps: ["Chuyển $-2y$ sang vế phải và đổi dấu: $x = 1 + 2y$, tức $x = 2y + 1$."],
      },
      {
        type: "number",
        id: "t9b2-q5",
        prompt: "Giải hệ $\\begin{cases} 3x + 2y = 12 \\\\ x + 2y = 8 \\end{cases}$. Giá trị của $y$ là bao nhiêu?",
        answer: 3,
        steps: [
          "Hai phương trình có cùng hệ số $2y$. Trừ vế theo vế: $2x = 4$, nên $x = 2$.",
          "Thay $x = 2$ vào $x + 2y = 8$: $2y = 6$, nên $y = 3$.",
        ],
      },
      {
        type: "truefalse",
        id: "t9b2-q6",
        prompt: "Hệ $\\begin{cases} x - y = 1 \\\\ 2x - 2y = 2 \\end{cases}$ có đúng một nghiệm.",
        answer: false,
        steps: [
          "Chia hai vế phương trình thứ hai cho $2$ được $x - y = 1$, giống hệt phương trình thứ nhất.",
          "Hai phương trình là một, nên hệ có vô số nghiệm, không phải đúng một nghiệm.",
        ],
      },
    ],
  },
  {
    id: "toan-9-c2-b1",
    title: "Phương trình quy về phương trình bậc nhất một ẩn",
    grade: 9,
    subject: toan9,
    topic: { index: 2, title: "Phương trình và bất phương trình bậc nhất một ẩn" },
    questions: [
      {
        type: "number",
        id: "t9c2-q1",
        prompt: "Phương trình $(x - 3)(2x + 4) = 0$ có một nghiệm âm. Nghiệm đó bằng bao nhiêu?",
        answer: -2,
        steps: [
          "Tích bằng $0$ khi một trong hai thừa số bằng $0$.",
          "$x - 3 = 0$ cho $x = 3$. $2x + 4 = 0$ cho $x = -2$.",
          "Nghiệm âm là $x = -2$.",
        ],
      },
      {
        type: "choice",
        id: "t9c2-q2",
        prompt: "Điều kiện xác định của phương trình $\\dfrac{2}{x - 1} = \\dfrac{3}{x + 2}$ là:",
        choices: ["$x \\ne 1$", "$x \\ne -1$ và $x \\ne 2$", "$x \\ne 1$ và $x \\ne -2$", "$x \\ne 0$"],
        answerIndex: 2,
        steps: [
          "Các mẫu phải khác $0$: $x - 1 \\ne 0$ và $x + 2 \\ne 0$.",
          "Vậy $x \\ne 1$ và $x \\ne -2$.",
        ],
      },
      {
        type: "number",
        id: "t9c2-q3",
        prompt: "Giải phương trình $\\dfrac{2}{x - 1} = \\dfrac{3}{x + 2}$.",
        answer: 7,
        steps: [
          "Điều kiện: $x \\ne 1$ và $x \\ne -2$.",
          "Nhân chéo: $2(x + 2) = 3(x - 1)$, tức $2x + 4 = 3x - 3$.",
          "Suy ra $x = 7$, thoả điều kiện. Vậy $x = 7$.",
        ],
      },
      {
        type: "truefalse",
        id: "t9c2-q4",
        prompt: "Phương trình $x(x + 5) = 0$ có hai nghiệm là $x = 0$ và $x = -5$.",
        answer: true,
        steps: ["$x = 0$ hoặc $x + 5 = 0$, tức $x = -5$. Câu này đúng."],
      },
      {
        type: "choice",
        id: "t9c2-q5",
        prompt: "Tập nghiệm của phương trình $(2x - 1)(x + 3) = 0$ là:",
        choices: ["$\\left\\{-\\tfrac{1}{2};\\ 3\\right\\}$", "$\\left\\{\\tfrac{1}{2};\\ -3\\right\\}$", "$\\{2;\\ -3\\}$", "$\\left\\{\\tfrac{1}{2};\\ 3\\right\\}$"],
        answerIndex: 1,
        steps: [
          "$2x - 1 = 0$ cho $x = \\dfrac{1}{2}$.",
          "$x + 3 = 0$ cho $x = -3$.",
          "Tập nghiệm là $\\left\\{\\tfrac{1}{2};\\ -3\\right\\}$.",
        ],
      },
    ],
  },
  {
    id: "toan-9-c3-b1",
    title: "Căn bậc hai và căn thức bậc hai",
    grade: 9,
    subject: toan9,
    topic: { index: 3, title: "Căn bậc hai và căn bậc ba" },
    questions: [
      {
        type: "number",
        id: "t9c3-q1",
        prompt: "Tính $\\sqrt{49}$.",
        answer: 7,
        steps: ["$7^2 = 49$ và $7 > 0$, nên $\\sqrt{49} = 7$."],
      },
      {
        type: "choice",
        id: "t9c3-q2",
        prompt: "Các căn bậc hai của $16$ là:",
        choices: ["$4$", "$4$ và $-4$", "$-4$", "$8$"],
        answerIndex: 1,
        steps: [
          "Số dương $a$ có đúng hai căn bậc hai là $\\sqrt{a}$ và $-\\sqrt{a}$.",
          "$4^2 = 16$ và $(-4)^2 = 16$. Vậy các căn bậc hai của $16$ là $4$ và $-4$.",
        ],
      },
      {
        type: "truefalse",
        id: "t9c3-q3",
        prompt: "$\\sqrt{(-5)^2} = -5$.",
        answer: false,
        steps: ["Ta có $\\sqrt{A^2} = |A|$.", "Nên $\\sqrt{(-5)^2} = |-5| = 5$, không phải $-5$."],
      },
      {
        type: "choice",
        id: "t9c3-q4",
        prompt: "Căn thức $\\sqrt{x - 3}$ xác định khi:",
        choices: ["$x > 3$", "$x \\le 3$", "$x \\ge -3$", "$x \\ge 3$"],
        answerIndex: 3,
        steps: ["$\\sqrt{A}$ xác định khi $A \\ge 0$.", "$x - 3 \\ge 0$ nên $x \\ge 3$."],
      },
      {
        type: "number",
        id: "t9c3-q5",
        prompt: "Tính $\\sqrt{0{,}25}$.",
        answer: 0.5,
        steps: ["$0{,}5^2 = 0{,}25$, nên $\\sqrt{0{,}25} = 0{,}5$."],
      },
    ],
  },
  {
    id: "toan-5-c2-b1",
    title: "Số thập phân",
    grade: 5,
    subject: toan5,
    topic: { index: 2, title: "Số thập phân" },
    questions: [
      {
        type: "choice",
        id: "t5-q1",
        prompt: "Số thập phân \"ba phẩy không năm\" được viết là:",
        choices: ["$3{,}5$", "$3{,}05$", "$3{,}005$", "$30{,}5$"],
        answerIndex: 1,
        steps: ["Phần nguyên là 3. Sau dấu phẩy: chữ số 0 ở hàng phần mười, 5 ở hàng phần trăm.", "Vậy viết là $3{,}05$."],
      },
      {
        type: "number",
        id: "t5-q2",
        prompt: "Viết phân số thập phân $\\dfrac{7}{10}$ thành số thập phân.",
        answer: 0.7,
        hint: "Mẫu số 10 thì có một chữ số sau dấu phẩy.",
        steps: ["$\\dfrac{7}{10}$ đọc là bảy phần mười.", "Bảy phần mười viết là $0{,}7$."],
      },
      {
        type: "choice",
        id: "t5-q3",
        prompt: "Chữ số 4 trong số $12{,}345$ thuộc hàng nào?",
        choices: ["Hàng phần mười", "Hàng đơn vị", "Hàng phần nghìn", "Hàng phần trăm"],
        answerIndex: 3,
        steps: ["Sau dấu phẩy lần lượt là hàng phần mười, phần trăm, phần nghìn.", "Trong $12{,}345$: 3 ở hàng phần mười, 4 ở hàng phần trăm, 5 ở hàng phần nghìn."],
      },
      {
        type: "truefalse",
        id: "t5-q4",
        prompt: "$0{,}5 = 0{,}50$.",
        answer: true,
        steps: ["Viết thêm chữ số 0 vào bên phải phần thập phân thì giá trị không đổi.", "Vậy $0{,}5 = 0{,}50$."],
      },
      {
        type: "choice",
        id: "t5-q5",
        prompt: "Số lớn nhất trong các số sau là:",
        choices: ["$4{,}09$", "$4{,}19$", "$4{,}9$", "$4{,}091$"],
        answerIndex: 2,
        steps: ["Các số đều có phần nguyên là 4. So sánh hàng phần mười: 0, 1, 9, 0.", "$4{,}9$ có chữ số hàng phần mười lớn nhất, nên lớn nhất."],
      },
      {
        type: "number",
        id: "t5-q6",
        prompt: "Điền số thích hợp: $2{,}5 \\text{ m} = \\ldots \\text{ cm}$",
        answer: 250,
        unit: "cm",
        steps: ["$1 \\text{ m} = 100 \\text{ cm}$.", "$2{,}5 \\times 100 = 250$. Vậy $2{,}5 \\text{ m} = 250 \\text{ cm}$."],
      },
    ],
  },
  {
    id: "tieng-viet-5-c3-b1",
    title: "Từ đồng nghĩa",
    grade: 5,
    subject: tv5,
    topic: { index: 3, title: "Từ đồng nghĩa, từ đa nghĩa" },
    questions: [
      {
        type: "choice",
        id: "tv5-q1",
        prompt: "Từ nào đồng nghĩa với \"siêng năng\"?",
        choices: ["lười biếng", "chăm chỉ", "thông minh", "vui vẻ"],
        answerIndex: 1,
        steps: ["\"Siêng năng\" là chịu khó làm việc, học tập đều đặn.", "\"Chăm chỉ\" có nghĩa giống như vậy. \"Lười biếng\" thì trái nghĩa."],
      },
      {
        type: "choice",
        id: "tv5-q2",
        prompt: "Từ nào không cùng nhóm nghĩa với các từ còn lại?",
        choices: ["Tổ quốc", "đất nước", "trường học", "non sông"],
        answerIndex: 2,
        steps: ["\"Tổ quốc\", \"đất nước\", \"non sông\" đều chỉ đất nước của mình.", "\"Trường học\" là nơi học tập, không cùng nghĩa với ba từ kia."],
      },
      {
        type: "truefalse",
        id: "tv5-q3",
        prompt: "\"Xanh biếc\" và \"xanh lè\" là từ đồng nghĩa hoàn toàn, có thể thay cho nhau trong mọi câu.",
        answer: false,
        steps: [
          "Hai từ cùng chỉ màu xanh nhưng sắc thái khác nhau.",
          "\"Xanh biếc\" gợi màu xanh đẹp, trong. \"Xanh lè\" gợi màu xanh gắt, thường chê. Đây là đồng nghĩa không hoàn toàn.",
        ],
      },
      {
        type: "choice",
        id: "tv5-q4",
        prompt: "Chọn từ hợp nhất để điền: \"Bầu trời mùa thu ... và cao vời vợi.\"",
        choices: ["xanh lè", "xanh xao", "xanh rì", "xanh ngắt"],
        answerIndex: 3,
        steps: [
          "Cần một từ tả màu trời trong, đẹp, trải rộng.",
          "\"Xanh ngắt\" là xanh đậm và đều khắp, hợp với bầu trời. \"Xanh rì\" hợp với cây cỏ, \"xanh xao\" tả nước da.",
        ],
      },
      {
        type: "choice",
        id: "tv5-q5",
        prompt: "Nhóm từ nào gồm các từ đồng nghĩa?",
        choices: ["to, nhỏ, cao", "to lớn, khổng lồ, vĩ đại", "vui, buồn, giận", "đi, chạy, nhảy"],
        answerIndex: 1,
        steps: ["Các từ trong nhóm phải có nghĩa giống hoặc gần giống nhau.", "\"To lớn\", \"khổng lồ\", \"vĩ đại\" đều chỉ cái gì đó rất lớn."],
      },
      {
        type: "truefalse",
        id: "tv5-q6",
        prompt: "\"Học hành\" và \"học tập\" là hai từ đồng nghĩa.",
        answer: true,
        steps: ["Cả hai đều chỉ việc học. Đây là hai từ đồng nghĩa."],
      },
      {
        type: "choice",
        id: "tv5-q7",
        prompt: "Từ nào đồng nghĩa với \"hoà bình\"?",
        choices: ["bình thản", "thái bình", "bình thường", "xung đột"],
        answerIndex: 1,
        steps: ["\"Hoà bình\" là không có chiến tranh, đất nước yên ổn.", "\"Thái bình\" cũng có nghĩa là yên ổn, không có chiến tranh. \"Bình thản\" chỉ tâm trạng một người."],
      },
      {
        type: "choice",
        id: "tv5-q8",
        prompt: "Trong câu \"Lan học rất chăm chỉ.\", có thể thay \"chăm chỉ\" bằng từ nào?",
        choices: ["cần cù", "nhanh nhẹn", "cẩn thận", "ngoan ngoãn"],
        answerIndex: 0,
        steps: ["Thay thử từng từ rồi xem nghĩa câu có giữ nguyên không.", "\"Lan học rất cần cù.\" vẫn giữ nghĩa chịu khó học. Các từ khác làm đổi nghĩa câu."],
      },
      {
        type: "truefalse",
        id: "tv5-q9",
        prompt: "Từ đồng nghĩa là những từ có nghĩa giống nhau hoặc gần giống nhau.",
        answer: true,
        steps: ["Đây đúng là định nghĩa từ đồng nghĩa trong sách Tiếng Việt 5."],
      },
      {
        type: "choice",
        id: "tv5-q10",
        prompt: "Điền từ đồng nghĩa với \"đẹp\": \"Cô bé có đôi mắt rất ... .\"",
        choices: ["mệt mỏi", "chậm chạp", "xinh xắn", "xấu xí"],
        answerIndex: 2,
        steps: ["Cần một từ khen vẻ ngoài, nghĩa gần với \"đẹp\".", "\"Xinh xắn\" là đẹp một cách dễ thương. \"Xấu xí\" thì trái nghĩa."],
      },
    ],
  },
];

/** A few earlier mistakes so Ôn tập has something on first visit. */
export function seedMistakes(): Mistake[] {
  const pick = (setId: string, qid: string, wrongCount: number, lastWrongAt: string): Mistake => {
    const set = practiceSets.find((s) => s.id === setId)!;
    return {
      question: set.questions.find((q) => q.id === qid)!,
      setId,
      setTitle: set.title,
      grade: set.grade,
      subject: set.subject,
      wrongCount,
      lastWrongAt,
    };
  };
  return [
    pick("toan-9-c1-b1", "t9b1-q7", 2, "2026-10-11T19:42:00+07:00"),
    pick("toan-9-c1-b1", "t9b1-q10", 1, "2026-10-11T19:47:00+07:00"),
    pick("toan-9-c1-b2", "t9b2-q6", 1, "2026-10-09T20:15:00+07:00"),
    pick("tieng-viet-5-c3-b1", "tv5-q3", 1, "2026-10-12T18:30:00+07:00"),
  ];
}

// ---------------------------------------------------------------------------
// Góc Toán: chapters and skills. setId null means "đang soạn".

type SkillSeed = { id: string; title: string; setId: string | null };
export const mathOutline: Record<number, { id: string; index: number; title: string; skills: SkillSeed[] }[]> = {
  9: [
    {
      id: "toan-9-c1",
      index: 1,
      title: "Phương trình và hệ hai phương trình bậc nhất hai ẩn",
      skills: [
        { id: "t9-nhan-biet-pt", title: "Nhận biết phương trình, hệ phương trình bậc nhất hai ẩn và nghiệm", setId: "toan-9-c1-b1" },
        { id: "t9-giai-he", title: "Giải hệ bằng phương pháp thế và cộng đại số", setId: "toan-9-c1-b2" },
        { id: "t9-lap-he", title: "Giải bài toán bằng cách lập hệ phương trình", setId: null },
      ],
    },
    {
      id: "toan-9-c2",
      index: 2,
      title: "Phương trình và bất phương trình bậc nhất một ẩn",
      skills: [
        { id: "t9-pt-tich", title: "Phương trình tích và phương trình chứa ẩn ở mẫu", setId: "toan-9-c2-b1" },
        { id: "t9-bat-dang-thuc", title: "Bất đẳng thức và tính chất", setId: null },
        { id: "t9-bpt", title: "Bất phương trình bậc nhất một ẩn", setId: null },
      ],
    },
    {
      id: "toan-9-c3",
      index: 3,
      title: "Căn bậc hai và căn bậc ba",
      skills: [
        { id: "t9-can-bac-hai", title: "Căn bậc hai và điều kiện xác định của căn thức", setId: "toan-9-c3-b1" },
        { id: "t9-khai-can", title: "Khai căn với phép nhân và phép chia", setId: null },
        { id: "t9-bien-doi", title: "Biến đổi đơn giản biểu thức chứa căn", setId: null },
        { id: "t9-can-bac-ba", title: "Căn bậc ba", setId: null },
      ],
    },
  ],
  5: [
    {
      id: "toan-5-c1",
      index: 1,
      title: "Ôn tập và bổ sung",
      skills: [
        { id: "t5-on-so-tu-nhien", title: "Ôn tập số tự nhiên và các phép tính", setId: null },
        { id: "t5-phan-so-thap-phan", title: "Phân số thập phân", setId: null },
      ],
    },
    {
      id: "toan-5-c2",
      index: 2,
      title: "Số thập phân",
      skills: [
        { id: "t5-so-thap-phan", title: "Đọc, viết và so sánh số thập phân", setId: "toan-5-c2-b1" },
        { id: "t5-so-do", title: "Viết số đo đại lượng dưới dạng số thập phân", setId: null },
        { id: "t5-lam-tron", title: "Làm tròn số thập phân", setId: null },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Giải bài tập SGK (Toán 9, Kết nối tri thức)

const solutionVideo: Video = {
  id: "v-ga-cho",
  title: "Bài toán vừa gà vừa chó bằng hệ phương trình",
  kind: "solution",
  thumbnailUrl: "https://picsum.photos/seed/fp-video-ga-cho/640/360",
  url: "https://www.youtube.com/embed/aqz-KE-bpKQ",
  teacher: "Cô Phạm Thu Hà",
  durationSec: 412,
};

export const solutionLessons: Record<string, SolutionLesson[]> = {
  "9:toan:ket-noi": [
    { id: "kntt-toan9-b1", title: "Bài 1. Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn", pages: [5, 10] },
    { id: "kntt-toan9-b2", title: "Bài 2. Giải hệ hai phương trình bậc nhất hai ẩn", pages: [11, 16] },
    { id: "kntt-toan9-b3", title: "Bài 3. Giải bài toán bằng cách lập hệ phương trình", pages: [17, 21] },
  ],
};

const ex = (e: Omit<ExerciseDetail, "grade" | "subject" | "series" | "hasVideo">): ExerciseDetail => ({
  ...e,
  grade: 9,
  subject: toan9,
  series: "ket-noi",
  hasVideo: !!e.video,
});

const b1 = "Bài 1. Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn";
const b2 = "Bài 2. Giải hệ hai phương trình bậc nhất hai ẩn";

export const exercises: ExerciseDetail[] = [
  ex({
    id: "kntt-toan9-b1-lt3",
    label: "Luyện tập 3",
    page: 9,
    lessonId: "kntt-toan9-b1",
    lessonTitle: b1,
    preview: "Cho phương trình 2x - y = 3. Cặp số nào là nghiệm? Viết nghiệm tổng quát.",
    problem: "Cho phương trình $2x - y = 3$.\na) Trong các cặp số $(1; -1)$, $(2; 1)$, $(0; 3)$, cặp số nào là nghiệm của phương trình?\nb) Viết nghiệm tổng quát của phương trình.",
    steps: [
      { title: "Bước 1. Thử từng cặp số", text: "Thay từng cặp vào vế trái $2x - y$ rồi so với $3$." },
      { text: "$(1; -1)$: $2 \\cdot 1 - (-1) = 3$. Đúng, là nghiệm." },
      { text: "$(2; 1)$: $2 \\cdot 2 - 1 = 3$. Đúng, là nghiệm." },
      { text: "$(0; 3)$: $2 \\cdot 0 - 3 = -3 \\ne 3$. Không phải nghiệm." },
      { title: "Bước 2. Rút y theo x", text: "Từ $2x - y = 3$ chuyển vế:", math: "y = 2x - 3" },
      { title: "Bước 3. Kết luận", text: "Mỗi $x$ tuỳ ý cho một nghiệm $(x;\\ 2x - 3)$." },
    ],
    answer: "a) $(1; -1)$ và $(2; 1)$. b) Nghiệm tổng quát $(x;\\ 2x - 3)$ với $x \\in \\mathbb{R}$.",
  }),
  ex({
    id: "kntt-toan9-b1-vd",
    label: "Vận dụng",
    page: 9,
    lessonId: "kntt-toan9-b1",
    lessonTitle: b1,
    preview: "Bài toán cổ: vừa gà vừa chó, bó lại cho tròn, ba mươi sáu con, một trăm chân chẵn.",
    problem: "Bài toán cổ:\n\"Vừa gà vừa chó\nBó lại cho tròn\nBa mươi sáu con\nMột trăm chân chẵn.\"\nGọi $x$ là số gà, $y$ là số chó. Viết hệ phương trình mô tả bài toán và kiểm tra cặp số $(22; 14)$ có phải nghiệm không.",
    steps: [
      { title: "Bước 1. Đếm số con", text: "Tổng số gà và chó là 36 con:", math: "x + y = 36" },
      { title: "Bước 2. Đếm số chân", text: "Mỗi con gà có 2 chân, mỗi con chó có 4 chân, tổng 100 chân:", math: "2x + 4y = 100" },
      { title: "Bước 3. Viết hệ", text: "Ghép hai phương trình:", math: "\\begin{cases} x + y = 36 \\\\ 2x + 4y = 100 \\end{cases}" },
      { title: "Bước 4. Kiểm tra (22; 14)", text: "$22 + 14 = 36$ đúng. $2 \\cdot 22 + 4 \\cdot 14 = 44 + 56 = 100$ đúng." },
    ],
    answer: "Hệ $\\begin{cases} x + y = 36 \\\\ 2x + 4y = 100 \\end{cases}$. Cặp $(22; 14)$ là nghiệm: có 22 con gà và 14 con chó.",
    video: solutionVideo,
  }),
  ex({
    id: "kntt-toan9-b1-1-1",
    label: "Bài 1.1",
    page: 10,
    lessonId: "kntt-toan9-b1",
    lessonTitle: b1,
    preview: "Phương trình nào là phương trình bậc nhất hai ẩn: 5x - 8y = 0, 3x + 0y = 4, 0x + 0y = 3, x² - y = 1.",
    problem: "Trong các phương trình sau, phương trình nào là phương trình bậc nhất hai ẩn?\na) $5x - 8y = 0$\nb) $3x + 0y = 4$\nc) $0x + 0y = 3$\nd) $x^2 - y = 1$",
    steps: [
      { title: "Bước 1. Nhớ dạng tổng quát", text: "Phương trình bậc nhất hai ẩn có dạng $ax + by = c$ với $a$, $b$ không đồng thời bằng $0$." },
      { title: "Bước 2. Xét từng phương trình", text: "a) $a = 5$, $b = -8$. Đúng dạng." },
      { text: "b) $a = 3$, $b = 0$. Vẫn đúng vì $a \\ne 0$." },
      { text: "c) $a = b = 0$. Không phải." },
      { text: "d) Có $x^2$ nên không phải bậc nhất." },
    ],
    answer: "Phương trình a) và b).",
  }),
  ex({
    id: "kntt-toan9-b1-1-2",
    label: "Bài 1.2",
    page: 10,
    lessonId: "kntt-toan9-b1",
    lessonTitle: b1,
    preview: "Cặp số (-2; 1) là nghiệm của phương trình nào: 4x + 3y = -5, 2x - y = 3, x + 0y = -2.",
    problem: "Cặp số $(-2; 1)$ là nghiệm của phương trình nào trong các phương trình sau?\na) $4x + 3y = -5$\nb) $2x - y = 3$\nc) $x + 0y = -2$",
    steps: [
      { title: "Bước 1. Thay x = -2, y = 1", text: "a) $4 \\cdot (-2) + 3 \\cdot 1 = -8 + 3 = -5$. Đúng." },
      { text: "b) $2 \\cdot (-2) - 1 = -5 \\ne 3$. Sai." },
      { text: "c) $-2 + 0 = -2$. Đúng." },
    ],
    answer: "Phương trình a) và c).",
  }),
  ex({
    id: "kntt-toan9-b1-1-3",
    label: "Bài 1.3",
    page: 10,
    lessonId: "kntt-toan9-b1",
    lessonTitle: b1,
    preview: "Viết nghiệm tổng quát và biểu diễn tập nghiệm của phương trình 2x + y = 1 trên mặt phẳng toạ độ.",
    problem: "Viết nghiệm tổng quát và biểu diễn tập nghiệm của phương trình $2x + y = 1$ trên mặt phẳng toạ độ $Oxy$.",
    steps: [
      { title: "Bước 1. Rút y theo x", text: "Chuyển vế:", math: "y = 1 - 2x" },
      { text: "Nghiệm tổng quát là $(x;\\ 1 - 2x)$ với $x \\in \\mathbb{R}$." },
      { title: "Bước 2. Tìm hai điểm", text: "Cho $x = 0$ thì $y = 1$, được điểm $(0; 1)$. Cho $y = 0$ thì $x = \\dfrac{1}{2}$, được điểm $\\left(\\tfrac{1}{2}; 0\\right)$." },
      { title: "Bước 3. Vẽ", text: "Tập nghiệm là đường thẳng đi qua hai điểm $(0; 1)$ và $\\left(\\tfrac{1}{2}; 0\\right)$." },
    ],
    answer: "Nghiệm tổng quát $(x;\\ 1 - 2x)$. Tập nghiệm là đường thẳng $y = 1 - 2x$.",
  }),
  ex({
    id: "kntt-toan9-b1-1-4",
    label: "Bài 1.4",
    page: 10,
    lessonId: "kntt-toan9-b1",
    lessonTitle: b1,
    preview: "Kiểm tra cặp số (2; 3) có là nghiệm của hệ 2x - y = 1, x + y = 5 hay không.",
    problem: "Cặp số $(2; 3)$ có là nghiệm của hệ phương trình $\\begin{cases} 2x - y = 1 \\\\ x + y = 5 \\end{cases}$ hay không?",
    steps: [
      { title: "Bước 1. Thay vào phương trình thứ nhất", text: "$2 \\cdot 2 - 3 = 1$. Đúng." },
      { title: "Bước 2. Thay vào phương trình thứ hai", text: "$2 + 3 = 5$. Đúng." },
      { title: "Bước 3. Kết luận", text: "Cặp số thoả cả hai phương trình nên là nghiệm của hệ." },
    ],
    answer: "Có. $(2; 3)$ là nghiệm của hệ.",
  }),
  ex({
    id: "kntt-toan9-b1-1-5",
    label: "Bài 1.5",
    page: 10,
    lessonId: "kntt-toan9-b1",
    lessonTitle: b1,
    preview: "Tìm m để cặp số (1; 2) là nghiệm của phương trình mx + 3y = 8.",
    problem: "Tìm giá trị của $m$ để cặp số $(1; 2)$ là nghiệm của phương trình $mx + 3y = 8$.",
    steps: [
      { title: "Bước 1. Thay x = 1, y = 2", text: "$m \\cdot 1 + 3 \\cdot 2 = 8$" },
      { title: "Bước 2. Tìm m", text: "$m + 6 = 8$, nên $m = 2$." },
    ],
    answer: "$m = 2$.",
  }),
  ex({
    id: "kntt-toan9-b2-1-6",
    label: "Bài 1.6",
    page: 16,
    lessonId: "kntt-toan9-b2",
    lessonTitle: b2,
    preview: "Giải hệ x - y = 3, 3x - 4y = 2 bằng phương pháp thế.",
    problem: "Giải hệ phương trình bằng phương pháp thế: $\\begin{cases} x - y = 3 \\\\ 3x - 4y = 2 \\end{cases}$",
    steps: [
      { title: "Bước 1. Rút x từ phương trình thứ nhất", text: "", math: "x = y + 3" },
      { title: "Bước 2. Thế vào phương trình thứ hai", text: "$3(y + 3) - 4y = 2$, tức $3y + 9 - 4y = 2$." },
      { text: "$-y = -7$, nên $y = 7$." },
      { title: "Bước 3. Tìm x", text: "$x = 7 + 3 = 10$." },
      { title: "Bước 4. Thử lại", text: "$10 - 7 = 3$ và $3 \\cdot 10 - 4 \\cdot 7 = 2$. Đúng." },
    ],
    answer: "Hệ có nghiệm duy nhất $(10; 7)$.",
  }),
  ex({
    id: "kntt-toan9-b2-1-7",
    label: "Bài 1.7",
    page: 16,
    lessonId: "kntt-toan9-b2",
    lessonTitle: b2,
    preview: "Giải hệ 3x + 2y = 6, 2x - 2y = 14 bằng phương pháp cộng đại số.",
    problem: "Giải hệ phương trình bằng phương pháp cộng đại số: $\\begin{cases} 3x + 2y = 6 \\\\ 2x - 2y = 14 \\end{cases}$",
    steps: [
      { title: "Bước 1. Nhận xét hệ số", text: "Hệ số của $y$ là $2$ và $-2$, đối nhau. Cộng vế theo vế sẽ mất $y$." },
      { title: "Bước 2. Cộng vế theo vế", text: "", math: "5x = 20 \\Rightarrow x = 4" },
      { title: "Bước 3. Tìm y", text: "Thay $x = 4$ vào $3x + 2y = 6$: $12 + 2y = 6$, nên $y = -3$." },
    ],
    answer: "Hệ có nghiệm duy nhất $(4; -3)$.",
  }),
];

// ---------------------------------------------------------------------------
// Đề thi

const pdf = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const passage =
  "Chiều nào cũng vậy, khi mặt trời vừa khuất sau rặng tre đầu làng, ông nội lại dắt chiếc xe đạp cũ ra ngõ chờ bé Na đi học về. Chiếc xe đã tróc sơn, chuông kêu lạch cạch, nhưng với Na, đó là chiếc xe đẹp nhất. Trên đường về, hai ông cháu đi qua cánh đồng lúa đang thì con gái. Gió thổi, lúa nghiêng ngả như sóng. Ông kể ngày xưa ông cũng đi học bằng đôi chân trần trên con đường đất này. Na ngồi sau, ôm lưng ông, thấy lưng ông ấm như một bếp lửa nhỏ. Về đến nhà, Na khẽ nói: \"Mai cháu lớn, cháu sẽ chở ông đi khắp nơi.\"";

export const examDetails: ExamDetail[] = [
  {
    id: "gk1-toan-9-hoa-sen-2025",
    title: "Đề kiểm tra giữa học kì I, Toán 9",
    grade: 9,
    subject: toan9,
    kind: "giua-ky",
    year: 2025,
    durationMin: 45,
    questionCount: 16,
    source: "Trường THCS Hoa Sen, Hà Nội",
    pdfUrl: pdf,
    online: true,
    parts: [
      {
        id: "p1",
        title: "Phần I. Trắc nghiệm nhiều lựa chọn",
        instructions: "Mỗi câu chọn một đáp án. Mỗi câu đúng được 0,5 điểm.",
        pointsEach: 0.5,
        questions: [
          { type: "choice", id: "gk9-1", prompt: "Phương trình nào là phương trình bậc nhất hai ẩn?", choices: ["$x + y^2 = 1$", "$\\dfrac{x}{2} - y = 1$", "$\\sqrt{x} + y = 2$", "$xy = 1$"], answerIndex: 1, explanation: "$\\dfrac{x}{2} - y = 1$ có dạng $ax + by = c$ với $a = \\tfrac{1}{2}$, $b = -1$." },
          { type: "choice", id: "gk9-2", prompt: "Nghiệm của hệ $\\begin{cases} x + y = 4 \\\\ x - y = 2 \\end{cases}$ là:", choices: ["$(1; 3)$", "$(2; 2)$", "$(3; 1)$", "$(4; 0)$"], answerIndex: 2, explanation: "Cộng vế theo vế: $2x = 6$, $x = 3$, rồi $y = 1$." },
          { type: "choice", id: "gk9-3", prompt: "Điều kiện xác định của phương trình $\\dfrac{x + 1}{x - 2} = 3$ là:", choices: ["$x \\ne 2$", "$x \\ne -1$", "$x \\ne -2$", "$x \\ne 3$"], answerIndex: 0, explanation: "Mẫu $x - 2 \\ne 0$ nên $x \\ne 2$." },
          { type: "choice", id: "gk9-4", prompt: "Phương trình $(x + 1)(x - 4) = 0$ có nghiệm là:", choices: ["$x = 1$ hoặc $x = -4$", "$x = -1$", "$x = 4$", "$x = -1$ hoặc $x = 4$"], answerIndex: 3, explanation: "$x + 1 = 0$ hoặc $x - 4 = 0$." },
          { type: "choice", id: "gk9-5", prompt: "Hệ $\\begin{cases} x - 2y = 1 \\\\ -2x + 4y = -2 \\end{cases}$ có:", choices: ["vô nghiệm", "vô số nghiệm", "đúng một nghiệm", "đúng hai nghiệm"], answerIndex: 1, explanation: "Nhân phương trình đầu với $-2$ được đúng phương trình thứ hai, nên hệ có vô số nghiệm." },
          { type: "choice", id: "gk9-6", prompt: "$\\sqrt{81}$ bằng:", choices: ["$-9$", "$\\pm 9$", "$9$", "$40{,}5$"], answerIndex: 2, explanation: "Căn bậc hai số học của $81$ là $9$." },
          { type: "choice", id: "gk9-7", prompt: "Nếu $a > b$ thì:", choices: ["$a + 3 > b + 3$", "$-a > -b$", "$2a < 2b$", "$a - 1 < b - 1$"], answerIndex: 0, explanation: "Cộng cùng một số vào hai vế thì bất đẳng thức không đổi chiều." },
          { type: "choice", id: "gk9-8", prompt: "Nghiệm của bất phương trình $2x - 6 > 0$ là:", choices: ["$x < 3$", "$x > 3$", "$x > -3$", "$x < -3$"], answerIndex: 1, explanation: "$2x > 6$ nên $x > 3$." },
        ],
      },
      {
        id: "p2",
        title: "Phần II. Đúng hay sai",
        instructions: "Mỗi khẳng định chọn Đúng hoặc Sai. Mỗi câu đúng được 0,5 điểm.",
        pointsEach: 0.5,
        questions: [
          { type: "truefalse", id: "gk9-9", prompt: "Cặp số $(1; 1)$ là nghiệm của phương trình $3x - 2y = 1$.", answer: true, explanation: "$3 - 2 = 1$." },
          { type: "truefalse", id: "gk9-10", prompt: "Phương trình $0x + 0y = 5$ là phương trình bậc nhất hai ẩn.", answer: false, explanation: "$a$ và $b$ đều bằng $0$ nên không phải." },
          { type: "truefalse", id: "gk9-11", prompt: "$\\sqrt{(1 - \\sqrt{2})^2} = 1 - \\sqrt{2}$.", answer: false, explanation: "$1 - \\sqrt{2} < 0$ nên $\\sqrt{(1 - \\sqrt{2})^2} = \\sqrt{2} - 1$." },
          { type: "truefalse", id: "gk9-12", prompt: "Nếu $a < b$ thì $-3a > -3b$.", answer: true, explanation: "Nhân hai vế với số âm thì đổi chiều bất đẳng thức." },
        ],
      },
      {
        id: "p3",
        title: "Phần III. Trả lời ngắn",
        instructions: "Ghi kết quả là một số. Mỗi câu đúng được 1 điểm.",
        pointsEach: 1,
        questions: [
          { type: "number", id: "gk9-13", prompt: "Giải hệ $\\begin{cases} 2x + 3y = 13 \\\\ x - y = -1 \\end{cases}$. Tính $x + y$.", answer: 5, explanation: "$x = y - 1$, thế vào được $5y - 2 = 13$, $y = 3$, $x = 2$. Vậy $x + y = 5$." },
          { type: "number", id: "gk9-14", prompt: "Giải phương trình $\\dfrac{3}{x + 1} = \\dfrac{2}{x - 1}$.", answer: 5, explanation: "$3(x - 1) = 2(x + 1)$ nên $x = 5$, thoả điều kiện." },
          { type: "number", id: "gk9-15", prompt: "Tìm số nguyên $x$ lớn nhất thoả mãn $3x + 5 < 20$.", answer: 4, explanation: "$3x < 15$ nên $x < 5$. Số nguyên lớn nhất là $4$." },
          { type: "number", id: "gk9-16", prompt: "Một mảnh vườn hình chữ nhật có chu vi $46$ m, chiều dài hơn chiều rộng $5$ m. Tính diện tích mảnh vườn.", answer: 126, unit: "m²", explanation: "Dài cộng rộng bằng $23$, dài trừ rộng bằng $5$. Dài $14$ m, rộng $9$ m, diện tích $126$ m²." },
        ],
      },
    ],
  },
  {
    id: "ck1-tieng-viet-5-hoa-sen-2025",
    title: "Đề kiểm tra cuối học kì I, Tiếng Việt 5",
    grade: 5,
    subject: tv5,
    kind: "cuoi-ky",
    year: 2025,
    durationMin: 40,
    questionCount: 12,
    source: "Trường Tiểu học Hoa Sen, Hà Nội",
    pdfUrl: pdf,
    online: true,
    parts: [
      {
        id: "p1",
        title: "Phần I. Đọc hiểu",
        instructions: `Đọc đoạn văn rồi trả lời. Mỗi câu đúng được 0,75 điểm.\n\n${passage}`,
        pointsEach: 0.75,
        questions: [
          { type: "choice", id: "ck5-1", prompt: "Ai thường đón Na đi học về?", choices: ["Bố", "Mẹ", "Ông nội", "Bà nội"], answerIndex: 2 },
          { type: "choice", id: "ck5-2", prompt: "Ông đón Na bằng gì?", choices: ["Xe máy", "Chiếc xe đạp cũ", "Đi bộ", "Xe buýt"], answerIndex: 1 },
          { type: "choice", id: "ck5-3", prompt: "Vì sao Na thấy chiếc xe là đẹp nhất?", choices: ["Vì xe mới được sơn lại", "Vì đó là chiếc xe ông dùng để đón Na, chứa tình thương của ông", "Vì chuông xe kêu rất to", "Vì xe chạy nhanh nhất làng"], answerIndex: 1, explanation: "Xe cũ, tróc sơn nhưng gắn với tình thương của ông." },
          { type: "choice", id: "ck5-4", prompt: "Câu \"Gió thổi, lúa nghiêng ngả như sóng.\" dùng biện pháp gì?", choices: ["So sánh", "Nhân hoá", "Điệp từ", "Liệt kê"], answerIndex: 0, explanation: "Từ \"như\" nối lúa với sóng, đó là so sánh." },
          { type: "choice", id: "ck5-5", prompt: "Hình ảnh \"lưng ông ấm như một bếp lửa nhỏ\" cho thấy điều gì?", choices: ["Trời hôm đó rất lạnh", "Ông đang bị sốt", "Tình thương và sự che chở ấm áp của ông", "Ông vừa nấu cơm xong"], answerIndex: 2 },
          { type: "choice", id: "ck5-6", prompt: "Từ nào đồng nghĩa với \"khuất\" trong câu \"mặt trời vừa khuất sau rặng tre\"?", choices: ["hiện ra", "ẩn", "sáng", "mọc"], answerIndex: 1 },
          { type: "choice", id: "ck5-7", prompt: "Câu nói cuối của Na thể hiện điều gì?", choices: ["Na muốn có xe mới", "Na mong lớn lên để chăm sóc, đền đáp ông", "Na không thích đi học", "Na muốn đi du lịch"], answerIndex: 1 },
          { type: "choice", id: "ck5-8", prompt: "Nội dung chính của đoạn văn là gì?", choices: ["Tả cánh đồng lúa", "Kể về chiếc xe đạp", "Kể về trường học của Na", "Tình cảm ấm áp giữa ông và cháu"], answerIndex: 3 },
        ],
      },
      {
        id: "p2",
        title: "Phần II. Luyện từ và câu",
        instructions: "Mỗi khẳng định chọn Đúng hoặc Sai. Mỗi câu đúng được 1 điểm. Bài viết làm trên giấy, không chấm ở đây.",
        pointsEach: 1,
        questions: [
          { type: "truefalse", id: "ck5-9", prompt: "Trong câu \"Chiếc xe đã tróc sơn, chuông kêu lạch cạch\", từ \"lạch cạch\" là từ tượng thanh.", answer: true, explanation: "\"Lạch cạch\" mô phỏng âm thanh." },
          { type: "truefalse", id: "ck5-10", prompt: "Câu \"Gió thổi, lúa nghiêng ngả như sóng.\" là câu ghép.", answer: true, explanation: "Có hai vế: gió / thổi và lúa / nghiêng ngả như sóng." },
          { type: "truefalse", id: "ck5-11", prompt: "Trong câu \"Về đến nhà, Na khẽ nói\", bộ phận \"Về đến nhà\" là chủ ngữ.", answer: false, explanation: "\"Về đến nhà\" là trạng ngữ chỉ thời gian. Chủ ngữ là \"Na\"." },
          { type: "truefalse", id: "ck5-12", prompt: "Trong cụm từ \"rặng tre đầu làng\", từ \"đầu\" được dùng theo nghĩa chuyển.", answer: true, explanation: "Nghĩa gốc của \"đầu\" là bộ phận cơ thể. Ở đây \"đầu làng\" là phần ngoài cùng của làng." },
        ],
      },
    ],
  },
];

const strip = (d: ExamDetail): ExamSummary => {
  const rest: ExamSummary & { parts?: unknown } = { ...d };
  delete rest.parts;
  return rest;
};

export const examLibrary: ExamSummary[] = [
  ...examDetails.map(strip),
  { id: "ck2-toan-9-hoa-sen-2024", title: "Đề kiểm tra cuối học kì II, Toán 9", grade: 9, subject: toan9, kind: "cuoi-ky", year: 2024, durationMin: 90, questionCount: 22, source: "Trường THCS Hoa Sen, Hà Nội", pdfUrl: pdf, online: false },
  { id: "vao10-toan-ha-noi-2025", title: "Đề thi vào lớp 10 môn Toán", grade: 9, subject: toan9, kind: "vao-10", year: 2025, durationMin: 120, questionCount: 5, source: "Sở Giáo dục và Đào tạo Hà Nội", pdfUrl: pdf, online: false },
  { id: "vao10-van-hcm-2025", title: "Đề thi vào lớp 10 môn Ngữ văn", grade: 9, subject: subj("ngu-van", "Ngữ văn", 9), kind: "vao-10", year: 2025, durationMin: 120, questionCount: 3, source: "Sở Giáo dục và Đào tạo TP. Hồ Chí Minh", pdfUrl: pdf, online: false },
  { id: "thpt-toan-2025", title: "Đề thi tốt nghiệp THPT môn Toán", grade: 12, subject: subj("toan", "Toán", 12), kind: "thpt", year: 2025, durationMin: 90, questionCount: 22, source: "Bộ Giáo dục và Đào tạo", pdfUrl: pdf, online: false },
  { id: "thpt-anh-2025", title: "Đề thi tốt nghiệp THPT môn Tiếng Anh", grade: 12, subject: subj("tieng-anh", "Tiếng Anh", 12), kind: "thpt", year: 2025, durationMin: 50, questionCount: 40, source: "Bộ Giáo dục và Đào tạo", pdfUrl: pdf, online: false },
  { id: "gk1-toan-5-hoa-sen-2025", title: "Đề kiểm tra giữa học kì I, Toán 5", grade: 5, subject: toan5, kind: "giua-ky", year: 2025, durationMin: 40, questionCount: 10, source: "Trường Tiểu học Hoa Sen, Hà Nội", pdfUrl: pdf, online: false },
  { id: "gk2-tieng-viet-5-hoa-sen-2024", title: "Đề kiểm tra giữa học kì II, Tiếng Việt 5", grade: 5, subject: tv5, kind: "giua-ky", year: 2024, durationMin: 40, questionCount: 9, source: "Trường Tiểu học Hoa Sen, Hà Nội", pdfUrl: pdf, online: false },
  { id: "ck1-vat-li-11-2025", title: "Đề kiểm tra cuối học kì I, Vật lí 11", grade: 11, subject: subj("vat-li", "Vật lí", 11), kind: "cuoi-ky", year: 2025, durationMin: 45, questionCount: 28, source: "Trường THPT Bạch Đằng, Hải Phòng", pdfUrl: pdf, online: false },
];

// ---------------------------------------------------------------------------
// Sách

const cover = (id: string) => `https://picsum.photos/seed/fp-book-${id}/300/420`;
const book = (b: Omit<BookSummary, "coverUrl">): BookSummary => ({ ...b, coverUrl: cover(b.id) });

export const books: BookSummary[] = [
  book({ id: "sgk-toan-9-t1", title: "Toán 9, tập một", kind: "sgk", grade: 9, subject: "Toán", publisher: "Kết nối tri thức", pageCount: 128 }),
  book({ id: "sgk-van-9-t1", title: "Ngữ văn 9, tập một", kind: "sgk", grade: 9, subject: "Ngữ văn", publisher: "Kết nối tri thức", pageCount: 144 }),
  book({ id: "sgk-khtn-9", title: "Khoa học tự nhiên 9", kind: "sgk", grade: 9, subject: "Khoa học tự nhiên", publisher: "Kết nối tri thức", pageCount: 196 }),
  book({ id: "sgk-su-dia-9", title: "Lịch sử và Địa lí 9", kind: "sgk", grade: 9, subject: "Lịch sử và Địa lí", publisher: "Kết nối tri thức", pageCount: 212 }),
  book({ id: "sgk-anh-9", title: "Tiếng Anh 9 Global Success", kind: "sgk", grade: 9, subject: "Tiếng Anh", publisher: "Kết nối tri thức", pageCount: 120 }),
  book({ id: "sgk-tv-5-t1", title: "Tiếng Việt 5, tập một", kind: "sgk", grade: 5, subject: "Tiếng Việt", publisher: "Kết nối tri thức", pageCount: 152 }),
  book({ id: "sgk-toan-5-t1", title: "Toán 5, tập một", kind: "sgk", grade: 5, subject: "Toán", publisher: "Kết nối tri thức", pageCount: 136 }),
  book({ id: "sgk-khoa-hoc-5", title: "Khoa học 5", kind: "sgk", grade: 5, subject: "Khoa học", publisher: "Kết nối tri thức", pageCount: 112 }),
  book({ id: "sgk-su-dia-5", title: "Lịch sử và Địa lí 5", kind: "sgk", grade: 5, subject: "Lịch sử và Địa lí", publisher: "Kết nối tri thức", pageCount: 124 }),
  book({ id: "dt-de-men", title: "Dế Mèn phiêu lưu kí", kind: "doc-them", grade: 5, publisher: "Tô Hoài", pageCount: 144 }),
  book({ id: "dt-hoang-tu-be", title: "Hoàng tử bé", kind: "doc-them", grade: 5, publisher: "Antoine de Saint-Exupéry", pageCount: 104 }),
  book({ id: "dt-khong-gia-dinh", title: "Không gia đình", kind: "doc-them", grade: 9, publisher: "Hector Malot", pageCount: 320 }),
  book({ id: "dt-tuoi-tho-du-doi", title: "Tuổi thơ dữ dội", kind: "doc-them", grade: 9, publisher: "Phùng Quán", pageCount: 280 }),
  book({ id: "dt-cau-hoi-khoa-hoc", title: "Hỏi gì cũng biết: khoa học quanh em", kind: "doc-them", grade: 5, publisher: "Nhóm cô Vũ Minh Thư", pageCount: 96 }),
];

const chaptersFor = (b: BookSummary): BookDetail["chapters"] => {
  if (b.id === "sgk-toan-9-t1")
    return [
      { title: "Chương I. Phương trình và hệ hai phương trình bậc nhất hai ẩn", page: 5 },
      { title: "Chương II. Phương trình và bất phương trình bậc nhất một ẩn", page: 26 },
      { title: "Chương III. Căn bậc hai và căn bậc ba", page: 44 },
      { title: "Chương IV. Hệ thức lượng trong tam giác vuông", page: 70 },
      { title: "Chương V. Đường tròn", page: 90 },
      { title: "Hoạt động thực hành trải nghiệm", page: 118 },
    ];
  if (b.id === "sgk-tv-5-t1")
    return [
      { title: "Chủ điểm 1. Thế giới tuổi thơ", page: 7 },
      { title: "Chủ điểm 2. Thiên nhiên kì thú", page: 39 },
      { title: "Chủ điểm 3. Trên con đường học tập", page: 71 },
      { title: "Chủ điểm 4. Nghệ thuật muôn màu", page: 105 },
      { title: "Ôn tập và đánh giá cuối học kì I", page: 136 },
    ];
  const n = b.kind === "sgk" ? 5 : 8;
  const step = Math.floor((b.pageCount - 4) / n);
  return Array.from({ length: n }, (_, i) => ({
    title: b.kind === "sgk" ? `Bài học ${i + 1}` : `Chương ${i + 1}`,
    page: 3 + i * step,
  }));
};

export const bookDetail = (b: BookSummary): BookDetail => ({
  ...b,
  chapters: chaptersFor(b),
  pageUrlTemplate: `https://picsum.photos/seed/fp-page-${b.id}-{page}/900/1200`,
  pageWidth: 900,
  pageHeight: 1200,
});

export const seedBookmarks: Record<string, number[]> = { "sgk-toan-9-t1": [9, 26] };

// ---------------------------------------------------------------------------
// Bảng công thức

export const formulas: Formula[] = [
  { id: "f6-chu-vi-hcn", grade: 6, subject: "Toán", group: "Hình học", name: "Chu vi hình chữ nhật", tex: "P = 2(a + b)", note: "$a$ là chiều dài, $b$ là chiều rộng." },
  { id: "f6-dt-hcn", grade: 6, subject: "Toán", group: "Hình học", name: "Diện tích hình chữ nhật", tex: "S = a \\cdot b" },
  { id: "f6-dt-thang", grade: 6, subject: "Toán", group: "Hình học", name: "Diện tích hình thang", tex: "S = \\dfrac{(a + b)\\,h}{2}", note: "$a$, $b$ là hai đáy, $h$ là chiều cao." },
  { id: "f6-dt-thoi", grade: 6, subject: "Toán", group: "Hình học", name: "Diện tích hình thoi", tex: "S = \\dfrac{d_1 \\cdot d_2}{2}", note: "$d_1$, $d_2$ là hai đường chéo." },
  { id: "f6-luy-thua", grade: 6, subject: "Toán", group: "Số học", name: "Nhân hai luỹ thừa cùng cơ số", tex: "a^m \\cdot a^n = a^{m + n}" },
  { id: "f6-chia-luy-thua", grade: 6, subject: "Toán", group: "Số học", name: "Chia hai luỹ thừa cùng cơ số", tex: "a^m : a^n = a^{m - n}\\ (a \\ne 0,\\ m \\ge n)" },
  { id: "f7-tl-thuan", grade: 7, subject: "Toán", group: "Đại số", name: "Đại lượng tỉ lệ thuận", tex: "y = kx\\ (k \\ne 0)" },
  { id: "f7-tl-nghich", grade: 7, subject: "Toán", group: "Đại số", name: "Đại lượng tỉ lệ nghịch", tex: "y = \\dfrac{a}{x}\\ (a \\ne 0)" },
  { id: "f7-day-ti-so", grade: 7, subject: "Toán", group: "Đại số", name: "Tính chất dãy tỉ số bằng nhau", tex: "\\dfrac{a}{b} = \\dfrac{c}{d} = \\dfrac{a + c}{b + d}" },
  { id: "f7-tong-goc", grade: 7, subject: "Toán", group: "Hình học", name: "Tổng ba góc trong tam giác", tex: "\\hat{A} + \\hat{B} + \\hat{C} = 180^\\circ" },
  { id: "f7-v-hop", grade: 7, subject: "Vật lí", group: "Chuyển động", name: "Tốc độ", tex: "v = \\dfrac{s}{t}", note: "$s$ là quãng đường, $t$ là thời gian." },
  { id: "f8-hdt1", grade: 8, subject: "Toán", group: "Hằng đẳng thức", name: "Bình phương của một tổng", tex: "(a + b)^2 = a^2 + 2ab + b^2" },
  { id: "f8-hdt2", grade: 8, subject: "Toán", group: "Hằng đẳng thức", name: "Bình phương của một hiệu", tex: "(a - b)^2 = a^2 - 2ab + b^2" },
  { id: "f8-hdt3", grade: 8, subject: "Toán", group: "Hằng đẳng thức", name: "Hiệu hai bình phương", tex: "a^2 - b^2 = (a - b)(a + b)" },
  { id: "f8-hdt4", grade: 8, subject: "Toán", group: "Hằng đẳng thức", name: "Lập phương của một tổng", tex: "(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3" },
  { id: "f8-pytago", grade: 8, subject: "Toán", group: "Hình học", name: "Định lí Pythagore", tex: "a^2 = b^2 + c^2", note: "Tam giác vuông có cạnh huyền $a$." },
  { id: "f8-ap-suat", grade: 8, subject: "Vật lí", group: "Áp suất", name: "Áp suất", tex: "p = \\dfrac{F}{S}" },
  { id: "f8-khoi-luong-rieng", grade: 8, subject: "Vật lí", group: "Khối lượng riêng", name: "Khối lượng riêng", tex: "D = \\dfrac{m}{V}" },
  { id: "f8-mol", grade: 8, subject: "Hoá học", group: "Mol", name: "Số mol theo khối lượng", tex: "n = \\dfrac{m}{M}" },
  { id: "f9-delta", grade: 9, subject: "Toán", group: "Đại số", name: "Biệt thức của phương trình bậc hai", tex: "\\Delta = b^2 - 4ac" },
  { id: "f9-nghiem-bac-hai", grade: 9, subject: "Toán", group: "Đại số", name: "Công thức nghiệm phương trình bậc hai", tex: "x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}", note: "Dùng khi $\\Delta \\ge 0$." },
  { id: "f9-viet", grade: 9, subject: "Toán", group: "Đại số", name: "Định lí Viète", tex: "x_1 + x_2 = -\\dfrac{b}{a},\\quad x_1 x_2 = \\dfrac{c}{a}" },
  { id: "f9-can", grade: 9, subject: "Toán", group: "Căn thức", name: "Căn bậc hai của bình phương", tex: "\\sqrt{A^2} = |A|" },
  { id: "f9-can-tich", grade: 9, subject: "Toán", group: "Căn thức", name: "Khai căn một tích", tex: "\\sqrt{AB} = \\sqrt{A} \\cdot \\sqrt{B}\\ (A, B \\ge 0)" },
  { id: "f9-sin", grade: 9, subject: "Toán", group: "Lượng giác", name: "Tỉ số lượng giác của góc nhọn", tex: "\\sin\\alpha = \\dfrac{\\text{đối}}{\\text{huyền}},\\ \\cos\\alpha = \\dfrac{\\text{kề}}{\\text{huyền}},\\ \\tan\\alpha = \\dfrac{\\text{đối}}{\\text{kề}}" },
  { id: "f9-chu-vi-tron", grade: 9, subject: "Toán", group: "Hình học", name: "Độ dài đường tròn", tex: "C = 2\\pi R" },
  { id: "f9-dt-tron", grade: 9, subject: "Toán", group: "Hình học", name: "Diện tích hình tròn", tex: "S = \\pi R^2" },
  { id: "f9-ohm", grade: 9, subject: "Vật lí", group: "Điện", name: "Định luật Ohm", tex: "I = \\dfrac{U}{R}" },
  { id: "f9-cong-suat", grade: 9, subject: "Vật lí", group: "Điện", name: "Công suất điện", tex: "P = U \\cdot I" },
  { id: "f10-cos", grade: 10, subject: "Toán", group: "Hình học", name: "Định lí côsin", tex: "a^2 = b^2 + c^2 - 2bc\\cos A" },
  { id: "f10-sin", grade: 10, subject: "Toán", group: "Hình học", name: "Định lí sin", tex: "\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C} = 2R" },
  { id: "f10-dinh-parabol", grade: 10, subject: "Toán", group: "Hàm số", name: "Đỉnh của parabol", tex: "I\\left(-\\dfrac{b}{2a};\\ -\\dfrac{\\Delta}{4a}\\right)" },
  { id: "f10-newton2", grade: 10, subject: "Vật lí", group: "Động lực học", name: "Định luật II Newton", tex: "\\vec{F} = m\\vec{a}" },
  { id: "f10-dong-nang", grade: 10, subject: "Vật lí", group: "Năng lượng", name: "Động năng", tex: "W_đ = \\dfrac{1}{2}mv^2" },
  { id: "f11-cap-so-cong", grade: 11, subject: "Toán", group: "Dãy số", name: "Số hạng tổng quát cấp số cộng", tex: "u_n = u_1 + (n - 1)d" },
  { id: "f11-cap-so-nhan", grade: 11, subject: "Toán", group: "Dãy số", name: "Số hạng tổng quát cấp số nhân", tex: "u_n = u_1 \\cdot q^{n - 1}" },
  { id: "f11-sin2x", grade: 11, subject: "Toán", group: "Lượng giác", name: "Công thức nhân đôi", tex: "\\sin 2x = 2\\sin x\\cos x" },
  { id: "f12-dao-ham", grade: 12, subject: "Toán", group: "Giải tích", name: "Đạo hàm của luỹ thừa", tex: "(x^n)' = n x^{n - 1}" },
  { id: "f12-nguyen-ham", grade: 12, subject: "Toán", group: "Giải tích", name: "Nguyên hàm của luỹ thừa", tex: "\\int x^n\\,dx = \\dfrac{x^{n + 1}}{n + 1} + C\\ (n \\ne -1)" },
  { id: "f12-log", grade: 12, subject: "Toán", group: "Mũ và lôgarit", name: "Lôgarit của một tích", tex: "\\log_a(bc) = \\log_a b + \\log_a c" },
];
