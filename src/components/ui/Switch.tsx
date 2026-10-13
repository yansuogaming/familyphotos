"use client";

import { useId, type ReactNode } from "react";

/** A labelled on/off row: title + description on the left, switch on the right. */
export function SwitchRow({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={`flex items-start justify-between gap-6 py-4 ${disabled ? "opacity-50" : ""}`}>
      <div className="min-w-0">
        <label htmlFor={id} className="font-semibold">{label}</label>
        {description && <p id={`${id}-d`} className="mt-0.5 max-w-[56ch] text-sm text-ink-2">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 ${
          checked ? "border-coral bg-coral" : "border-line bg-paper-3"
        }`}
      >
        <span
          className={`absolute left-0 top-0.5 size-[22px] rounded-full bg-[oklch(0.98_0.005_275)] shadow-[0_1px_3px_hsl(var(--shadow)/0.3)] transition-transform duration-300 ease-[var(--ease-out-expo)] ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
