"use client";

import {
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  BookOpen,
  ChatCircleText,
  CheckSquare,
  DotsSixVertical,
  Function as FunctionIcon,
  Image as ImageIcon,
  ListNumbers,
  Plus,
  PushPin,
  TextAlignLeft,
  Trash,
  WarningCircle,
  XCircle,
  type Icon,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { formatDateTime, useToast } from "@/components/settings/shared";
import { Button, IconButton, buttonClass } from "@/components/ui/Button";
import type { LessonBlock, LessonDetail, Video } from "@/lib/api/lesson-types";
import { lessonsApi, slugify } from "@/lib/api/lessons";
import { useApi } from "@/lib/hooks/useApi";
import { ImageField } from "../ImageField";
import { ConfirmDialog, ErrorNote, SelectField, TextField, errorText } from "../ui";
import { useUnsavedChanges } from "../unsaved";
import { ActionMenu } from "./ActionMenu";
import { BlockBody } from "./BlockBody";
import { RichField } from "./fields";
import {
  blockLabels,
  blockOrder,
  fingerprint,
  hasContent,
  issueKeys,
  move,
  newBlock,
  toDraft,
  toLesson,
  uid,
  validate,
  type BlockType,
  type Draft,
  type EBlock,
  type ESection,
} from "./model";

/** Where "Xem như học sinh" goes. The reader has no per-lesson route yet. */
export const STUDENT_HREF = "/hoc/ly-thuyet";

const blockIcons: Record<BlockType, Icon> = {
  paragraph: TextAlignLeft,
  math: FunctionIcon,
  definition: BookOpen,
  question: ChatCircleText,
  example: ListNumbers,
  mistake: XCircle,
  note: PushPin,
  image: ImageIcon,
  quiz: CheckSquare,
};

const ease = [0.16, 1, 0.3, 1] as const;

export function LessonEditor({ lessonId, onSaved }: { lessonId: string; onSaved: (l: LessonDetail) => void }) {
  const res = useApi(() => lessonsApi.lesson(lessonId), [lessonId]);
  if (res.status === "loading") return <EditorSkeleton />;
  if (res.status === "error") return <LoadError onRetry={res.reload} what="bài học" />;
  return <EditorForm key={res.data.id} initial={res.data} onSaved={onSaved} />;
}

function EditorSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải bài" className="flex flex-col gap-6">
      <div className="h-4 w-48 animate-pulse rounded bg-paper-3" />
      <div className="h-11 w-full animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-paper-3" />
        <div className="h-11 w-full animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
        <div className="h-11 w-full animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-[var(--radius-paper)] border border-line p-4">
          <div className="h-4 w-24 animate-pulse rounded bg-paper-3" />
          <div className="mt-4 h-20 w-full animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
        </div>
      ))}
    </div>
  );
}

type Confirm = { title: string; body: ReactNode; label: string; run: () => void };

