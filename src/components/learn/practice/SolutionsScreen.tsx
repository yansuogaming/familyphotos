"use client";

import { ArrowLeft, ArrowRight, CaretDown, ChatCircleDots, Eye, EyeSlash, Play, VideoCamera } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "@/components/ui/Image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Math as TeX, RichText } from "@/components/learn/Math";
import { Button } from "@/components/ui/Button";
import { practiceApi, seriesNames } from "@/lib/api/practice";
import type { BookSeries, ExerciseDetail, ExerciseSummary } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { RichLines } from "./QuestionView";
import { askAssistant, Chips, EmptyNote, grades, LearnHeader, plain, SelectField } from "./shared";

const ease = [0.16, 1, 0.3, 1] as const;

const subjectsFor = (grade: number) =>
  grade <= 5
    ? [{ value: "toan", label: "Toán" }, { value: "tieng-viet", label: "Tiếng Việt" }, { value: "tieng-anh", label: "Tiếng Anh" }]
    : grade <= 9
      ? [{ value: "toan", label: "Toán" }, { value: "ngu-van", label: "Ngữ văn" }, { value: "khtn", label: "Khoa học tự nhiên" }, { value: "tieng-anh", label: "Tiếng Anh" }]
      : [{ value: "toan", label: "Toán" }, { value: "ngu-van", label: "Ngữ văn" }, { value: "vat-li", label: "Vật lí" }, { value: "hoa-hoc", label: "Hoá học" }, { value: "tieng-anh", label: "Tiếng Anh" }];

const seriesOptions = (Object.keys(seriesNames) as BookSeries[]).map((s) => ({ value: s, label: seriesNames[s] }));

