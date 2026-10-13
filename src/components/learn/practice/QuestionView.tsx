"use client";

import { Check, Minus, X } from "@phosphor-icons/react";
import { useId } from "react";
import { RichText } from "@/components/learn/Math";
import { isCorrect } from "@/lib/api/practice";
import type { AnswerValue, PracticeQuestion } from "@/lib/api/practice-types";

const letters = ["A", "B", "C", "D", "E", "F"];

/** Rich text that may contain line breaks (\n). */
export function RichLines({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          <RichText text={line} />
        </span>
      ))}
    </span>
  );
}

/** "0,5" style number for display. */
export const viNumber = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 6 });

/** The correct answer as text, for feedback and answer keys. */
export function correctAnswerText(q: PracticeQuestion) {
  if (q.type === "choice") return `${letters[q.answerIndex]}. ${q.choices[q.answerIndex]}`;
  if (q.type === "truefalse") return q.answer ? "Đúng" : "Sai";
  return `${viNumber(q.answer)}${q.unit ? ` ${q.unit}` : ""}`;
}

/** Answer controls for one question. When `checked`, shows the teacher's marks. */
export function AnswerInput({
  question: q,
  value,
  onChange,
  checked,
  onSubmit,
  error,
  size = "lg",
}: {
  question: PracticeQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  checked: boolean;
  onSubmit?: () => void;
  error?: string;
  size?: "md" | "lg";
}) {
  const id = useId();
  const big = size === "lg";

  if (q.type === "number") {
    const right = checked && isCorrect(q, value);
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor={`${id}-n`} className="text-sm font-semibold">
          Đáp số
        </label>
        <div className="flex items-center gap-3">
          <input
            id={`${id}-n`}
            inputMode="decimal"
            autoComplete="off"
            value={typeof value === "string" ? value : value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
            readOnly={checked}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : `${id}-hint`}
            placeholder="Ví dụ: 3 hoặc 0,5"
            className={`tabular h-12 w-44 rounded-[var(--radius-paper)] border bg-paper px-4 text-lg outline-none transition-[border-color,box-shadow] focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] ${
              error ? "border-danger" : "border-line hover:border-ink-3"
            } ${checked && !right ? "text-danger line-through decoration-2" : ""}`}
          />
          {q.unit && <span className="text-ink-2">{q.unit}</span>}
          {checked && (right ? <Check size={30} weight="bold" className="text-coral-ink" aria-label="Đúng" /> : <X size={26} weight="bold" className="text-danger" aria-label="Sai" />)}
        </div>
        {error ? (
          <p id={`${id}-err`} className="text-sm text-danger">{error}</p>
        ) : (
          <p id={`${id}-hint`} className="text-sm text-ink-3">Số thập phân viết bằng dấu phẩy. Có thể viết phân số như 1/2.</p>
        )}
      </form>
    );
  }

  const options =
    q.type === "choice"
      ? q.choices.map((c, i) => ({ value: i as AnswerValue, label: c, key: letters[i] }))
      : [
          { value: true as AnswerValue, label: "Đúng", key: "Đ" },
          { value: false as AnswerValue, label: "Sai", key: "S" },
        ];
  const answer: AnswerValue = q.type === "choice" ? q.answerIndex : q.answer;

  return (
    <div role="radiogroup" aria-label="Chọn đáp án" className={q.type === "truefalse" ? "grid grid-cols-2 gap-3 sm:max-w-md" : "flex flex-col gap-2.5"}>
      {options.map((o, i) => {
        const picked = value === o.value;
        const isAnswer = o.value === answer;
        const state = !checked ? (picked ? "picked" : "idle") : isAnswer ? "right" : picked ? "wrong" : "dim";
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={picked}
            disabled={checked}
            onClick={() => onChange(o.value)}
            className={`group flex items-center gap-3 rounded-[var(--radius-paper)] border text-left transition-[border-color,background-color,opacity] duration-200 ${
              big ? "min-h-14 px-4 py-3 text-lg" : "min-h-11 px-3 py-2"
            } ${
              state === "picked"
                ? "border-coral bg-coral-wash"
                : state === "right"
                  ? "border-coral bg-coral-wash"
                  : state === "wrong"
                    ? "border-danger/60 bg-paper"
                    : state === "dim"
                      ? "border-line bg-paper opacity-55"
                      : "border-line bg-paper hover:border-ink-3"
            } disabled:cursor-default`}
          >
            <span
              className={`tabular flex shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${big ? "size-8" : "size-7"} ${
                state === "picked" || state === "right" ? "border-coral bg-coral text-on-coral" : "border-rule text-ink-2"
              }`}
              aria-hidden="true"
            >
              {o.key}
            </span>
            <span className={`min-w-0 flex-1 ${state === "wrong" ? "text-ink-2 line-through decoration-danger decoration-2" : ""}`}>
              <RichText text={o.label} />
            </span>
            {!checked && big && (
              <kbd className="hidden font-sans text-xs text-ink-3 md:inline" aria-hidden="true">
                {i + 1}
              </kbd>
            )}
            {state === "right" && <Check size={28} weight="bold" className="shrink-0 text-coral-ink" aria-label="Đáp án đúng" />}
            {state === "wrong" && <X size={24} weight="bold" className="shrink-0 text-danger" aria-label="Con chọn sai" />}
          </button>
        );
      })}
    </div>
  );
}

/** Worked solution, one numbered step per line. */
export function SolutionSteps({ steps, className = "" }: { steps: string[]; className?: string }) {
  return (
    <ol className={`flex flex-col gap-2.5 ${className}`}>
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-paper-3 text-xs font-semibold text-ink-2">{i + 1}</span>
          <RichText text={s} className="min-w-0 flex-1 leading-relaxed" />
        </li>
      ))}
    </ol>
  );
}

export type CellState = "pending" | "right" | "wrong" | "skipped";

/** Session progress as notebook squares: red tick, red cross, or a dash for skipped. */
export function ProgressCells({ states, current }: { states: CellState[]; current?: number }) {
  const right = states.filter((s) => s === "right").length;
  return (
    <div className="flex flex-wrap gap-1" role="img" aria-label={`Câu ${(current ?? 0) + 1} trên ${states.length}. Đúng ${right} câu.`}>
      {states.map((s, i) => (
        <span
          key={i}
          className={`flex size-8 items-center justify-center border bg-paper transition-[border-color,box-shadow] duration-200 sm:size-9 ${
            i === current ? "border-coral shadow-[0_0_0_2px_var(--coral)]" : "border-rule"
          }`}
        >
          {s === "right" && <Check size={22} weight="bold" className="text-coral-ink" />}
          {s === "wrong" && <X size={18} weight="bold" className="text-danger" />}
          {s === "skipped" && <Minus size={16} weight="bold" className="text-ink-3" />}
        </span>
      ))}
    </div>
  );
}
