"use client";

import { ArrowSquareOut, Check, ListBullets, Sparkle } from "@/components/ui/icons";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import type { LessonAiKind, LessonAiResult } from "@/lib/api/lesson-ai-types";
import type { LessonDetail } from "@/lib/api/lesson-types";
import { lessonsApi, slugify } from "@/lib/api/lessons";
import { useApi } from "@/lib/hooks/useApi";
import { SaveBar } from "../SaveBar";
import { ConfirmDialog, EmptyState, errorText } from "../ui";
import { useUnsavedChanges } from "../unsaved";
import type { EditorBridge } from "./AiComposer";
import { ContentCanvas, selKey } from "./Canvas";
import { aiKey, type Ed } from "./ed";
import { Inspector } from "./Inspector";
import { InfoPanel, QuestionsPanel, VideosPanel, studentHref } from "./Lists";
import {
  allQuestions,
  blockLabels,
  blockSummary,
  cloneBlock,
  findBlock,
  fingerprint,
  hasContent,
  move,
  newBlock,
  newQuestion,
  newVideo,
  questionHasContent,
  tabOf,
  toDraft,
  toLesson,
  uid,
  validate,
  type Draft,
  type EBlock,
  type ESection,
  type Issue,
  type QuizBlock,
  type Selection,
  type Tab,
} from "./model";
import { Pane, useInspectorDocked } from "./Pane";

/** Center area width rules shared by the editor, its skeleton and the empty state. */
const centerClass = "flex min-w-0 flex-1 flex-col lg:min-h-0";
const scrollClass = "flex-1 lg:min-h-0 lg:overflow-y-auto lg:px-5";
const dockedAside = "hidden min-h-0 flex-col border-l border-line bg-paper lg:@min-[1000px]/studio:flex lg:@min-[1000px]/studio:w-[320px] lg:@min-[1000px]/studio:shrink-0 lg:@min-[1150px]/studio:w-[360px]";

export function LessonEditor({
  lessonId,
  onSaved,
  onOpenAi,
  bridgeRef,
}: {
  lessonId: string;
  onSaved: (l: LessonDetail) => void;
  onOpenAi: (kind: LessonAiKind) => void;
  bridgeRef: RefObject<EditorBridge | null>;
}) {
  const res = useApi(() => lessonsApi.lesson(lessonId), [lessonId]);
  if (res.status === "loading") return <EditorSkeleton />;
  if (res.status === "error")
    return (
      <>
        <section className={centerClass}>
          <div className={`${scrollClass} lg:py-8`}>
            <LoadError onRetry={res.reload} what="bài học" />
          </div>
        </section>
        <aside className={dockedAside} aria-hidden="true" />
      </>
    );
  return <Studio key={res.data.id} initial={res.data} onSaved={onSaved} onOpenAi={onOpenAi} bridgeRef={bridgeRef} />;
}

/** Center and inspector when no lesson is open (or while the outline loads). */
export function NoLesson({ loading = false, empty = false, action, onOpenTree }: { loading?: boolean; empty?: boolean; action?: ReactNode; onOpenTree?: () => void }) {
  return (
    <>
      <section className={centerClass} aria-busy={loading || undefined}>
        <div className={`${scrollClass} py-6 lg:py-10`}>
          {loading ? (
            <div className="flex flex-col gap-4">
              <div className="h-5 w-56 animate-pulse rounded bg-paper-3" />
              <div className="h-40 w-full animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
            </div>
          ) : (
            <EmptyState
              title={empty ? "Môn này chưa có bài nào" : "Chọn một bài để soạn"}
              body={
                empty
                  ? "Thêm chủ đề ở mục lục, hoặc để AI gợi ý dàn ý cả môn theo lớp. Bạn chọn những chủ đề và bài muốn giữ."
                  : "Bấm vào tên bài ở mục lục. Bài hiện ở đây giống như học sinh thấy, bấm vào phần nào thì sửa phần đó."
              }
              action={
                <div className="flex flex-wrap gap-2">
                  {onOpenTree && (
                    <Button variant="secondary" className="lg:hidden" onClick={onOpenTree}>
                      <ListBullets size={18} /> Mở mục lục
                    </Button>
                  )}
                  {action}
                </div>
              }
            />
          )}
        </div>
      </section>
      <aside className={dockedAside} aria-label="Bảng sửa">
        <div className="border-b border-line px-5 py-4">
          <p className="text-lg font-bold">Bảng sửa</p>
        </div>
        <p className="px-5 py-5 text-ink-2">Mở một bài, rồi bấm vào phần muốn sửa. Ô sửa hiện ở đây.</p>
      </aside>
    </>
  );
}

