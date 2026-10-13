"use client";

import { ArrowLeft } from "@/components/ui/icons";
import { useCallback, useState, type ReactNode } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import type { LessonDetail, LessonSummary, SubjectOutline, TopicSummary } from "@/lib/api/lesson-types";
import { lessonsApi } from "@/lib/api/lessons";
import { useApi } from "@/lib/hooks/useApi";
import { ConfirmDialog, EmptyState, Modal, PageHeader, SelectField, TextField, errorText } from "../ui";
import { useUnsavedGuard } from "../unsaved";
import { LessonEditor } from "./LessonEditor";
import { move, slugId } from "./model";
import { OutlineTree, TreeSkeleton, type TreeActions } from "./OutlineTree";

const grades = Array.from({ length: 12 }, (_, i) => i + 1);
const never = new Promise<never>(() => {});

type Guarded = (fn: () => void) => void;

export function LessonsScreen() {
  const guard = useUnsavedGuard();
  const [grade, setGrade] = useState(9);
  const [picked, setPicked] = useState("toan");
  const [pending, setPending] = useState<(() => void) | null>(null);

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
    <div className="grid grid-cols-2 gap-3">
      <SelectField label="Lớp" value={grade} onChange={(e) => {
        const g = Number(e.target.value);
        guarded(() => setGrade(g));
      }}>
        {grades.map((g) => (
          <option key={g} value={g}>
            Lớp {g}
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

  let body: ReactNode;
  if (subjects.status === "error") body = <Frame filters={filters} tree={<LoadError onRetry={subjects.reload} what="danh sách môn" />} />;
  else if (subjects.status === "ready" && list.length === 0)
    body = <Frame filters={filters} tree={<p className="text-ink-2">Lớp này chưa có môn học nào.</p>} />;
  else if (outline.status === "error") body = <Frame filters={filters} tree={<LoadError onRetry={outline.reload} what="mục lục môn" />} />;
  else if (outline.status !== "ready") body = <Frame filters={filters} tree={<TreeSkeleton />} />;
  else body = <Workspace key={`${grade}:${subjectId}`} initial={outline.data} filters={filters} guarded={guarded} />;

  return (
    <div>
      <PageHeader title="Học liệu" description="Soạn mục lục và nội dung bài cho từng lớp, từng môn. Học sinh đọc bài ở mục Lý thuyết." />
      <div className="mt-8">{body}</div>
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
    </div>
  );
}

/** Two areas on desktop. Below 1024px one of them at a time. */
function Frame({ filters, tree, editor, view = "tree" }: { filters: ReactNode; tree: ReactNode; editor?: ReactNode; view?: "tree" | "editor" }) {
  return (
    <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className={`flex flex-col gap-6 ${view === "editor" ? "max-lg:hidden" : ""}`}>
        {filters}
        {tree}
      </div>
      <div className={`min-w-0 ${view === "tree" ? "max-lg:hidden" : ""}`}>
        {editor ?? (
          <EmptyState title="Chọn một bài để soạn" body="Bấm vào tên bài ở mục lục. Muốn thêm bài mới, bấm Thêm bài dưới một chủ đề." />
        )}
      </div>
    </div>
  );
}

const renumber = (o: SubjectOutline): SubjectOutline => ({
  ...o,
  topics: o.topics.map((t, i) => ({ ...t, index: i + 1, lessons: t.lessons.map((l, j) => ({ ...l, index: j + 1 })) })),
});

type NameAsk = { title: string; label: string; initial: string; submit: string; placeholder?: string; run: (name: string) => Promise<void> };
type Ask = { title: string; body: ReactNode; label: string; run: () => Promise<void> };

function Workspace({ initial, filters, guarded }: { initial: SubjectOutline; filters: ReactNode; guarded: Guarded }) {
  const toast = useToast();
  const [outline, setOutline] = useState(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"tree" | "editor">("tree");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameAsk, setNameAsk] = useState<NameAsk | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);

  /** Saves the outline right away; on failure the tree goes back to what the server has. */
  async function commit(next: SubjectOutline, message: string) {
    const prev = outline;
    const clean = renumber(next);
    setOutline(clean);
    setBusy(true);
    setError(null);
    try {
      setOutline(await lessonsApi.saveOutline(clean));
      toast(message);
    } catch (e) {
      setOutline(prev);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  const quiet = (p: Promise<void>) => p.catch((e) => setError(errorText(e, "Chưa lưu được mục lục. Thử lại sau ít phút.")));
  const withTopics = (fn: (t: TopicSummary[]) => TopicSummary[]) => ({ ...outline, topics: fn(outline.topics) });

  function open(id: string) {
    setSelected(id);
    setView("editor");
    window.scrollTo({ top: 0 });
  }

  const actions: TreeActions = {
    addTopic: () =>
      setNameAsk({
        title: "Thêm chủ đề",
        label: "Tên chủ đề",
        initial: "",
        submit: "Thêm chủ đề",
        placeholder: "Phương trình và hệ hai phương trình bậc nhất hai ẩn",
        run: (title) => commit(withTopics((ts) => [...ts, { id: slugId(title, "chu-de"), index: ts.length + 1, title, lessons: [] }]), "Đã thêm chủ đề"),
      }),
    renameTopic: (t) =>
      setNameAsk({
        title: `Đổi tên chủ đề ${t.index}`,
        label: "Tên chủ đề",
        initial: t.title,
        submit: "Lưu tên",
        run: (title) => commit(withTopics((ts) => ts.map((x) => (x.id === t.id ? { ...x, title } : x))), "Đã đổi tên chủ đề"),
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
          if (selected && doomed.includes(selected)) {
            setSelected(null);
            setView("tree");
          }
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
          if (selected === l.id) {
            setSelected(null);
            setView("tree");
          }
          toast("Đã xoá bài");
        },
      }),
    openLesson: (l) => {
      if (l.id === selected) {
        setView("editor");
        return;
      }
      guarded(() => open(l.id));
    },
  };

  function onSaved(l: LessonDetail) {
    setOutline((o) => ({ ...o, topics: o.topics.map((t) => ({ ...t, lessons: t.lessons.map((x) => (x.id === l.id ? { ...x, title: l.title } : x)) })) }));
  }

  return (
    <>
      <Frame
        filters={filters}
        view={view}
        tree={<OutlineTree outline={outline} selected={selected} busy={busy} error={error} actions={actions} />}
        editor={
          selected ? (
            <div>
              <Button variant="ghost" size="sm" className="-ml-2 mb-4 !h-10 lg:hidden" onClick={() => setView("tree")}>
                <ArrowLeft size={16} /> Quay lại mục lục
              </Button>
              <LessonEditor key={selected} lessonId={selected} onSaved={onSaved} />
            </div>
          ) : undefined
        }
      />
      <Modal open={nameAsk !== null} onClose={() => setNameAsk(null)} title={nameAsk?.title ?? ""} size="sm">
        {nameAsk && <NameForm ask={nameAsk} onDone={() => setNameAsk(null)} />}
      </Modal>
      <ConfirmDialog open={ask !== null} onClose={() => setAsk(null)} onConfirm={() => ask?.run()} title={ask?.title ?? ""} body={ask?.body} confirmLabel={ask?.label} />
    </>
  );
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
