"use client";

import { X } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { buttonClass } from "@/components/ui/Button";

/** Input look shared by dialogs: own focus ring since the global outline is off for inputs. */
export const inputClass =
  "h-12 w-full rounded-[var(--radius-paper)] border border-line bg-paper px-4 text-base text-ink placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] hover:border-ink-3 focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_25%,transparent)] aria-[invalid=true]:border-danger";

export const dangerButton = (size: "sm" | "md" = "md") => buttonClass("primary", size, "bg-danger! text-paper! shadow-none! hover:opacity-90");

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Only the top-most modal reacts to Esc and Tab.
const stack: symbol[] = [];

export const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/**
 * Modal behaviour for a container: focus moves in (to [data-autofocus] or the first
 * control), Tab stays inside, Esc closes, page scroll locks, focus returns on close.
 */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const id = Symbol("modal");
    stack.push(id);
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const target = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE) ?? el;
    target?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (stack.at(-1) !== id || !el) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (items.length === 0) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(id), 1);
      if (stack.length === 0) document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref]);
}

export function Portal({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  return mounted ? createPortal(children, document.body) : null;
}

type Size = "sm" | "md" | "lg";
const widths: Record<Size, string> = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

/** Paper dialog. Centered on larger screens, a bottom sheet on phones. */
export function Dialog({
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
  children: ReactNode;
  footer?: ReactNode;
  size?: Size;
}) {
  return (
    <Portal>
      <AnimatePresence>{open && <Panel {...{ onClose, title, description, footer, size }}>{children}</Panel>}</AnimatePresence>
    </Portal>
  );
}

function Panel({
  onClose,
  title,
  description,
  children,
  footer,
  size,
}: {
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size: Size;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduce = useReducedMotion();
  useModal(ref, onClose);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[hsl(var(--shadow)/0.5)] sm:items-center sm:p-6"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        tabIndex={-1}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-[14px] border border-line bg-paper text-ink paper-shadow outline-none sm:rounded-[var(--radius-paper)] ${widths[size]}`}
      >
        <div className="flex items-start gap-3 px-5 pb-2 pt-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-t`} className="text-xl font-bold">{title}</h2>
            {description && <p id={`${id}-d`} className="mt-1 text-sm text-ink-2">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Đóng" className="-mr-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}

/** Yes/no question before something that cannot be undone. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  busy?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className={buttonClass("ghost")} onClick={onClose} data-autofocus>Thôi</button>
          <button className={dangerButton()} onClick={onConfirm} disabled={busy}>{busy ? "Đang làm..." : confirmLabel}</button>
        </>
      }
    >
      <p className="text-ink-2">{description}</p>
    </Dialog>
  );
}
