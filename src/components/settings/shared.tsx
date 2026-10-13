"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export function Section({
  id,
  title,
  description,
  children,
  tone = "default",
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line py-10 first:border-t-0 first:pt-0">
      <h2 id={`${id}-h`} className={`text-2xl font-bold ${tone === "danger" ? "text-danger" : ""}`}>{title}</h2>
      {description && <p className="mt-1.5 max-w-[60ch] text-ink-2">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Sub-block inside a section: small heading, content below. */
export function Block({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="py-5 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const show = useCallback((text: string) => {
    const id = Date.now();
    setMsg({ id, text });
    setTimeout(() => setMsg((m) => (m?.id === id ? null : m)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center md:bottom-8">
        <AnimatePresence>
          {msg && (
            <motion.p
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-[0_12px_32px_-12px_hsl(var(--shadow)/0.5)]"
            >
              <CheckCircle size={18} weight="fill" className="text-coral" /> {msg.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const formatBytes = (n: number) =>
  n >= 1024 ** 3
    ? `${(n / 1024 ** 3).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} GB`
    : `${Math.round(n / 1024 ** 2).toLocaleString("vi-VN")} MB`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
