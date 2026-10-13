"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

/**
 * One-time code boxes. Typing moves forward, Backspace moves back, pasting fills
 * every box, and phones can autofill the code (autocomplete="one-time-code").
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid = false,
  disabled = false,
  onComplete,
  label = "Mã xác nhận",
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  onComplete?: (code: string) => void;
  label?: string;
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function set(next: string, focus: number) {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    boxes.current[Math.min(focus, length - 1)]?.focus();
    if (clean.length === length) onComplete?.(clean);
  }

  function onInput(i: number, raw: string) {
    const d = raw.replace(/\D/g, "");
    if (!d) return;
    // autofill or a fast typist may drop several digits into one box
    const next = (value.slice(0, i) + d + value.slice(i + d.length)).slice(0, length);
    set(next, i + d.length);
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) set(value.slice(0, i) + value.slice(i + 1), i);
      else if (i > 0) set(value.slice(0, i - 1) + value.slice(i), i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) boxes.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const d = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!d) return;
    e.preventDefault();
    set(d, d.length);
  }

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex gap-2 sm:gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={length}
            aria-label={`Số thứ ${i + 1}`}
            aria-invalid={invalid}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            className={`tabular h-14 w-full min-w-0 rounded-[var(--radius-paper)] border bg-paper text-center font-display text-2xl font-semibold text-ink outline-none transition-[border-color,box-shadow] focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] disabled:opacity-60 ${
              invalid ? "border-danger" : d ? "border-ink-3" : "border-line"
            }`}
          />
        ))}
      </div>
    </fieldset>
  );
}
