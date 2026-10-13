// Editor model for one lesson: the API shape plus stable React keys for the
// parts that can be reordered (outcomes, sections and blocks), what the studio
// has selected, and validation.
import type { LessonBlock, LessonDetail, QuizQuestion, Video } from "@/lib/api/lesson-types";
import { slugify } from "@/lib/api/lessons";

export type BlockType = LessonBlock["type"];
export type QuizBlock = Extract<LessonBlock, { type: "quiz" }>;

export interface EBlock {
  key: string;
  block: LessonBlock;
}

export interface ESection {
  key: string;
  id: string;
  title: string;
  blocks: EBlock[];
}

export interface EOutcome {
  key: string;
  text: string;
}

export interface Draft {
  title: string;
  outcomes: EOutcome[];
  videos: Video[];
  exerciseCount: number;
  sections: ESection[];
}

/** What the inspector edits. */
export type Selection =
  | { kind: "info" }
  | { kind: "section"; key: string }
  | { kind: "block"; key: string }
  | { kind: "video"; id: string }
  | { kind: "question"; blockKey: string; id: string };

export type Tab = "content" | "videos" | "questions" | "info";

export const tabOf = (s: Selection): Tab =>
  s.kind === "video" ? "videos" : s.kind === "question" ? "questions" : s.kind === "info" ? "info" : "content";

export const sameSelection = (a: Selection | null, b: Selection | null) => JSON.stringify(a) === JSON.stringify(b);

export const uid = (prefix = "k") => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/** Short random suffix so new ids made from a title do not collide. */
export const slugId = (title: string, fallback: string) => `${slugify(title).slice(0, 40) || fallback}-${Math.random().toString(36).slice(2, 6)}`;

export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const blockLabels: Record<BlockType, string> = {
  paragraph: "Đoạn văn",
  math: "Công thức",
  definition: "Định nghĩa",
  question: "Câu hỏi",
  example: "Ví dụ mẫu",
  mistake: "Lỗi hay mắc",
  note: "Ghi nhớ",
  image: "Hình ảnh",
  quiz: "Tự kiểm",
};

export const blockOrder: BlockType[] = ["paragraph", "math", "definition", "question", "example", "mistake", "note", "image", "quiz"];

export const newQuestion = (): QuizQuestion => ({ id: uid("q"), prompt: "", choices: ["", ""], answerIndex: 0, explanation: "" });

export const newVideo = (): Video => ({ id: uid("v"), title: "", kind: "lecture", thumbnailUrl: "", url: "" });

export function newBlock(type: BlockType): LessonBlock {
  switch (type) {
    case "paragraph":
      return { type, text: "" };
    case "math":
      return { type, tex: "" };
    case "definition":
      return { type, term: "", text: "" };
    case "question":
      return { type, prompt: "", hint: "", answer: "" };
    case "example":
      return { type, title: "", problem: "", steps: [""] };
    case "mistake":
      return { type, wrong: "", right: "", why: "" };
    case "note":
      return { type, text: "" };
    case "image":
      return { type, url: "", alt: "", caption: "" };
    case "quiz":
      return { type, questions: [newQuestion()] };
  }
}

/** Copy with fresh ids, for "Nhân bản". */
export function cloneBlock(b: LessonBlock): LessonBlock {
  const c = structuredClone(b);
  if (c.type === "quiz") c.questions = c.questions.map((q) => ({ ...q, id: uid("q") }));
  return c;
}

const filled = (s?: string) => !!s && s.trim() !== "";

/** True when the block holds anything worth asking about before deleting. */
export function hasContent(b: LessonBlock): boolean {
  switch (b.type) {
    case "paragraph":
    case "note":
      return filled(b.text);
    case "math":
      return filled(b.tex);
    case "definition":
      return filled(b.term) || filled(b.text);
    case "question":
      return filled(b.prompt) || filled(b.hint) || filled(b.answer);
    case "example":
      return filled(b.title) || filled(b.problem) || b.steps.some(filled);
    case "mistake":
      return filled(b.wrong) || filled(b.right) || filled(b.why);
    case "image":
      return filled(b.url) || filled(b.caption);
    case "quiz":
      return b.questions.some(questionHasContent);
  }
}

