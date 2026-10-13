"use client";

import { ListBullets, Morph, Plus, Sparkle, X, icons } from "@/components/ui/icons";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { useToast } from "@/components/settings/shared";
import { Button, IconButton } from "@/components/ui/Button";
import type { LessonAiContext, LessonAiKind, OutlineDraftTopic } from "@/lib/api/lesson-ai-types";
import type { LessonDetail, LessonSummary, SubjectOutline, TopicSummary } from "@/lib/api/lesson-types";
import { lessonsApi, slugify } from "@/lib/api/lessons";
import { useApi } from "@/lib/hooks/useApi";
import { ConfirmDialog, Modal, SelectField, TextField, errorText } from "../ui";
import { useUnsavedGuard } from "../unsaved";
import { AiComposer, type EditorBridge } from "./AiComposer";
import { LessonEditor, NoLesson } from "./LessonEditor";
import { move, slugId } from "./model";
import { OutlineTree, TreeSkeleton, type TreeActions } from "./OutlineTree";
import { Pane, StudioWidth } from "./Pane";

const grades = Array.from({ length: 12 }, (_, i) => i + 1);
const never = new Promise<never>(() => {});
const fold = (s: string) => slugify(s);

type Guarded = (fn: () => void) => void;

/**
 * /admin/lessons: the lesson studio. Three areas on wide screens, each scrolling
 * on its own: the outline (grade, subject, topics and lessons), the lesson as
 * students see it, and the inspector for whatever is selected.
 */
