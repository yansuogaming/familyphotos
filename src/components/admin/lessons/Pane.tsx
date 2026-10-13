"use client";

import { createContext, useContext, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/** Width of the studio (the admin content area), measured, so the layout follows the admin sidebar width. */
export const StudioWidth = createContext(0);
/** The inspector docks as a column when the studio is at least this wide. */
export const DOCK_AT = 1000;
export const useInspectorDocked = () => useContext(StudioWidth) >= DOCK_AT;

/**
 * The studio's side areas. One element, placed by CSS:
 * - "outline": a column from 1024px, a drawer from the left below.
 * - "inspector": a column when the studio is 1000px wide or more, otherwise a
 *   drawer from the right (screens from 1024px) or a sheet from the bottom.
 * The outline can also be collapsed to a narrow rail (from 1024px).
 * When it floats, Esc closes it, focus moves in and returns on close.
 */
export function Pane({
  kind,
  open,
  onClose,
  label,
  collapsed = false,
  children,
}: {
  kind: "outline" | "inspector";
  open: boolean;
  onClose: () => void;
  label: string;
  collapsed?: boolean;
  children: ReactNode;
}) {
  const wideScreen = useMediaQuery("(min-width: 1024px)");
  const inspectorDocked = useInspectorDocked();
  const docked = kind === "outline" ? wideScreen : inspectorDocked;
  const modal = useMediaQuery("(max-width: 1023.98px)");
  const floating = !docked;
  const ref = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!floating) return;
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      const el = ref.current;
      if (el && !el.contains(document.activeElement)) {
        el.querySelector<HTMLElement>("[data-autofocus], input:not([type=radio]):not([type=checkbox]), textarea, select, button, a[href]")?.focus({ preventScroll: true });
      }
    } else if (opener.current && ref.current?.contains(document.activeElement)) {
      opener.current.focus?.({ preventScroll: true });
      opener.current = null;
    }
  }, [open, floating]);

  function onKeyDown(e: KeyboardEvent) {
    if (!floating || !open) return;
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.stopPropagation();
      onClose();
      return;
    }
    // Keep Tab inside while it covers the page (phones and small tablets).
    if (e.key === "Tab" && modal) {
      const els = Array.from(ref.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex='-1'])") ?? []).filter((x) => x.offsetParent !== null);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  const place =
    kind === "outline"
      ? `bg-paper-2 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[min(20rem,88vw)] max-lg:shadow-[0_16px_40px_-12px_hsl(var(--shadow)/0.5)] lg:shrink-0 lg:overflow-hidden lg:border-r lg:border-line lg:transition-[width] ${collapsed ? "lg:w-14" : "lg:w-[248px] @min-[1150px]/studio:w-[272px]"} ${
          open ? "" : "max-lg:invisible max-lg:-translate-x-full"
        }`
      : `bg-paper lg:@min-[1000px]/studio:w-[320px] lg:@min-[1150px]/studio:w-[360px] lg:@min-[1000px]/studio:shrink-0 lg:@min-[1000px]/studio:border-l lg:@min-[1000px]/studio:border-line
         lg:@max-[999.98px]/studio:fixed lg:@max-[999.98px]/studio:inset-y-0 lg:@max-[999.98px]/studio:right-0 lg:@max-[999.98px]/studio:z-40 lg:@max-[999.98px]/studio:w-[400px] lg:@max-[999.98px]/studio:border-l lg:@max-[999.98px]/studio:border-line lg:@max-[999.98px]/studio:shadow-[0_16px_40px_-12px_hsl(var(--shadow)/0.45)]
         max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:max-h-[85dvh] max-lg:rounded-t-xl max-lg:border-t max-lg:border-line max-lg:shadow-[0_-16px_40px_-12px_hsl(var(--shadow)/0.45)] ${
           open ? "" : "max-lg:invisible lg:@max-[999.98px]/studio:invisible lg:@max-[999.98px]/studio:translate-x-full max-lg:translate-y-full"
         }`;

  return (
    <>
      {open && floating && modal && (
        <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-[oklch(0.2_0.04_262/0.45)] lg:hidden" />
      )}
      <aside
        ref={ref}
        aria-label={label}
        role={floating && modal ? "dialog" : undefined}
        aria-modal={floating && modal && open ? true : undefined}
        inert={floating && !open ? true : undefined}
        onKeyDown={onKeyDown}
        className={`flex min-h-0 flex-col transition-[transform,visibility,width] duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none ${place}`}
      >
        {children}
      </aside>
    </>
  );
}