export const questionHasContent = (q: QuizQuestion) => filled(q.prompt) || q.choices.some(filled) || filled(q.explanation);

/** Short one-line text for a block, used in labels and confirmations. */
export function blockSummary(b: LessonBlock): string {
  const pick = (() => {
    switch (b.type) {
      case "paragraph":
      case "note":
        return b.text;
      case "math":
        return b.tex;
      case "definition":
        return b.term;
      case "question":
        return b.prompt;
      case "example":
        return b.title || b.problem;
      case "mistake":
        return b.right || b.wrong;
      case "image":
        return b.caption || b.alt;
      case "quiz":
        return `${b.questions.length} câu hỏi`;
    }
  })();
  return pick.replace(/\s+/g, " ").trim();
}

export function toDraft(l: LessonDetail): Draft {
  return {
    title: l.title,
    outcomes: l.outcomes.map((text) => ({ key: uid("o"), text })),
    videos: l.videos.map((v) => ({ ...v })),
    exerciseCount: l.exerciseCount,
    sections: l.sections.map((s) => ({
      key: uid("s"),
      id: s.id,
      title: s.title,
      blocks: s.blocks.map((block) => ({ key: uid("b"), block: structuredClone(block) })),
    })),
  };
}

const keep = (s: string | undefined) => (s ?? "").trim() !== "";
const opt = (s: string | undefined) => (keep(s) ? s!.trim() : undefined);

/** Drops empty optional bits (blank steps, choices) the way they will be saved. */
function cleanBlock(b: LessonBlock): LessonBlock {
  switch (b.type) {
    case "question":
      return { type: b.type, prompt: b.prompt, ...(opt(b.hint) ? { hint: opt(b.hint) } : {}), answer: b.answer };
    case "example":
      return { ...b, steps: b.steps.filter(keep) };
    case "image":
      return { type: b.type, url: b.url, alt: b.alt, ...(opt(b.caption) ? { caption: opt(b.caption) } : {}) };
    case "quiz":
      return {
        type: b.type,
        questions: b.questions.map((q) => {
          const kept = q.choices.map((c, i) => ({ c, i })).filter((x) => keep(x.c));
          const answerIndex = Math.max(0, kept.findIndex((x) => x.i === q.answerIndex));
          return {
            id: q.id,
            prompt: q.prompt,
            choices: kept.map((x) => x.c),
            answerIndex,
            ...(opt(q.explanation) ? { explanation: opt(q.explanation) } : {}),
          };
        }),
      };
    default:
      return b;
  }
}

