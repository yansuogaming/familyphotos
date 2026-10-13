"use client";

import { ArrowCounterClockwise, Check, Trash, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { RichText } from "@/components/learn/Math";
import { Button, buttonClass, IconButton } from "@/components/ui/Button";
import { isCorrect, parseNumber, practiceApi } from "@/lib/api/practice";
import type { AnswerValue, Mistake } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";
import { AnswerInput, correctAnswerText, SolutionSteps } from "./QuestionView";
import { PracticeSession } from "./PracticeSession";
import { Chips, EmptyNote, LearnHeader, plain } from "./shared";

const ease = [0.16, 1, 0.3, 1] as const;
const groupKey = (m: Mistake) => `${m.subject.id}-${m.grade}`;
const groupName = (m: Mistake) => `${m.subject.name} ${m.grade}`;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });

/** /hoc/on-tap: questions answered wrong, by subject. A right answer clears them. */
export function ReviewScreen() {
  const mistakes = useApi(practiceApi.mistakes);
  const [filter, setFilter] = useState("all");
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<Mistake[] | null>(null);

  const all = mistakes.status === "ready" ? mistakes.data.filter((m) => !removed.has(m.question.id)) : [];
  const groups = [...new Map(all.map((m) => [groupKey(m), groupName(m)])).entries()];
  const active = groups.some(([k]) => k === filter) ? filter : "all";
  const shown = active === "all" ? all : all.filter((m) => groupKey(m) === active);

  const remove = (id: string) => setRemoved((s) => new Set(s).add(id));

  if (session)
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
        <LearnHeader title="Ôn câu sai" backHref="/hoc/on-tap" backLabel="Về danh sách câu sai" />
        <div className="mt-8">
          <PracticeSession
            title={active === "all" ? "Tất cả câu sai" : groups.find(([k]) => k === active)?.[1] ?? "Câu sai"}
            mode="review"
            items={session.map((m) => ({ question: m.question, setId: m.setId, source: m.setTitle }))}
            exitHref="/hoc/on-tap"
            exitLabel="Về danh sách"
            onExit={() => {
              setSession(null);
              setRemoved(new Set());
              mistakes.reload();
            }}
          />
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <LearnHeader title="Ôn câu sai" />
      <p className="mt-2 max-w-2xl text-ink-2 sm:pl-14">Câu nào con làm sai sẽ nằm ở đây. Làm lại đúng một lần là câu đó được gạch khỏi sổ.</p>

      <div className="mt-8 max-w-3xl sm:pl-14">
        {mistakes.status === "loading" && (
          <div aria-busy="true" className="flex flex-col gap-3">
            <div className="h-10 w-72 animate-pulse rounded-full bg-paper-3" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
            ))}
          </div>
        )}
        {mistakes.status === "error" && <LoadError onRetry={mistakes.reload} what="câu sai" />}
        {mistakes.status === "ready" && all.length === 0 && (
          <EmptyNote
            title="Chưa có câu sai nào, giỏi lắm"
            action={
              <Link href="/hoc/luyen-tap" className={buttonClass("primary")}>
                Đi luyện tập
              </Link>
            }
          >
            Khi luyện tập mà làm sai, câu đó sẽ được ghi vào đây để con ôn lại.
          </EmptyNote>
        )}
        {all.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Chips
                label="Môn"
                value={active}
                onChange={setFilter}
                options={[
                  { value: "all", label: `Tất cả (${all.length})` },
                  ...groups.map(([k, name]) => ({ value: k, label: `${name} (${all.filter((m) => groupKey(m) === k).length})` })),
                ]}
              />
              <Button onClick={() => setSession(shown)}>
                <ArrowCounterClockwise size={18} /> Ôn {shown.length} câu liền
              </Button>
            </div>

            <ul className="mt-6 flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {shown.map((m) => (
                  <MistakeRow key={m.question.id} m={m} showSubject={active === "all"} onFixed={() => remove(m.question.id)} />
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function MistakeRow({ m, showSubject, onFixed }: { m: Mistake; showSubject: boolean; onFixed: () => void }) {
  const reduce = useReducedMotion();
  const q = m.question;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<AnswerValue | undefined>();
  const [result, setResult] = useState<"right" | "wrong" | null>(null);
  const [error, setError] = useState<string>();

  function check() {
    if (value === undefined || value === "") return setError(q.type === "number" ? "Con viết đáp số vào ô nhé." : "Con chọn một đáp án đã nhé.");
    if (q.type === "number" && parseNumber(String(value)) === null) return setError("Đáp số phải là một số.");
    setError(undefined);
    const ok = isCorrect(q, value);
    setResult(ok ? "right" : "wrong");
    practiceApi.answer({ setId: m.setId, questionId: q.id, correct: ok, mode: "review" }).catch(() => {});
    if (ok) setTimeout(onFixed, 1400);
  }

  function dismiss() {
    practiceApi.dismissMistake(q.id).then(onFixed, () => {});
  }

  const solution = q.steps?.length ? q.steps : q.explanation ? [q.explanation] : [];

  return (
    <motion.li
      layout={!reduce}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.35, ease }}
      className="overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper"
    >
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="leading-relaxed">
            <RichText text={q.prompt} />
          </p>
          <p className="mt-1 text-sm text-ink-3">
            {showSubject && <>{m.subject.name} {m.grade}. </>}
            {m.setTitle}. Sai {m.wrongCount} lần, gần nhất {shortDate(m.lastWrongAt)}.
          </p>
        </div>
        {!open && (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)} aria-label={`Làm lại câu: ${plain(q.prompt).slice(0, 60)}`}>
            Làm lại
          </Button>
        )}
        <IconButton label="Bỏ khỏi danh sách" onClick={dismiss}>
          <Trash size={18} />
        </IconButton>
      </div>

      {open && (
        <div className="oli border-t border-line px-4 py-5 sm:px-5">
          <AnswerInput question={q} value={value} onChange={(v) => { if (!result) { setValue(v); setError(undefined); } }} checked={result !== null} error={error} size="md" onSubmit={check} />
          {error && q.type !== "number" && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          <div aria-live="polite">
            {result === "right" && (
              <p className="mt-4 flex items-center gap-2 font-hand text-2xl text-coral-ink">
                <Check size={28} weight="bold" /> Sửa xong rồi! Câu này được gạch khỏi sổ.
              </p>
            )}
            {result === "wrong" && (
              <div className="mt-4">
                <p className="flex items-center gap-2 font-hand text-xl text-danger">
                  <X size={22} weight="bold" /> Vẫn chưa đúng.
                </p>
                <p className="mt-1">
                  Đáp án: <RichText text={correctAnswerText(q)} className="font-semibold" />
                </p>
                {solution.length > 0 && <SolutionSteps steps={solution} className="mt-3" />}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            {result === null && <Button size="sm" onClick={check}>Kiểm tra</Button>}
            {result === "wrong" && (
              <Button size="sm" variant="secondary" onClick={() => { setResult(null); setValue(undefined); }}>
                Thử lại
              </Button>
            )}
            {result !== "right" && (
              <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setResult(null); setValue(undefined); setError(undefined); }}>
                Đóng
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.li>
  );
}
