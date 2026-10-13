"use client";

import { ArrowLeft, ArrowRight, Check, NotePencil, Play, Sparkle } from "@/components/ui/icons";
import Image from "@/components/ui/Image";
import Link from "next/link";
import { useState } from "react";
import { RichText } from "@/components/learn/Math";
import { buttonClass } from "@/components/ui/Button";
import type { LessonDetail, SubjectOutline, Video } from "@/lib/api/lesson-types";
import { useSession } from "@/lib/session";
import { Block } from "./Blocks";
import { VideoDialog, formatDuration, videoKindLabel } from "./Overlays";

export interface Anchor {
  id: string;
  label: string;
  number?: number;
}

/** Everything "Trong bài này" lists, in reading order. */
export function lessonAnchors(lesson: LessonDetail, outline: SubjectOutline | null): Anchor[] {
  const list: Anchor[] = [];
  if (lesson.outcomes.length) list.push({ id: "muc-tieu", label: "Sau bài này em" });
  if (lesson.videos.length) list.push({ id: "video-bai-giang", label: "Video bài giảng" });
  lesson.sections.forEach((s, i) => list.push({ id: s.id, label: s.title, number: i + 1 }));
  list.push({ id: "bai-tap", label: "Bài tập" });
  if (outline?.generalVideos.length) list.push({ id: "video-chung", label: "Video chung" });
  return list;
}

export const practiceHref = (id: string) => `/learn/practice?lesson=${encodeURIComponent(id)}`;

export function askAi(lesson: LessonDetail) {
  window.dispatchEvent(
    new CustomEvent("fp:assistant-open", {
      detail: { context: `${lesson.subject.name} ${lesson.grade}, Bài ${lesson.index}: ${lesson.title}` },
    }),
  );
}

