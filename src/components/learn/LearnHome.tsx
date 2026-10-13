"use client";

import { ArrowCounterClockwise, ArrowRight, Fire, MathOperations } from "@/components/ui/icons";
import Link from "next/link";
import { LoadError } from "@/components/album/PhotosScreen";
import { ButtonLink } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import { slugify } from "@/lib/api/lessons";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { learnAreas } from "@/lib/learn-areas";
import { AreaIndex } from "./AreaIndex";
import { DailyTicks } from "./DailyTicks";

export function LearnHome() {
  const today = useApi(api.learning.today);
  const areas = useApi(api.learning.areas);
  const user = useSession()?.user;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <p className="font-hand text-xl text-ink-2">Chào {user?.nickname ?? user?.name},</p>
      <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Bắt đầu buổi học hôm nay</h1>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        {/* today's page of the notebook */}
        <section aria-labelledby="today-h" className="oli oli-margin rounded-[var(--radius-paper)] border border-line py-6 pl-20 pr-4 sm:py-8 sm:pr-8">
          <h2 id="today-h" className="text-lg font-semibold">Hôm nay</h2>
          {today.status === "loading" && <div className="mt-4 h-24 animate-pulse rounded bg-paper-3/70" />}
          {today.status === "error" && <div className="mt-4"><LoadError onRetry={today.reload} what="bài hôm nay" /></div>}
          {today.status === "ready" && (
            <>
              <div className="mt-4">
                <DailyTicks goal={today.data.goal} done={today.data.done} size="lg" />
              </div>
              <div className="tabular mt-4 flex flex-wrap gap-x-6 gap-y-2 text-ink-2">
                <p>
                  <span className="font-semibold text-ink">{today.data.done}/{today.data.goal}</span> câu đã làm
                </p>
                <p className="flex items-center gap-1.5">
                  <Fire size={18} weight="fill" className="text-coral-ink" />
                  <span className="font-semibold text-ink">{today.data.streakDays} ngày</span> học liền
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/learn/practice?lesson=toan-9-c1-b1" size="lg">
                  {today.data.done >= today.data.goal ? "Luyện thêm" : `Học tiếp ${today.data.goal - today.data.done} câu`} <ArrowRight size={18} weight="bold" />
                </ButtonLink>
                <ButtonLink href="/learn/review" size="lg" variant="secondary">
                  <ArrowCounterClockwise size={18} /> Ôn câu sai
                </ButtonLink>
              </div>
            </>
          )}
        </section>

        <div className="flex flex-col gap-5">
          {today.status === "ready" && today.data.resume ? (
            <Link
              href={`/learn/theory?grade=${today.data.resume.grade}&subject=${slugify(today.data.resume.subject)}&topic=${today.data.resume.topicIndex}`}
              className="group relative flex flex-1 flex-col justify-between gap-6 rounded-[var(--radius-paper)] border border-line bg-paper py-6 pl-12 pr-5 paper-shadow transition-colors hover:border-coral"
            >
              <span className="absolute -top-2 left-4 h-[calc(100%+1.25rem)] w-4 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-8px),0_100%)]" aria-hidden="true" />
              <span>
                <span className="block text-sm text-ink-3">
                  Đang học dở: {today.data.resume.subject} {today.data.resume.grade}, chủ đề {today.data.resume.topicIndex}
                </span>
                <span className="mt-1 block font-display text-xl font-semibold leading-snug">{today.data.resume.topicTitle}</span>
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-coral-ink">
                Đọc tiếp <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ) : (
            today.status === "loading" && <div className="h-40 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
          )}
          <Link href="/learn/tools" className="group flex items-center gap-4 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-5 py-4 transition-colors hover:border-ink-3">
            <MathOperations size={24} className="shrink-0 text-ink-2" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Tiện ích học tập</span>
              <span className="block text-sm text-ink-2">Máy tính, giải phương trình, bảng công thức, đồng hồ học</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <h2 className="mt-14 text-2xl font-bold">Mục lục</h2>
      <div className="mt-2">
        {/* the table of contents is fixed; counts appear once the API answers */}
        <AreaIndex
          areas={learnAreas.map((a) => ({ ...a, itemCount: areas.status === "ready" ? areas.data.find((d) => d.id === a.id)?.itemCount : undefined }))}
        />
      </div>
    </div>
  );
}