/** /learn/giai-bai-tap. `?exercise=<exerciseId>` opens one exercise. */
export function SolutionsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const openId = useSearchParams().get("exercise");
  const wide = useMediaQuery("(min-width: 1024px)");

  const [grade, setGrade] = useState(9);
  const [subject, setSubject] = useState("toan");
  const [series, setSeries] = useState<BookSeries>("ket-noi");
  const [lessonId, setLessonId] = useState("");
  const [pageText, setPageText] = useState("");

  const pageNum = pageText.trim() ? Number(pageText) : undefined;
  const pageError = pageText.trim() && (!Number.isInteger(pageNum) || pageNum! < 1 || pageNum! > 400) ? "Trang là số từ 1 đến 400." : undefined;
  const page = pageError ? undefined : pageNum;

  const lessons = useApi(() => practiceApi.solutionLessons({ grade, subject, series }), [grade, subject, series]);
  const list = useApi(() => practiceApi.exercises({ grade, subject, series, lessonId: lessonId || undefined, page }), [grade, subject, series, lessonId, page]);

  const items = list.status === "ready" ? list.data : [];
  const selected = openId ?? (wide ? items[0]?.id : undefined);
  const open = (id: string | null) => router.push(id ? `${pathname}?exercise=${id}` : pathname, { scroll: !wide });

  const resetDemo = () => {
    setGrade(9);
    setSubject("toan");
    setSeries("ket-noi");
    setLessonId("");
    setPageText("");
  };

  const showList = wide || !openId;
  const showDetail = !!selected && (wide || !!openId);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <LearnHeader title="Giải bài tập" modes />

      {showList && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[110px_180px_minmax(0,1fr)_110px]">
          <SelectField
            label="Lớp"
            value={grade}
            onChange={(g) => {
              setGrade(g);
              setSubject("toan");
              setLessonId("");
            }}
            options={grades.map((g) => ({ value: g, label: `Lớp ${g}` }))}
          />
          <SelectField
            label="Môn"
            value={subject}
            onChange={(s) => {
              setSubject(s);
              setLessonId("");
            }}
            options={subjectsFor(grade)}
          />
          <SelectField
            label="Bài trong sách"
            className="col-span-2 sm:col-span-1"
            value={lessonId}
            onChange={setLessonId}
            options={[{ value: "", label: "Tất cả các bài" }, ...(lessons.status === "ready" ? lessons.data.map((l) => ({ value: l.id, label: `${l.title} (trang ${l.pages[0]}-${l.pages[1]})` })) : [])]}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Trang SGK</span>
            <input
              inputMode="numeric"
              value={pageText}
              onChange={(e) => setPageText(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Ví dụ 10"
              aria-invalid={!!pageError}
              aria-describedby={pageError ? "trang-loi" : undefined}
              className={`tabular h-11 w-full rounded-[var(--radius-paper)] border bg-paper px-3 outline-none transition-colors focus:border-coral ${pageError ? "border-danger" : "border-line hover:border-ink-3"}`}
            />
            {pageError && <span id="trang-loi" className="text-sm text-danger">{pageError}</span>}
          </label>
          <Chips
            label="Bộ sách"
            className="col-span-2 sm:col-span-4"
            value={series}
            tone="coral"
            onChange={(s) => {
              setSeries(s);
              setLessonId("");
            }}
            options={seriesOptions}
          />
        </div>
      )}

      <div className={`mt-6 ${wide ? "grid grid-cols-[340px_minmax(0,1fr)] gap-8" : ""}`}>
        {showList && (
          <div className="min-w-0">
            {list.status === "loading" && <ListSkeleton />}
            {list.status === "error" && <LoadError onRetry={list.reload} what="danh sách bài tập" />}
            {list.status === "ready" &&
              (items.length === 0 ? (
                <EmptyNote title="Chưa có lời giải cho lựa chọn này" action={<Button variant="secondary" onClick={resetDemo}>Xem Toán 9, Kết nối tri thức</Button>}>
                  {page ? `Trang ${page} chưa có bài tập nào được giải. ` : ""}Hiện đã có lời giải Toán 9 sách Kết nối tri thức, các sách khác đang được soạn.
                </EmptyNote>
              ) : (
                <ExerciseList items={items} selected={selected} onOpen={open} />
              ))}
          </div>
        )}
        {showDetail && selected && (
          <div className="min-w-0">
            {!wide && (
              <button onClick={() => open(null)} className="mb-4 inline-flex h-10 items-center gap-1.5 rounded-full pl-2 pr-4 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
                <ArrowLeft size={18} /> Danh sách bài tập
              </button>
            )}
            <ExerciseLoader key={selected} id={selected} siblings={items} onOpen={open} />
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseList({ items, selected, onOpen }: { items: ExerciseSummary[]; selected?: string; onOpen: (id: string) => void }) {
  const pages = [...new Set(items.map((i) => i.page))];
  return (
    <nav aria-label="Danh sách bài tập" className="flex flex-col gap-5">
      {pages.map((p) => (
        <section key={p} aria-labelledby={`trang-${p}`}>
          <h2 id={`trang-${p}`} className="tabular border-b border-line pb-1.5 text-sm font-semibold text-ink-3">
            Trang {p}
          </h2>
          <ul className="mt-1">
            {items
              .filter((i) => i.page === p)
              .map((i) => {
                const on = i.id === selected;
                return (
                  <li key={i.id}>
                    <button
                      onClick={() => onOpen(i.id)}
                      aria-current={on ? "true" : undefined}
                      className={`relative flex w-full items-start gap-3 rounded-[var(--radius-paper)] py-3 pl-7 pr-3 text-left transition-colors ${on ? "bg-coral-wash" : "hover:bg-paper-2"}`}
                    >
                      {on && <span aria-hidden="true" className="absolute left-2 top-0 h-8 w-3 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" />}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">
                          {i.label}
                          {i.hasVideo && <VideoCamera size={16} className="text-ink-3" aria-label="Có video" />}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-sm text-ink-2">{i.preview}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <div className="h-5 w-20 animate-pulse rounded bg-paper-3" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      ))}
    </div>
  );
}

function ExerciseLoader({ id, siblings, onOpen }: { id: string; siblings: ExerciseSummary[]; onOpen: (id: string) => void }) {
  const ex = useApi(() => practiceApi.exercise(id), [id]);
  if (ex.status === "loading")
    return (
      <div aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-paper-3" />
        <div className="mt-4 h-48 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
        <div className="mt-6 h-32 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      </div>
    );
  if (ex.status === "error") return <LoadError onRetry={ex.reload} what="bài tập" />;
  const i = siblings.findIndex((s) => s.id === id);
  return <ExerciseView ex={ex.data} prev={i > 0 ? siblings[i - 1] : undefined} next={i >= 0 ? siblings[i + 1] : undefined} onOpen={onOpen} />;
}

function ExerciseView({ ex, prev, next, onOpen }: { ex: ExerciseDetail; prev?: ExerciseSummary; next?: ExerciseSummary; onOpen: (id: string) => void }) {
  const reduce = useReducedMotion();
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [playing, setPlaying] = useState(false);

  const allOpen = opened.size === ex.steps.length;
  const toggle = (i: number) =>
    setOpened((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const revealNext = () => {
    const i = ex.steps.findIndex((_, k) => !opened.has(k));
    if (i >= 0) toggle(i);
  };

  return (
    <article aria-labelledby="bt-title">
      <p className="text-sm text-ink-3">
        {ex.subject.name} {ex.grade}, {seriesNames[ex.series]}. {ex.lessonTitle}
      </p>
      <h2 id="bt-title" className="mt-1 text-2xl font-bold sm:text-3xl">
        {ex.label} <span className="tabular font-normal text-ink-3">trang {ex.page}</span>
      </h2>

      <section aria-label="Đề bài" className="oli oli-margin mt-5 rounded-[var(--radius-paper)] border border-line py-6 pl-20 pr-4 paper-shadow sm:pr-8">
        <span className="absolute left-0 top-5 w-14 text-center font-hand text-xl text-coral-ink" aria-hidden="true">
          Đề
        </span>
        <RichLines text={ex.problem} className="block text-lg leading-relaxed" />
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => askAssistant(`${ex.label} trang ${ex.page}, ${ex.lessonTitle} (${ex.subject.name} ${ex.grade}, ${seriesNames[ex.series]}): ${plain(ex.problem)}`)}>
          <ChatCircleDots size={18} /> Hỏi AI về bài này
        </Button>
      </div>

      <section aria-labelledby="loi-giai" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="loi-giai" className="text-xl font-bold">Lời giải</h3>
            <p className="font-hand text-lg text-ink-2">Tự nghĩ trước, rồi mới xem bước tiếp.</p>
          </div>
          <div className="flex gap-2">
            {!allOpen && (
              <Button size="sm" onClick={revealNext}>
                <Eye size={16} /> {opened.size === 0 ? "Xem bước 1" : "Xem bước tiếp"}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setOpened(allOpen ? new Set() : new Set(ex.steps.map((_, i) => i)))}>
              {allOpen ? <EyeSlash size={16} /> : null}
              {allOpen ? "Ẩn hết" : "Hiện tất cả"}
            </Button>
          </div>
        </div>

        <ol className="mt-4 divide-y divide-line border-y border-line">
          {ex.steps.map((s, i) => {
            const on = opened.has(i);
            return (
              <li key={i}>
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={on}
                  aria-controls={`buoc-${i}`}
                  className="flex min-h-12 w-full items-center gap-3 py-2.5 text-left"
                >
                  <span className={`tabular flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${on ? "bg-coral text-on-coral" : "bg-paper-3 text-ink-2"}`}>{i + 1}</span>
                  <span className={`flex-1 ${on ? "font-semibold" : "text-ink-2"}`}>{s.title ?? `Bước ${i + 1}`}</span>
                  <CaretDown size={16} className={`shrink-0 text-ink-3 transition-transform ${on ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`buoc-${i}`}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 pl-10 pr-2 leading-relaxed">
                        {s.text && <RichText text={s.text} />}
                        {s.math && <TeX tex={s.math} block />}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>

        <div className="mt-5" aria-live="polite">
          {showAnswer || allOpen ? (
            <p className="rounded-[var(--radius-paper)] border border-coral bg-coral-wash px-4 py-3">
              <span className="font-semibold">Đáp số. </span>
              <RichText text={ex.answer} />
            </p>
          ) : (
            <button onClick={() => setShowAnswer(true)} className="h-10 rounded-full px-3 text-sm font-semibold text-ink-2 underline hover:text-ink">
              Chỉ xem đáp số
            </button>
          )}
        </div>
      </section>

      {ex.video && (
        <section aria-labelledby="video-giai" className="mt-10">
          <h3 id="video-giai" className="text-xl font-bold">Video giải</h3>
          <div className="mt-3 overflow-hidden rounded-[var(--radius-paper)] border border-line bg-cover">
            {playing ? (
              <iframe src={`${ex.video.url}?autoplay=1`} title={ex.video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full" />
            ) : (
              <button onClick={() => setPlaying(true)} className="group relative block aspect-video w-full" aria-label={`Phát video: ${ex.video.title}`}>
                <Image src={ex.video.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-coral text-on-coral shadow-lg transition-transform group-hover:scale-105">
                    <Play size={28} weight="fill" />
                  </span>
                </span>
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-ink-2">
            {ex.video.title}
            {ex.video.teacher && `. ${ex.video.teacher}`}
            {ex.video.durationSec && `, ${Math.round(ex.video.durationSec / 60)} phút`}
          </p>
        </section>
      )}

      <nav aria-label="Bài trước và bài sau" className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-5">
        {prev ? (
          <Button variant="ghost" onClick={() => onOpen(prev.id)}>
            <ArrowLeft size={18} /> {prev.label}
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button variant="secondary" onClick={() => onOpen(next.id)}>
            {next.label} <ArrowRight size={18} />
          </Button>
        )}
      </nav>
    </article>
  );
}
