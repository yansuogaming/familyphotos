// AI drafting for the admin lesson studio (/admin/lessons). The backend calls the
// AI provider with the family's shared key; the browser never does.
// Mirrored in docs/api/lesson-ai.md.
import type { LessonBlock, QuizQuestion } from "./lesson-types";

/**
 * What to draft:
 * - quiz: self-check questions (QuizQuestion) for the "Tự kiểm" part
 * - outcomes: lesson goals, one sentence each ("Sau bài này em...")
 * - examples: worked examples (LessonBlock type "example")
 * - mistakes: common mistakes (LessonBlock type "mistake")
 * - warmup: opening questions (LessonBlock type "question")
 * - outline: topics and lesson titles for a whole subject of one grade
 */
export type LessonAiKind = "quiz" | "outcomes" | "examples" | "mistakes" | "warmup" | "outline";

export type LessonAiDifficulty = "easy" | "medium" | "hard";

export interface LessonAiContext {
  grade: number;
  subjectId: string;
  subjectName: string;
  /** Lesson kinds only. */
  topicTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
}

export interface LessonAiRequest {
  kind: LessonAiKind;
  /** 1-10. For "outline": number of topics. */
  count: number;
  difficulty: LessonAiDifficulty;
  /** Free text from the admin, e.g. "Dùng ví dụ về tiền tiêu vặt". Max 600 characters. */
  notes?: string;
  context: LessonAiContext;
  /**
   * Texts already on screen or in the lesson (question prompts, goal sentences,
   * example titles, topic titles). The AI should not repeat them.
   */
  avoid?: string[];
}

export interface OutlineDraftTopic {
  title: string;
  lessons: string[];
}

export type WarmupBlock = Extract<LessonBlock, { type: "question" }>;
export type ExampleBlock = Extract<LessonBlock, { type: "example" }>;
export type MistakeBlock = Extract<LessonBlock, { type: "mistake" }>;

/** Drafts, typed by kind. Rich text fields may hold $TeX$ like the rest of the lesson. */
export type LessonAiResult =
  | { kind: "quiz"; items: QuizQuestion[] }
  | { kind: "outcomes"; items: string[] }
  | { kind: "examples"; items: ExampleBlock[] }
  | { kind: "mistakes"; items: MistakeBlock[] }
  | { kind: "warmup"; items: WarmupBlock[] }
  | { kind: "outline"; topics: OutlineDraftTopic[] };

export const LESSON_AI_KINDS: { id: LessonAiKind; label: string; body: string; unit: string }[] = [
  { id: "quiz", label: "Câu hỏi tự kiểm", body: "Trắc nghiệm có đáp án và giải thích.", unit: "câu hỏi" },
  { id: "outcomes", label: "Mục tiêu bài học", body: "Những điều em làm được sau bài.", unit: "mục tiêu" },
  { id: "examples", label: "Ví dụ có lời giải", body: "Đề bài và các bước giải.", unit: "ví dụ" },
  { id: "mistakes", label: "Lỗi hay mắc", body: "Cách sai, cách đúng và vì sao.", unit: "lỗi" },
  { id: "warmup", label: "Câu hỏi khởi động", body: "Câu hỏi mở đầu có gợi ý.", unit: "câu hỏi" },
  { id: "outline", label: "Dàn ý cả môn", body: "Chủ đề và tên bài theo lớp và môn.", unit: "chủ đề" },
];

export const DIFFICULTY_LABELS: Record<LessonAiDifficulty, string> = { easy: "Dễ", medium: "Vừa", hard: "Khó" };
