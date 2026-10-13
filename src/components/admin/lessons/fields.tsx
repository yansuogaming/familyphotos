"use client";

import type { ReactNode } from "react";
import { Math, RichText } from "@/components/learn/Math";
import { TextArea, TextField } from "../ui";
import { RICH_HINT } from "./model";

/** Wraps a field so the save bar can scroll to it. */
export function IssueAnchor({ at, children, className = "" }: { at: string; children: ReactNode; className?: string }) {
  return (
    <div data-issue={at} className={className}>
      {children}
    </div>
  );
}

function Preview({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 rounded-[var(--radius-paper)] bg-paper-2 px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-ink">
      <span className="sr-only">Xem trước: </span>
      {children}
    </div>
  );
}

/** Text that may hold $TeX$; shows the rendered result right under the box. */
export function RichField({
  label,
  value,
  onChange,
  error,
  rows = 2,
  placeholder,
  optional,
  single,
  issue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
  placeholder?: string;
  optional?: boolean;
  single?: boolean;
  issue?: string;
}) {
  const filled = value.trim() !== "";
  const showPreview = filled && value.includes("$");
  const hint = filled ? undefined : RICH_HINT;
  const aside = optional ? <span className="text-xs text-ink-3">Không bắt buộc</span> : undefined;
  const field = single ? (
    <TextField label={label} value={value} onChange={(e) => onChange(e.target.value)} error={error} hint={hint} placeholder={placeholder} aside={aside} />
  ) : (
    <TextArea label={label} value={value} onChange={(e) => onChange(e.target.value)} error={error} hint={hint} rows={rows} placeholder={placeholder} aside={aside} />
  );
  return (
    <div data-issue={issue}>
      {field}
      {showPreview && (
        <Preview>
          <RichText text={value} />
        </Preview>
      )}
    </div>
  );
}

/** Display formula in TeX, without the $ signs. */
export function TexField({ label = "Công thức (TeX)", value, onChange, error, issue }: { label?: string; value: string; onChange: (v: string) => void; error?: string; issue?: string }) {
  return (
    <div data-issue={issue}>
      <TextArea
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        rows={2}
        spellCheck={false}
        className="[&_textarea]:font-mono [&_textarea]:text-sm"
        placeholder="\frac{a}{b} = \sqrt{x^2 + 1}"
        hint="Viết TeX, không cần dấu $. Kết quả hiện ngay bên dưới."
      />
      {value.trim() !== "" && (
        <Preview>
          <Math tex={value} block className="!my-1" />
        </Preview>
      )}
    </div>
  );
}
