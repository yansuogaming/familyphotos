"use client";

import { WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/core";

/** Page title row of every admin screen. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-[64ch] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export const errorText = (e: unknown, fallback = "Có lỗi xảy ra. Thử lại sau ít phút.") =>
  e instanceof ApiError ? e.message : e instanceof Error && e.message ? e.message : fallback;

/** Inline error near the thing that failed. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-[var(--radius-paper)] border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
      <WarningCircle size={18} className="mt-0.5 shrink-0" /> <span>{children}</span>
    </p>
  );
}

const control =
  "w-full rounded-[var(--radius-paper)] border bg-paper px-3.5 text-base text-ink placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)]";
const controlBorder = (error?: string) => (error ? "border-danger" : "border-line hover:border-ink-3");

function FieldShell({ id, label, hint, error, children, className = "", aside }: { id: string; label: string; hint?: string; error?: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
        {aside}
      </div>
      {children}
      {error ? <p id={`${id}-err`} className="text-sm text-danger">{error}</p> : hint ? <p id={`${id}-hint`} className="text-sm text-ink-3">{hint}</p> : null}
    </div>
  );
}

/** Compact text input for dense admin forms (label above, error below). */
export function TextField({ label, hint, error, className = "", aside, ...input }: ComponentProps<"input"> & { label: string; hint?: string; error?: string; aside?: ReactNode }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} aside={aside}>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={`${control} ${controlBorder(error)} h-11`} {...input} />
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, className = "", aside, rows = 3, ...input }: ComponentProps<"textarea"> & { label: string; hint?: string; error?: string; aside?: ReactNode }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} aside={aside}>
      <textarea id={id} rows={rows} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={`${control} ${controlBorder(error)} resize-y py-2.5 leading-relaxed`} {...input} />
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, className = "", children, ...select }: ComponentProps<"select"> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={`${control} ${controlBorder(error)} h-11 pr-8`} {...select}>
        {children}
      </select>
    </FieldShell>
  );
}

/** Bare select for filter bars (label is visually hidden or given by aria-label). */
export const selectClass = `${control} border-line hover:border-ink-3 h-10 w-auto pr-8 text-sm`;
export const inputClass = `${control} border-line hover:border-ink-3 h-10 text-sm`;

/**
 * Modal built on <dialog>: Esc closes, focus stays inside, focus returns to the
 * opener on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
    } else if (!open && d.open) {
      d.close();
      opener.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // React re-dispatches "cancel" to parent dialogs: only the top one closes.
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${widths[size]} max-h-[calc(100dvh-2rem)] rounded-[var(--radius-paper)] border border-line bg-paper p-0 text-ink paper-shadow backdrop:bg-[oklch(0.2_0.04_262/0.55)] backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-bold">{title}</h2>
              {description && <div className="mt-1 text-sm text-ink-2">{description}</div>}
            </div>
            <IconButton label="Đóng" onClick={onClose} className="-mr-2 shrink-0">
              <X size={20} />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/**
 * Confirmation for destructive actions. With `typeToConfirm`, the button stays
 * disabled until the exact text is typed.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Xoá",
  typeToConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<unknown> | void;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  typeToConfirm?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {open && <ConfirmBody onClose={onClose} onConfirm={onConfirm} body={body} confirmLabel={confirmLabel} typeToConfirm={typeToConfirm} />}
    </Modal>
  );
}

function ConfirmBody({ onClose, onConfirm, body, confirmLabel, typeToConfirm }: { onClose: () => void; onConfirm: () => Promise<unknown> | void; body: ReactNode; confirmLabel: string; typeToConfirm?: string }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ok = !typeToConfirm || typed.trim() === typeToConfirm.trim();

  async function go() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-ink-2">{body}</div>
      {typeToConfirm && (
        <TextField
          label={`Gõ "${typeToConfirm}" để xác nhận`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoFocus
        />
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="mt-1 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} autoFocus={!typeToConfirm}>Huỷ</Button>
        <button onClick={go} disabled={!ok || busy} className={dangerButton}>
          {busy ? "Đang làm..." : confirmLabel}
        </button>
      </div>
    </div>
  );
}

export const dangerButton =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-danger px-5 text-[0.95rem] font-semibold text-paper transition-[opacity,transform] duration-200 ease-[var(--ease-out-expo)] hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

/** Empty state: what this place is for, and how to fill it. */
export function EmptyState({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="oli oli-margin rounded-[var(--radius-paper)] border border-line py-12 pl-20 pr-6">
      <p className="font-display text-xl font-semibold">{title}</p>
      <p className="mt-1.5 max-w-[52ch] text-ink-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Skeleton shaped like table rows. */
export function RowsSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="overflow-hidden rounded-[var(--radius-paper)] border border-line">
      <div className="h-11 border-b border-line bg-paper-2" />
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-line px-4 py-3.5 last:border-b-0">
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-paper-3" />
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="h-3.5 animate-pulse rounded bg-paper-3" style={{ width: `${c === 0 ? 22 : 12 + ((r + c) % 3) * 4}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Pill showing a state. Tone is meaning, not decoration. */
export function Tag({ tone = "neutral", children }: { tone?: "neutral" | "ok" | "warn" | "danger" | "coral"; children: ReactNode }) {
  const tones = {
    neutral: "border-line text-ink-2",
    ok: "border-ok/40 text-ok",
    warn: "border-coral/50 text-coral-ink",
    danger: "border-danger/40 text-danger",
    coral: "border-transparent bg-coral-wash text-coral-ink",
  };
  return <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

const rtf = typeof Intl !== "undefined" ? new Intl.RelativeTimeFormat("vi", { numeric: "auto" }) : null;

/** "5 phút trước", "hôm qua", or a date for older things. */
export function timeAgo(iso: string, now = Date.now()) {
  const diff = (Date.parse(iso) - now) / 1000;
  const abs = Math.abs(diff);
  if (!rtf) return iso;
  if (abs < 60) return "vừa xong";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Ribbon bookmark, the area's one signature: marks what is open. */
export function RibbonMark({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-6px),0_100%)] ${className}`} />;
}
