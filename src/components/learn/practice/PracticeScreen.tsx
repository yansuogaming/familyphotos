"use client";

import { ArrowCounterClockwise, ArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { DailyTicks } from "@/components/learn/DailyTicks";
import { buttonClass } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/core";
import { formatScore, practiceApi } from "@/lib/api/practice";
import type { PracticeCatalogEntry } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { PracticeSession } from "./PracticeSession";
import { Chips, EmptyNote, grades, LearnHeader } from "./shared";

/** /learn/luyen-tap. `?lesson=<lessonId>` opens a session straight away. */
export function PracticeScreen() {
  const id = useSearchParams().get("lesson");
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <LearnHeader title="Luyện tập" modes />
      <div className="mt-8">{id ? <SetLoader key={id} id={id} /> : <Picker />}</div>
    </div>
  );
}

function SetLoader({ id }: { id: string }) {
  const set = useApi(() => practiceApi.set(id), [id]);

  if (set.status === "loading") return <SessionSkeleton />;
  if (set.status === "error") {
    if (set.error instanceof ApiError && set.error.status === 404)
      return (
        <EmptyNote
          title="Bài này chưa có câu luyện tập"
          action={
            <>
              <Link href="/learn/practice" className={buttonClass("primary")}>
                Chọn bài khác
              </Link>
              <Link href="/learn/theory" className={buttonClass("secondary")}>
                Đọc lý thuyết
              </Link>
            </>
          }
        >
          Cô giáo đang soạn câu hỏi cho bài này. Con chọn một bài khác để luyện trước nhé.
        </EmptyNote>
      );
    return <LoadError onRetry={set.reload} what="bài luyện tập" />;
  }
  const s = set.data;
  return (
    <PracticeSession
      key={s.id}
      title={s.title}
      setId={s.id}
      items={s.questions.map((question) => ({ question, setId: s.id }))}
      exitHref="/learn/practice"
      theoryHref={`/learn/theory?lesson=${s.id}`}
    />
  );
}

function SessionSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" aria-busy="true" aria-label="Đang tải câu hỏi">
      <div className="h-7 w-2/3 animate-pulse rounded bg-paper-3" />
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="size-8 animate-pulse border border-rule bg-paper-2 sm:size-9" />
        ))}
      </div>
      <div className="mt-6 h-80 animate-pulse rounded-[var(--radius-paper)] border border-line bg-paper-2" />
    </div>
  );
}