function EditorSkeleton() {
  return (
    <>
      <section className={centerClass} aria-busy="true" aria-label="Đang tải bài">
        <div className="border-b border-line pb-3 pt-4 lg:px-5">
          <div className="h-4 w-48 animate-pulse rounded bg-paper-3" />
          <div className="mt-4 flex gap-4">
            {[72, 56, 64, 88].map((w) => (
              <div key={w} className="h-5 animate-pulse rounded bg-paper-3" style={{ width: w }} />
            ))}
          </div>
        </div>
        <div className={`${scrollClass} py-8`}>
          <div className="oli-margin flex flex-col gap-4 pl-20">
            <div className="h-4 w-40 animate-pulse rounded bg-paper-3" />
            <div className="h-16 w-14 animate-pulse rounded bg-paper-3" />
            <div className="h-8 w-4/5 animate-pulse rounded bg-paper-3" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-paper-2" style={{ width: `${60 + i * 12}%` }} />
            ))}
            <div className="mt-6 h-7 w-44 animate-pulse rounded bg-paper-3" />
            <div className="h-24 w-full animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
          </div>
        </div>
      </section>
      <aside className={dockedAside} aria-hidden="true">
        <div className="border-b border-line px-5 py-4">
          <div className="h-5 w-28 animate-pulse rounded bg-paper-3" />
        </div>
      </aside>
    </>
  );
}

type Confirm = { title: string; body: ReactNode; label: string; run: () => void };

const tabs: { id: Tab; label: string }[] = [
  { id: "content", label: "Nội dung" },
  { id: "videos", label: "Video" },
  { id: "questions", label: "Câu hỏi" },
  { id: "info", label: "Thông tin bài" },
];

const focusable = "input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea, select, button";

/** Where AI blocks go: an existing part with one of these anchors, or a new part. */
const aiHome: Record<"examples" | "mistakes" | "warmup", { anchors: string[]; title: string }> = {
  examples: { anchors: ["cac-dang-bai", "vi-du", "vi-du-mau", "vi-du-co-loi-giai"], title: "Các dạng bài" },
  mistakes: { anchors: ["loi-hay-mac"], title: "Lỗi hay mắc" },
  warmup: { anchors: ["khoi-dong"], title: "Khởi động" },
};

