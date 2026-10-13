// Practice, worked exercises, exams, books and study-tool data. Contract: docs/api/practice.md.
import { http } from "./core";
import type {
  AnswerRecord,
  AnswerValue,
  BookDetail,
  BookSeries,
  BookSummary,
  ExamDetail,
  ExamResult,
  ExamSubmission,
  ExamSummary,
  ExerciseDetail,
  ExerciseQuery,
  ExerciseSummary,
  FinishRecord,
  Formula,
  Mistake,
  PracticeAttempt,
  PracticeCatalogEntry,
  PracticeQuestion,
  PracticeSet,
  PracticeToday,
  SolutionLesson,
} from "./practice-types";

// ---------- pure helpers (the UI grades instantly; the backend records) ----------

/** Parses "0,7", "-1", "1/2", "2.5". Returns null when it is not a number. */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(/\s+/g, "").replace(",", ".").replace("−", "-");
  if (!t) return null;
  const frac = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(t);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  return Number(t);
}

export function isCorrect(q: PracticeQuestion, value: AnswerValue | undefined): boolean {
  if (value === undefined) return false;
  switch (q.type) {
    case "choice":
      return value === q.answerIndex;
    case "truefalse":
      return value === q.answer;
    case "number": {
      const n = typeof value === "number" ? value : parseNumber(String(value));
      return n !== null && Math.abs(n - q.answer) <= (q.tolerance ?? 1e-9);
    }
  }
}

/** Score out of 10 with one decimal. */
export const scoreOf = (correct: number, total: number) => (total ? Math.round((correct / total) * 100) / 10 : 0);

/** "8,5" style. */
export const formatScore = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

export const seriesNames: Record<BookSeries, string> = {
  "ket-noi": "Kết nối tri thức",
  "chan-troi": "Chân trời sáng tạo",
  "canh-dieu": "Cánh diều",
};

// ---------- endpoints ----------

const enc = encodeURIComponent;
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const qs = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();

export const practiceApi = {
  /** Everything that can be practised, grouped by grade, subject and topic. */
  catalog: (): Promise<PracticeCatalogEntry[]> => http("/practice/catalog"),
  /** One practice set, e.g. "toan-9-c1-b1". 404 when the lesson has no exercises yet. */
  set: (id: string): Promise<PracticeSet> => http(`/practice/sets/${enc(id)}`),
  /** Today's goal, shared with /learn. */
  today: (): Promise<PracticeToday> => http("/practice/today"),
  /** Record one checked question. Updates today's count and the mistake list. */
  answer: (rec: AnswerRecord): Promise<PracticeToday> => http("/practice/answers", json("POST", rec)),
  /** Save a finished session. */
  finish: (rec: FinishRecord): Promise<PracticeAttempt> => http("/practice/attempts", json("POST", rec)),
  attempts: (setId?: string): Promise<PracticeAttempt[]> => http(`/practice/attempts?${qs({ set: setId })}`),
  /** Questions answered wrong and not yet fixed in review, newest first. */
  mistakes: (): Promise<Mistake[]> => http("/practice/mistakes"),
  dismissMistake: (questionId: string): Promise<void> => http(`/practice/mistakes/${enc(questionId)}`, { method: "DELETE" }),

  // SGK solutions
  solutionLessons: (q: { grade: number; subject: string; series: BookSeries }): Promise<SolutionLesson[]> => http(`/solutions/lessons?${qs(q)}`),
  exercises: (q: ExerciseQuery): Promise<ExerciseSummary[]> => http(`/solutions/exercises?${qs({ ...q, lesson: q.lessonId, lessonId: undefined })}`),
  exercise: (id: string): Promise<ExerciseDetail> => http(`/solutions/exercises/${enc(id)}`),

  // exams
  exams: (): Promise<ExamSummary[]> => http("/exams"),
  /** Full exam. PDF-only exams come back with `parts: []`. */
  exam: (id: string): Promise<ExamDetail> => http(`/exams/${enc(id)}`),
  submitExam: (sub: ExamSubmission): Promise<ExamResult> => http(`/exams/${enc(sub.examId)}/submissions`, json("POST", sub)),

  // books
  books: (): Promise<BookSummary[]> => http("/books"),
  book: (id: string): Promise<BookDetail> => http(`/books/${enc(id)}`),
  bookmarks: (bookId: string): Promise<number[]> => http(`/books/${enc(bookId)}/bookmarks`),
  /** Adds or removes a bookmark, returns the new sorted list. */
  toggleBookmark: (bookId: string, page: number): Promise<number[]> => http(`/books/${enc(bookId)}/bookmarks/${page}`, { method: "PUT" }),

  // study tools
  formulas: (): Promise<Formula[]> => http("/formulas"),
};
