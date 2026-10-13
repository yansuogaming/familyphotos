// Lesson content schema shared by the reader (/learn/theory), practice
// (/learn/practice) and the admin lesson editor (/admin/lessons).
// Text fields marked "rich" may contain inline TeX between $...$ (see RichText).

export interface Subject {
  id: string; // e.g. "toan", "tieng-viet"
  name: string; // "Toán"
  grade: number; // 1-12
}

export interface LessonSummary {
  id: string; // stable id, e.g. "toan-9-c1-b1"
  index: number; // 1-based within its topic
  title: string;
}

export interface TopicSummary {
  id: string;
  index: number; // 1-based within the subject
  title: string;
  lessons: LessonSummary[];
}

export interface SubjectOutline {
  subject: Subject;
  topics: TopicSummary[];
  /** Videos that span the whole subject ("Video bài giảng chung"). */
  generalVideos: Video[];
}

export interface Video {
  id: string;
  title: string;
  kind: "lecture" | "solution"; // Bài giảng | Giải bài tập
  thumbnailUrl: string;
  url: string; // embeddable URL (YouTube embed, mp4...)
  teacher?: string;
  durationSec?: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string; // rich
  choices: string[]; // rich
  answerIndex: number;
  explanation?: string; // rich
}

export type LessonBlock =
  | { type: "paragraph"; text: string } // rich
  | { type: "math"; tex: string } // display formula
  | { type: "definition"; term: string; text: string } // rich
  | { type: "question"; prompt: string; hint?: string; answer: string } // rich; reveal-on-click
  | { type: "example"; title: string; problem: string; steps: string[] } // rich; worked example
  | { type: "mistake"; wrong: string; right: string; why: string } // rich
  | { type: "note"; text: string } // rich; "Ghi nhớ" key point
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "quiz"; questions: QuizQuestion[] }; // "Tự kiểm"

export interface LessonSection {
  id: string; // anchor id, e.g. "khoi-dong"
  title: string; // "Khởi động"
  blocks: LessonBlock[];
}

export interface LessonDetail {
  id: string;
  grade: number;
  subject: Subject;
  topic: { id: string; index: number; title: string; count: number };
  index: number; // lesson index within topic
  lessonCount: number; // lessons in this topic
  title: string;
  outcomes: string[]; // rich; "Sau bài này em..."
  videos: Video[];
  sections: LessonSection[];
  /** Graded exercises available in Luyện tập for this lesson. */
  exerciseCount: number;
  prev?: Pick<LessonSummary, "id" | "title">;
  next?: Pick<LessonSummary, "id" | "title">;
  updatedAt: string;
}
