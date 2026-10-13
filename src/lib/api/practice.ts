// Practice, worked exercises, exams, books and study-tool data.
// Endpoints are documented in docs/api/practice.md.

import { ApiError, BASE, fake, http, persisted } from "./core";
import { learningToday } from "./mock-data";
import {
  bookDetail,
  books,
  examDetails,
  examLibrary,
  exercises,
  formulas,
  mathOutline,
  practiceSets,
  seedBookmarks,
  seedMistakes,
  solutionLessons,
} from "./practice-mock";
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
  MathChapter,
  Mistake,
  PracticeAttempt,
  PracticeCatalogEntry,
  PracticeQuestion,
  PracticeSet,
  PracticeToday,
  SolutionLesson,
} from "./practice-types";

// ---------------------------------------------------------------------------
// Pure helpers (used by the UI to grade instantly, and by the mock)

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

// ---------------------------------------------------------------------------
// Mock stores

const attemptsStore = persisted<PracticeAttempt[]>("practice:attempts", []);
const mistakesStore = persisted<Mistake[]>("practice:mistakes", seedMistakes());
const correctStore = persisted<Record<string, string[]>>("practice:correct", {});
const todayStore = persisted<{ date: string | null; done: number }>("practice:today", { date: null, done: learningToday.done });
const examResultsStore = persisted<ExamResult[]>("practice:exam-results", []);
const bookmarksStore = persisted<Record<string, number[]>>("practice:bookmarks", seedBookmarks);

const dayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function readToday(): PracticeToday {
  const t = todayStore.get();
  const done = t.date === null || t.date === dayKey() ? t.done : 0;
  return { goal: learningToday.goal, done, streakDays: learningToday.streakDays };
}

const bestOf = (setId: string) => {
  const scores = attemptsStore.get().filter((a) => a.setId === setId).map((a) => a.score);
  return scores.length ? Math.max(...scores) : undefined;
};

function findSet(id: string): PracticeSet {
  const set = practiceSets.find((s) => s.id === id);
  if (!set) throw new ApiError(404, "Bài này chưa có câu luyện tập");
  return set;
}

function buildCatalog(): PracticeCatalogEntry[] {
  const out: PracticeCatalogEntry[] = [];
  for (const s of practiceSets) {
    let entry = out.find((e) => e.grade === s.grade && e.subject.id === s.subject.id);
    if (!entry) out.push((entry = { grade: s.grade, subject: s.subject, topics: [] }));
    const tIndex = s.topic?.index ?? 1;
    let topic = entry.topics.find((t) => t.index === tIndex);
    if (!topic) entry.topics.push((topic = { id: `${s.subject.id}-${s.grade}-c${tIndex}`, index: tIndex, title: s.topic?.title ?? s.subject.name, lessons: [] }));
    const lessonIndex = Number(/-b(\d+)$/.exec(s.id)?.[1] ?? topic.lessons.length + 1);
    topic.lessons.push({ id: s.id, index: lessonIndex, title: s.title, questionCount: s.questions.length, best: bestOf(s.id) });
  }
  out.forEach((e) => e.topics.sort((a, b) => a.index - b.index));
  return out;
}

function gradeExam(sub: ExamSubmission): ExamResult {
  const exam = examDetails.find((e) => e.id === sub.examId);
  if (!exam) throw new ApiError(404, "Không tìm thấy đề");
  let earned = 0;
  let max = 0;
  let correct = 0;
  let total = 0;
  for (const part of exam.parts) {
    for (const q of part.questions) {
      max += part.pointsEach;
      total += 1;
      if (isCorrect(q, sub.answers[q.id])) {
        earned += part.pointsEach;
        correct += 1;
      }
    }
  }
  const score = max ? Math.round((earned / max) * 1000) / 100 : 0;
  return { examId: exam.id, score, correct, total, usedSec: sub.usedSec, submittedAt: new Date().toISOString() };
}

const qs = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();

// ---------------------------------------------------------------------------

