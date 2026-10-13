"use client";

import { ArrowLeft } from "@/components/ui/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { StudyModeTabs } from "@/components/learn/StudyModeTabs";

/** Page title row shared by every /learn sub-page. `modes` shows the four study-mode tabs. */
export function LearnHeader({
  title,
  backHref = "/learn",
  backLabel = "Về trang Học",
  modes = false,
  children,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  modes?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <Link
        href={backHref}
        aria-label={backLabel}
        title={backLabel}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
      >
        <ArrowLeft size={20} />
      </Link>
      <h1 className="mr-auto text-3xl font-bold">{title}</h1>
      {children}
      {modes && (
        <div className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:px-0">
          <StudyModeTabs />
        </div>
      )}
    </div>
  );
}

/** Row of pill toggles (grade, subject, filter). One is pressed at a time. */
export function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  tone = "ink",
  className = "",
}: {
  label: string;
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  tone?: "ink" | "coral";
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`flex gap-1 overflow-x-auto pb-1 ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-40 ${
              on ? (tone === "coral" ? "bg-coral text-on-coral" : "bg-ink text-paper") : "text-ink-2 hover:bg-paper-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Labelled native select, for compact filters. */
export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold">{label}</span>
      <select
        value={String(value)}
        onChange={(e) => {
          const hit = options.find((o) => String(o.value) === e.target.value);
          if (hit) onChange(hit.value);
        }}
        className="h-11 w-full rounded-[var(--radius-paper)] border border-line bg-paper px-3 text-[0.95rem] text-ink outline-none transition-colors hover:border-ink-3 focus:border-coral"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The coral "đang ở đây" ribbon with a V notch at the bottom. Position it from outside. */
export function Ribbon({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-8px),0_100%)] ${className}`} />;
}

/** Friendly empty state: what is missing and what to do next. */
export function EmptyNote({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-paper)] border border-dashed border-rule bg-paper px-6 py-10 text-center">
      <p className="font-display text-xl font-semibold">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-ink-2">{children}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export const grades = Array.from({ length: 12 }, (_, i) => i + 1);

/** Opens the floating assistant with some context. */
export function askAssistant(context: string) {
  window.dispatchEvent(new CustomEvent("fp:assistant-open", { detail: { context } }));
}

/** Rich text without the $ delimiters (TeX stays readable for the assistant). */
export const plain = (rich: string) => rich.replace(/\$/g, "").replace(/\s+/g, " ").trim();
