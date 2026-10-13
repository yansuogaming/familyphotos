// Lessons API: subjects per grade, subject outlines (topics and lessons),
// lesson content, search, and the admin write calls. Endpoints in docs/api/lessons.md.
import { ApiError, BASE, fake, http, persisted } from "./core";
import type { LessonDetail, Subject, SubjectOutline } from "./lesson-types";
import { initialLessons, initialOutlines, mockSubjects, slugify } from "./lessons-mock";

export { slugify };

export interface LessonSearchHit {
  lessonId: string;
  title: string;
  subjectName: string;
  grade: number;
  /** Matched text. Starts with "Chủ đề N." for topic hits; may contain $TeX$. */
  snippet: string;
}

const lessonsStore = persisted<Record<string, LessonDetail>>("lessons", initialLessons);
const outlinesStore = persisted<Record<string, SubjectOutline>>("outlines", initialOutlines);

const outlineKey = (grade: number, subjectId: string) => `${grade}:${subjectId}`;

function mockOutline(grade: number, subjectId: string): SubjectOutline {
  const found = outlinesStore.get()[outlineKey(grade, subjectId)];
  if (found) return found;
  const subject = mockSubjects(grade).find((s) => s.id === subjectId);
  if (!subject) throw new ApiError(404, "Không tìm thấy môn học");
  return { subject, topics: [], generalVideos: [] };
}

/** Where a lesson sits in its outline; position fields always come from the outline. */
function locate(id: string) {
  for (const outline of Object.values(outlinesStore.get())) {
    const flat = outline.topics.flatMap((t) => t.lessons.map((l) => ({ topic: t, lesson: l })));
    const at = flat.findIndex((x) => x.lesson.id === id);
    if (at >= 0) return { outline, flat, at };
  }
  return null;
}

function mockLesson(id: string): LessonDetail {
  const where = locate(id);
  const stored = lessonsStore.get()[id];
  if (!where) {
    if (stored) return stored;
    throw new ApiError(404, "Không tìm thấy bài học");
  }
  const { outline, flat, at } = where;
  const { topic, lesson } = flat[at];
  const prev = flat[at - 1]?.lesson;
  const next = flat[at + 1]?.lesson;
  const content: Pick<LessonDetail, "outcomes" | "videos" | "sections" | "exerciseCount" | "updatedAt"> = stored ?? {
    outcomes: [],
    videos: [],
    sections: [],
    exerciseCount: 0,
    updatedAt: "2026-10-01T08:00:00",
  };
  return {
    ...content,
    id,
    grade: outline.subject.grade,
    subject: outline.subject,
    topic: { id: topic.id, index: topic.index, title: topic.title, count: outline.topics.length },
    index: lesson.index,
    lessonCount: topic.lessons.length,
    title: lesson.title,
    prev: prev && { id: prev.id, title: prev.title },
    next: next && { id: next.id, title: next.title },
  };
}

/** Lowercase, no diacritics, so "phuong trinh" finds "phương trình". */
const fold = (s: string) => slugify(s).replace(/-/g, " ");

function snippetAround(text: string, q: string) {
  const plain = text.replace(/\s+/g, " ").trim();
  const i = fold(plain).indexOf(q);
  if (plain.length <= 110 || i < 0) return plain.length <= 110 ? plain : `${plain.slice(0, 107)}...`;
  // Do not cut inside a $...$ formula.
  let start = Math.max(0, i - 40);
  while (start > 0 && (plain.slice(0, start).match(/\$/g)?.length ?? 0) % 2 === 1) start--;
  let end = Math.min(plain.length, start + 110);
  while (end < plain.length && (plain.slice(0, end).match(/\$/g)?.length ?? 0) % 2 === 1) end++;
  return `${start > 0 ? "..." : ""}${plain.slice(start, end)}${end < plain.length ? "..." : ""}`;
}

function mockSearch(q: string, grade?: number) {
  const needle = fold(q).trim();
  if (!needle) return [];
  // Typed with diacritics: match them exactly ("căn" must not find "cần"). Without: match loosely.
  const exact = q.trim().toLowerCase().normalize("NFC");
  const strict = exact.normalize("NFD") !== exact || exact.includes("đ");
  const has = (text: string) => (strict ? text.toLowerCase().normalize("NFC").includes(exact) : fold(text).includes(needle));
  const hits: LessonSearchHit[] = [];
  const lessons = lessonsStore.get();
  for (const outline of Object.values(outlinesStore.get())) {
    if (grade && outline.subject.grade !== grade) continue;
    const meta = { subjectName: outline.subject.name, grade: outline.subject.grade };
    for (const topic of outline.topics) {
      const first = topic.lessons[0];
      if (first && has(topic.title)) {
        hits.push({ lessonId: first.id, title: first.title, ...meta, snippet: `Chủ đề ${topic.index}. ${topic.title}` });
      }
      for (const l of topic.lessons) {
        if (has(l.title)) {
          hits.push({ lessonId: l.id, title: l.title, ...meta, snippet: `Chủ đề ${topic.index}, Bài ${l.index}` });
          continue;
        }
        const detail = lessons[l.id];
        if (!detail) continue;
        const texts = [
          ...detail.outcomes,
          ...detail.sections.flatMap((s) =>
            s.blocks.flatMap((b) => {
              switch (b.type) {
                case "paragraph":
                case "note":
                  return [b.text];
                case "math":
                  return [`$${b.tex}$`];
                case "definition":
                  return [`${b.term} ${b.text}`];
                case "question":
                  return [b.prompt];
                case "example":
                  return [`${b.title}. ${b.problem}`];
                case "mistake":
                  return [b.right];
                case "image":
                  return [b.caption ?? b.alt];
                case "quiz":
                  return b.questions.map((x) => x.prompt);
              }
            }),
          ),
        ];
        const match = texts.find(has);
        if (match) hits.push({ lessonId: l.id, title: l.title, ...meta, snippet: snippetAround(match, needle) });
      }
    }
  }
  return hits.slice(0, 20);
}

