"use client";

import { ArrowClockwise, CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui/Button";
import { formatSize } from "./format";

export interface UploadRow {
  id: string;
  name: string;
  size: number;
  progress: number; // 0-100
  state: "uploading" | "done" | "error";
  error?: string;
  /** Save failed (not a bad file), so the same file can be sent again. */
  retryable?: boolean;
}

/** One row per file picked: progress, then done or the reason it failed. */
export function UploadQueue({
  rows,
  onRetry,
  onDismiss,
  onClear,
}: {
  rows: UploadRow[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
}) {
  if (rows.length === 0) return null;
  const busy = rows.filter((r) => r.state === "uploading").length;
  const failed = rows.filter((r) => r.state === "error").length;
  const done = rows.length - busy - failed;

  return (
    <section aria-label="Tệp đang tải lên" className="rounded-[var(--radius-paper)] border border-line bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <p className="text-sm font-semibold" aria-live="polite">
          {busy > 0 ? `Đang tải lên ${busy} tệp` : `Xong ${done} tệp`}
          {failed > 0 && <span className="font-normal text-danger">, {failed} tệp chưa được</span>}
        </p>
        {busy === 0 && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            Đóng danh sách
          </Button>
        )}
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-4 px-4 py-2.5">
            <span className="shrink-0">
              {r.state === "done" ? (
                <CheckCircle size={20} weight="fill" className="text-ok" aria-label="Xong" />
              ) : r.state === "error" ? (
                <WarningCircle size={20} weight="fill" className="text-danger" aria-label="Lỗi" />
              ) : (
                <span className="tabular block w-9 text-right text-xs text-ink-3">{Math.round(r.progress)}%</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">{r.name}</span>
                <span className="tabular shrink-0 text-xs text-ink-3">{formatSize(r.size)}</span>
              </div>
              {r.state === "error" ? (
                <p className="mt-0.5 text-sm text-danger">{r.error}</p>
              ) : (
                <div
                  role="progressbar"
                  aria-label={`Tải lên ${r.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(r.progress)}
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-3"
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ease-[var(--ease-out-expo)] ${r.state === "done" ? "bg-ok" : "bg-coral"}`}
                    style={{ width: `${r.progress}%` }}
                  />
                </div>
              )}
            </div>
            {r.state === "error" && (
              <div className="flex shrink-0 items-center">
                {r.retryable && (
                  <IconButton label={`Thử lại ${r.name}`} onClick={() => onRetry(r.id)}>
                    <ArrowClockwise size={18} />
                  </IconButton>
                )}
                <IconButton label={`Bỏ ${r.name} khỏi danh sách`} onClick={() => onDismiss(r.id)}>
                  <X size={18} />
                </IconButton>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