function EditorForm({ initial, onSaved }: { initial: LessonDetail; onSaved: (l: LessonDetail) => void }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [base, setBase] = useState(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);

  const baseline = useMemo(() => fingerprint(toLesson(base, toDraft(base))), [base]);
  const current = useMemo(() => toLesson(base, draft), [base, draft]);
  const dirty = fingerprint(current) !== baseline;
  useUnsavedChanges(dirty);

  const issues = useMemo(() => validate(draft), [draft]);
  const err = (at: string) => (showErrors ? issues.find((i) => i.at === at)?.message : undefined);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const setSections = (fn: (s: ESection[]) => ESection[]) => setDraft((d) => ({ ...d, sections: fn(d.sections) }));
  const setSection = (key: string, fn: (s: ESection) => ESection) => setSections((all) => all.map((s) => (s.key === key ? fn(s) : s)));

  function jump(at: string) {
    const el = document.querySelector<HTMLElement>(`[data-issue="${CSS.escape(at)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el.querySelector<HTMLElement>("input:not([type=radio]), textarea, select, button")?.focus({ preventScroll: true });
  }

  async function save() {
    if (saving) return;
    if (issues.length) {
      setShowErrors(true);
      jump(issues[0].at);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await lessonsApi.saveLesson(current);
      setBase(saved);
      setDraft(toDraft(saved));
      setShowErrors(false);
      toast("Đã lưu bài");
      onSaved(saved);
    } catch (e) {
      setSaveError(errorText(e, "Chưa lưu được bài. Thử lại sau ít phút."));
    } finally {
      setSaving(false);
    }
  }

  function addSection() {
    const key = uid("s");
    setSections((all) => [...all, { key, id: "", title: "", blocks: [] }]);
    setFresh(key);
  }

  function removeSection(s: ESection) {
    const run = () => setSections((all) => all.filter((x) => x.key !== s.key));
    if (s.blocks.length === 0) return run();
    setConfirm({
      title: "Xoá phần này?",
      body: (
        <>
          Phần <strong className="text-ink">{s.title || "chưa có tên"}</strong> có {s.blocks.length} khối nội dung. Tất cả sẽ bị xoá khỏi bài khi bạn lưu.
        </>
      ),
      label: "Xoá phần",
      run,
    });
  }

  function removeBlock(sectionKey: string, b: EBlock) {
    const run = () => setSection(sectionKey, (s) => ({ ...s, blocks: s.blocks.filter((x) => x.key !== b.key) }));
    if (!hasContent(b.block)) return run();
    setConfirm({ title: "Xoá khối này?", body: `Khối "${blockLabels[b.block.type]}" đã có nội dung. Nội dung sẽ mất khi bạn lưu bài.`, label: "Xoá khối", run });
  }

  const statusText = saving ? "Đang lưu..." : dirty ? "Chưa lưu thay đổi" : `Đã lưu lúc ${formatDateTime(base.updatedAt)}`;
  const shownIssues = showErrors ? issues : [];

  return (
    <div
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          void save();
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-ink-2">
          Lớp {base.grade}, {base.subject.name}. Chủ đề {base.topic.index}: {base.topic.title}. Bài {base.index}/{base.lessonCount}.
        </p>
        <a href={STUDENT_HREF} target="_blank" rel="noopener" className={buttonClass("secondary", "sm", "!h-10")}>
          <ArrowSquareOut size={16} /> Xem như học sinh
        </a>
      </div>

      <div className="mt-4" data-issue={issueKeys.title}>
        <TextField label="Tiêu đề bài" value={draft.title} error={err(issueKeys.title)} onChange={(e) => patch({ title: e.target.value })} className="[&_input]:h-12 [&_input]:font-display [&_input]:text-xl [&_input]:font-semibold" />
      </div>

      <Group title="Mục tiêu" description='Mỗi dòng là một điều em làm được sau bài học, hiện sau câu "Sau bài này em..."'>
        <StringList
          items={draft.outcomes}
          onChange={(outcomes) => patch({ outcomes })}
          itemLabel={(i) => `Mục tiêu ${i + 1}`}
          addLabel="Thêm mục tiêu"
          empty="Chưa có mục tiêu nào."
        />
      </Group>

      <Group title="Video" description="Bài giảng và giải bài tập gắn với bài này.">
        <VideoList videos={draft.videos} onChange={(videos) => patch({ videos })} err={err} />
      </Group>

      <Group title="Luyện tập">
        <TextField
          label="Số bài luyện tập"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={String(draft.exerciseCount)}
          onChange={(e) => patch({ exerciseCount: Math.max(0, Number(e.target.value) || 0) })}
          hint="Số bài có chấm điểm của bài này trong mục Luyện tập."
          className="max-w-56"
        />
      </Group>

      <Group title="Các phần của bài" description="Học sinh đọc từ trên xuống. Mỗi phần có một mục trong mục lục bên cạnh bài.">
        {draft.sections.length === 0 ? (
          <p className="text-ink-2">Bài chưa có phần nào. Thêm phần đầu tiên, ví dụ Khởi động.</p>
        ) : (
          <ol className="flex flex-col gap-10">
            {draft.sections.map((s, i) => (
              <motion.li key={s.key} layout={reduce ? false : "position"} transition={{ duration: 0.35, ease }}>
                <SectionEditor
                  section={s}
                  index={i}
                  count={draft.sections.length}
                  autoFocus={fresh === s.key}
                  freshBlock={fresh}
                  onFresh={setFresh}
                  err={err}
                  onChange={(fn) => setSection(s.key, fn)}
                  onMove={(d) => setSections((all) => move(all, i, i + d))}
                  onRemove={() => removeSection(s)}
                  onRemoveBlock={(b) => removeBlock(s.key, b)}
                />
              </motion.li>
            ))}
          </ol>
        )}
        <div className="mt-6">
          <Button variant="secondary" onClick={addSection}>
            <Plus size={18} /> Thêm phần
          </Button>
        </div>
      </Group>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-20 -mx-1 mt-10 border-t border-line bg-paper/95 px-1 py-3 backdrop-blur-sm">
        {saveError && (
          <div className="mb-3">
            <ErrorNote>{saveError}</ErrorNote>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p aria-live="polite" className="flex items-center gap-2 text-sm text-ink-2">
            {dirty && !saving && <span aria-hidden="true" className="size-2 rounded-full bg-coral" />}
            {statusText}
          </p>
          {shownIssues.length > 0 && (
            <button type="button" onClick={() => jump(shownIssues[0].at)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-danger underline-offset-2 hover:underline">
              <WarningCircle size={18} /> Còn {shownIssues.length} chỗ cần sửa: {shownIssues[0].message}
            </button>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="ghost"
              disabled={!dirty || saving}
              onClick={() =>
                setConfirm({
                  title: "Huỷ các thay đổi?",
                  body: "Bài sẽ trở về như lần lưu gần nhất. Những gì bạn vừa sửa sẽ mất.",
                  label: "Huỷ thay đổi",
                  run: () => {
                    setDraft(toDraft(base));
                    setShowErrors(false);
                    setSaveError(null);
                  },
                })
              }
            >
              Huỷ thay đổi
            </Button>
            <Button onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? "Đang lưu..." : "Lưu bài"}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.run()}
        title={confirm?.title ?? ""}
        body={confirm?.body}
        confirmLabel={confirm?.label}
      />
    </div>
  );
}

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-[64ch] text-sm text-ink-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- outcomes */

function StringList({ items, onChange, itemLabel, addLabel, empty }: { items: string[]; onChange: (v: string[]) => void; itemLabel: (i: number) => string; addLabel: string; empty: string }) {
  return (
    <div>
      {items.length === 0 ? (
        <p className="text-ink-2">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-1">
              <div className="min-w-0 flex-1">
                <RichField label={itemLabel(i)} single value={it} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} />
              </div>
              <div className="mt-7 flex">
                <MoveButtons index={i} count={items.length} what={itemLabel(i).toLowerCase()} onMove={(d) => onChange(move(items, i, i + d))} />
                <IconButton label={`Xoá ${itemLabel(i).toLowerCase()}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                  <Trash size={18} />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Button variant="ghost" size="sm" className="mt-2 !h-10" onClick={() => onChange([...items, ""])}>
        <Plus size={16} /> {addLabel}
      </Button>
    </div>
  );
}

function MoveButtons({ index, count, what, onMove }: { index: number; count: number; what: string; onMove: (delta: -1 | 1) => void }) {
  const first = index === 0;
  const last = index === count - 1;
  return (
    <>
      <IconButton label={`Đưa ${what} lên`} aria-disabled={first || undefined} className="aria-disabled:opacity-35" onClick={() => !first && onMove(-1)}>
        <ArrowUp size={18} />
      </IconButton>
      <IconButton label={`Đưa ${what} xuống`} aria-disabled={last || undefined} className="aria-disabled:opacity-35" onClick={() => !last && onMove(1)}>
        <ArrowDown size={18} />
      </IconButton>
    </>
  );
}

/* ------------------------------------------------------------------ videos */

function VideoList({ videos, onChange, err }: { videos: Video[]; onChange: (v: Video[]) => void; err: (at: string) => string | undefined }) {
  const set = (id: string, p: Partial<Video>) => onChange(videos.map((v) => (v.id === id ? { ...v, ...p } : v)));
  return (
    <div>
      {videos.length === 0 ? (
        <p className="text-ink-2">Chưa có video. Thêm bài giảng hoặc video giải bài tập nếu có.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {videos.map((v, i) => (
            <li key={v.id} className="rounded-[var(--radius-paper)] border border-line p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-semibold">Video {i + 1}</p>
                <div className="-mr-2 flex">
                  <MoveButtons index={i} count={videos.length} what={`video ${i + 1}`} onMove={(d) => onChange(move(videos, i, i + d))} />
                  <IconButton label={`Xoá video ${i + 1}`} onClick={() => onChange(videos.filter((x) => x.id !== v.id))}>
                    <Trash size={18} />
                  </IconButton>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <ImageField label="Ảnh bìa" value={{ url: v.thumbnailUrl, alt: "" }} showAlt={false} ratio="16/9" onChange={(img) => set(v.id, { thumbnailUrl: img.url })} />
                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2" data-issue={issueKeys.video(v.id, "title")}>
                    <TextField label="Tiêu đề video" value={v.title} error={err(issueKeys.video(v.id, "title"))} onChange={(e) => set(v.id, { title: e.target.value })} />
                  </div>
                  <SelectField label="Loại" value={v.kind} onChange={(e) => set(v.id, { kind: e.target.value as Video["kind"] })}>
                    <option value="lecture">Bài giảng</option>
                    <option value="solution">Giải bài tập</option>
                  </SelectField>
                  <TextField
                    label="Thời lượng (phút)"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={v.durationSec ? String(Math.round(v.durationSec / 60)) : ""}
                    onChange={(e) => set(v.id, { durationSec: Math.max(0, Math.round(Number(e.target.value) || 0)) * 60 || undefined })}
                  />
                  <div className="sm:col-span-2" data-issue={issueKeys.video(v.id, "url")}>
                    <TextField
                      label="Đường dẫn nhúng"
                      type="url"
                      inputMode="url"
                      placeholder="https://www.youtube.com/embed/..."
                      value={v.url}
                      error={err(issueKeys.video(v.id, "url"))}
                      hint="Với YouTube, dùng link dạng youtube.com/embed/mã-video."
                      onChange={(e) => set(v.id, { url: e.target.value })}
                    />
                  </div>
                  <TextField label="Giáo viên" value={v.teacher ?? ""} aside={<span className="text-xs text-ink-3">Không bắt buộc</span>} onChange={(e) => set(v.id, { teacher: e.target.value })} className="sm:col-span-2" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Button variant="ghost" size="sm" className="mt-2 !h-10" onClick={() => onChange([...videos, { id: uid("v"), title: "", kind: "lecture", thumbnailUrl: "", url: "" }])}>
        <Plus size={16} /> Thêm video
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- sections */

function SectionEditor({
  section,
  index,
  count,
  autoFocus,
  freshBlock,
  onFresh,
  err,
  onChange,
  onMove,
  onRemove,
  onRemoveBlock,
}: {
  section: ESection;
  index: number;
  count: number;
  autoFocus: boolean;
  freshBlock: string | null;
  onFresh: (key: string) => void;
  err: (at: string) => string | undefined;
  onChange: (fn: (s: ESection) => ESection) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onRemoveBlock: (b: EBlock) => void;
}) {
  const reduce = useReducedMotion();
  const head = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<{ key: string; after: boolean } | null>(null);

  useEffect(() => {
    if (autoFocus) head.current?.querySelector("input")?.focus();
  }, [autoFocus]);

  const setBlocks = (fn: (b: EBlock[]) => EBlock[]) => onChange((s) => ({ ...s, blocks: fn(s.blocks) }));

  function addBlock(type: BlockType) {
    const key = uid("b");
    setBlocks((all) => [...all, { key, block: newBlock(type) }]);
    onFresh(key);
  }

  function endDrag() {
    setArmed(null);
    setDragging(null);
    setOver(null);
  }

  function onDragOver(e: DragEvent, key: string) {
    if (!dragging || !section.blocks.some((b) => b.key === dragging)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const r = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    if (over?.key !== key || over.after !== after) setOver({ key, after });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (dragging && over && dragging !== over.key) {
      setBlocks((all) => {
        const from = all.findIndex((b) => b.key === dragging);
        if (from < 0) return all;
        const rest = all.filter((b) => b.key !== dragging);
        const at = rest.findIndex((b) => b.key === over.key);
        if (at < 0) return all;
        rest.splice(at + (over.after ? 1 : 0), 0, all[from]);
        return rest;
      });
    }
    endDrag();
  }

  return (
    <div>
      <div ref={head} className="flex items-start gap-3 border-b border-rule pb-4" data-issue={issueKeys.section(section.key)}>
        <span className="tabular mt-8 w-7 shrink-0 text-right font-display text-xl font-bold text-coral-ink">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <TextField
            label={`Tiêu đề phần ${index + 1}`}
            value={section.title}
            placeholder="Khởi động"
            error={err(issueKeys.section(section.key))}
            hint={section.title.trim() ? `Neo liên kết: #${section.id || slugify(section.title)}` : "Ví dụ: Khởi động, Khám phá, Ghi nhớ."}
            onChange={(e) => {
              const title = e.target.value;
              onChange((s) => ({ ...s, title, id: slugify(title) }));
            }}
          />
        </div>
        <div className="mt-7 flex">
          <MoveButtons index={index} count={count} what={`phần ${index + 1}`} onMove={onMove} />
          <IconButton label={`Xoá phần ${index + 1}`} onClick={onRemove}>
            <Trash size={18} />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 md:pl-10">
        {section.blocks.length === 0 ? (
          <p className="text-sm text-ink-2">Phần này chưa có khối nào. Thêm đoạn văn, công thức, ví dụ hoặc câu hỏi tự kiểm.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {section.blocks.map((b, i) => (
              <motion.li key={b.key} layout={reduce ? false : "position"} transition={{ duration: 0.3, ease }} className="relative">
                {over?.key === b.key && dragging !== b.key && (
                  <span aria-hidden="true" className={`absolute inset-x-0 z-10 h-0.5 rounded-full bg-coral ${over.after ? "-bottom-2.5" : "-top-2.5"}`} />
                )}
                <div
                  draggable={armed === b.key}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", b.key);
                    setDragging(b.key);
                  }}
                  onDragOver={(e) => onDragOver(e, b.key)}
                  onDrop={onDrop}
                  onDragEnd={endDrag}
                  className={`rounded-[var(--radius-paper)] border bg-paper transition-opacity ${dragging === b.key ? "border-coral opacity-50" : "border-line"}`}
                >
                  <BlockCard
                    entry={b}
                    index={i}
                    count={section.blocks.length}
                    autoFocus={freshBlock === b.key}
                    err={err}
                    onArm={(on) => setArmed(on ? b.key : null)}
                    onChange={(block) => setBlocks((all) => all.map((x) => (x.key === b.key ? { ...x, block } : x)))}
                    onMove={(d) => setBlocks((all) => move(all, i, i + d))}
                    onRemove={() => onRemoveBlock(b)}
                  />
                </div>
              </motion.li>
            ))}
          </ol>
        )}
        <div className="mt-4">
          <ActionMenu
            label="Thêm khối"
            showLabel
            align="left"
            triggerClassName={buttonClass("secondary", "sm", "!h-10 aria-expanded:border-ink-3")}
            trigger={
              <>
                <Plus size={16} /> Thêm khối
              </>
            }
            items={blockOrder.map((t) => {
              const I = blockIcons[t];
              return { label: blockLabels[t], icon: <I size={18} />, onSelect: () => addBlock(t) };
            })}
          />
        </div>
      </div>
    </div>
  );
}

function BlockCard({
  entry,
  index,
  count,
  autoFocus,
  err,
  onArm,
  onChange,
  onMove,
  onRemove,
}: {
  entry: EBlock;
  index: number;
  count: number;
  autoFocus: boolean;
  err: (at: string) => string | undefined;
  onArm: (on: boolean) => void;
  onChange: (b: LessonBlock) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const body = useRef<HTMLDivElement>(null);
  const I = blockIcons[entry.block.type];
  const label = blockLabels[entry.block.type];

  useEffect(() => {
    if (autoFocus) body.current?.querySelector<HTMLElement>("input:not([type=radio]), textarea, button")?.focus();
  }, [autoFocus]);

  return (
    <>
      <div className="flex items-center gap-1 border-b border-line py-1 pl-1 pr-2">
        <span
          aria-hidden="true"
          title="Kéo để đổi chỗ"
          onPointerDown={() => onArm(true)}
          onPointerUp={() => onArm(false)}
          className="inline-flex size-10 cursor-grab touch-none items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink active:cursor-grabbing"
        >
          <DotsSixVertical size={20} weight="bold" />
        </span>
        <I size={18} className="shrink-0 text-ink-3" />
        <p className="ml-1 mr-auto truncate text-sm font-semibold">{label}</p>
        <MoveButtons index={index} count={count} what={`khối ${label.toLowerCase()}`} onMove={onMove} />
        <IconButton label={`Xoá khối ${label.toLowerCase()}`} onClick={onRemove}>
          <Trash size={18} />
        </IconButton>
      </div>
      <div ref={body} className="p-4">
        <BlockBody block={entry.block} blockKey={entry.key} onChange={onChange} err={err} />
      </div>
    </>
  );
}