export const practiceApi = {
  /** Everything that can be practised, grouped by grade, subject and topic. */
  catalog: (): Promise<PracticeCatalogEntry[]> => (BASE ? http("/practice/catalog") : fake(buildCatalog())),

  /** One practice set, e.g. "toan-9-c1-b1". 404 when the lesson has no exercises yet. */
  set: async (id: string): Promise<PracticeSet> => (BASE ? http(`/practice/sets/${encodeURIComponent(id)}`) : fake(findSet(id))),

  /** Today's goal, shared with /hoc (DailyTicks). */
  today: (): Promise<PracticeToday> => (BASE ? http("/practice/today") : fake(readToday(), 200)),

  /** Record one checked question. Updates today's count and the mistake list. */
  answer: async (rec: AnswerRecord): Promise<PracticeToday> => {
    if (BASE) return http("/practice/answers", { method: "POST", body: JSON.stringify(rec) });
    const t = readToday();
    todayStore.set({ date: dayKey(), done: t.done + 1 });
    if (rec.correct) {
      correctStore.update((m) => ({ ...m, [rec.setId]: [...new Set([...(m[rec.setId] ?? []), rec.questionId])] }));
      if (rec.mode === "review") mistakesStore.update((list) => list.filter((x) => x.question.id !== rec.questionId));
    } else {
      const set = practiceSets.find((s) => s.id === rec.setId);
      const question = set?.questions.find((q) => q.id === rec.questionId);
      if (set && question) {
        mistakesStore.update((list) => {
          const old = list.find((x) => x.question.id === rec.questionId);
          const rest = list.filter((x) => x.question.id !== rec.questionId);
          return [
            { question, setId: set.id, setTitle: set.title, grade: set.grade, subject: set.subject, wrongCount: (old?.wrongCount ?? 0) + 1, lastWrongAt: new Date().toISOString() },
            ...rest,
          ];
        });
      }
    }
    return fake(readToday(), 120);
  },

  /** Save a finished session. */
  finish: async (rec: FinishRecord): Promise<PracticeAttempt> => {
    if (BASE) return http("/practice/attempts", { method: "POST", body: JSON.stringify(rec) });
    const attempt: PracticeAttempt = { ...rec, id: `a-${Date.now()}`, score: scoreOf(rec.correct, rec.total), finishedAt: new Date().toISOString() };
    attemptsStore.update((list) => [attempt, ...list].slice(0, 200));
    return fake(attempt, 150);
  },

  attempts: (setId?: string): Promise<PracticeAttempt[]> =>
    BASE ? http(`/practice/attempts?${qs({ set: setId })}`) : fake(attemptsStore.get().filter((a) => !setId || a.setId === setId)),

  /** Questions answered wrong and not yet fixed in Ôn tập, newest first. */
  mistakes: (): Promise<Mistake[]> => (BASE ? http("/practice/mistakes") : fake(mistakesStore.get())),

  /** Remove a mistake without answering (Bỏ khỏi danh sách). */
  dismissMistake: async (questionId: string): Promise<void> => {
    if (BASE) return http(`/practice/mistakes/${encodeURIComponent(questionId)}`, { method: "DELETE" });
    mistakesStore.update((list) => list.filter((x) => x.question.id !== questionId));
    return fake(undefined, 150);
  },

  /** Góc Toán: chapters and skills for one grade, with progress. */
  mathOutline: (grade: number): Promise<MathChapter[]> => {
    if (BASE) return http(`/practice/math/${grade}`);
    const correct = correctStore.get();
    const chapters: MathChapter[] = (mathOutline[grade] ?? []).map((c) => ({
      ...c,
      skills: c.skills.map((s) => {
        const set = s.setId ? practiceSets.find((p) => p.id === s.setId) : undefined;
        return { ...s, setId: set ? s.setId : null, questionCount: set?.questions.length ?? 0, mastered: set ? (correct[set.id]?.length ?? 0) : 0 };
      }),
    }));
    return fake(chapters);
  },

  // --- Giải bài tập SGK ----------------------------------------------------

  solutionLessons: (q: { grade: number; subject: string; series: BookSeries }): Promise<SolutionLesson[]> =>
    BASE ? http(`/solutions/lessons?${qs(q)}`) : fake(solutionLessons[`${q.grade}:${q.subject}:${q.series}`] ?? []),

  exercises: (q: ExerciseQuery): Promise<ExerciseSummary[]> => {
    if (BASE) return http(`/solutions/exercises?${qs({ ...q, lesson: q.lessonId, lessonId: undefined })}`);
    const list = exercises
      .filter((e) => e.grade === q.grade && e.subject.id === q.subject && e.series === q.series)
      .filter((e) => !q.lessonId || e.lessonId === q.lessonId)
      .filter((e) => !q.page || e.page === q.page)
      .map(({ id, label, page, lessonId, preview, hasVideo }) => ({ id, label, page, lessonId, preview, hasVideo }));
    return fake(list);
  },

  exercise: async (id: string): Promise<ExerciseDetail> => {
    if (BASE) return http(`/solutions/exercises/${encodeURIComponent(id)}`);
    const e = exercises.find((x) => x.id === id);
    if (!e) throw new ApiError(404, "Không tìm thấy bài tập");
    return fake(e);
  },

  // --- Đề thi ---------------------------------------------------------------

  exams: (): Promise<ExamSummary[]> => {
    if (BASE) return http("/exams");
    const results = examResultsStore.get();
    return fake(
      examLibrary.map((e) => {
        const scores = results.filter((r) => r.examId === e.id).map((r) => r.score);
        return scores.length ? { ...e, best: Math.max(...scores) } : e;
      }),
    );
  },

  /** Full exam. PDF-only exams come back with `parts: []`. */
  exam: async (id: string): Promise<ExamDetail> => {
    if (BASE) return http(`/exams/${encodeURIComponent(id)}`);
    const full = examDetails.find((e) => e.id === id);
    if (full) return fake(full);
    const summary = examLibrary.find((e) => e.id === id);
    if (!summary) throw new ApiError(404, "Không tìm thấy đề");
    return fake({ ...summary, parts: [] });
  },

  submitExam: async (sub: ExamSubmission): Promise<ExamResult> => {
    if (BASE) return http(`/exams/${encodeURIComponent(sub.examId)}/submissions`, { method: "POST", body: JSON.stringify(sub) });
    const result = gradeExam(sub);
    examResultsStore.update((list) => [result, ...list].slice(0, 100));
    return fake(result, 500);
  },

  // --- Sách -----------------------------------------------------------------

  books: (): Promise<BookSummary[]> => (BASE ? http("/books") : fake(books)),

  book: async (id: string): Promise<BookDetail> => {
    if (BASE) return http(`/books/${encodeURIComponent(id)}`);
    const b = books.find((x) => x.id === id);
    if (!b) throw new ApiError(404, "Không tìm thấy sách");
    return fake(bookDetail(b));
  },

  bookmarks: (bookId: string): Promise<number[]> =>
    BASE ? http(`/books/${encodeURIComponent(bookId)}/bookmarks`) : fake(bookmarksStore.get()[bookId] ?? [], 150),

  /** Adds or removes a bookmark, returns the new sorted list. */
  toggleBookmark: async (bookId: string, page: number): Promise<number[]> => {
    if (BASE) return http(`/books/${encodeURIComponent(bookId)}/bookmarks/${page}`, { method: "PUT" });
    const next = bookmarksStore.update((all) => {
      const cur = all[bookId] ?? [];
      const list = cur.includes(page) ? cur.filter((p) => p !== page) : [...cur, page].sort((a, b) => a - b);
      return { ...all, [bookId]: list };
    });
    return fake(next[bookId], 120);
  },

  // --- Tiện ích -------------------------------------------------------------

  formulas: (): Promise<Formula[]> => (BASE ? http("/formulas") : fake(formulas)),
};
