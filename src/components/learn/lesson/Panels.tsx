"use client";

import { ArrowRight, CaretDown, NotePencil, Sparkle, VideoCamera } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { RichText } from "@/components/learn/Math";
import { buttonClass } from "@/components/ui/Button";
import type { LessonDetail, SubjectOutline } from "@/lib/api/lesson-types";
import { type Anchor, practiceHref } from "./LessonArticle";

const ease = [0.16, 1, 0.3, 1] as const;

type Loadable<T> = { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: T };

/* ------------------------------------------------------------------ Mục lục */

export function TableOfContents({
  outline,
  onRetry,
  currentLessonId,
  currentTopicId,
  hrefFor,
  onNavigate,
  onGeneralVideos,
  group = "toc",
}: {
  outline: Loadable<SubjectOutline | null>;
  onRetry: () => void;
  currentLessonId?: string;
  currentTopicId?: string;
  hrefFor: (lessonId: string) => string;
  onNavigate: () => void;
  onGeneralVideos: () => void;
  /** Separate ribbon animation scope for each copy (sidebar, drawer). */
  group?: string;
}) {
  const reduce = useReducedMotion();
  // Which topic is unfolded. Follows the open lesson until the reader picks another.
  const [manual, setManual] = useState<{ forLesson?: string; topicId: string | null } | null>(null);
  const openTopic = manual && manual.forLesson === currentLessonId ? manual.topicId : currentTopicId ?? null;

  if (outline.status === "loading" || (outline.status === "ready" && !outline.data)) {
    return (
      <div className="flex flex-col gap-1.5" aria-busy="true" aria-label="Đang tải mục lục">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
            <span className="h-4 w-5 animate-pulse rounded bg-paper-3" />
            <span className="h-4 animate-pulse rounded bg-paper-3" style={{ width: `${55 + ((i * 37) % 40)}%` }} />
          </div>
        ))}
      </div>
    );
  }
  if (outline.status === "error") return <LoadError onRetry={onRetry} what="mục lục" />;

  const { topics, generalVideos } = outline.data!;
  if (topics.length === 0) {
    return <p className="px-2 text-sm text-ink-3">Môn này chưa có chủ đề nào. Khi thầy cô soạn xong, mục lục sẽ hiện ở đây.</p>;
  }

  return (
    <LayoutGroup id={group}>
      <ol className="flex flex-col gap-0.5">
        {topics.map((t) => {
          const open = openTopic === t.id;
          const here = t.id === currentTopicId;
          return (
            <li key={t.id}>
              <button
                aria-expanded={open}
                aria-controls={`toc-${t.id}`}
                onClick={() => setManual({ forLesson: currentLessonId, topicId: open ? null : t.id })}
                className={`flex min-h-11 w-full items-start gap-3 rounded-[var(--radius-paper)] px-2 py-2.5 text-left text-sm leading-snug transition-colors ${
                  here ? "font-semibold text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                }`}
              >
                <span className={`tabular w-5 shrink-0 text-right ${here ? "text-coral-ink" : "text-ink-3"}`}>{t.index}</span>
                <span className="min-w-0 flex-1">
                  <RichText text={t.title} />
                </span>
                <CaretDown
                  size={14}
                  className={`mt-0.5 shrink-0 text-ink-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.ol
                    id={`toc-${t.id}`}
                    initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease }}
                    className="ml-[1.1rem] overflow-hidden border-l border-line"
                  >
                    {t.lessons.length === 0 && <li className="py-2 pl-5 text-sm text-ink-3">Chưa có bài.</li>}
                    {t.lessons.map((l) => {
                      const current = l.id === currentLessonId;
                      return (
                        <li key={l.id} className="relative">
                          {current && (
                            <motion.span
                              layoutId="toc-ribbon"
                              transition={{ type: "tween", duration: reduce ? 0 : 0.45, ease }}
                              className="absolute -left-[7px] top-1 h-7 w-3 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]"
                              aria-hidden="true"
                            />
                          )}
                          <Link
                            href={hrefFor(l.id)}
                            replace
                            scroll={false}
                            onClick={onNavigate}
                            aria-current={current ? "page" : undefined}
                            className={`flex min-h-10 gap-2 rounded-r-[var(--radius-paper)] py-2 pl-5 pr-2 text-sm leading-snug transition-colors ${
                              current ? "bg-coral-wash font-semibold text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                            }`}
                          >
                            <span className={`tabular shrink-0 ${current ? "text-coral-ink" : "text-ink-3"}`}>Bài {l.index}</span>
                            <span className="min-w-0">
                              <RichText text={l.title} />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </motion.ol>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      {generalVideos.length > 0 && (
        <button
          onClick={onGeneralVideos}
          className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-paper)] border-t border-line px-2 pt-3 pb-2 text-left text-sm text-ink-2 transition-colors hover:text-ink"
        >
          <VideoCamera size={18} className="ml-0.5 shrink-0 text-coral-ink" />
          <span className="flex-1">Video bài giảng chung</span>
          <span className="tabular text-ink-3">{generalVideos.length}</span>
        </button>
      )}
    </LayoutGroup>
  );
}

/* ------------------------------------------------------------ Trong bài này */

export function OnThisPage({
  lesson,
  anchors,
  activeId,
  onJump,
  onAskAi,
  hrefFor,
  onNavigate,
}: {
  lesson: LessonDetail;
  anchors: Anchor[];
  activeId: string | null;
  onJump: (id: string) => void;
  onAskAi: () => void;
  hrefFor: (lessonId: string) => string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Các phần trong bài">
        <ul className="flex flex-col border-l border-line">
          {anchors.map((a) => {
            const on = a.id === activeId;
            return (
              <li key={a.id}>
                <a
                  href={`#${a.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onJump(a.id);
                  }}
                  aria-current={on ? "location" : undefined}
                  className={`-ml-px flex min-h-9 items-baseline gap-2 border-l py-1.5 pl-3 text-sm leading-snug transition-colors ${
                    on ? "border-coral font-semibold text-ink" : "border-transparent text-ink-2 hover:border-ink-3 hover:text-ink"
                  }`}
                >
                  {a.number !== undefined && <span className={`tabular w-4 shrink-0 ${on ? "text-coral-ink" : "text-ink-3"}`}>{a.number}.</span>}
                  {a.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-2">
        {lesson.exerciseCount > 0 && (
          <Link href={practiceHref(lesson.id)} className={buttonClass("primary", "md", "w-full justify-start")}>
            <NotePencil size={18} /> Luyện Bài {lesson.index}, có chấm điểm
          </Link>
        )}
        <button onClick={onAskAi} className={buttonClass("secondary", "md", "w-full justify-start")}>
          <Sparkle size={18} className="text-coral-ink" /> Hỏi AI về bài này
        </button>
      </div>

      {lesson.next && (
        <Link href={hrefFor(lesson.next.id)} replace scroll={false} onClick={onNavigate} className="group rounded-[var(--radius-paper)] text-sm text-ink-3">
          Bài tiếp theo
          <span className="mt-0.5 flex items-start gap-1.5 font-semibold leading-snug text-ink group-hover:text-coral-ink">
            <span className="min-w-0">
              <RichText text={lesson.next.title} />
            </span>
            <ArrowRight size={14} className="mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
    </div>
  );
}