export function LessonsScreen() {
  const guard = useUnsavedGuard();
  const [grade, setGrade] = useState(9);
  const [picked, setPicked] = useState("toan");
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  const subjects = useApi(() => lessonsApi.subjects(grade), [grade]);
  const list = subjects.status === "ready" ? subjects.data : [];
  const subjectId = list.find((s) => s.id === picked)?.id ?? list[0]?.id;
  const outline = useApi(() => (subjectId ? lessonsApi.outline(grade, subjectId) : never), [grade, subjectId]);

  /** Runs `fn` now, or after the admin agrees to drop unsaved lesson edits. */
  const guarded = useCallback<Guarded>(
    (fn) => {
      if (guard.isDirty()) setPending(() => fn);
      else fn();
    },
    [guard],
  );

  const filters = (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-2 [&_select]:pl-3 [&_select]:pr-7">
      <SelectField
        label="Lớp"
        value={grade}
        onChange={(e) => {
          const g = Number(e.target.value);
          guarded(() => setGrade(g));
        }}
      >
        {grades.map((g) => (
          <option key={g} value={g} aria-label={`Lớp ${g}`}>
            {g}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Môn"
        value={subjectId ?? ""}
        disabled={subjects.status !== "ready"}
        onChange={(e) => {
          const id = e.target.value;
          guarded(() => setPicked(id));
        }}
      >
        {subjects.status !== "ready" ? (
          <option value="">{subjects.status === "loading" ? "Đang tải..." : "Chưa tải được"}</option>
        ) : (
          list.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))
        )}
      </SelectField>
    </div>
  );

  let placeholder: ReactNode = null;
  let mainPlaceholder: ReactNode = <NoLesson />;
  if (subjects.status === "error") placeholder = <LoadError onRetry={subjects.reload} what="danh sách môn" />;
  else if (subjects.status === "ready" && list.length === 0) placeholder = <p className="text-sm text-ink-2">Lớp này chưa có môn học nào.</p>;
  else if (outline.status === "error") placeholder = <LoadError onRetry={outline.reload} what="mục lục môn" />;
  else if (outline.status !== "ready") {
    placeholder = <TreeSkeleton />;
    mainPlaceholder = <NoLesson loading />;
  }
  const loaded = placeholder === null && outline.status === "ready" ? outline.data : null;

  return (
    <>
      <Workspace
        loaded={loaded}
        placeholder={placeholder}
        mainPlaceholder={mainPlaceholder}
        guarded={guarded}
        filters={filters}
        treeOpen={treeOpen}
        setTreeOpen={setTreeOpen}
      />
      <Modal open={pending !== null} onClose={() => setPending(null)} title="Bỏ các thay đổi chưa lưu?" size="sm">
        <p className="text-ink-2">Bài đang mở có thay đổi chưa lưu. Nếu đi tiếp, các thay đổi đó sẽ mất.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setPending(null)} autoFocus>
            Ở lại
          </Button>
          <Button
            onClick={() => {
              const fn = pending;
              guard.clear();
              setPending(null);
              fn?.();
            }}
          >
            Bỏ thay đổi
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* Outline collapsed to a rail (from 1024px), remembered in localStorage. */
const OUTLINE_KEY = "fp-lessons-outline";
const outlineListeners = new Set<() => void>();
function subscribeOutline(cb: () => void) {
  outlineListeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === OUTLINE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    outlineListeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
const readOutline = () => localStorage.getItem(OUTLINE_KEY) === "collapsed";
function writeOutline(collapsed: boolean) {
  localStorage.setItem(OUTLINE_KEY, collapsed ? "collapsed" : "open");
  outlineListeners.forEach((l) => l());
}
const useOutlineCollapsed = () => useSyncExternalStore(subscribeOutline, readOutline, () => false);

type Rail = { onAi: () => void; onAddTopic: () => void } | null;

/**
 * The studio frame: fills the screen from 1024px, normal page flow below.
 * Its own width (not the screen's) decides whether the inspector docks, so it
 * follows the admin sidebar when that one is collapsed or expanded.
 */
function Studio({
  filters,
  tree,
  treeOpen,
  setTreeOpen,
  rail,
  children,
}: {
  filters: ReactNode;
  tree: ReactNode;
  treeOpen: boolean;
  setTreeOpen: (v: boolean) => void;
  rail: Rail;
  children: ReactNode;
}) {
  const collapsed = useOutlineCollapsed();
  const [width, setWidth] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggle = (
    <IconButton label={collapsed ? "Mở rộng mục lục" : "Thu gọn mục lục"} aria-expanded={!collapsed} onClick={() => writeOutline(!collapsed)} className="shrink-0 max-lg:hidden">
      <Morph icon={collapsed ? icons.SidebarExpand : icons.SidebarCollapse} size={20} />
    </IconButton>
  );

  return (
    <StudioWidth.Provider value={width}>
      <div ref={root} className="@container/studio flex flex-col lg:-mx-8 lg:-my-10 lg:h-dvh">
        <div className="flex items-center gap-3 border-b border-line pb-4 lg:hidden">
          <h1 className="min-w-0 flex-1 text-2xl font-bold">Học liệu</h1>
          <Button variant="secondary" size="sm" className="!h-10" aria-expanded={treeOpen} onClick={() => setTreeOpen(true)}>
            <ListBullets size={16} /> Mục lục
          </Button>
        </div>
        <div className="flex min-h-0 flex-1">
          <Pane kind="outline" open={treeOpen} onClose={() => setTreeOpen(false)} label="Lớp, môn và mục lục" collapsed={collapsed}>
            {collapsed && (
              <div className="hidden flex-col items-center gap-1 py-3 lg:flex">
                {toggle}
                <span aria-hidden="true" className="my-1 h-px w-8 bg-line" />
                {rail && (
                  <>
                    <IconButton label="Dàn ý bằng AI" onClick={rail.onAi}>
                      <Sparkle size={20} className="text-coral-ink" />
                    </IconButton>
                    <IconButton label="Thêm chủ đề" onClick={rail.onAddTopic}>
                      <Plus size={20} />
                    </IconButton>
                  </>
                )}
              </div>
            )}
            <div className={`flex min-h-0 flex-1 flex-col lg:w-[248px] lg:shrink-0 @min-[1150px]/studio:w-[272px] ${collapsed ? "lg:hidden" : ""}`}>
              <div className="relative border-b border-line px-4 pb-4 pt-5">
                <IconButton label="Đóng mục lục" onClick={() => setTreeOpen(false)} className="absolute right-2 top-2 lg:hidden">
                  <X size={20} />
                </IconButton>
                <div className="flex items-start justify-between gap-2 max-lg:hidden">
                  <h1 className="text-2xl font-bold">Học liệu</h1>
                  <span className="-mr-2 -mt-1">{toggle}</span>
                </div>
                <p className="mb-3 mt-0.5 text-sm text-ink-3 max-lg:hidden">Soạn bài cho từng lớp, từng môn.</p>
                {filters}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8 pt-4">{tree}</div>
            </div>
          </Pane>
          {children}
        </div>
      </div>
    </StudioWidth.Provider>
  );
}

const renumber = (o: SubjectOutline): SubjectOutline => ({
  ...o,
  topics: o.topics.map((t, i) => ({ ...t, index: i + 1, lessons: t.lessons.map((l, j) => ({ ...l, index: j + 1 })) })),
});

type NameAsk = { title: string; label: string; initial: string; submit: string; placeholder?: string; run: (name: string) => Promise<void> };
type Ask = { title: string; body: ReactNode; label: string; run: () => Promise<void> };

const emptyOutline = (o: SubjectOutline | null): SubjectOutline => o ?? { subject: { id: "", name: "", grade: 0 }, topics: [], generalVideos: [] };

function Workspace({
  loaded,
  placeholder,
  mainPlaceholder,
  guarded,
  filters,
  treeOpen,
  setTreeOpen,
}: {
  loaded: SubjectOutline | null;
  placeholder: ReactNode;
  mainPlaceholder: ReactNode;
  guarded: Guarded;
  filters: ReactNode;
  treeOpen: boolean;
  setTreeOpen: (v: boolean) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState(() => emptyOutline(loaded));
  const [selected, setSelected] = useState<string | null>(null);
  const [source, setSource] = useState(loaded);
  // A new grade or subject was loaded: start over with its outline.
  if (source !== loaded) {
    setSource(loaded);
    setOutline(emptyOutline(loaded));
    setSelected(null);
    setError(null);
  }
  const closeTree = () => setTreeOpen(false);
  const openTree = () => setTreeOpen(true);
  const [nameAsk, setNameAsk] = useState<NameAsk | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [ai, setAi] = useState<LessonAiKind | null>(null);
  const [aiLessons, setAiLessons] = useState<Set<string>>(() => new Set());
  const bridge = useRef<EditorBridge | null>(null);

  /** Saves the outline right away; on failure the tree goes back to what the server has. */
  async function commit(next: SubjectOutline, message?: string) {
    const prev = outline;
    const clean = renumber(next);
    setOutline(clean);
    setBusy(true);
    setError(null);
    try {
      const saved = await lessonsApi.saveOutline(clean);
      setOutline(saved);
      if (message) toast(message);
      return saved;
    } catch (e) {
      setOutline(prev);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  const quiet = (p: Promise<unknown>) => p.catch((e) => setError(errorText(e, "Chưa lưu được mục lục. Thử lại sau ít phút.")));
  const withTopics = (fn: (t: TopicSummary[]) => TopicSummary[]) => ({ ...outline, topics: fn(outline.topics) });

  function open(id: string) {
    setSelected(id);
    closeTree();
  }

  const actions: TreeActions = {
    addTopic: () =>
      setNameAsk({
        title: "Thêm chủ đề",
        label: "Tên chủ đề",
        initial: "",
        submit: "Thêm chủ đề",
        placeholder: "Phương trình và hệ hai phương trình bậc nhất hai ẩn",
        run: async (title) => void (await commit(withTopics((ts) => [...ts, { id: slugId(title, "chu-de"), index: ts.length + 1, title, lessons: [] }]), "Đã thêm chủ đề")),
      }),
    renameTopic: (t) =>
      setNameAsk({
        title: `Đổi tên chủ đề ${t.index}`,
        label: "Tên chủ đề",
        initial: t.title,
        submit: "Lưu tên",
        run: async (title) => void (await commit(withTopics((ts) => ts.map((x) => (x.id === t.id ? { ...x, title } : x))), "Đã đổi tên chủ đề")),
      }),
    moveTopic: (i, d) => void quiet(commit(withTopics((ts) => move(ts, i, i + d)), d < 0 ? "Đã đưa chủ đề lên" : "Đã đưa chủ đề xuống")),
    deleteTopic: (t) =>
      setAsk({
        title: `Xoá chủ đề ${t.index}?`,
        label: "Xoá chủ đề",
        body:
          t.lessons.length > 0 ? (
            <>
              Chủ đề <strong className="text-ink">{t.title}</strong> có {t.lessons.length} bài. Xoá chủ đề sẽ xoá luôn {t.lessons.length} bài này cùng toàn bộ nội dung, video và câu hỏi tự kiểm. Không lấy lại được.
            </>
          ) : (
            <>
              Chủ đề <strong className="text-ink">{t.title}</strong> chưa có bài nào.
            </>
          ),
        run: async () => {
          const doomed = t.lessons.map((l) => l.id);
          await commit(withTopics((ts) => ts.filter((x) => x.id !== t.id)), "Đã xoá chủ đề");
          if (selected && doomed.includes(selected)) setSelected(null);
          await Promise.all(doomed.map((id) => lessonsApi.deleteLesson(id)));
        },
      }),
    addLesson: (t) =>
      guarded(() =>
        setNameAsk({
          title: `Thêm bài vào chủ đề ${t.index}`,
          label: "Tên bài",
          initial: "",
          submit: "Thêm và mở bài",
          placeholder: "Phương trình bậc nhất hai ẩn",
          run: async (title) => {
            const made = await lessonsApi.createLesson({ grade: outline.subject.grade, subjectId: outline.subject.id, topicId: t.id, title });
            setOutline((o) =>
              renumber({ ...o, topics: o.topics.map((x) => (x.id === t.id ? { ...x, lessons: [...x.lessons, { id: made.id, index: x.lessons.length + 1, title: made.title }] } : x)) }),
            );
            toast("Đã thêm bài");
            open(made.id);
          },
        }),
      ),
    moveLesson: (t, j, d) =>
      void quiet(
        commit(
          withTopics((ts) => ts.map((x) => (x.id === t.id ? { ...x, lessons: move(x.lessons, j, j + d) } : x))),
          d < 0 ? "Đã đưa bài lên" : "Đã đưa bài xuống",
        ),
      ),
    deleteLesson: (t, l: LessonSummary) =>
      setAsk({
        title: "Xoá bài này?",
        label: "Xoá bài",
        body: (
          <>
            Bài <strong className="text-ink">{l.title}</strong> trong chủ đề {t.index} sẽ bị xoá cùng toàn bộ nội dung. Không lấy lại được.
          </>
        ),
        run: async () => {
          await lessonsApi.deleteLesson(l.id);
          setOutline((o) => renumber({ ...o, topics: o.topics.map((x) => ({ ...x, lessons: x.lessons.filter((y) => y.id !== l.id) })) }));
          if (selected === l.id) setSelected(null);
          toast("Đã xoá bài");
        },
      }),
    openLesson: (l) => {
      if (l.id === selected) return closeTree();
      guarded(() => open(l.id));
    },
  };

  function onSaved(l: LessonDetail) {
    setOutline((o) => ({ ...o, topics: o.topics.map((t) => ({ ...t, lessons: t.lessons.map((x) => (x.id === l.id ? { ...x, title: l.title } : x)) })) }));
    setAiLessons((s) => {
      if (!s.has(l.id)) return s;
      const next = new Set(s);
      next.delete(l.id);
      return next;
    });
  }

  /** Adds AI topics and lessons: new topics in one outline save, then each new lesson. */
  async function addOutline(drafts: OutlineDraftTopic[]) {
    let next = outline;
    const targets: { topicId: string; lessons: string[] }[] = [];
    for (const d of drafts) {
      const found = next.topics.find((t) => fold(t.title) === fold(d.title));
      if (found) {
        const have = new Set(found.lessons.map((l) => fold(l.title)));
        targets.push({ topicId: found.id, lessons: d.lessons.filter((l) => !have.has(fold(l))) });
      } else {
        const id = slugId(d.title, "chu-de");
        next = { ...next, topics: [...next.topics, { id, index: next.topics.length + 1, title: d.title, lessons: [] }] };
        targets.push({ topicId: id, lessons: d.lessons });
      }
    }
    const newTopics = next.topics.length - outline.topics.length;
    if (newTopics > 0) next = await commit(next);
    const made: string[] = [];
    setBusy(true);
    try {
      for (const t of targets) {
        for (const title of t.lessons) {
          const l = await lessonsApi.createLesson({ grade: outline.subject.grade, subjectId: outline.subject.id, topicId: t.topicId, title });
          made.push(l.id);
          setOutline((o) =>
            renumber({ ...o, topics: o.topics.map((x) => (x.id === t.topicId ? { ...x, lessons: [...x.lessons, { id: l.id, index: x.lessons.length + 1, title: l.title }] } : x)) }),
          );
        }
      }
    } finally {
      setBusy(false);
      setAiLessons((s) => new Set([...s, ...made]));
    }
    return newTopics > 0 ? `Đã thêm ${newTopics} chủ đề và ${made.length} bài vào mục lục` : `Đã thêm ${made.length} bài vào mục lục`;
  }

  const where = selected ? locate(outline, selected) : null;
  const context: LessonAiContext = {
    grade: outline.subject.grade,
    subjectId: outline.subject.id,
    subjectName: outline.subject.name,
    ...(where ? { topicTitle: where.topic.title, lessonId: where.lesson.id, lessonTitle: where.lesson.title } : {}),
  };

  const tree = !loaded ? (
    placeholder
  ) : (
    <OutlineTree
      outline={outline}
      selected={selected}
      busy={busy}
      error={error}
      actions={actions}
      aiLessons={aiLessons}
      onAiOutline={() => {
        closeTree();
        setAi("outline");
      }}
    />
  );

  const main = !loaded ? (
    mainPlaceholder
  ) : selected ? (
    <LessonEditor key={selected} lessonId={selected} onSaved={onSaved} onOpenAi={setAi} bridgeRef={bridge} />
  ) : (
    <NoLesson
      onOpenTree={openTree}
      action={
        <Button variant="secondary" onClick={() => setAi("outline")}>
          <Sparkle size={18} className="text-coral-ink" /> Dàn ý bằng AI
        </Button>
      }
      empty={outline.topics.length === 0}
    />
  );

  return (
    <>
      <Studio filters={filters} tree={tree} treeOpen={treeOpen} setTreeOpen={setTreeOpen} rail={loaded ? { onAi: () => setAi("outline"), onAddTopic: actions.addTopic } : null}>
        {main}
      </Studio>
      <AiComposer
        open={ai !== null}
        initialKind={ai ?? "quiz"}
        onClose={() => setAi(null)}
        context={context}
        lessonOpen={!!selected}
        bridgeRef={bridge}
        existingTopics={outline.topics.map((t) => t.title)}
        onAddOutline={addOutline}
      />
      <Modal open={nameAsk !== null} onClose={() => setNameAsk(null)} title={nameAsk?.title ?? ""} size="sm">
        {nameAsk && <NameForm ask={nameAsk} onDone={() => setNameAsk(null)} />}
      </Modal>
      <ConfirmDialog open={ask !== null} onClose={() => setAsk(null)} onConfirm={() => ask?.run()} title={ask?.title ?? ""} body={ask?.body} confirmLabel={ask?.label} />
    </>
  );
}

function locate(o: SubjectOutline, id: string) {
  for (const topic of o.topics) {
    const lesson = topic.lessons.find((l) => l.id === id);
    if (lesson) return { topic, lesson };
  }
  return null;
}

function NameForm({ ask, onDone }: { ask: NameAsk; onDone: () => void }) {
  const [name, setName] = useState(ask.initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const v = name.trim().replace(/\s+/g, " ");
    if (!v) return setError(`${ask.label} không được để trống.`);
    if (v.length > 160) return setError(`${ask.label} dài quá. Viết gọn dưới 160 kí tự.`);
    setBusy(true);
    setError(null);
    try {
      await ask.run(v);
      onDone();
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-5"
    >
      <TextField label={ask.label} value={name} placeholder={ask.placeholder} error={error ?? undefined} autoFocus onChange={(e) => setName(e.target.value)} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Huỷ
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Đang lưu..." : ask.submit}
        </Button>
      </div>
    </form>
  );
}
