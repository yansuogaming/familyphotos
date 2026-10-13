"use client";

import { ArrowRight } from "@/components/ui/icons";
import { motion, useReducedMotion } from "motion/react";
import Image from "@/components/ui/Image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { mediaApi } from "@/lib/api/media";
import { useApi } from "@/lib/hooks/useApi";
import { Lightbox, photoToItem } from "./Lightbox";

const tilt = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];

/** "Ngày này năm xưa": shows only when earlier years have photos from today's date. */
export function OnThisDay() {
  const memories = useApi(() => mediaApi.onThisDay());
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<{ m: number; i: number } | null>(null);
  const list = useMemo(() => (memories.status === "ready" ? memories.data : []), [memories]);
  const items = useMemo(() => (open ? list[open.m].photos.map(photoToItem) : []), [open, list]);

  if (list.length === 0) return null;
  const today = new Date().toLocaleDateString("vi-VN", { day: "numeric", month: "long" });

  return (
    <section aria-labelledby="memories-h" className="oli oli-margin mt-14 overflow-hidden rounded-[var(--radius-paper)] border border-line py-8 pl-20 pr-5 sm:pr-8">
      <h2 id="memories-h" className="text-2xl font-bold">Ngày này năm xưa</h2>
      <p className="mt-1 font-hand text-xl text-ink-2">{today}, nhà mình đã ở đâu?</p>

      <div className="mt-6 flex flex-col gap-10">
        {list.map((m, mi) => (
          <div key={m.date + m.album.id} className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
            <div>
              <p className="font-display text-xl font-semibold">{m.yearsAgo} năm trước</p>
              <p className="tabular text-sm text-ink-3">{new Date(m.date).toLocaleDateString("vi-VN")}</p>
              <Link href={`/photos/${m.album.id}`} className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-coral-ink hover:underline">
                {m.album.title} <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
            <ul className="-my-2 flex gap-4 overflow-x-auto px-1 py-3 sm:gap-5">
              {m.photos.map((p, i) => (
                <li key={p.id} className="shrink-0">
                  <motion.button
                    type="button"
                    onClick={() => setOpen({ m: mi, i })}
                    whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`block rounded-[3px] border border-line bg-paper p-1.5 pb-6 paper-shadow ${tilt[i % tilt.length]}`}
                    aria-label={`Xem lớn. ${p.memo ?? "Ảnh"}, ${m.yearsAgo} năm trước`}
                  >
                    <motion.span layoutId={reduce ? undefined : `memory-${p.id}`} className="sleeve relative block h-32 w-28 overflow-hidden rounded-[2px] bg-paper-3 sm:h-36 sm:w-32">
                      <Image src={p.url} alt="" fill sizes="128px" className="object-cover" />
                    </motion.span>
                  </motion.button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Lightbox items={items} index={open?.i ?? null} onIndexChange={(i) => setOpen((o) => (o ? { ...o, i } : o))} onClose={() => setOpen(null)} layoutPrefix="memory" />
    </section>
  );
}
