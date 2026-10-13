"use client";

import { X } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useRef } from "react";
import type { Video } from "@/lib/api/lesson-types";
import { useDialogA11y } from "./hooks";

const ease = [0.16, 1, 0.3, 1] as const;

/** Side sheet used for "Mục lục" and "Trong bài này" below the lg breakpoint. */
export function Drawer({
  open,
  side,
  title,
  onClose,
  children,
}: {
  open: boolean;
  side: "left" | "right";
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useDialogA11y(open, ref, onClose);
  const off = side === "left" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-cover/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { x: off }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: off }}
            transition={{ duration: 0.42, ease }}
            className={`absolute inset-y-0 flex w-[min(22rem,88vw)] flex-col bg-paper paper-shadow ${side === "left" ? "left-0 border-r" : "right-0 border-l"} border-line`}
          >
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line pl-5 pr-2">
              <p className="mr-auto font-display text-lg font-semibold">{title}</p>
              <button
                onClick={onClose}
                aria-label="Đóng"
                className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const kindLabel: Record<Video["kind"], string> = { lecture: "Bài giảng", solution: "Giải bài tập" };
export const videoKindLabel = (k: Video["kind"]) => kindLabel[k];

export function formatDuration(sec?: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** Plays a lesson video in an iframe. Esc or the backdrop closes it. */
export function VideoDialog({ video, onClose }: { video: Video | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useDialogA11y(!!video, ref, onClose);
  const src = video ? `${video.url}${video.url.includes("?") ? "&" : "?"}autoplay=1&rel=0` : "";

  return (
    <AnimatePresence>
      {video && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            className="absolute inset-0 bg-cover/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-dialog-title"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.4, ease }}
            className="relative w-full max-w-4xl overflow-hidden rounded-[var(--radius-paper)] bg-cover text-on-cover paper-shadow"
          >
            <div className="flex items-center gap-3 py-2 pl-5 pr-2">
              <div className="min-w-0 flex-1">
                <p id="video-dialog-title" className="truncate font-display text-lg font-semibold">{video.title}</p>
                <p className="text-sm text-on-cover/75">
                  {videoKindLabel(video.kind)}
                  {video.teacher ? `, ${video.teacher}` : ""}
                </p>
              </div>
              <button
                data-autofocus
                onClick={onClose}
                aria-label="Đóng video"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-on-cover/80 hover:bg-cover-2 hover:text-on-cover"
              >
                <X size={22} />
              </button>
            </div>
            <div className="aspect-video w-full bg-cover-2">
              <iframe
                src={src}
                title={video.title}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
