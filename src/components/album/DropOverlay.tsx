"use client";

import { CloudArrowUp } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Portal } from "./Modal";

/** Shown while files are dragged over the page. */
export function DropOverlay({ show, target }: { show: boolean; target?: string }) {
  return (
    <Portal>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center bg-paper/85 p-6 backdrop-blur-sm"
            aria-hidden="true"
          >
            <div className="oli flex w-full max-w-xl flex-col items-center gap-3 rounded-[var(--radius-paper)] border-2 border-dashed border-coral px-8 py-14 text-center paper-shadow">
              <CloudArrowUp size={44} className="text-coral-ink" />
              <p className="font-display text-2xl font-semibold">Thả ảnh vào đây</p>
              <p className="font-hand text-xl text-ink-2">{target ? `Ảnh sẽ vào album ${target}` : "Bạn sẽ chọn album ở bước sau"}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
