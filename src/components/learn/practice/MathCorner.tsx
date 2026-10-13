"use client";

import { ArrowRight, Clock } from "@/components/ui/icons";
import Link from "next/link";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { buttonClass } from "@/components/ui/Button";
import { practiceApi } from "@/lib/api/practice";
import type { MathChapter, MathSkill } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { Chips, EmptyNote, grades, LearnHeader, Ribbon } from "./shared";

/** /learn/toan: math skills by chapter for one grade, each opening a practice set. */
export function MathCorner() {
  const user = useSession()?.user;
  const [picked, setPicked] = useState<number | null>(null);
  const grade = picked ?? user?.grade ?? 9;
  const outline = useApi(() => practiceApi.mathOutline(grade), [grade]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <LearnHeader title="Góc Toán">
        <Link href="/learn/tools?tool=equations" className={buttonClass("secondary", "sm")}>
          Giải phương trình
        </Link>
      </LearnHeader>
      <p className="mt-2 max-w-2xl text-ink-2 sm:pl-14">Luyện từng dạng bài theo chương. Mỗi dạng có lời giải từng bước cho câu làm sai.</p>

      <Chips className="mt-6 sm:pl-14" label="Lớp" value={grade} onChange={setPicked} options={grades.map((g) => ({ value: g, label: `Lớp ${g}` }))} />

      <div className="mt-8 sm:pl-14">
        {outline.status === "loading" && <OutlineSkeleton />}
        {outline.status === "error" && <LoadError onRetry={outline.reload} what="các dạng bài" />}
        {outline.status === "ready" &&
          (outline.data.length === 0 ? (
            <EmptyNote
              title={`Toán lớp ${grade} đang được soạn`}
              action={
                <>
                  <button onClick={() => setPicked(9)} className={buttonClass("primary")}>Xem Toán 9</button>
                  <button onClick={() => setPicked(5)} className={buttonClass("secondary")}>Xem Toán 5</button>
                </>
              }
            >
              Các dạng bài của lớp này sẽ có sớm. Trong lúc chờ, con thử lớp khác hoặc dùng công cụ giải phương trình.
            </EmptyNote>
          ) : (
            <Outline chapters={outline.data} />
          ))}
      </div>
    </div>
  );
}

function Outline({ chapters }: { chapters: MathChapter[] }) {
  const skills = chapters.flatMap((c) => c.skills);
  const ready = skills.filter((s) => s.setId);
  const totalQ = ready.reduce((n, s) => n + s.questionCount, 0);
  const mastered = ready.reduce((n, s) => n + Math.min(s.mastered, s.questionCount), 0);
  const nextSkill = ready.find((s) => s.mastered < s.questionCount) ?? ready[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-10">
        {chapters.map((c) => (
          <section key={c.id} aria-labelledby={c.id}>
            <h2 id={c.id} className="text-xl font-bold sm:text-2xl">
              <span className="tabular mr-2 text-coral-ink">Chương {c.index}.</span>
              {c.title}
            </h2>
            <ol className="mt-3 divide-y divide-line border-y border-line">
              {c.skills.map((s) => (
                <li key={s.id}>
                  <SkillRow skill={s} current={s.id === nextSkill?.id} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-paper)] border border-line bg-paper p-5 paper-shadow">
          <p className="font-display text-lg font-semibold">Tiến độ của con</p>
          <p className="tabular mt-3 font-hand text-4xl text-coral-ink">
            {mastered}/{totalQ}
          </p>
          <p className="text-sm text-ink-2">câu đã làm đúng, trong {ready.length} dạng bài đang mở.</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-3" aria-hidden="true">
            <div className="h-full rounded-full bg-coral transition-[width] duration-500 ease-[var(--ease-out-expo)]" style={{ width: `${totalQ ? (mastered / totalQ) * 100 : 0}%` }} />
          </div>
          {nextSkill?.setId && (
            <Link href={`/learn/practice?lesson=${nextSkill.setId}`} className={buttonClass("primary", "md", "mt-5 w-full")}>
              Luyện dạng tiếp theo <ArrowRight size={18} weight="bold" />
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}

function SkillRow({ skill: s, current }: { skill: MathSkill; current: boolean }) {
  const pct = s.questionCount ? Math.min(1, s.mastered / s.questionCount) : 0;
  if (!s.setId)
    return (
      <div className="flex min-h-16 items-center gap-4 py-3 pl-8 pr-2 text-ink-3">
        <span className="min-w-0 flex-1">{s.title}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm">
          <Clock size={16} /> Đang soạn
        </span>
      </div>
    );
  return (
    <Link href={`/learn/practice?lesson=${s.setId}`} className="group relative flex min-h-16 items-center gap-4 py-3 pl-8 pr-2 transition-colors hover:bg-paper-2">
      {current && <Ribbon className="absolute -top-px left-1.5 h-9 w-3.5" />}
      <span className="min-w-0 flex-1">
        <span className="block font-medium transition-colors group-hover:text-coral-ink">{s.title}</span>
        <span className="mt-1.5 flex items-center gap-3">
          <span className="h-1.5 w-28 overflow-hidden rounded-full bg-paper-3" aria-hidden="true">
            <span className="block h-full rounded-full bg-coral" style={{ width: `${pct * 100}%` }} />
          </span>
          <span className="tabular text-sm text-ink-3">
            {s.mastered > 0 ? `Đúng ${Math.min(s.mastered, s.questionCount)}/${s.questionCount}` : "Chưa làm"}
          </span>
        </span>
      </span>
      <span className="tabular shrink-0 text-sm text-ink-2">{s.questionCount} câu</span>
      <ArrowRight size={18} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-coral-ink" aria-hidden="true" />
    </Link>
  );
}

function OutlineSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-10 lg:max-w-[calc(100%-320px)]">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i}>
          <div className="h-7 w-2/3 animate-pulse rounded bg-paper-3" />
          {Array.from({ length: 3 }, (_, j) => (
            <div key={j} className="mt-3 h-14 animate-pulse rounded bg-paper-2" />
          ))}
        </div>
      ))}
    </div>
  );
}
