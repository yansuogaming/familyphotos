"use client";

import { ArrowClockwise, Check, Clock, PaperPlaneTilt, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/learn/Math";
import { AnswerInput, correctAnswerText, RichLines } from "@/components/learn/practice/QuestionView";
import { Button, buttonClass } from "@/components/ui/Button";
import { formatScore, isCorrect, practiceApi } from "@/lib/api/practice";
import type { AnswerValue, ExamDetail, ExamResult } from "@/lib/api/practice-types";

const ease = [0.16, 1, 0.3, 1] as const;
const clock = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
};

type Phase = { name: "doing" } | { name: "sending"; auto: boolean } | { name: "done"; result: ExamResult; auto: boolean } | { name: "failed"; auto: boolean };

/** Timed attempt: countdown, answer sheet, submit, grade, answer key. */
export function ExamRunner({ exam }: { exam: ExamDetail }) {
  const [attempt, setAttempt] = useState(0);
  return <Attempt key={attempt} exam={exam} onRestart={() => setAttempt((a) => a + 1)} />;
}

function Attempt({ exam, onRestart }: { exam: ExamDetail; onRestart: () => void }) {
  const reduce = useReducedMotion();
  const questions = exam.parts.flatMap((p) => p.questions);
  const numberOf = new Map(questions.map((q, i) => [q.id, i + 1]));
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [phase, setPhase] = useState<Phase>({ name: "doing" });
  const [confirm, setConfirm] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const limit = exam.durationMin * 60;
  const used = Math.min(limit, Math.floor((now - startedAt) / 1000));
  const left = limit - used;
  const answered = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const doing = phase.name === "doing";
  const reviewing = phase.name === "done";

  const submitRef = useRef<(auto: boolean) => void>(() => {});
  useEffect(() => {
    submitRef.current = (auto) => {
      setConfirm(false);
      setPhase({ name: "sending", auto });
      practiceApi
        .submitExam({ examId: exam.id, answers, usedSec: used })
        .then((result) => setPhase({ name: "done", result, auto }), () => setPhase({ name: "failed", auto }));
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    };
  });

  useEffect(() => {
    if (!doing) return;
    const iv = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - startedAt >= limit * 1000) submitRef.current(true);
    }, 1000);
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(iv);
      window.removeEventListener("beforeunload", warn);
    };
  }, [doing, startedAt, limit]);

  const jump = (id: string) => document.getElementById(`cau-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  const low = left <= 300;

  return (
    <div>
      {/* Sticky exam bar under the top bar */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-semibold">{exam.title}</p>
            <p className="tabular text-sm text-ink-3">
              Đã làm {answered}/{questions.length} câu
            </p>
          </div>
          {doing && (
            <p
              role="timer"
              aria-label={`Còn ${Math.floor(left / 60)} phút`}
              className={`tabular inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xl font-bold ${low ? "bg-danger/10 text-danger" : "bg-paper-2"}`}
            >
              <Clock size={20} /> {clock(left)}
            </p>
          )}
          {doing && (
            <Button onClick={() => setConfirm(true)}>
              <PaperPlaneTilt size={18} /> Nộp bài
            </Button>
          )}
        </div>
        <nav aria-label="Đi tới câu" className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {questions.map((q) => {
            const has = answers[q.id] !== undefined && answers[q.id] !== "";
            const mark = reviewing ? (isCorrect(q, answers[q.id]) ? "right" : "wrong") : null;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => jump(q.id)}
                aria-label={`Câu ${numberOf.get(q.id)}${has ? ", đã làm" : ""}`}
                className={`tabular flex size-10 shrink-0 items-center justify-center border text-sm font-semibold transition-colors ${
                  mark === "right" ? "border-coral text-coral-ink" : mark === "wrong" ? "border-danger/60 text-danger" : has ? "border-ink-3 bg-paper-3 text-ink" : "border-rule bg-paper text-ink-3 hover:border-ink-3"
                }`}
              >
                {mark === "right" ? <Check size={16} weight="bold" /> : mark === "wrong" ? <X size={14} weight="bold" /> : numberOf.get(q.id)}
              </button>
            );
          })}
        </nav>
      </div>

      <div aria-live="polite">
        {phase.name === "sending" && <p className="mt-6 text-ink-2">{phase.auto ? "Hết giờ. Đang nộp bài..." : "Đang nộp bài và chấm điểm..."}</p>}
        {phase.name === "failed" && (
          <div role="alert" className="mt-6 flex flex-wrap items-center gap-4 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-5 py-4">
            <p className="text-ink-2">Chưa nộp được bài. Bài làm của con vẫn còn nguyên.</p>
            <Button size="sm" variant="secondary" onClick={() => submitRef.current(phase.auto)}>
              Nộp lại
            </Button>
          </div>
        )}
        {phase.name === "done" && (
          <motion.section
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="oli oli-margin mt-6 max-w-3xl rounded-[var(--radius-paper)] border border-line py-7 pl-20 pr-4 paper-shadow sm:pr-8"
            aria-label="Kết quả"
          >
            <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
              <div className="relative flex h-32 w-40 -rotate-3 items-center justify-center rounded-[50%] border-[3px] border-coral" role="img" aria-label={`Điểm ${formatScore(phase.result.score)} trên 10`}>
                <span className="tabular font-hand text-6xl leading-none text-coral-ink">{formatScore(phase.result.score)}</span>
                <span className="absolute bottom-3 right-4 font-hand text-lg text-coral-ink">/10</span>
              </div>
              <div className="min-w-0 flex-1">
                {phase.auto && <p className="text-sm text-ink-3">Hết giờ, bài đã được nộp tự động.</p>}
                <p className="tabular text-lg">
                  Đúng <span className="font-semibold">{phase.result.correct}</span>/{phase.result.total} câu
                </p>
                <p className="tabular text-ink-2">Thời gian làm: {clock(phase.result.usedSec)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => setShowKey((s) => !s)} aria-pressed={showKey}>
                    {showKey ? "Ẩn đáp án" : "Xem đáp án"}
                  </Button>
                  <Button variant="secondary" onClick={onRestart}>
                    <ArrowClockwise size={18} /> Làm lại
                  </Button>
                  <Link href="/hoc/de-thi" className={buttonClass("ghost")}>
                    Về thư viện
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      <article className="mt-6 max-w-3xl" aria-label="Đề bài">
        {exam.parts.map((part) => (
          <section key={part.id} className="mt-8 first:mt-0">
            <h2 className="font-display text-xl font-semibold">{part.title}</h2>
            {part.instructions && <RichLines text={part.instructions} className="mt-2 block rounded-[var(--radius-paper)] bg-paper-2 px-4 py-3 leading-relaxed text-ink-2" />}
            <ol className="mt-4 flex flex-col gap-4">
              {part.questions.map((q) => {
                const right = reviewing && isCorrect(q, answers[q.id]);
                return (
                  <li key={q.id} id={`cau-${q.id}`} className="scroll-mt-48 rounded-[var(--radius-paper)] border border-line bg-paper px-4 py-4 sm:px-5">
                    <p className="leading-relaxed">
                      <span className="font-semibold">Câu {numberOf.get(q.id)}. </span>
                      <RichText text={q.prompt} />
                    </p>
                    <div className="mt-3">
                      <AnswerInput
                        question={q}
                        size="md"
                        value={answers[q.id]}
                        checked={reviewing && showKey}
                        onChange={(v) => doing && setAnswers((a) => ({ ...a, [q.id]: v }))}
                      />
                    </div>
                    {reviewing && (
                      <p className={`mt-3 flex items-center gap-1.5 font-hand text-lg ${right ? "text-coral-ink" : "text-danger"}`}>
                        {right ? <Check size={20} weight="bold" /> : <X size={18} weight="bold" />}
                        {right ? "Đúng" : answers[q.id] === undefined || answers[q.id] === "" ? "Chưa làm" : "Sai"}
                        {showKey && !right && (
                          <span className="font-sans text-base text-ink">
                            . Đáp án: <RichText text={correctAnswerText(q)} className="font-semibold" />
                          </span>
                        )}
                      </p>
                    )}
                    {reviewing && showKey && q.explanation && <RichText text={q.explanation} className="mt-1 block text-sm text-ink-2" />}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        {doing && (
          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={() => setConfirm(true)}>
              <PaperPlaneTilt size={18} /> Nộp bài
            </Button>
          </div>
        )}
      </article>

      <ConfirmDialog
        open={confirm}
        unanswered={questions.length - answered}
        left={left}
        onCancel={() => setConfirm(false)}
        onConfirm={() => submitRef.current(false)}
      />
    </div>
  );
}

function ConfirmDialog({ open, unanswered, left, onCancel, onConfirm }: { open: boolean; unanswered: number; left: number; onCancel: () => void; onConfirm: () => void }) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => cancelRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab" && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>("button")];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nop-title"
            aria-describedby="nop-desc"
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease }}
            className="w-full max-w-md rounded-[var(--radius-paper)] border border-line bg-paper p-6 paper-shadow"
          >
            <h2 id="nop-title" className="font-display text-xl font-semibold">
              Nộp bài nhé?
            </h2>
            <p id="nop-desc" className="mt-2 text-ink-2">
              {unanswered > 0 ? `Còn ${unanswered} câu chưa làm. ` : "Con đã làm hết các câu. "}
              Vẫn còn {clock(left)} để kiểm tra lại. Nộp rồi thì không sửa được nữa.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
                Làm tiếp
              </Button>
              <Button onClick={onConfirm}>
                <PaperPlaneTilt size={18} /> Nộp bài
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
