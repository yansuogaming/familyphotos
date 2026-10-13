"use client";

import { CheckCircle, WarningCircle } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";

const timeOf = (d: Date | string | number) =>
  new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

/**
 * Save bar for admin forms. Sticks to the bottom of the content area while the
 * form has unsaved edits (or is saving, or the last save failed).
 *
 * - The caller validates, sets `saving`, shows the "Đã lưu" toast and passes
 *   `error` when the save fails.
 * - `onReset` is called directly (no confirmation): edits are only local until
 *   saved, so discarding them is cheap to redo.
 * - `savedAt`, when given and nothing is dirty, shows a quiet "Đã lưu lúc 10:42"
 *   line in place of the bar.
 */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  error,
  savedAt,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  error?: string | null;
  savedAt?: Date | string | number | null;
}) {
  const reduce = useReducedMotion();
  const open = dirty || saving || !!error;

  return (
    <div aria-live="polite" className="sticky bottom-0 z-20 -mx-4 mt-8 sm:-mx-8">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="bar"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm sm:px-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p className={`flex min-w-0 items-center gap-2 text-sm font-semibold ${error ? "text-danger" : "text-ink"}`}>
                {error ? (
                  <>
                    <WarningCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-coral" />
                    <span>{saving ? "Đang lưu thay đổi..." : "Có thay đổi chưa lưu"}</span>
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={onReset} disabled={saving || !dirty}>
                  Huỷ thay đổi
                </Button>
                <Button onClick={onSave} disabled={saving || !dirty}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : savedAt ? (
          <motion.p
            key="saved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 px-4 py-3 text-sm text-ink-3 sm:px-8"
          >
            <CheckCircle size={16} weight="fill" className="text-ok" /> Đã lưu lúc {timeOf(savedAt)}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