function Picker() {
  const user = useSession()?.user;
  const catalog = useApi(practiceApi.catalog);
  const today = useApi(practiceApi.today);
  const mistakes = useApi(practiceApi.mistakes);
  const [pickedGrade, setPickedGrade] = useState<number | null>(null);
  const [pickedSubject, setPickedSubject] = useState<string | null>(null);

  const entries: PracticeCatalogEntry[] = catalog.status === "ready" ? catalog.data : [];
  const available = new Set(entries.map((e) => e.grade));
  const grade = pickedGrade ?? (user?.grade && available.has(user.grade) ? user.grade : (entries[0]?.grade ?? 9));
  const subjects = entries.filter((e) => e.grade === grade);
  const entry = subjects.find((e) => e.subject.id === pickedSubject) ?? subjects[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold">Chọn bài để luyện</h2>
        <p className="mt-1 text-ink-2">Mỗi lần làm một câu. Làm xong cô chấm ngay, sai thì có lời giải từng bước.</p>

        {catalog.status === "loading" && (
          <div className="mt-6 flex flex-col gap-3" aria-busy="true">
            <div className="h-10 w-full animate-pulse rounded-full bg-paper-3" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-paper-2" />
            ))}
          </div>
        )}
        {catalog.status === "error" && (
          <div className="mt-6">
            <LoadError onRetry={catalog.reload} what="danh sách bài" />
          </div>
        )}
        {catalog.status === "ready" && (
          <>
            <Chips
              className="mt-6"
              label="Lớp"
              value={grade}
              onChange={(g) => {
                setPickedGrade(g);
                setPickedSubject(null);
              }}
              options={grades.map((g) => ({ value: g, label: `Lớp ${g}` }))}
            />
            {subjects.length > 0 && (
              <Chips
                className="mt-2 border-b border-line pb-3"
                label="Môn học"
                tone="coral"
                value={entry?.subject.id ?? ""}
                onChange={setPickedSubject}
                options={subjects.map((s) => ({ value: s.subject.id, label: s.subject.name }))}
              />
            )}

            <div className="mt-6">
              {!entry ? (
                <EmptyNote title={`Lớp ${grade} chưa có bài luyện`} action={<button onClick={() => setPickedGrade(entries[0]?.grade ?? 9)} className={buttonClass("secondary")}>Xem lớp {entries[0]?.grade ?? 9}</button>}>
                  Câu hỏi cho lớp này đang được soạn. Trong lúc chờ, con có thể đọc lý thuyết hoặc luyện lớp khác.
                </EmptyNote>
              ) : (
                <div className="flex flex-col gap-8">
                  {entry.topics.map((t) => (
                    <section key={t.id} aria-labelledby={`chu-de-${t.id}`}>
                      <h3 id={`chu-de-${t.id}`} className="text-lg font-semibold">
                        <span className="tabular mr-2 text-coral-ink">{t.index}.</span>
                        {t.title}
                      </h3>
                      <ol className="mt-1">
                        {t.lessons.map((l) => (
                          <li key={l.id}>
                            <Link href={`/learn/practice?lesson=${l.id}`} className="group flex min-h-12 items-baseline gap-3 py-2.5">
                              <span className="tabular w-12 shrink-0 text-sm text-ink-3">Bài {l.index}</span>
                              <span className="min-w-0 font-medium transition-colors group-hover:text-coral-ink">{l.title}</span>
                              <span className="mx-1 hidden flex-1 -translate-y-[0.3em] border-b-2 border-dotted border-rule sm:block" aria-hidden="true" />
                              <span className="tabular ml-auto shrink-0 text-sm text-ink-2">{l.questionCount} câu</span>
                              <span className="tabular w-16 shrink-0 text-right font-hand text-lg text-coral-ink">
                                {l.best !== undefined ? `${formatScore(l.best)} đ` : ""}
                                {l.best !== undefined && <span className="sr-only"> điểm cao nhất</span>}
                              </span>
                              <ArrowRight size={16} className="shrink-0 self-center text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-coral-ink" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-paper)] border border-line bg-paper p-5 paper-shadow">
          <p className="font-display text-lg font-semibold">Mục tiêu hôm nay</p>
          {today.status === "loading" && <div className="mt-3 h-14 animate-pulse bg-paper-3" />}
          {today.status === "error" && <div className="mt-3"><LoadError onRetry={today.reload} what="mục tiêu" /></div>}
          {today.status === "ready" && (
            <>
              <div className="mt-3">
                <DailyTicks goal={today.data.goal} done={Math.min(today.data.done, today.data.goal)} />
              </div>
              <p className="tabular mt-3 text-sm text-ink-2">
                <span className="font-semibold text-ink">{Math.min(today.data.done, today.data.goal)}/{today.data.goal}</span> câu.{" "}
                {today.data.done >= today.data.goal ? "Xong rồi, làm thêm cũng được." : `Còn ${today.data.goal - today.data.done} câu nữa.`}
              </p>
            </>
          )}
        </div>
        <div className="rounded-[var(--radius-paper)] border border-line bg-paper p-5">
          <p className="font-display text-lg font-semibold">Câu làm sai</p>
          {mistakes.status === "ready" ? (
            mistakes.data.length ? (
              <>
                <p className="mt-1 text-sm text-ink-2">Có {mistakes.data.length} câu đang chờ con làm lại.</p>
                <Link href="/learn/review" className={buttonClass("secondary", "md", "mt-4 w-full")}>
                  <ArrowCounterClockwise size={18} /> Ôn câu sai
                </Link>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-2">Chưa có câu sai nào. Giỏi lắm!</p>
            )
          ) : mistakes.status === "error" ? (
            <div className="mt-2"><LoadError onRetry={mistakes.reload} what="câu sai" /></div>
          ) : (
            <div className="mt-2 h-10 animate-pulse bg-paper-3" />
          )}
        </div>
      </aside>
    </div>
  );
}
