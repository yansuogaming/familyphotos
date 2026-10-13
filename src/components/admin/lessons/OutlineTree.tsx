"use client";

import { ArrowDown, ArrowUp, CaretRight, DotsThree, PencilSimple, Plus, Trash } from "@/components/ui/icons";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { LessonSummary, SubjectOutline, TopicSummary } from "@/lib/api/lesson-types";
import { EmptyState, ErrorNote, RibbonMark } from "../ui";
import { ActionMenu } from "./ActionMenu";

export interface TreeActions {
  addTopic: () => void;
  renameTopic: (t: TopicSummary) => void;
  moveTopic: (index: number, delta: -1 | 1) => void;
  deleteTopic: (t: TopicSummary) => void;
  addLesson: (t: TopicSummary) => void;
  moveLesson: (t: TopicSummary, index: number, delta: -1 | 1) => void;
  deleteLesson: (t: TopicSummary, l: LessonSummary) => void;
  openLesson: (l: LessonSummary) => void;
}

/** Chủ đề > Bài. Order matters, so both levels are numbered. */
export function OutlineTree({ outline, selected, busy, error, actions }: { outline: SubjectOutline; selected: string | null; busy: boolean; error: string | null; actions: TreeActions }) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const lessonCount = outline.topics.reduce((n, t) => n + t.lessons.length, 0);
  const isOpen = (t: TopicSummary, i: number) => openMap[t.id] ?? (i === 0 || t.lessons.some((l) => l.id === selected));

  return (
    <nav aria-label="Mục lục môn học">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Mục lục</h2>
          <p className="text-sm text-ink-3">
            {outline.topics.length} chủ đề, {lessonCount} bài{busy ? ". Đang lưu..." : ""}
          </p>
        </div>
        {outline.topics.length > 0 && (
          <Button variant="secondary" size="sm" className="!h-10" onClick={actions.addTopic} disabled={busy}>
            <Plus size={16} /> Thêm chủ đề
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {outline.topics.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Môn này chưa có chủ đề."
            body="Thêm chủ đề đầu tiên, rồi thêm bài vào chủ đề đó."
            action={
              <Button size="sm" className="!h-10" onClick={actions.addTopic} disabled={busy}>
                <Plus size={16} /> Thêm chủ đề
              </Button>
            }
          />
        </div>
      ) : (
        <ol className="mt-4 flex flex-col border-t border-line">
          {outline.topics.map((t, i) => {
            const open = isOpen(t, i);
            const listId = `topic-${t.id}`;
            return (
              <li key={t.id} className="border-b border-line py-1.5">
                <div className="flex items-start gap-0.5">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={listId}
                    onClick={() => setOpenMap((m) => ({ ...m, [t.id]: !open }))}
                    className="flex min-h-10 min-w-0 flex-1 items-start gap-2 rounded-[var(--radius-paper)] px-1.5 py-2 text-left hover:bg-paper-2"
                  >
                    <CaretRight size={14} weight="bold" className={`mt-1 shrink-0 text-ink-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
                    <span className="tabular w-5 shrink-0 text-right font-semibold text-coral-ink">{t.index}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">{t.title}</span>
                      <span className="block text-xs text-ink-3">{t.lessons.length} bài</span>
                    </span>
                  </button>
                  <ActionMenu
                    label={`Thao tác cho chủ đề ${t.index}`}
                    trigger={<DotsThree size={20} weight="bold" />}
                    items={[
                      { label: "Thêm bài", icon: <Plus size={18} />, onSelect: () => actions.addLesson(t), disabled: busy },
                      { label: "Đổi tên", icon: <PencilSimple size={18} />, onSelect: () => actions.renameTopic(t), disabled: busy },
                      { label: "Đưa lên", icon: <ArrowUp size={18} />, onSelect: () => actions.moveTopic(i, -1), disabled: busy || i === 0 },
                      { label: "Đưa xuống", icon: <ArrowDown size={18} />, onSelect: () => actions.moveTopic(i, 1), disabled: busy || i === outline.topics.length - 1 },
                      { label: "Xoá chủ đề", icon: <Trash size={18} />, onSelect: () => actions.deleteTopic(t), danger: true, disabled: busy },
                    ]}
                  />
                </div>
                {open && (
                  <ol id={listId} className="mb-1 ml-[1.15rem] border-l border-line pl-2">
                    {t.lessons.map((l, j) => {
                      const active = l.id === selected;
                      return (
                        <li key={l.id} className="relative flex items-start gap-0.5">
                          {active && <RibbonMark className="absolute -left-[0.85rem] top-0 h-6 w-2.5" />}
                          <button
                            type="button"
                            aria-current={active ? "page" : undefined}
                            onClick={() => actions.openLesson(l)}
                            className={`flex min-h-10 min-w-0 flex-1 gap-2 rounded-[var(--radius-paper)] px-2 py-2 text-left text-sm leading-snug transition-colors ${
                              active ? "bg-coral-wash font-semibold text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                            }`}
                          >
                            <span className={`tabular shrink-0 ${active ? "text-coral-ink" : "text-ink-3"}`}>{l.index}.</span>
                            <span className="min-w-0">{l.title}</span>
                          </button>
                          <ActionMenu
                            label={`Thao tác cho bài ${l.index}, chủ đề ${t.index}`}
                            trigger={<DotsThree size={20} weight="bold" />}
                            items={[
                              { label: "Đưa lên", icon: <ArrowUp size={18} />, onSelect: () => actions.moveLesson(t, j, -1), disabled: busy || j === 0 },
                              { label: "Đưa xuống", icon: <ArrowDown size={18} />, onSelect: () => actions.moveLesson(t, j, 1), disabled: busy || j === t.lessons.length - 1 },
                              { label: "Xoá bài", icon: <Trash size={18} />, onSelect: () => actions.deleteLesson(t, l), danger: true, disabled: busy },
                            ]}
                          />
                        </li>
                      );
                    })}
                    <li>
                      <button
                        type="button"
                        onClick={() => actions.addLesson(t)}
                        disabled={busy}
                        className="flex min-h-10 w-full items-center gap-2 rounded-[var(--radius-paper)] px-2 text-left text-sm font-semibold text-coral-ink hover:bg-paper-2 disabled:opacity-50"
                      >
                        <Plus size={16} /> {t.lessons.length ? "Thêm bài" : "Thêm bài đầu tiên"}
                      </button>
                    </li>
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}

export function TreeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải mục lục" className="flex flex-col">
      <div className="h-6 w-28 animate-pulse rounded bg-paper-3" />
      <div className="mt-2 h-3.5 w-36 animate-pulse rounded bg-paper-3" />
      <div className="mt-4 border-t border-line">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-line px-2 py-3.5">
            <div className="h-3.5 w-4 animate-pulse rounded bg-paper-3" />
            <div className="h-3.5 animate-pulse rounded bg-paper-3" style={{ width: `${48 + ((i * 17) % 35)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
