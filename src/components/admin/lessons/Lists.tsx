"use client";

/* eslint-disable @next/next/no-img-element -- video covers may be data URLs or any pasted address */
import { ArrowDown, ArrowSquareOut, ArrowUp, Check, DotsSixVertical, PencilSimple, Plus, Sparkle, Trash, VideoCamera } from "@/components/ui/icons";
import { useState, type DragEvent, type ReactNode } from "react";
import { RichText } from "@/components/learn/Math";
import { formatDateTime } from "@/components/settings/shared";
import { Button, buttonClass } from "@/components/ui/Button";
import type { LessonDetail } from "@/lib/api/lesson-types";
import { EmptyState, RibbonMark, Tag } from "../ui";
import { AiTag, Toolbar, selKey } from "./Canvas";
import { aiKey, type Ed } from "./ed";
import { allQuestions, issuesFor, sameSelection, type Selection } from "./model";

const letters = "ABCDEF";
export const kindLabel = { lecture: "Bài giảng", solution: "Giải bài tập" } as const;
export const minutes = (sec?: number) => (sec ? `${Math.max(1, Math.round(sec / 60))} phút` : null);

function Row({ ed, sel, children, className = "" }: { ed: Ed; sel: Selection; children: ReactNode; className?: string }) {
  const on = sameSelection(ed.sel, sel);
  const bad = issuesFor(ed.issues, sel).length > 0;
  return (
    <div
      data-sel={selKey(sel)}
      onClick={() => ed.select(sel)}
      className={`group/row relative flex cursor-pointer items-center gap-3 rounded-[var(--radius-paper)] border bg-paper py-2 pl-2 pr-1 transition-colors ${
        on ? "border-coral bg-paper-2" : bad ? "border-danger" : "border-line hover:border-ink-3"
      } ${className}`}
    >
      {on && <RibbonMark className="absolute -left-px -top-1 h-7 w-2.5" />}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ videos */

export function VideosPanel({ ed }: { ed: Ed }) {
  const videos = ed.draft.videos;
  const [armed, setArmed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null);

  const end = () => {
    setArmed(null);
    setDragging(null);
    setOver(null);
  };

  function onDragOver(e: DragEvent, id: string) {
    if (!dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const r = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    if (over?.id !== id || over.after !== after) setOver({ id, after });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (dragging && over && dragging !== over.id) {
      const from = videos.findIndex((v) => v.id === dragging);
      let to = videos.findIndex((v) => v.id === over.id) + (over.after ? 1 : 0);
      if (from < to) to -= 1;
      ed.reorderVideo(from, to);
    }
    end();
  }

  return (
    <div className="max-w-[46rem]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Video của bài</h2>
          <p className="mt-0.5 text-sm text-ink-2">Học sinh thấy các video này ngay dưới phần Mục tiêu. Kéo tay nắm để đổi thứ tự.</p>
        </div>
        {videos.length > 0 && (
          <Button variant="secondary" size="sm" className="!h-10" onClick={ed.addVideo}>
            <Plus size={16} /> Thêm video
          </Button>
        )}
      </div>
      {videos.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Bài chưa có video."
            body="Thêm bài giảng hoặc video giải bài tập. Dán đường dẫn nhúng của YouTube, rồi chọn ảnh bìa."
            action={
              <Button size="sm" className="!h-10" onClick={ed.addVideo}>
                <Plus size={16} /> Thêm video
              </Button>
            }
          />
        </div>
      ) : (
        <ol className="mt-5 flex flex-col gap-2" aria-label="Danh sách video">
          {videos.map((v, i) => {
            const sel: Selection = { kind: "video", id: v.id };
            const meta = [minutes(v.durationSec), v.teacher?.trim() || null].filter(Boolean).join(", ");
            return (
              <li
                key={v.id}
                className={`relative transition-opacity ${dragging === v.id ? "opacity-40" : ""}`}
                draggable={armed === v.id}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", v.id);
                  setDragging(v.id);
                }}
                onDragOver={(e) => onDragOver(e, v.id)}
                onDrop={onDrop}
                onDragEnd={end}
              >
                {over?.id === v.id && dragging !== v.id && <span aria-hidden="true" className={`absolute inset-x-0 z-10 h-0.5 rounded-full bg-coral ${over.after ? "-bottom-1.5" : "-top-1.5"}`} />}
                <Row ed={ed} sel={sel}>
                  <span
                    aria-hidden="true"
                    title="Kéo để đổi chỗ"
                    onPointerDown={() => setArmed(v.id)}
                    onPointerUp={() => setArmed(null)}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-ink-3 hover:text-ink active:cursor-grabbing max-sm:hidden"
                  >
                    <DotsSixVertical size={18} />
                  </span>
                  <span className="relative block h-[54px] w-24 shrink-0 overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper-3">
                    {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <VideoCamera size={20} aria-hidden="true" className="absolute inset-0 m-auto text-ink-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        ed.select(sel, { focus: true });
                      }}
                      className="block max-w-full truncate rounded text-left font-semibold"
                    >
                      <span className="sr-only">Sửa video {i + 1}: </span>
                      {v.title.trim() || <span className="text-ink-3">Video chưa có tên</span>}
                    </button>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
                      <Tag tone={v.kind === "lecture" ? "neutral" : "coral"}>{kindLabel[v.kind]}</Tag>
                      {meta && <span className="min-w-0 truncate">{meta}</span>}
                      {!v.url.trim() && <span className="text-danger">Chưa có đường dẫn</span>}
                    </span>
                  </span>
                  <Toolbar
                    className="shrink-0 border-transparent shadow-none"
                    tools={[
                      { label: `Đưa video ${i + 1} lên`, icon: <ArrowUp size={18} />, onClick: () => ed.reorderVideo(i, i - 1), disabled: i === 0 },
                      { label: `Đưa video ${i + 1} xuống`, icon: <ArrowDown size={18} />, onClick: () => ed.reorderVideo(i, i + 1), disabled: i === videos.length - 1 },
                      { label: `Xoá video ${i + 1}`, icon: <Trash size={18} />, onClick: () => ed.removeVideo(v.id), danger: true },
                    ]}
                  />
                </Row>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- questions */

export function QuestionsPanel({ ed }: { ed: Ed }) {
  const all = allQuestions(ed.draft);
  const groups = ed.draft.sections.flatMap((s, si) =>
    s.blocks.filter((b) => b.block.type === "quiz").map((b) => ({ section: s, si, blockKey: b.key, items: all.filter((x) => x.blockKey === b.key), start: all.findIndex((x) => x.blockKey === b.key) })),
  );
  return (
    <div className="max-w-[46rem]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Câu hỏi tự kiểm</h2>
          <p className="mt-0.5 text-sm text-ink-2">Trắc nghiệm cuối bài. Học sinh chọn đáp án, máy chấm và giải thích ngay.</p>
        </div>
        <Button variant="secondary" size="sm" className="!h-10" onClick={() => ed.openAi("quiz")}>
          <Sparkle size={16} className="text-coral-ink" /> Tạo câu hỏi bằng AI
        </Button>
      </div>
      {groups.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Bài chưa có câu hỏi tự kiểm."
            body='Thêm câu đầu tiên, phần "Tự kiểm" sẽ được tạo ở cuối bài. Hoặc để AI soạn vài câu rồi chọn câu hợp.'
            action={
              <Button size="sm" className="!h-10" onClick={() => ed.addQuestion()}>
                <Plus size={16} /> Thêm câu hỏi
              </Button>
            }
          />
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.blockKey} className="mt-6" aria-label={`Câu hỏi trong phần ${g.si + 1}`}>
            {groups.length > 1 && (
              <h3 className="mb-2 text-sm font-semibold text-ink-2">
                Trong phần {g.si + 1}. {g.section.title || "Phần chưa có tên"}
              </h3>
            )}
            {g.items.length === 0 ? (
              <p className="text-sm text-ink-3">Khối tự kiểm này chưa có câu nào.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {g.items.map(({ q }, i) => {
                  const n = g.start + i + 1;
                  const sel: Selection = { kind: "question", blockKey: g.blockKey, id: q.id };
                  const right = q.choices[q.answerIndex];
                  const ai = ed.isAi(aiKey.question(q.id));
                  const problem = issuesFor(ed.issues, sel)[0];
                  return (
                    <li key={q.id}>
                      <Row ed={ed} sel={sel} className="!items-start !pl-3">
                        <span className="tabular mt-2 shrink-0 whitespace-nowrap font-display text-base font-semibold text-coral-ink">Câu {n}</span>
                        <span className="min-w-0 flex-1 py-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ed.select(sel, { focus: true });
                            }}
                            className="line-clamp-2 rounded text-left font-semibold"
                          >
                            {q.prompt.trim() ? <RichText text={q.prompt} /> : <span className="text-ink-3">Câu hỏi chưa có đề</span>}
                          </button>
                          <span className="mt-1 flex items-start gap-1.5 text-sm text-ink-2">
                            <Check size={16} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-coral-ink" />
                            <span className="min-w-0">
                              Đáp án {letters[q.answerIndex]}. {right?.trim() ? <RichText text={right} /> : <span className="text-ink-3">còn trống</span>}
                            </span>
                          </span>
                          {(ai || problem) && (
                            <span className="mt-1 flex flex-wrap items-center gap-x-3">
                              {ai && <AiTag onApprove={() => ed.approve(aiKey.question(q.id))} />}
                              {problem && <span className="text-sm font-semibold text-danger">{problem.message}</span>}
                            </span>
                          )}
                        </span>
                        <Toolbar
                          className="shrink-0 border-transparent shadow-none"
                          tools={[
                            { label: `Đưa câu ${n} lên`, icon: <ArrowUp size={18} />, onClick: () => ed.moveQuestion(g.blockKey, q.id, -1), disabled: i === 0 },
                            { label: `Đưa câu ${n} xuống`, icon: <ArrowDown size={18} />, onClick: () => ed.moveQuestion(g.blockKey, q.id, 1), disabled: i === g.items.length - 1 },
                            { label: `Xoá câu ${n}`, icon: <Trash size={18} />, onClick: () => ed.removeQuestion(g.blockKey, q.id), danger: true },
                          ]}
                        />
                      </Row>
                    </li>
                  );
                })}
              </ol>
            )}
            <Button variant="ghost" size="sm" className="mt-2 !h-10" onClick={() => ed.addQuestion(g.blockKey)}>
              <Plus size={16} /> Thêm câu hỏi
            </Button>
          </section>
        ))
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- info */

export function studentHref(base: LessonDetail) {
  const qs = new URLSearchParams({ grade: String(base.grade), subject: base.subject.id, lesson: base.id });
  return `/learn/theory?${qs}`;
}

export function InfoPanel({ ed }: { ed: Ed }) {
  const { draft, base } = ed;
  const sel: Selection = { kind: "info" };
  const quizCount = allQuestions(draft).length;
  const rows: [string, ReactNode][] = [
    ["Tiêu đề", draft.title.trim() ? <RichText text={draft.title} /> : <span className="text-danger">Chưa có tiêu đề</span>],
    ["Vị trí", <>Lớp {base.grade}, {base.subject.name}. Chủ đề {base.topic.index}: <RichText text={base.topic.title} />. Bài {base.index}/{base.lessonCount}.</>],
    ["Mục tiêu", draft.outcomes.length ? `${draft.outcomes.length} mục tiêu` : "Chưa có"],
    ["Bài luyện tập", draft.exerciseCount ? `${draft.exerciseCount} bài có chấm điểm` : "Chưa có"],
    ["Nội dung", `${draft.sections.length} phần, ${draft.sections.reduce((n, s) => n + s.blocks.length, 0)} khối`],
    ["Video", draft.videos.length ? `${draft.videos.length} video` : "Chưa có"],
    ["Câu hỏi tự kiểm", quizCount ? `${quizCount} câu` : "Chưa có"],
    ["Lưu lần cuối", formatDateTime(base.updatedAt)],
  ];
  return (
    <div className="max-w-[46rem]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold">Thông tin bài</h2>
        <Button variant="secondary" size="sm" className="!h-10" onClick={() => ed.select(sel, { focus: true })}>
          <PencilSimple size={16} /> Sửa
        </Button>
      </div>
      <dl className="mt-4 border-t border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-sm text-ink-3">{k}</dt>
            <dd className="min-w-0">{v}</dd>
          </div>
        ))}
      </dl>
      <a href={studentHref(base)} target="_blank" rel="noopener" className={buttonClass("ghost", "sm", "mt-4 !h-10 -ml-3")}>
        <ArrowSquareOut size={16} /> Xem như học sinh
      </a>
    </div>
  );
}
