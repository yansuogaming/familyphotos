import { useId, type ComponentProps, type ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  trailing,
  className = "",
  ...input
}: ComponentProps<"input"> & { label: string; hint?: string; error?: string; trailing?: ReactNode }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-[var(--radius-paper)] border bg-paper px-4 text-base text-ink placeholder:text-ink-3 transition-[border-color,box-shadow] outline-none focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] ${
            error ? "border-danger" : "border-line hover:border-ink-3"
          } ${trailing ? "pr-12" : ""}`}
          {...input}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}
