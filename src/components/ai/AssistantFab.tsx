"use client";

import { ArrowsOut, ChatCircleDots, Plus, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AssistantChat } from "./AssistantChat";

const ease = [0.16, 1, 0.3, 1] as const;

/** Bottom-right assistant, present on every app screen except the full assistant page. */
export function AssistantFab() {
  const path = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [context, setContext] = useState<string | undefined>();

  // Any page can open the assistant with a topic:
  // window.dispatchEvent(new CustomEvent("fp:assistant-open", { detail: { context: "Bài 1..." } }))
  useEffect(() => {
    const onOpen = (e: Event) => {
      const ctx = (e as CustomEvent<{ context?: string }>).detail?.context;
      setContext(ctx);
      setSession((s) => s + 1);
      setOpen(true);
    };
    window.addEventListener("fp:assistant-open", onOpen);
    return () => window.removeEventListener("fp:assistant-open", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (path.startsWith("/tro-ly")) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-label="Trợ lý AI"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col border-l border-line bg-paper shadow-[-24px_0_48px_-24px_hsl(var(--shadow)/0.35)] md:inset-x-auto md:right-0 md:w-[440px]"
          >
            <div className="flex h-14 items-center gap-1 border-b border-line pl-5 pr-2">
              <p className="mr-auto font-display text-lg font-semibold">Trợ lý AI</p>
              <button onClick={() => { setContext(undefined); setSession((s) => s + 1); }} aria-label="Cuộc trò chuyện mới" title="Cuộc trò chuyện mới" className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink">
                <Plus size={20} />
              </button>
              <Link href="/tro-ly" onClick={() => setOpen(false)} aria-label="Mở toàn trang" title="Mở toàn trang" className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink">
                <ArrowsOut size={20} />
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Đóng" title="Đóng" className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <AssistantChat key={session} context={context} />
          </motion.aside>
        )}
      </AnimatePresence>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-label="Mở trợ lý AI"
          className={`fixed right-4 z-40 ${path.startsWith("/chat") ? "bottom-36 md:bottom-28" : "bottom-20 md:bottom-6"} flex size-14 items-center justify-center rounded-full bg-coral text-on-coral shadow-[0_10px_28px_-10px_var(--coral)] transition-[transform,background-color] duration-300 ease-[var(--ease-out-expo)] hover:bg-coral-strong active:scale-95 md:right-6`}
        >
          <ChatCircleDots size={26} weight="fill" />
        </button>
      )}
    </>
  );
}
