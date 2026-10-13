"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSiteContent } from "@/lib/api/site";
import { PhotoSleeve } from "./PhotoSleeve";

const ease = [0.16, 1, 0.3, 1] as const;

/** The open album: two pages on one gutter, a ribbon marking where you stopped. */
export function AlbumSpread() {
  const reduce = useReducedMotion();
  const photos = useSiteContent().landing.album;
  const left = photos.slice(0, 2);
  const right = photos.slice(2, 4);

  return (
    <div className="relative mx-auto w-full max-w-[720px] [perspective:2200px]">
      {/* cover peeking behind the pages */}
      <div className="vinyl absolute -inset-3 rounded-[10px] sm:-inset-4" aria-hidden="true" />

      <div className="relative grid grid-cols-2">
        <motion.div
          initial={reduce ? false : { rotateY: 28, opacity: 0.6 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease }}
          style={{ transformOrigin: "right center" }}
          className="flex flex-col gap-3 rounded-l-[var(--radius-paper)] bg-paper-2 p-3 shadow-[inset_-14px_0_18px_-14px_hsl(var(--shadow)/0.35)] sm:gap-4 sm:p-5"
        >
          {left.map((p, i) => (
            <PhotoSleeve key={i} src={p.url} alt={p.alt} memo={p.memo} date={p.date} ratio="4/3" priority={i === 0} sizes="(min-width: 1024px) 300px, 45vw" />
          ))}
        </motion.div>

        <motion.div
          initial={reduce ? false : { rotateY: -28, opacity: 0.6 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease }}
          style={{ transformOrigin: "left center" }}
          className="flex flex-col gap-3 rounded-r-[var(--radius-paper)] bg-paper-2 p-3 shadow-[inset_14px_0_18px_-14px_hsl(var(--shadow)/0.35)] sm:gap-4 sm:p-5"
        >
          {right.map((p, i) => (
            <PhotoSleeve key={i} src={p.url} alt={p.alt} memo={p.memo} date={p.date} ratio="4/3" sizes="(min-width: 1024px) 300px, 45vw" />
          ))}
        </motion.div>

        {/* gutter */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" aria-hidden="true" />

        {/* ribbon bookmark */}
        <motion.div
          aria-hidden="true"
          initial={reduce ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.9, delay: 0.7, ease }}
          style={{ transformOrigin: "top" }}
          className="absolute -top-3 left-[calc(50%-0.5rem)] h-[calc(100%+2.5rem)] w-4 bg-coral sm:-top-4 [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-10px),0_100%)]"
        />
      </div>
    </div>
  );
}
