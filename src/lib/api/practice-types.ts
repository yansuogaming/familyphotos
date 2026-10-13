// Types for practice (/learn/practice, /learn/review), worked
// textbook exercises (/learn/solutions), exams (/learn/exams), books
// (/learn/books) and study tools (/learn/tools). Builds on lesson-types.ts.
// Text fields marked "rich" may contain inline TeX between $...$.

import type { QuizQuestion, Subject, Video } from "./lesson-types";

/** Fields every practice question has besides its answer. */
interface QuestionMeta {
  /** Worked solution, one step per item (rich). Shown after a wrong answer. */
  steps?: string[];
  /** Optional hint before answering (rich). */
  hint?: string;
}

/** Multiple choice. Same shape as the lesson quiz, plus steps. */
export type ChoiceQuestion = QuizQuestion & QuestionMeta & { type: "choice" };

/** Type in a number. `tolerance` is the allowed absolute error (default 0). */
export type NumberQuestion = QuestionMeta & {
  type: "number";
  id: string;
  prompt: string; // rich
  answer: number;
  tolerance?: number;
  unit?: string; // shown after the input, e.g. "cm"
  explanation?: string; // rich
};

/** A statement the learner marks Đúng or Sai. */
export type TrueFalseQuestion = QuestionMeta & {
  type: "truefalse";
  id: string;
  prompt: string; // rich
  answer: boolean;
  explanation?: string; // rich
};

export type PracticeQuestion = ChoiceQuestion | NumberQuestion | TrueFalseQuestion;

/** What the learner gave. Choice: index. Number: the typed text. True/false: boolean. */
export type AnswerValue = number | string | boolean;

/** A set of questions, usually one lesson ("toan-9-c1-b1") or one math skill. */
export interface PracticeSet {
  id: string; // same as the lesson id when it belongs to a lesson
  title: string;
  grade: number;
  subject: Subject;
  topic?: { index: number; title: string };
  questions: PracticeQuestion[];
}

export interface PracticeLessonEntry {
  id: string; // practice set id
  index: number;
  title: string;
  questionCount: number;
  /** Best score out of 10, if the learner has finished this set before. */
  best?: number;
}

/** Everything available to practise, grouped like the theory outline. */
export interface PracticeCatalogEntry {
  grade: number;
  subject: Subject;
  topics: { id: string; index: number; title: string; lessons: PracticeLessonEntry[] }[];
}

/** Sent after each checked question. */
export interface AnswerRecord {
  setId: string;
  questionId: string;
  correct: boolean;
  skipped?: boolean;
  /** "review" when the answer comes from /learn/review (a correct answer clears the mistake). */
  mode?: "practice" | "review";
}

export interface FinishRecord {
  setId: string;
  correct: number;
  total: number;
  /** Ids answered wrong or skipped. */
  wrongIds: string[];
}

export interface PracticeAttempt extends FinishRecord {
  id: string;
  score: number; // out of 10, one decimal
  finishedAt: string;
}

export interface PracticeToday {
  goal: number;
  done: number;
  streakDays: number;
}

/** A question the learner got wrong, kept until they get it right in Ôn tập. */
export interface Mistake {
  question: PracticeQuestion;
  setId: string;
  setTitle: string;
  grade: number;
  subject: Subject;
  wrongCount: number;
  lastWrongAt: string;
}

// ---------------------------------------------------------------------------
// Góc Toán

// ---------------------------------------------------------------------------
// Giải bài tập SGK

export type BookSeries = "ket-noi" | "chan-troi" | "canh-dieu";

export interface SolutionLesson {
  id: string;
  title: string; // "Bài 1. Khái niệm phương trình..."
  pages: [number, number];
}

export interface ExerciseSummary {
  id: string;
  label: string; // "Bài 1.1", "Luyện tập 2"
  page: number;
  lessonId: string;
  preview: string; // first line of the problem, plain text
  hasVideo: boolean;
}

export interface SolutionStep {
  title?: string; // "Bước 1. Đặt ẩn"
  text: string; // rich
  math?: string; // optional display formula
}

export interface ExerciseDetail extends ExerciseSummary {
  grade: number;
  subject: Subject;
  series: BookSeries;
  lessonTitle: string;
  problem: string; // rich, may contain \n for line breaks
  steps: SolutionStep[];
  answer: string; // rich, "Đáp số"
  video?: Video;
}

export interface ExerciseQuery {
  grade: number;
  subject: string; // subject id
  series: BookSeries;
  lessonId?: string;
  page?: number;
}

// ---------------------------------------------------------------------------
// Đề thi

export type ExamKind = "giua-ky" | "cuoi-ky" | "vao-10" | "thpt";

export interface ExamSummary {
  id: string;
  title: string;
  grade: number;
  subject: Subject;
  kind: ExamKind;
  year: number; // school year start, or exam year for vao-10 / thpt
  durationMin: number;
  questionCount: number;
  source: string; // "Trường THCS Nguyễn Du, Hà Nội"
  pdfUrl: string;
  /** False when only the PDF exists (no online mode). */
  online: boolean;
  /** Best score out of 10 from the learner's attempts. */
  best?: number;
}

export interface ExamPart {
  id: string;
  title: string; // "Phần I. Trắc nghiệm nhiều lựa chọn"
  instructions?: string;
  pointsEach: number;
  questions: PracticeQuestion[];
}

export interface ExamDetail extends ExamSummary {
  parts: ExamPart[];
}

export interface ExamSubmission {
  examId: string;
  answers: Record<string, AnswerValue>;
  usedSec: number;
}

export interface ExamResult {
  examId: string;
  score: number; // out of 10
  correct: number;
  total: number;
  usedSec: number;
  submittedAt: string;
}

// ---------------------------------------------------------------------------
// Sách

export interface BookSummary {
  id: string;
  title: string;
  kind: "sgk" | "doc-them";
  grade: number;
  subject?: string;
  publisher: string;
  coverUrl: string;
  pageCount: number;
}

export interface BookChapter {
  title: string;
  page: number; // first page
}

export interface BookDetail extends BookSummary {
  chapters: BookChapter[];
  /** Page image URL; `{page}` is replaced with the 1-based page number. */
  pageUrlTemplate: string;
  pageWidth: number;
  pageHeight: number;
}

// ---------------------------------------------------------------------------
// Tiện ích: bảng công thức

export interface Formula {
  id: string;
  grade: number;
  subject: "Toán" | "Vật lí" | "Hoá học";
  group: string; // "Hình học", "Đại số"...
  name: string;
  tex: string;
  note?: string; // rich
}