export function LessonArticle({
  lesson,
  outline,
  hrefFor,
  onNavigate,
  onAskAi,
}: {
  lesson: LessonDetail;
  outline: SubjectOutline | null;
  hrefFor: (lessonId: string) => string;
  onNavigate: () => void;
  onAskAi: () => void;
}) {
  const [playing, setPlaying] = useState<Video | null>(null);
  const role = useSession()?.user.role;
  const empty = lesson.sections.length === 0;
  const general = outline?.generalVideos ?? [];

  return (
    <article className="oli-margin max-sm:before:left-4! pb-16 pl-9 pr-1 sm:pl-20 sm:pr-4" aria-labelledby="lesson-title">
      <div className="max-w-[70ch] text-[1.0625rem] leading-[1.8]">
        {/* heading */}
        <p className="text-sm leading-normal text-ink-2">
          Chủ đề {lesson.topic.index}/{lesson.topic.count} · <RichText text={lesson.topic.title} />
        </p>
        <div className="mt-6 flex items-end gap-4">
          <span className="tabular font-display text-[5rem] font-bold leading-[0.8] text-coral-ink sm:text-[6rem]" aria-hidden="true">
            {lesson.index}
          </span>
          <div className="pb-1">
            <p className="tabular text-sm leading-normal text-ink-2">
              Bài {lesson.index}/{lesson.lessonCount} của chủ đề
            </p>
            <ProgressDots index={lesson.index} count={lesson.lessonCount} />
          </div>
        </div>
        <h2 id="lesson-title" className="mt-5 text-3xl font-bold sm:text-[2.5rem]">
          <span className="sr-only">Bài {lesson.index}. </span>
          <RichText text={lesson.title} />
        </h2>

        {lesson.outcomes.length > 0 && (
          <section id="muc-tieu" aria-labelledby="muc-tieu-h" className="mt-8 scroll-mt-32">
            <h3 id="muc-tieu-h" className="text-lg font-semibold">Sau bài này em</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {lesson.outcomes.map((o, i) => (
                <li key={i} className="flex gap-3">
                  <Check size={20} weight="bold" className="mt-1.5 shrink-0 text-coral-ink" aria-hidden="true" />
                  <RichText text={o} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {lesson.videos.length > 0 && (
          <section id="video-bai-giang" aria-labelledby="video-bai-giang-h" className="mt-12 scroll-mt-32">
            <h3 id="video-bai-giang-h" className="text-2xl font-bold">Video bài giảng</h3>
            <VideoList videos={lesson.videos} onPlay={setPlaying} />
          </section>
        )}

        {empty ? (
          <Drafting canEdit={role === "admin"} onAskAi={onAskAi} />
        ) : (
          lesson.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-14 scroll-mt-32">
              <h3 id={`${s.id}-h`} className="flex items-baseline gap-2.5 text-2xl font-bold">
                <span className="tabular text-coral-ink">{i + 1}.</span>
                {s.title}
              </h3>
              <div className="mt-2">
                {s.blocks.map((b, bi) => (
                  <Block key={bi} block={b} />
                ))}
              </div>
            </section>
          ))
        )}

        <section id="bai-tap" aria-labelledby="bai-tap-h" className="mt-14 scroll-mt-32">
          <h3 id="bai-tap-h" className="text-2xl font-bold">Bài tập</h3>
          <p className="mt-3 text-ink-2">
            {lesson.exerciseCount > 0
              ? `Phần Luyện tập có ${lesson.exerciseCount} câu cho bài này. Máy chấm điểm ngay và giải thích câu sai.`
              : "Bài này chưa có bài tập chấm điểm. Em có thể hỏi trợ lý AI ra thêm câu luyện."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {lesson.exerciseCount > 0 && (
              <Link href={practiceHref(lesson.id)} className={buttonClass("primary", "md")}>
                <NotePencil size={18} /> Luyện Bài {lesson.index}, có chấm điểm
              </Link>
            )}
            <button onClick={onAskAi} className={buttonClass("secondary", "md")}>
              <Sparkle size={18} className="text-coral-ink" /> Hỏi AI về bài này
            </button>
          </div>
        </section>

        {general.length > 0 && (
          <section id="video-chung" aria-labelledby="video-chung-h" className="mt-14 scroll-mt-32">
            <h3 id="video-chung-h" className="text-2xl font-bold">Video chung</h3>
            <p className="mt-2 text-ink-2">Dùng cho cả môn {outline?.subject.name}, xem khi ôn tập.</p>
            <VideoList videos={general} onPlay={setPlaying} />
          </section>
        )}

        {(lesson.prev || lesson.next) && (
          <nav aria-label="Chuyển bài" className="mt-16 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
            {lesson.prev ? (
              <Link
                href={hrefFor(lesson.prev.id)}
                replace
                scroll={false}
                onClick={onNavigate}
                className="group flex min-h-16 items-center gap-3 rounded-[var(--radius-paper)] border border-line px-4 py-3 transition-colors hover:border-ink-3"
              >
                <ArrowLeft size={20} className="shrink-0 text-ink-3 transition-transform group-hover:-translate-x-0.5 group-hover:text-coral-ink" />
                <span className="min-w-0">
                  <span className="block text-sm leading-normal text-ink-3">Bài trước</span>
                  <span className="line-clamp-2 font-semibold leading-snug"><RichText text={lesson.prev.title} /></span>
                </span>
              </Link>
            ) : (
              <span className="max-sm:hidden" />
            )}
            {lesson.next && (
              <Link
                href={hrefFor(lesson.next.id)}
                replace
                scroll={false}
                onClick={onNavigate}
                className="group flex min-h-16 items-center justify-end gap-3 rounded-[var(--radius-paper)] border border-line px-4 py-3 text-right transition-colors hover:border-coral"
              >
                <span className="min-w-0">
                  <span className="block text-sm leading-normal text-ink-3">Bài sau</span>
                  <span className="line-clamp-2 font-semibold leading-snug"><RichText text={lesson.next.title} /></span>
                </span>
                <ArrowRight size={20} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-coral-ink" />
              </Link>
            )}
          </nav>
        )}
      </div>

      <VideoDialog video={playing} onClose={() => setPlaying(null)} />
    </article>
  );
}

function ProgressDots({ index, count }: { index: number; count: number }) {
  return (
    <span className="mt-2 flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
            i + 1 === index ? "w-6 bg-coral" : i + 1 < index ? "w-2 bg-coral/45" : "w-2 bg-line"
          }`}
        />
      ))}
    </span>
  );
}

function VideoList({ videos, onPlay }: { videos: Video[]; onPlay: (v: Video) => void }) {
  return (
    <ul className="mt-4 grid gap-5 sm:grid-cols-2">
      {videos.map((v) => (
        <li key={v.id}>
          <button onClick={() => onPlay(v)} className="group w-full rounded-[var(--radius-paper)] text-left">
            <span className="relative block aspect-video overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper-3">
              <Image
                src={v.thumbnailUrl}
                alt=""
                fill
                sizes="(min-width: 640px) 340px, 90vw"
                // Hosts outside next.config remotePatterns (admin uploads) load as-is.
                unoptimized={!/^https:\/\/(fastly\.)?picsum\.photos\//.test(v.thumbnailUrl)}
                className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-paper/90 text-ink paper-shadow transition-colors group-hover:bg-coral group-hover:text-on-coral">
                  <Play size={22} weight="fill" />
                </span>
              </span>
              {v.durationSec ? (
                <span className="tabular absolute bottom-2 right-2 rounded-full bg-cover/85 px-2 py-0.5 text-xs font-semibold leading-normal text-on-cover">
                  {formatDuration(v.durationSec)}
                </span>
              ) : null}
            </span>
            <span className="mt-2.5 block font-semibold leading-snug group-hover:text-coral-ink">{v.title}</span>
            <span className="mt-0.5 block text-sm leading-normal text-ink-3">
              {videoKindLabel(v.kind)}
              {v.teacher ? `, ${v.teacher}` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Drafting({ canEdit, onAskAi }: { canEdit: boolean; onAskAi: () => void }) {
  return (
    <div className="oli mt-12 rounded-[var(--radius-paper)] border border-rule px-6 py-10 sm:px-8">
      <p className="font-display text-2xl font-semibold">Bài này đang được soạn.</p>
      <p className="mt-2 max-w-[48ch] text-ink-2">
        Thầy cô đang viết nội dung cho bài này. Trong lúc chờ, em xem video ở trên hoặc hỏi trợ lý AI giảng trước cho em nhé.
      </p>
      <p className="mt-4 font-hand text-xl text-coral-ink">Sắp xong rồi, em quay lại sau nhé.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onAskAi} className={buttonClass("primary", "md")}>
          <Sparkle size={18} /> Hỏi AI về bài này
        </button>
        {canEdit && (
          <Link href="/admin/lessons" className={buttonClass("secondary", "md")}>
            <NotePencil size={18} /> Soạn bài này
          </Link>
        )}
      </div>
    </div>
  );
}
