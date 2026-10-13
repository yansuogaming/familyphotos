"use client";

import { ArrowClockwise, ArrowCounterClockwise, ArrowRight, Check, ChatCircleDots, Lightbulb, SkipForward, X } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DailyTicks } from "@/components/learn/DailyTicks";
import { RichText } from "@/components/learn/Math";
import { Button, buttonClass } from "@/components/ui/Button";
import { formatScore, isCorrect, parseNumber, practiceApi, scoreOf } from "@/lib/api/practice";
import type { AnswerValue, PracticeQuestion, PracticeToday } from "@/lib/api/practice-types";
import { AnswerInput, correctAnswerText, ProgressCells, SolutionSteps, type CellState } from "./QuestionView";
import { askAssistant, plain } from "./shared";

const ease = [0.16, 1, 0.3, 1] as const;

export interface SessionItem {
  question: PracticeQuestion;
  setId: string;
  /** Shown under the question in review mode, e.g. the lesson it came from. */
  source?: string;
}

type Run = { items: SessionItem[]; n: number };

/**
 * One question at a time, graded on the spot, then a result sheet.
 * `mode="review"` is used by Ôn tập: a right answer clears the mistake.
 */
export function PracticeSession({
  title,
  items,
  setId,
  mode = "practice",
  exitHref,
  exitLabel = "Chọn bài khác",
  onExit,
  theoryHref,
}: {
  title: string;
  items: SessionItem[];
  /** Practice set to save the attempt under. Omit for mixed review sessions. */
  setId?: string;
  mode?: "practice" | "review";
  exitHref: string;
  exitLabel?: string;
  /** When set, exit buttons call this instead of navigating to exitHref. */
  onExit?: () => void;
  theoryHref?: string;
}) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState<Run>({ items, n: 0 });
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<AnswerValue | undefined>();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string>();
  const [showHint, setShowHint] = useState(false);
  const [marks, setMarks] = useState<Record<string, CellState>>({});
  const [done, setDone] = useState(false);
  const [today, setToday] = useState<PracticeToday | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const item = run.items[index];
  const q = item?.question;
  const total = run.items.length;
  const states: CellState[] = run.items.map((it) => marks[it.question.id] ?? "pending");
  const right = states.filter((s) => s === "right").length;
  const wrongItems = run.items.filter((it) => marks[it.question.id] === "wrong" || marks[it.question.id] === "skipped");

  useEffect(() => {
    practiceApi.today().then(setToday, () => {});
  }, []);

  function start(next: SessionItem[]) {
    setRun((r) => ({ items: next, n: r.n + 1 }));
    setIndex(0);
    setValue(undefined);
    setChecked(false);
    setError(undefined);
    setShowHint(false);
    setMarks({});
    setDone(false);
  }

  function check() {
    if (!q || checked) return;
    if (value === undefined || value === "") {
      setError(q.type === "number" ? "Con viết đáp số vào ô nhé." : "Con chọn một đáp án đã nhé.");
      return;
    }
    if (q.type === "number" && parseNumber(String(value)) === null) {
      setError("Đáp số phải là một số, ví dụ 2, -1 hoặc 0,5.");
      return;
    }
    const ok = isCorrect(q, value);
    setError(undefined);
    setChecked(true);
    setMarks((m) => ({ ...m, [q.id]: ok ? "right" : "wrong" }));
    practiceApi.answer({ setId: item.setId, questionId: q.id, correct: ok, mode }).then(setToday, () => {});
    requestAnimationFrame(() => nextRef.current?.focus());
  }

  function finish(final: Record<string, CellState>) {
    setDone(true);
    // Only a full run counts as an attempt (not "Ôn câu sai" on part of the set).
    if (mode === "practice" && setId && run.items.length === items.length) {
      const wrongIds = run.items.filter((it) => final[it.question.id] !== "right").map((it) => it.question.id);
      const correct = run.items.length - wrongIds.length;
      practiceApi.finish({ setId, correct, total: run.items.length, wrongIds }).catch(() => {});
    }
  }

  function next(final = marks) {
    if (index + 1 >= total) return finish(final);
    setIndex(index + 1);
    setValue(undefined);
    setChecked(false);
    setError(undefined);
    setShowHint(false);
  }

  function skip() {
    if (!q) return;
    const final = { ...marks, [q.id]: "skipped" as const };
    setMarks(final);
    next(final);
  }

  function choose(v: AnswerValue) {
    if (checked) return;
    setValue(v);
    setError(undefined);
  }

  // Keyboard: 1-4 picks an answer, Enter checks or moves on.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e) => {
      if (done || !q || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      if (t !== document.body && !rootRef.current?.contains(t)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (checked) next();
        else check();
        return;
      }
      const n = Number(e.key);
      if (!checked && n >= 1 && n <= 4) {
        if (q.type === "choice" && n <= q.choices.length) choose(n - 1);
        if (q.type === "truefalse" && n <= 2) choose(n === 1);
      }
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (done) {
    return (
      <ResultSheet
        title={title}
        right={right}
        total={total}
        states={states}
        wrongItems={wrongItems}
        today={today}
        mode={mode}
        exitHref={exitHref}
        exitLabel={exitLabel}
        onExit={onExit}
        theoryHref={theoryHref}
        onReviewWrong={() => start(wrongItems)}
        onRestart={() => start(items)}
      />
    );
  }

  if (!q) return null;
  const isRight = checked && marks[q.id] === "right";
  const solution = q.steps?.length ? q.steps : q.explanation ? [q.explanation] : [];

  return (
    <div ref={rootRef} className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-3">{mode === "review" ? "Ôn câu sai" : "Luyện tập"}</p>
          <h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
        </div>
        <p className="tabular text-sm text-ink-2">
          Câu <span className="font-semibold text-ink">{index + 1}</span>/{total}
        </p>
      </div>
      <div className="mt-4">
        <ProgressCells states={states} current={index} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={`${run.n}-${q.id}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease }}
          aria-label={`Câu ${index + 1}`}
          onAnimationComplete={() => promptRef.current?.focus({ preventScroll: true })}
          className="oli oli-margin relative mt-6 overflow-hidden rounded-[var(--radius-paper)] border border-line py-7 pl-20 pr-4 paper-shadow sm:pr-8"
        >
          <span className="tabular absolute left-0 top-6 w-14 text-center font-hand text-3xl text-coral-ink" aria-hidden="true">
            {index + 1}.
          </span>
          <p ref={promptRef} tabIndex={-1} className="text-lg font-semibold leading-relaxed outline-none sm:text-xl">
            <RichText text={q.prompt} />
          </p>
          {item.source && <p className="mt-1 text-sm text-ink-3">{item.source}</p>}

          {q.hint && !checked && (
            <div className="mt-3">
              {showHint ? (
                <p className="font-hand text-lg text-ink-2">
                  <RichText text={q.hint} />
                </p>
              ) : (
                <button type="button" onClick={() => setShowHint(true)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
                  <Lightbulb size={18} /> Xem gợi ý
                </button>
              )}
            </div>
          )}

          <div className="mt-6">
            <AnswerInput
              question={q}
              value={value}
              onChange={choose}
              checked={checked}
              error={error}
              onSubmit={() => (checked ? next() : check())}
            />
            {error && q.type !== "number" && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          <div aria-live="polite">
            {checked && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease }}
                className="mt-7 border-t border-rule pt-5"
              >
                {isRight ? (
                  <p className="flex items-center gap-2 font-hand text-2xl text-coral-ink">
                    <Check size={30} weight="bold" /> Đúng rồi, giỏi lắm!
                  </p>
                ) : (
                  <>
                    <p className="flex items-center gap-2 font-hand text-2xl text-danger">
                      <X size={26} weight="bold" /> Chưa đúng, mình xem lại nhé.
                    </p>
                    <p className="mt-2">
                      Đáp án đúng: <RichText text={correctAnswerText(q)} className="font-semibold" />
                    </p>
                  </>
                )}
                {solution.length > 0 && (!isRight || q.type !== "choice") && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-ink-2">Lời giải</p>
                    <SolutionSteps steps={solution} />
                  </div>
                )}
                {!isRight && (
                  <button
                    type="button"
                    onClick={() => askAssistant(`Con làm sai câu này, giảng lại giúp con: ${plain(q.prompt)}`)}
                    className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink"
                  >
                    <ChatCircleDots size={18} /> Hỏi trợ lý về câu này
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="mt-5 flex items-center gap-3">
        {!checked && (
          <Button variant="ghost" onClick={skip}>
            <SkipForward size={18} /> Bỏ qua
          </Button>
        )}
        <div className="flex-1" />
        {checked ? (
          <Button ref={nextRef} size="lg" onClick={() => next()}>
            {index + 1 >= total ? "Xem kết quả" : "Câu tiếp"} <ArrowRight size={18} weight="bold" />
          </Button>
        ) : (
          <Button size="lg" onClick={check}>
            Kiểm tra
          </Button>
        )}
      </div>
      <p className="mt-3 hidden text-right text-sm text-ink-3 md:block">Phím 1 đến 4 để chọn, Enter để kiểm tra.</p>
      <p className="mt-6 text-sm">
        <ExitLink href={exitHref} onExit={onExit} className="text-ink-3 underline hover:text-ink">
          Dừng và thoát
        </ExitLink>
      </p>
    </div>
  );
}

function ExitLink({ href, onExit, className, children }: { href: string; onExit?: () => void; className: string; children: ReactNode }) {
  if (onExit)
    return (
      <button type="button" onClick={onExit} className={className}>
        {children}
      </button>
    );
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function verdict(score: number) {
  if (score >= 9) return "Xuất sắc! Cô chấm điểm tuyệt vời.";
  if (score >= 8) return "Giỏi lắm! Chỉ còn một chút nữa thôi.";
  if (score >= 6.5) return "Khá rồi. Ôn câu sai là lên điểm ngay.";
  if (score >= 5) return "Đạt rồi. Mình ôn lại vài chỗ nhé.";
  return "Chưa sao cả. Đọc lại lý thuyết rồi làm lại nhé.";
}

function ResultSheet({
  title,
  right,
  total,
  states,
  wrongItems,
  today,
  mode,
  exitHref,
  exitLabel,
  onExit,
  theoryHref,
  onReviewWrong,
  onRestart,
}: {
  title: string;
  right: number;
  total: number;
  states: CellState[];
  wrongItems: SessionItem[];
  today: PracticeToday | null;
  mode: "practice" | "review";
  exitHref: string;
  exitLabel: string;
  onExit?: () => void;
  theoryHref?: string;
  onReviewWrong: () => void;
  onRestart: () => void;
}) {
  const reduce = useReducedMotion();
  const score = scoreOf(right, total);
  const skipped = states.filter((s) => s === "skipped").length;
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus(), []);

  return (
    <div className="mx-auto max-w-3xl">
      <section className="oli oli-margin relative overflow-hidden rounded-[var(--radius-paper)] border border-line py-8 pl-20 pr-4 paper-shadow sm:pr-8">
        <h2 ref={headRef} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
          {mode === "review" ? "Ôn xong rồi" : "Kết quả"}: {title}
        </h2>

        <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-6">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -4 }}
            transition={{ duration: 0.6, ease }}
            className="relative flex h-36 w-44 items-center justify-center rounded-[50%] border-[3px] border-coral"
            aria-label={`Điểm ${formatScore(score)} trên 10`}
            role="img"
          >
            <span className="tabular font-hand text-7xl leading-none text-coral-ink">{formatScore(score)}</span>
            <span className="absolute bottom-3 right-5 font-hand text-xl text-coral-ink">/10</span>
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="font-hand text-2xl text-ink">{verdict(score)}</p>
            <p className="tabular mt-2 text-ink-2">
              Đúng <span className="font-semibold text-ink">{right}</span>, sai <span className="font-semibold text-ink">{total - right - skipped}</span>
              {skipped > 0 && (
                <>
                  , bỏ qua <span className="font-semibold text-ink">{skipped}</span>
                </>
              )}{" "}
              trên {total} câu.
            </p>
            <div className="mt-3">
              <ProgressCells states={states} />
            </div>
          </div>
        </div>

        {today && (
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-5">
            <DailyTicks goal={today.goal} done={Math.min(today.done, today.goal)} />
            <p className="tabular text-sm text-ink-2">
              Mục tiêu hôm nay: <span className="font-semibold text-ink">{Math.min(today.done, today.goal)}/{today.goal}</span> câu
              {today.done >= today.goal ? ". Xong mục tiêu rồi!" : "."}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {wrongItems.length > 0 && (
            <Button size="lg" onClick={onReviewWrong}>
              <ArrowCounterClockwise size={18} /> Ôn câu sai ({wrongItems.length})
            </Button>
          )}
          <Button size="lg" variant={wrongItems.length ? "secondary" : "primary"} onClick={onRestart}>
            <ArrowClockwise size={18} /> Làm lại
          </Button>
          <ExitLink href={exitHref} onExit={onExit} className={buttonClass("ghost", "lg")}>
            {exitLabel}
          </ExitLink>
        </div>
      </section>

      {wrongItems.length > 0 && (
        <section className="mt-10" aria-labelledby="cau-sai">
          <h3 id="cau-sai" className="text-xl font-bold">
            Câu cần xem lại
          </h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {wrongItems.map((it) => {
              const q = it.question;
              const solution = q.steps?.length ? q.steps : q.explanation ? [q.explanation] : [];
              return (
                <li key={q.id}>
                  <details className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start gap-3 rounded-[var(--radius-paper)] [&::-webkit-details-marker]:hidden">
                      <X size={20} weight="bold" className="mt-1 shrink-0 text-danger" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <RichText text={q.prompt} />
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-coral-ink group-open:hidden">Xem lời giải</span>
                      <span className="hidden shrink-0 text-sm font-semibold text-ink-3 group-open:inline">Thu gọn</span>
                    </summary>
                    <div className="mt-3 pl-8">
                      <p>
                        Đáp án: <RichText text={correctAnswerText(q)} className="font-semibold" />
                      </p>
                      {solution.length > 0 && <SolutionSteps steps={solution} className="mt-3" />}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
          {mode === "practice" && (
            <p className="mt-4 text-sm text-ink-2">
              Các câu sai đã được ghi vào{" "}
              <Link href="/learn/review" className="font-semibold text-coral-ink underline">
                Ôn tập
              </Link>
              {theoryHref && (
                <>
                  . Hoặc{" "}
                  <Link href={theoryHref} className="font-semibold text-coral-ink underline">
                    đọc lại lý thuyết
                  </Link>
                </>
              )}
              .
            </p>
          )}
        </section>
      )}
    </div>
  );
}