export const lessonsApi = {
  subjects: (grade: number): Promise<Subject[]> => (BASE ? http(`/learning/grades/${grade}/subjects`) : fake(mockSubjects(grade), 200)),

  outline: async (grade: number, subjectId: string): Promise<SubjectOutline> => {
    if (BASE) return http(`/learning/grades/${grade}/subjects/${encodeURIComponent(subjectId)}/outline`);
    return fake(mockOutline(grade, subjectId), 250);
  },

  lesson: async (id: string): Promise<LessonDetail> => {
    if (BASE) return http(`/learning/lessons/${encodeURIComponent(id)}`);
    return fake(mockLesson(id), 350);
  },

  search: async (q: string, grade?: number): Promise<LessonSearchHit[]> => {
    if (BASE) {
      const qs = new URLSearchParams({ q });
      if (grade) qs.set("grade", String(grade));
      return http(`/learning/search?${qs}`);
    }
    return fake(mockSearch(q, grade), 180);
  },

  saveLesson: async (lesson: LessonDetail): Promise<LessonDetail> => {
    if (BASE) return http(`/learning/lessons/${encodeURIComponent(lesson.id)}`, { method: "PUT", body: JSON.stringify(lesson) });
    const saved = { ...lesson, updatedAt: new Date().toISOString() };
    lessonsStore.update((all) => ({ ...all, [lesson.id]: saved }));
    // Keep the outline title in step with the lesson title.
    outlinesStore.update((all) => {
      for (const o of Object.values(all)) for (const t of o.topics) for (const l of t.lessons) if (l.id === lesson.id) l.title = lesson.title;
      return all;
    });
    return fake(mockLesson(lesson.id));
  },

  createLesson: async (input: { grade: number; subjectId: string; topicId: string; title: string }): Promise<LessonDetail> => {
    if (BASE) return http("/learning/lessons", { method: "POST", body: JSON.stringify(input) });
    const key = outlineKey(input.grade, input.subjectId);
    const outline = structuredClone(mockOutline(input.grade, input.subjectId));
    const topic = outline.topics.find((t) => t.id === input.topicId);
    if (!topic) throw new ApiError(404, "Không tìm thấy chủ đề");
    let n = topic.lessons.length + 1;
    const taken = new Set(outline.topics.flatMap((t) => t.lessons.map((l) => l.id)));
    while (taken.has(`${topic.id}-b${n}`)) n++;
    const id = `${topic.id}-b${n}`;
    topic.lessons.push({ id, index: topic.lessons.length + 1, title: input.title });
    outlinesStore.update((all) => ({ ...all, [key]: outline }));
    return fake(mockLesson(id));
  },

  deleteLesson: async (id: string): Promise<void> => {
    if (BASE) return http(`/learning/lessons/${encodeURIComponent(id)}`, { method: "DELETE" });
    outlinesStore.update((all) => {
      for (const o of Object.values(all))
        for (const t of o.topics) {
          t.lessons = t.lessons.filter((l) => l.id !== id).map((l, i) => ({ ...l, index: i + 1 }));
        }
      return all;
    });
    lessonsStore.update((all) => {
      const rest = { ...all };
      delete rest[id];
      return rest;
    });
    await fake(null, 250);
  },

  saveOutline: async (outline: SubjectOutline): Promise<SubjectOutline> => {
    if (BASE) {
      return http(`/learning/grades/${outline.subject.grade}/subjects/${encodeURIComponent(outline.subject.id)}/outline`, {
        method: "PUT",
        body: JSON.stringify(outline),
      });
    }
    // Indexes follow the order the admin left them in.
    const clean: SubjectOutline = {
      ...outline,
      topics: outline.topics.map((t, i) => ({ ...t, index: i + 1, lessons: t.lessons.map((l, j) => ({ ...l, index: j + 1 })) })),
    };
    outlinesStore.update((all) => ({ ...all, [outlineKey(outline.subject.grade, outline.subject.id)]: clean }));
    return fake(clean);
  },
};