/** Unique anchor ids: "vi-du", "vi-du-2"... */
function anchors(sections: ESection[]) {
  const seen = new Map<string, number>();
  return sections.map((s) => {
    const base = s.id || slugify(s.title) || "phan";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

export function toLesson(base: LessonDetail, d: Draft): LessonDetail {
  const ids = anchors(d.sections);
  return {
    ...base,
    title: d.title.trim(),
    outcomes: d.outcomes.map((o) => o.text).filter(keep),
    videos: d.videos.map((v) => ({
      id: v.id,
      title: v.title.trim(),
      kind: v.kind,
      thumbnailUrl: v.thumbnailUrl,
      url: v.url.trim(),
      ...(opt(v.teacher) ? { teacher: opt(v.teacher) } : {}),
      ...(v.durationSec ? { durationSec: v.durationSec } : {}),
    })),
    exerciseCount: Math.max(0, Math.round(d.exerciseCount || 0)),
    sections: d.sections.map((s, i) => ({ id: ids[i], title: s.title.trim(), blocks: s.blocks.map((b) => cleanBlock(b.block)) })),
  };
}

/** What the save compares: only the editable content. */
export const fingerprint = (l: LessonDetail) => JSON.stringify([l.title, l.outcomes, l.videos, l.exerciseCount, l.sections]);

/** Every quiz question in the lesson, in reading order, with the block that holds it. */
export function allQuestions(d: Draft) {
  return d.sections.flatMap((s) =>
    s.blocks.flatMap((b) => (b.block.type === "quiz" ? b.block.questions.map((q) => ({ section: s, blockKey: b.key, q })) : [])),
  );
}

/** Finds a block and where it sits. */
export function findBlock(d: Draft, key: string) {
  for (let si = 0; si < d.sections.length; si++) {
    const bi = d.sections[si].blocks.findIndex((b) => b.key === key);
    if (bi >= 0) return { section: d.sections[si], si, bi, entry: d.sections[si].blocks[bi] };
  }
  return null;
}

/* -------------------------------------------------------------- validation */

export interface Issue {
  /** Matches a data-issue attribute near the field, used to focus it. */
  at: string;
  message: string;
  /** Where the field is edited. */
  where: Selection;
}

export const issueKeys = {
  title: "title",
  video: (id: string, field: "title" | "url") => `v:${id}:${field}`,
  section: (key: string) => `s:${key}`,
  block: (key: string, field: string) => `b:${key}:${field}`,
  question: (blockKey: string, qid: string, field: "prompt" | "choices" | "answer") => `b:${blockKey}:q:${qid}:${field}`,
};

export function validate(d: Draft): Issue[] {
  const out: Issue[] = [];
  if (!keep(d.title)) out.push({ at: issueKeys.title, message: "Bài cần có tiêu đề.", where: { kind: "info" } });
  for (const s of d.sections) {
    const sel: Selection = { kind: "section", key: s.key };
    if (!keep(s.title)) out.push({ at: issueKeys.section(s.key), message: "Phần cần có tiêu đề.", where: sel });
    for (const { key, block: b } of s.blocks) {
      const where: Selection = { kind: "block", key };
      if (b.type === "math" && !keep(b.tex)) out.push({ at: issueKeys.block(key, "tex"), message: "Công thức đang trống.", where });
      if (b.type === "image" && !keep(b.url)) out.push({ at: issueKeys.block(key, "url"), message: "Chọn hoặc tải lên một ảnh.", where });
      if (b.type === "quiz") {
        if (b.questions.length === 0) out.push({ at: issueKeys.block(key, "questions"), message: "Phần tự kiểm cần ít nhất một câu hỏi.", where });
        for (const q of b.questions) {
          const qw: Selection = { kind: "question", blockKey: key, id: q.id };
          if (!keep(q.prompt)) out.push({ at: issueKeys.question(key, q.id, "prompt"), message: "Câu hỏi đang trống.", where: qw });
          const n = q.choices.filter(keep).length;
          if (n < 2) out.push({ at: issueKeys.question(key, q.id, "choices"), message: "Cần ít nhất 2 lựa chọn có nội dung.", where: qw });
          else if (!keep(q.choices[q.answerIndex])) out.push({ at: issueKeys.question(key, q.id, "answer"), message: "Đáp án đúng đang là một lựa chọn trống.", where: qw });
        }
      }
    }
  }
  for (const v of d.videos) {
    const where: Selection = { kind: "video", id: v.id };
    if (!keep(v.title)) out.push({ at: issueKeys.video(v.id, "title"), message: "Video cần có tiêu đề.", where });
    if (!keep(v.url)) out.push({ at: issueKeys.video(v.id, "url"), message: "Dán đường dẫn nhúng của video.", where });
  }
  return out;
}

/** Issues that belong to a selection (a quiz block also owns its questions' issues). */
export function issuesFor(issues: Issue[], s: Selection) {
  return issues.filter((i) => sameSelection(i.where, s) || (s.kind === "block" && i.where.kind === "question" && i.where.blockKey === s.key));
}

export const RICH_HINT = "Viết công thức giữa hai dấu $, ví dụ $x^2 + 1$";
