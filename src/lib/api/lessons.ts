// Lessons: subjects per grade, outlines (topics and lessons), lesson content,
// search, and the admin write calls. Contract: docs/api/lessons.md.
import { http } from "./core";
import type { LessonDetail, Subject, SubjectOutline } from "./lesson-types";

export interface LessonSearchHit {
  lessonId: string;
  title: string;
  subjectName: string;
  grade: number;
  /** Matched text. Starts with "Chủ đề N." for topic hits; may contain $TeX$. */
  snippet: string;
}

/** URL-safe id from a Vietnamese name: "Tiếng Việt" -> "tieng-viet". */
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

const enc = encodeURIComponent;
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const outlinePath = (grade: number, subjectId: string) => `/learning/grades/${grade}/subjects/${enc(subjectId)}/outline`;

export const lessonsApi = {
  subjects: (grade: number): Promise<Subject[]> => http(`/learning/grades/${grade}/subjects`),
  outline: (grade: number, subjectId: string): Promise<SubjectOutline> => http(outlinePath(grade, subjectId)),
  lesson: (id: string): Promise<LessonDetail> => http(`/learning/lessons/${enc(id)}`),
  search(q: string, grade?: number): Promise<LessonSearchHit[]> {
    const qs = new URLSearchParams({ q });
    if (grade) qs.set("grade", String(grade));
    return http(`/learning/search?${qs}`);
  },

  // admin
  saveLesson: (lesson: LessonDetail): Promise<LessonDetail> => http(`/learning/lessons/${enc(lesson.id)}`, json("PUT", lesson)),
  createLesson: (input: { grade: number; subjectId: string; topicId: string; title: string }): Promise<LessonDetail> =>
    http("/learning/lessons", json("POST", input)),
  deleteLesson: (id: string): Promise<void> => http(`/learning/lessons/${enc(id)}`, { method: "DELETE" }),
  saveOutline: (outline: SubjectOutline): Promise<SubjectOutline> =>
    http(outlinePath(outline.subject.grade, outline.subject.id), json("PUT", outline)),
};