function Studio({
  initial,
  onSaved,
  onOpenAi,
  bridgeRef,
}: {
  initial: LessonDetail;
  onSaved: (l: LessonDetail) => void;
  onOpenAi: (kind: LessonAiKind) => void;
  bridgeRef: RefObject<EditorBridge | null>;
}) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const docked = useInspectorDocked();
  const [base, setBase] = useState(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [sel, setSel] = useState<Selection | null>(null);
  const [tab, setTab] = useState<Tab>("content");
  const [inspOpen, setInspOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [aiKeys, setAiKeys] = useState<Set<string>>(() => new Set());
  const focusReq = useRef<string | null>(null);
  const scrollReq = useRef<string | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ content: null, videos: null, questions: null, info: null });

  const baseline = useMemo(() => fingerprint(toLesson(base, toDraft(base))), [base]);
  const current = useMemo(() => toLesson(base, draft), [base, draft]);
  const dirty = fingerprint(current) !== baseline;
  useUnsavedChanges(dirty);

  const issues = useMemo(() => validate(draft), [draft]);
  const shown = showErrors ? issues : [];

  // AI markers that still point at something in the lesson.
  const liveAi = useMemo(() => {
    const live = new Set<string>();
    draft.outcomes.forEach((o) => live.add(aiKey.outcome(o.key)));
    draft.sections.forEach((s) => s.blocks.forEach((b) => live.add(aiKey.block(b.key))));
    allQuestions(draft).forEach(({ q }) => live.add(aiKey.question(q.id)));
    return [...aiKeys].filter((k) => live.has(k));
  }, [aiKeys, draft]);

  // Focus and scroll requests run after the inspector or canvas has rendered.
  useEffect(() => {
    const f = focusReq.current;
    const s = scrollReq.current;
    if (!f && !s) return;
    focusReq.current = null;
    scrollReq.current = null;
    const id = requestAnimationFrame(() => {
      if (s) document.querySelector<HTMLElement>(`[data-sel="${CSS.escape(s)}"]`)?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
      if (f) {
        const scope = f === "inspector" ? document.getElementById("lesson-inspector-body") : document.querySelector<HTMLElement>(`[data-issue="${CSS.escape(f)}"]`);
        const el = scope?.matches(focusable) ? scope : scope?.querySelector<HTMLElement>(focusable);
        el?.focus({ preventScroll: false });
      }
    });
    return () => cancelAnimationFrame(id);
  });

  function select(s: Selection | null, opts: { focus?: boolean; scroll?: boolean } = {}) {
    setSel(s);
    if (!s) {
      setInspOpen(false);
      return;
    }
    setTab(tabOf(s));
    setInspOpen(true);
    if (opts.focus) focusReq.current = "inspector";
    if (opts.scroll) scrollReq.current = selKey(s);
  }

  function openTab(t: Tab) {
    setTab(t);
    if (t === "info") return select({ kind: "info" });
    if (sel && tabOf(sel) !== t) select(null);
  }

  const ask = (c: Confirm) => setConfirm(c);
  const setSections = (fn: (s: ESection[]) => ESection[]) => setDraft((d) => ({ ...d, sections: fn(d.sections) }));
  const mapBlocks = (fn: (b: EBlock) => EBlock) => setSections((all) => all.map((s) => ({ ...s, blocks: s.blocks.map(fn) })));
  const dropSel = (match: (s: Selection) => boolean) => {
    if (sel && match(sel)) select(null);
  };

  const quizBlocks = () => draft.sections.flatMap((s) => s.blocks.filter((b): b is { key: string; block: QuizBlock } => b.block.type === "quiz"));

  function updateQuiz(blockKey: string, fn: (b: QuizBlock) => QuizBlock) {
    mapBlocks((b) => (b.key === blockKey && b.block.type === "quiz" ? { ...b, block: fn(b.block) } : b));
  }

  /** Adds questions to the last quiz block, or to a new "Tự kiểm" part at the end. */
  function appendQuestions(qs: QuizBlock["questions"], blockKey?: string) {
    const target = blockKey ?? quizBlocks().at(-1)?.key;
    if (target) {
      updateQuiz(target, (b) => ({ ...b, questions: [...b.questions, ...qs] }));
      return target;
    }
    const key = uid("b");
    setSections((all) => [...all, { key: uid("s"), id: "", title: "Tự kiểm", blocks: [{ key, block: { type: "quiz", questions: qs } }] }]);
    return key;
  }

  const ed: Ed = {
    draft,
    base,
    sel,
    select,
    openTab,
    openAi: onOpenAi,
    isAi: (k) => aiKeys.has(k),
    approve: (k) =>
      setAiKeys((s) => {
        const next = new Set(s);
        next.delete(k);
        return next;
      }),
    issues: shown,
    err: (at) => shown.find((i) => i.at === at)?.message,
    patch: (p) => setDraft((d) => ({ ...d, ...p })),

    setBlock: (key, block) => mapBlocks((b) => (b.key === key ? { ...b, block } : b)),
    canMoveBlock: (key, d) => {
      const f = findBlock(draft, key);
      if (!f) return false;
      return d < 0 ? f.bi > 0 || f.si > 0 : f.bi < f.section.blocks.length - 1 || f.si < draft.sections.length - 1;
    },
    moveBlock: (key, d) =>
      setDraft((dr) => {
        const f = findBlock(dr, key);
        if (!f) return dr;
        const secs = dr.sections.map((s) => ({ ...s, blocks: s.blocks.slice() }));
        const list = secs[f.si].blocks;
        if (d < 0) {
          if (f.bi > 0) [list[f.bi - 1], list[f.bi]] = [list[f.bi], list[f.bi - 1]];
          else if (f.si > 0) secs[f.si - 1].blocks.push(...list.splice(f.bi, 1));
          else return dr;
        } else {
          if (f.bi < list.length - 1) [list[f.bi + 1], list[f.bi]] = [list[f.bi], list[f.bi + 1]];
          else if (f.si < secs.length - 1) secs[f.si + 1].blocks.unshift(...list.splice(f.bi, 1));
          else return dr;
        }
        return { ...dr, sections: secs };
      }),
    duplicateBlock: (key) => {
      const f = findBlock(draft, key);
      if (!f) return;
      const copy = { key: uid("b"), block: cloneBlock(f.entry.block) };
      setSections((all) => all.map((s) => (s.key === f.section.key ? { ...s, blocks: [...s.blocks.slice(0, f.bi + 1), copy, ...s.blocks.slice(f.bi + 1)] } : s)));
      select({ kind: "block", key: copy.key }, { scroll: true });
      toast(`Đã nhân bản khối ${blockLabels[copy.block.type].toLowerCase()}`);
    },
    removeBlock: (key) => {
      const f = findBlock(draft, key);
      if (!f) return;
      const run = () => {
        setSections((all) => all.map((s) => ({ ...s, blocks: s.blocks.filter((b) => b.key !== key) })));
        dropSel((s) => (s.kind === "block" && s.key === key) || (s.kind === "question" && s.blockKey === key));
      };
      if (!hasContent(f.entry.block)) return run();
      const what = blockSummary(f.entry.block);
      ask({
        title: "Xoá khối này?",
        body: `Khối "${blockLabels[f.entry.block.type]}"${what ? ` (${what.length > 60 ? `${what.slice(0, 57)}...` : what})` : ""} đã có nội dung. Nội dung sẽ mất khi bạn lưu bài.`,
        label: "Xoá khối",
        run,
      });
    },
    insertBlock: (sectionKey, at, type) => {
      const entry = { key: uid("b"), block: newBlock(type) };
      setSections((all) => all.map((s) => (s.key === sectionKey ? { ...s, blocks: [...s.blocks.slice(0, at), entry, ...s.blocks.slice(at)] } : s)));
      if (type === "quiz" && entry.block.type === "quiz") select({ kind: "question", blockKey: entry.key, id: entry.block.questions[0].id }, { focus: true });
      else select({ kind: "block", key: entry.key }, { focus: true, scroll: true });
    },

    setSection: (key, fn) => setSections((all) => all.map((s) => (s.key === key ? fn(s) : s))),
    moveSection: (key, d) =>
      setSections((all) => {
        const i = all.findIndex((s) => s.key === key);
        return move(all, i, i + d);
      }),
    duplicateSection: (key) => {
      const i = draft.sections.findIndex((s) => s.key === key);
      const s = draft.sections[i];
      if (!s) return;
      const copy: ESection = { key: uid("s"), id: "", title: s.title ? `${s.title} (bản sao)` : "", blocks: s.blocks.map((b) => ({ key: uid("b"), block: cloneBlock(b.block) })) };
      setSections((all) => [...all.slice(0, i + 1), copy, ...all.slice(i + 1)]);
      select({ kind: "section", key: copy.key }, { scroll: true });
      toast("Đã nhân bản phần");
    },
    removeSection: (key) => {
      const s = draft.sections.find((x) => x.key === key);
      if (!s) return;
      const run = () => {
        setSections((all) => all.filter((x) => x.key !== key));
        const keys = new Set(s.blocks.map((b) => b.key));
        dropSel((x) => (x.kind === "section" && x.key === key) || (x.kind === "block" && keys.has(x.key)) || (x.kind === "question" && keys.has(x.blockKey)));
      };
      if (s.blocks.length === 0) return run();
      ask({
        title: "Xoá phần này?",
        body: (
          <>
            Phần <strong className="text-ink">{s.title || "chưa có tên"}</strong> có {s.blocks.length} khối nội dung. Tất cả sẽ bị xoá khỏi bài khi bạn lưu.
          </>
        ),
        label: "Xoá phần",
        run,
      });
    },
    addSection: (title = "") => {
      const s: ESection = { key: uid("s"), id: slugify(title), title, blocks: [] };
      setSections((all) => (slugify(title) === "khoi-dong" ? [s, ...all] : [...all, s]));
      select({ kind: "section", key: s.key }, { focus: true, scroll: true });
    },

    setVideo: (id, p) => setDraft((d) => ({ ...d, videos: d.videos.map((v) => (v.id === id ? { ...v, ...p } : v)) })),
    reorderVideo: (from, to) => setDraft((d) => ({ ...d, videos: move(d.videos, from, to) })),
    removeVideo: (id) => {
      const v = draft.videos.find((x) => x.id === id);
      if (!v) return;
      const run = () => {
        setDraft((d) => ({ ...d, videos: d.videos.filter((x) => x.id !== id) }));
        dropSel((s) => s.kind === "video" && s.id === id);
      };
      if (!v.title.trim() && !v.url.trim()) return run();
      ask({ title: "Xoá video này?", body: `Video "${v.title || "chưa có tên"}" sẽ bị gỡ khỏi bài khi bạn lưu.`, label: "Xoá video", run });
    },
    addVideo: () => {
      const v = newVideo();
      setDraft((d) => ({ ...d, videos: [...d.videos, v] }));
      select({ kind: "video", id: v.id }, { focus: true, scroll: true });
    },

    setQuestion: (blockKey, q) => updateQuiz(blockKey, (b) => ({ ...b, questions: b.questions.map((x) => (x.id === q.id ? q : x)) })),
    moveQuestion: (blockKey, id, d) =>
      updateQuiz(blockKey, (b) => {
        const i = b.questions.findIndex((x) => x.id === id);
        return { ...b, questions: move(b.questions, i, i + d) };
      }),
    removeQuestion: (blockKey, id) => {
      const q = allQuestions(draft).find((x) => x.blockKey === blockKey && x.q.id === id)?.q;
      if (!q) return;
      const run = () => {
        updateQuiz(blockKey, (b) => ({ ...b, questions: b.questions.filter((x) => x.id !== id) }));
        dropSel((s) => s.kind === "question" && s.id === id);
      };
      if (!questionHasContent(q)) return run();
      ask({ title: "Xoá câu hỏi này?", body: "Câu hỏi cùng các lựa chọn và lời giải thích sẽ mất khi bạn lưu bài.", label: "Xoá câu hỏi", run });
    },
    addQuestion: (blockKey) => {
      const q = newQuestion();
      const key = appendQuestions([q], blockKey);
      select({ kind: "question", blockKey: key, id: q.id }, { focus: true, scroll: true });
    },
  };

  /** Puts AI drafts into the lesson, marked "Nháp AI", and returns the confirmation text. */
  function insertAi(r: LessonAiResult): string {
    const mark = (keys: string[]) => setAiKeys((s) => new Set([...s, ...keys]));
    switch (r.kind) {
      case "quiz": {
        const qs = r.items.map((q) => ({ ...q, id: uid("q") }));
        const key = appendQuestions(qs);
        mark(qs.map((q) => aiKey.question(q.id)));
        if (qs[0]) select({ kind: "question", blockKey: key, id: qs[0].id }, { scroll: true });
        return `Đã thêm ${qs.length} câu hỏi tự kiểm. Đọc lại rồi bấm Duyệt.`;
      }
      case "outcomes": {
        const os = r.items.map((text) => ({ key: uid("o"), text }));
        setDraft((d) => ({ ...d, outcomes: [...d.outcomes, ...os] }));
        mark(os.map((o) => aiKey.outcome(o.key)));
        select({ kind: "info" });
        return `Đã thêm ${os.length} mục tiêu. Đọc lại rồi bấm Duyệt.`;
      }
      case "examples":
      case "mistakes":
      case "warmup": {
        const home = aiHome[r.kind];
        const entries = r.items.map((block) => ({ key: uid("b"), block }));
        const found = draft.sections.find((s) => home.anchors.includes(s.id || slugify(s.title)));
        if (found) {
          setSections((all) => all.map((s) => (s.key === found.key ? { ...s, blocks: [...s.blocks, ...entries] } : s)));
        } else {
          const fresh: ESection = { key: uid("s"), id: home.anchors[0], title: home.title, blocks: entries };
          setSections((all) => {
            if (r.kind === "warmup") return [fresh, ...all];
            const before = all.findIndex((s) => ["ghi-nho", "tu-kiem"].includes(s.id || slugify(s.title)));
            return before < 0 ? [...all, fresh] : [...all.slice(0, before), fresh, ...all.slice(before)];
          });
        }
        mark(entries.map((e) => aiKey.block(e.key)));
        if (entries[0]) select({ kind: "block", key: entries[0].key }, { scroll: true });
        const what = { examples: "ví dụ", mistakes: "lỗi hay mắc", warmup: "câu hỏi khởi động" }[r.kind];
        return `Đã thêm ${entries.length} ${what} vào phần ${found?.title || home.title}. Đọc lại rồi bấm Duyệt.`;
      }
      case "outline":
        return "Dàn ý được thêm ở mục lục.";
    }
  }

  function avoid(kind: LessonAiKind): string[] {
    const blocks = draft.sections.flatMap((s) => s.blocks.map((b) => b.block));
    switch (kind) {
      case "quiz":
        return allQuestions(draft).map((x) => x.q.prompt);
      case "outcomes":
        return draft.outcomes.map((o) => o.text);
      case "examples":
        return blocks.flatMap((b) => (b.type === "example" ? [b.title] : []));
      case "mistakes":
        return blocks.flatMap((b) => (b.type === "mistake" ? [b.wrong] : []));
      case "warmup":
        return blocks.flatMap((b) => (b.type === "question" ? [b.prompt] : []));
      case "outline":
        return [];
    }
  }

  // The AI composer lives with the outline; it reaches the open lesson through this bridgeRef.
  const insertRef = useRef(insertAi);
  const avoidRef = useRef(avoid);
  useEffect(() => {
    insertRef.current = insertAi;
    avoidRef.current = avoid;
  });
  useEffect(() => {
    bridgeRef.current = { insert: (r) => insertRef.current(r), avoid: (k) => avoidRef.current(k) };
    return () => {
      bridgeRef.current = null;
    };
  }, [bridgeRef]);

  function jumpTo(issue: Issue) {
    select(issue.where, { scroll: true });
    focusReq.current = issue.at;
  }

  async function save() {
    if (saving) return;
    if (issues.length) {
      setShowErrors(true);
      jumpTo(issues[0]);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await lessonsApi.saveLesson(current);
      setBase(saved);
      // Keep the editor's keys (selection, AI markers) unless the server changed the content.
      if (fingerprint(toLesson(saved, draft)) !== fingerprint(toLesson(saved, toDraft(saved)))) setDraft(toDraft(saved));
      setShowErrors(false);
      toast.success("Đã lưu bài");
      onSaved(saved);
    } catch (e) {
      const message = errorText(e, "Chưa lưu được bài. Thử lại sau ít phút.");
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDraft(toDraft(base));
    setShowErrors(false);
    setSaveError(null);
    setAiKeys(new Set());
    select(null);
  }

  function onTabKey(e: KeyboardEvent, i: number) {
    const go = (j: number) => {
      const t = tabs[(j + tabs.length) % tabs.length].id;
      openTab(t);
      tabRefs.current[t]?.focus();
    };
    if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(tabs.length - 1);
    else return;
    e.preventDefault();
  }

  const counts: Partial<Record<Tab, number>> = { videos: draft.videos.length, questions: allQuestions(draft).length };
  const barError = saveError ?? (shown.length ? `Còn ${shown.length} chỗ cần sửa. ${shown[0].message}` : null);
  const firstSection = () => ed.addSection("Khởi động");

  return (
    <div
      className="contents"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          void save();
        }
      }}
    >
      <section className={centerClass} aria-label="Bài đang soạn">
        <header className="border-b border-line bg-paper pt-4 lg:px-5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm text-ink-2" title={`Lớp ${base.grade}, ${base.subject.name}. Chủ đề ${base.topic.index}. Bài ${base.index}/${base.lessonCount}`}>
              Lớp {base.grade}, {base.subject.name}. Chủ đề {base.topic.index}, bài {base.index}/{base.lessonCount}
            </p>
            <a href={studentHref(base)} target="_blank" rel="noopener" aria-label="Xem như học sinh (mở thẻ mới)" title="Xem như học sinh" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink">
              <ArrowSquareOut size={18} />
            </a>
            <Button variant="secondary" size="sm" className="!h-10 shrink-0" onClick={() => onOpenAi(tab === "questions" ? "quiz" : tab === "info" ? "outcomes" : "examples")}>
              <Sparkle size={16} className="text-coral-ink" /> Soạn bằng AI
            </Button>
          </div>
          <div role="tablist" aria-label="Phần của bài" className="-mb-px mt-2 flex gap-0.5 overflow-x-auto [scrollbar-width:none] sm:gap-1">
            {tabs.map((t, i) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  role="tab"
                  id={`lesson-tab-${t.id}`}
                  aria-selected={on}
                  aria-controls="lesson-tabpanel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => openTab(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={`relative inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-[var(--radius-paper)] px-2 text-sm sm:px-2.5 font-semibold transition-colors ${
                    on ? "text-ink" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {t.label}
                  {counts[t.id] !== undefined && <span className={`tabular text-xs ${on ? "text-coral-ink" : "text-ink-3"}`}>{counts[t.id]}</span>}
                  {on && <span aria-hidden="true" className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-coral" />}
                </button>
              );
            })}
          </div>
        </header>

        <div className={scrollClass}>
          {liveAi.length > 0 && (
            <div className="z-20 -mx-4 flex lg:sticky lg:top-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-coral-wash px-4 py-2 text-sm sm:-mx-8 sm:px-8 lg:-mx-5 lg:px-5" role="status">
              <Sparkle size={16} aria-hidden="true" className="shrink-0 text-coral-ink" />
              <p className="min-w-0 flex-1">
                <span className="font-semibold">Bản nháp AI chưa duyệt: {liveAi.length}.</span> <span className="text-ink-2">Vẫn được lưu cùng bài, nhãn chỉ nhắc bạn đọc lại.</span>
              </p>
              <Button variant="ghost" size="sm" className="!h-10 !px-3" onClick={() => setAiKeys(new Set())}>
                <Check size={16} weight="bold" /> Duyệt hết
              </Button>
            </div>
          )}
          <div id="lesson-tabpanel" role="tabpanel" aria-labelledby={`lesson-tab-${tab}`} className="py-8">
            {tab === "content" && <ContentCanvas ed={ed} onAddFirst={firstSection} />}
            {tab === "videos" && <VideosPanel ed={ed} />}
            {tab === "questions" && <QuestionsPanel ed={ed} />}
            {tab === "info" && <InfoPanel ed={ed} />}
          </div>
          <div className="lg:mx-3">
            <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onReset={reset} error={barError} savedAt={base.updatedAt} />
          </div>
        </div>
      </section>

      <Pane kind="inspector" open={inspOpen && sel !== null} onClose={() => setInspOpen(false)} label="Bảng sửa">
        <Inspector ed={ed} onClose={() => setInspOpen(false)} floating={!docked} />
      </Pane>

      <ConfirmDialog open={confirm !== null} onClose={() => setConfirm(null)} onConfirm={() => confirm?.run()} title={confirm?.title ?? ""} body={confirm?.body} confirmLabel={confirm?.label} />
    </div>
  );
}
