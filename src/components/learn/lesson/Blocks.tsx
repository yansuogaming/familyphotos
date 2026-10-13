"use client";

import { ArrowCounterClockwise, Check, Eye, EyeSlash, Lightbulb, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { type ReactNode, useId, useState } from "react";
import { Math, RichText } from "@/components/learn/Math";
import type { LessonBlock, QuizQuestion } from "@/lib/api/lesson-types";

const ease = [0.16, 1, 0.3, 1] as const;

/** Red-pen strike that also crosses KaTeX formulas (text-decoration does not). */
const strike =
  "box-decoration-clone bg-[linear-gradient(transparent_calc(50%-1px),color-mix(in_oklch,var(--danger)_85%,transparent)_calc(50%-1px),color-mix(in_oklch,var(--danger)_85%,transparent)_calc(50%+1px),transparent_calc(50%+1px))]";

/** Highlighter stroke for "Ghi nhớ" lines. */
const highlight =
  "box-decoration-clone bg-[linear-gradient(transparent_55%,color-mix(in_oklch,var(--coral)_34%,transparent)_55%,color-mix(in_oklch,var(--coral)_34%,transparent)_92%,transparent_92%)] px-0.5";

const frame = "my-6 rounded-[var(--radius-paper)] border border-line bg-paper";

export function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="my-4">
          <RichText text={block.text} />
        </p>
      );
    case "math":
      return (
        <div className="my-5 text-lg">
          <Math tex={block.tex} block className="py-1" />
        </div>
      );
    case "definition":
      return (
        <p className="my-5 rounded-[var(--radius-paper)] bg-paper-2 px-5 py-4">
          <dfn className="font-semibold not-italic text-ink">{block.term}</dfn> <RichText text={block.text} />
        </p>
      );
    case "question":
      return <QuestionBlock prompt={block.prompt} hint={block.hint} answer={block.answer} />;
    case "example":
      return (
        <div className={`${frame} px-5 py-5 sm:px-6`}>
          <h4 className="text-lg font-semibold">
            <RichText text={block.title} />
          </h4>
          <p className="mt-2">
            <RichText text={block.problem} />
          </p>
          <p className="mt-4 text-sm font-semibold text-ink-3">Lời giải</p>
          <ol className="mt-2 flex flex-col gap-2.5">
            {block.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="tabular mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink-2">
                  {i + 1}
                </span>
                <span className="min-w-0 pt-0.5">
                  <RichText text={s} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "mistake":
      return (
        <div className={`${frame} px-5 py-4 sm:px-6`}>
          <Mark kind="wrong">
            <span className={`text-ink-2 ${strike}`}>
              <RichText text={block.wrong} />
            </span>
          </Mark>
          <Mark kind="right">
            <RichText text={block.right} />
          </Mark>
          <p className="mt-3 border-t border-dashed border-line pt-3 text-ink-2">
            <span className="font-semibold text-ink">Vì sao? </span>
            <RichText text={block.why} />
          </p>
        </div>
      );
    case "note":
      return (
        <p className="my-3 leading-[1.9]">
          <mark className={`bg-transparent text-ink ${highlight}`}>
            <RichText text={block.text} />
          </mark>
        </p>
      );
    case "image":
      return (
        <figure className="my-6">
          <Image
            src={block.url}
            alt={block.alt}
            width={1120}
            height={760}
            unoptimized
            className="h-auto w-full rounded-[var(--radius-paper)] border border-line bg-paper-2"
          />
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm text-ink-3">
              <RichText text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    case "quiz":
      return <Quiz questions={block.questions} />;
  }
}

/** Teacher's mark: red cross for the wrong line, red tick for the right one. */
function Mark({ kind, children }: { kind: "wrong" | "right"; children: ReactNode }) {
  const wrong = kind === "wrong";
  return (
    <div className={`flex gap-3 ${wrong ? "" : "mt-3"}`}>
      {wrong ? (
        <X size={22} weight="bold" className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
      ) : (
        <Check size={22} weight="bold" className="mt-0.5 shrink-0 text-coral-ink" aria-hidden="true" />
      )}
      <p className="min-w-0">
        <span className={`mr-2 font-hand text-lg ${wrong ? "text-danger" : "text-coral-ink"}`}>{wrong ? "Sai" : "Đúng"}</span>
        {children}
      </p>
    </div>
  );
}

function Reveal({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuestionBlock({ prompt, hint, answer }: { prompt: string; hint?: string; answer: string }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const uid = useId();
  const toggle = "inline-flex h-10 items-center gap-2 rounded-full border border-line bg-paper px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink";

  return (
    <div className="oli my-6 rounded-[var(--radius-paper)] border border-rule px-5 py-5 sm:px-6">
      <p className="font-display text-xl font-semibold leading-snug">
        <RichText text={prompt} />
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {hint && (
          <button className={toggle} aria-expanded={showHint} aria-controls={`${uid}-hint`} onClick={() => setShowHint((v) => !v)}>
            <Lightbulb size={18} weight={showHint ? "fill" : "regular"} className="text-coral-ink" />
            {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
          </button>
        )}
        <button className={toggle} aria-expanded={showAnswer} aria-controls={`${uid}-answer`} onClick={() => setShowAnswer((v) => !v)}>
          {showAnswer ? <EyeSlash size={18} /> : <Eye size={18} />}
          {showAnswer ? "Ẩn đáp án" : "Xem đáp án"}
        </button>
      </div>
      {hint && (
        <Reveal open={showHint} id={`${uid}-hint`}>
          <p className="pt-4 font-hand text-xl leading-snug text-ink-2">
            Gợi ý: <RichText text={hint} />
          </p>
        </Reveal>
      )}
      <Reveal open={showAnswer} id={`${uid}-answer`}>
        <div className="pt-4">
          <p className="rounded-[var(--radius-paper)] border border-line bg-paper px-4 py-3">
            <span className="font-semibold">Đáp án. </span>
            <RichText text={answer} />
          </p>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------- quiz */

const letters = "ABCDEFGH";

function verdict(score: number, total: number) {
  if (score === total) return "Giỏi lắm, đúng hết!";
  if (score >= total * 0.7) return "Tốt rồi, xem lại câu sai nhé.";
  if (score >= total * 0.4) return "Em đọc lại phần Ghi nhớ rồi làm lại nhé.";
  return "Không sao, đọc lại bài rồi thử lần nữa.";
}

function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [round, setRound] = useState(0);
  const done = Object.keys(picked).length;
  const score = questions.filter((q) => picked[q.id] === q.answerIndex).length;
  const finished = done === questions.length && questions.length > 0;

  return (
    <div className="my-6">
      <ol className="flex flex-col gap-8">
        {questions.map((q, i) => (
          <QuizItem
            key={`${round}-${q.id}`}
            q={q}
            n={i + 1}
            picked={picked[q.id]}
            onPick={(c) => setPicked((p) => (q.id in p ? p : { ...p, [q.id]: c }))}
          />
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-5 py-4" aria-live="polite">
        {finished ? (
          <>
            <p className="font-display text-3xl font-semibold tabular">
              {score}
              <span className="text-ink-3">/{questions.length}</span>
            </p>
            <p className="min-w-0 flex-1">
              <span className="block text-sm text-ink-2">Em làm đúng {score} trên {questions.length} câu.</span>
              <span className="font-hand text-xl text-coral-ink">{verdict(score, questions.length)}</span>
            </p>
            <button
              onClick={() => {
                setPicked({});
                setRound((r) => r + 1);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-paper px-5 text-sm font-semibold hover:border-ink-3"
            >
              <ArrowCounterClockwise size={18} /> Làm lại
            </button>
          </>
        ) : (
          <p className="tabular text-sm text-ink-2">
            Đã làm <span className="font-semibold text-ink">{done}/{questions.length}</span> câu. Làm hết để xem điểm.
          </p>
        )}
      </div>
    </div>
  );
}

function QuizItem({ q, n, picked, onPick }: { q: QuizQuestion; n: number; picked?: number; onPick: (c: number) => void }) {
  const name = useId();
  const answered = picked !== undefined;
  const correct = picked === q.answerIndex;

  return (
    <li>
      <fieldset>
        <legend className="font-semibold">
          <span className="tabular mr-1.5 text-ink-3">Câu {n}.</span>
          <RichText text={q.prompt} />
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {q.choices.map((c, ci) => {
            const isPicked = picked === ci;
            const isAnswer = ci === q.answerIndex;
            const state = !answered ? "idle" : isAnswer ? "right" : isPicked ? "wrong" : "muted";
            const tone = {
              idle: "border-line hover:border-ink-3 hover:bg-paper-2 cursor-pointer",
              right: "border-coral bg-coral-wash",
              wrong: "border-danger",
              muted: "border-line opacity-60",
            }[state];
            return (
              <label
                key={ci}
                className={`relative flex min-h-12 items-center gap-3 rounded-[var(--radius-paper)] border px-3 py-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-coral ${tone}`}
              >
                <input
                  type="radio"
                  name={name}
                  className="sr-only"
                  checked={isPicked}
                  disabled={answered}
                  onChange={() => onPick(ci)}
                />
                <span className="tabular inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-sm font-semibold text-ink-2">
                  {letters[ci]}
                </span>
                <span className={`min-w-0 flex-1 ${state === "wrong" ? `text-ink-2 ${strike}` : ""}`}>
                  <RichText text={c} />
                </span>
                {state === "right" && <Check size={22} weight="bold" className="shrink-0 text-coral-ink" aria-label="Đáp án đúng" />}
                {state === "wrong" && <X size={22} weight="bold" className="shrink-0 text-danger" aria-label="Em chọn, chưa đúng" />}
              </label>
            );
          })}
        </div>
        {answered && (
          <p className="mt-3 text-ink-2">
            <span className={`mr-2 font-hand text-xl ${correct ? "text-coral-ink" : "text-danger"}`}>{correct ? "Đúng rồi." : "Chưa đúng."}</span>
            {q.explanation && <RichText text={q.explanation} />}
          </p>
        )}
      </fieldset>
    </li>
  );
}
