"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * Small menu button (role="menu"): arrows move, Esc closes and returns focus,
 * a click outside closes.
 */
export function ActionMenu({
  label,
  trigger,
  items,
  triggerClassName,
  align = "right",
  showLabel = false,
}: {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  triggerClassName?: string;
  align?: "left" | "right";
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLButtonElement>("[role=menuitem]:not([aria-disabled=true])")?.focus();
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function close(refocus = true) {
    setOpen(false);
    if (refocus) button.current?.focus();
  }

  function onKey(e: KeyboardEvent) {
    const els = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []);
    const at = els.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => els[(i + els.length) % els.length]?.focus();
    const keys: Record<string, () => void> = {
      ArrowDown: () => go(at + 1),
      ArrowUp: () => go(at - 1),
      Home: () => go(0),
      End: () => go(els.length - 1),
      Escape: () => {
        e.stopPropagation();
        close();
      },
    };
    const act = keys[e.key];
    if (act) {
      e.preventDefault();
      act();
    }
    if (e.key === "Tab") close(false);
  }

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={showLabel ? undefined : label}
        title={showLabel ? undefined : label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={triggerClassName ?? "inline-flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink aria-expanded:bg-paper-3 aria-expanded:text-ink"}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={list}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          className={`absolute top-full z-30 mt-1 min-w-52 rounded-[var(--radius-paper)] border border-line bg-paper py-1 paper-shadow ${align === "right" ? "right-0" : "left-0"}`}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              aria-disabled={it.disabled || undefined}
              onClick={() => {
                if (it.disabled) return;
                close();
                it.onSelect();
              }}
              className={`flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm outline-none transition-colors focus-visible:bg-paper-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-45 ${
                it.danger ? "text-danger hover:bg-danger/5" : "text-ink hover:bg-paper-2"
              }`}
            >
              {it.icon && <span className={`shrink-0 ${it.danger ? "" : "text-ink-3"}`}>{it.icon}</span>}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
