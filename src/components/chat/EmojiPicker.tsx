"use client";

import {
  ClockCounterClockwise,
  Confetti,
  ForkKnife,
  HandWaving,
  Heart,
  Lightbulb,
  PawPrint,
  Smiley,
  UsersThree,
  type Icon,
} from "@/components/ui/icons";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EMOJI_GROUPS, recentEmoji, rememberEmoji } from "./emoji";

const icons: Record<string, Icon> = {
  recent: ClockCounterClockwise,
  faces: Smiley,
  gestures: HandWaving,
  people: UsersThree,
  animals: PawPrint,
  food: ForkKnife,
  activities: Confetti,
  objects: Lightbulb,
  symbols: Heart,
};

/** Grid of standard emoji in groups, with a "recent" tab. Closes on Esc or outside click. */
export function EmojiPicker({ onPick, onClose, className = "" }: { onPick: (emoji: string) => void; onClose: () => void; className?: string }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [recent] = useState(recentEmoji);
  const groups = recent.length ? [{ id: "recent", label: "Dùng gần đây", emoji: recent }, ...EMOJI_GROUPS] : EMOJI_GROUPS;
  const [tab, setTab] = useState(groups[0].id);
  const group = groups.find((g) => g.id === tab) ?? groups[0];
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    root.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (root.current?.contains(t) || t.closest("[data-emoji-toggle]")) return;
      close.current();
    };
    const key = (e: globalThis.KeyboardEvent) => e.key === "Escape" && close.current();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, []);

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = groups.findIndex((g) => g.id === tab);
    const next = groups[(i + (e.key === "ArrowRight" ? 1 : -1) + groups.length) % groups.length];
    setTab(next.id);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`#emoji-tab-${next.id}`)?.focus());
  }

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-label="Chọn biểu cảm"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`z-40 w-[min(22rem,calc(100vw-1.5rem))] rounded-[var(--radius-paper)] border border-line bg-paper paper-shadow ${className}`}
    >
      <div role="tablist" aria-label="Nhóm biểu cảm" onKeyDown={onTabKey} className="flex overflow-x-auto border-b border-line px-1 pt-1">
        {groups.map((g) => {
          const I = icons[g.id] ?? Smiley;
          const active = g.id === tab;
          return (
            <button
              key={g.id}
              id={`emoji-tab-${g.id}`}
              role="tab"
              aria-selected={active}
              aria-controls="emoji-panel"
              tabIndex={active ? 0 : -1}
              title={g.label}
              aria-label={g.label}
              onClick={() => setTab(g.id)}
              className={`relative inline-flex size-10 shrink-0 items-center justify-center rounded-t-[var(--radius-paper)] ${active ? "text-coral-ink" : "text-ink-3 hover:text-ink"}`}
            >
              <I size={20} weight={active ? "fill" : "regular"} />
              {active && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-coral" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div id="emoji-panel" role="tabpanel" aria-labelledby={`emoji-tab-${group.id}`} className="h-64 overflow-y-auto p-2">
        <p className="px-1.5 pb-1 text-xs font-semibold text-ink-3">{group.label}</p>
        <div className="grid grid-cols-8 gap-0.5">
          {group.emoji.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={e}
              onClick={() => {
                rememberEmoji(e);
                onPick(e);
              }}
              className="flex aspect-square items-center justify-center rounded-[var(--radius-paper)] text-2xl leading-none transition-transform hover:bg-paper-2 active:scale-90"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
