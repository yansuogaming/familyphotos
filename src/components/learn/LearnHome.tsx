"use client";

import { ArrowCounterClockwise, ArrowRight, Fire } from "@phosphor-icons/react";
import Link from "next/link";
import { LoadError } from "@/components/album/PhotosScreen";
import { ButtonLink } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import { slugify } from "@/lib/api/lessons";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/hooks/useApi";
import { AreaIndex } from "./AreaIndex";
import { DailyTicks } from "./DailyTicks";

export function LearnHome() {
  const today = useApi(api.learning.today);
  const areas = useApi(api.learning.areas);
  const user = useSession()?.user;

  return (
    <div className="oli min-h-full">
      <div className="oli-margin mx-auto max-w-5xl py-10 pl-20 pr-4 sm:pr-6 lg:py-14">
        <p className="font-hand text-xl text-ink-2">Chào {user?.nickname ?? user?.name},</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Bắt đầu buổi học hôm nay</h1>

        {today.status === "loading" && <div className="mt-8 h-9 w-96 max-w-full animate-pulse bg-paper-3" />}
        {today.status === "error" && <div className="mt-8"><LoadError onRetry={today.reload} what="bài hôm nay" /></div>}
        {today.status === "ready" && (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <DailyTicks goal={today.data.goal} done={today.data.done} size="lg" />
              <p className="tabular text-ink-2">
                <span className="font-semibold text-ink">{today.data.done}/{today.data.goal}</span> câu hôm nay
              </p>
              <p className="tabular flex items-center gap-1.5 text-ink-2">
                <Fire size={20} weight="fill" className="text-coral-ink" />
                <span className="font-semibold text-ink">{today.data.streakDays} ngày</span> học liền
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/hoc/luyen-tap?bai=toan-9-c1-b1" size="lg">
                {today.data.done >= today.data.goal ? "Luyện thêm" : `Học tiếp ${today.data.goal - today.data.done} câu`} <ArrowRight size={18} weight="bold" />
              </ButtonLink>
              <ButtonLink href="/hoc/on-tap" size="lg" variant="secondary">
                <ArrowCounterClockwise size={18} /> Ôn câu sai
              </ButtonLink>
            </div>

            {today.data.resume && (
              <Link
                href={`/hoc/ly-thuyet?lop=${today.data.resume.grade}&mon=${slugify(today.data.resume.subject)}&chu-de=${today.data.resume.topicIndex}`}
                className="group relative mt-12 flex items-center gap-4 rounded-[var(--radius-paper)] border border-line bg-paper py-4 pl-12 pr-5 paper-shadow transition-colors hover:border-coral"
              >
                <span className="absolute -top-2 left-4 h-[calc(100%+1.25rem)] w-4 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-8px),0_100%)]" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink-3">
                    Đang học dở: {today.data.resume.subject} {today.data.resume.grade}, chủ đề {today.data.resume.topicIndex}
                  </span>
                  <span className="block truncate font-display text-lg font-semibold">{today.data.resume.topicTitle}</span>
                </span>
                <ArrowRight size={20} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-1 group-hover:text-coral-ink" />
              </Link>
            )}
          </>
        )}

        <h2 className="mt-16 text-2xl font-bold">Mục lục</h2>
        <div className="mt-2">
          {areas.status === "loading" && <div className="h-64 animate-pulse bg-paper-3/60" />}
          {areas.status === "error" && <LoadError onRetry={areas.reload} what="mục lục" />}
          {areas.status === "ready" && <AreaIndex areas={areas.data} />}
        </div>
      </div>
    </div>
  );
}
