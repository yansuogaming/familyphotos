"use client";

import { Toaster as Sonner, toast as sonner } from "sonner";
import { useSyncExternalStore } from "react";
import { CheckCircle, Info, Warning, WarningCircle } from "@/components/ui/icons";

/**
 * App-wide notifications (Sonner), styled with the "Sổ nhà" tokens.
 * Mounted once in the root layout. Call through `notify` / `useToast()`.
 */
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

export function AppToaster() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return (
    <Sonner
      theme={dark ? "dark" : "light"}
      position="bottom-center"
      // phones: sit above the bottom tab bar
      mobileOffset={{ bottom: 88 }}
      offset={24}
      visibleToasts={3}
      closeButton
      icons={{
        success: <CheckCircle size={20} weight="fill" className="text-ok" />,
        error: <WarningCircle size={20} weight="fill" className="text-danger" />,
        warning: <Warning size={20} weight="fill" className="text-coral-ink" />,
        info: <Info size={20} className="text-ink-2" />,
        loading: <span className="block size-4 animate-spin rounded-full border-2 border-rule border-t-coral" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group flex w-[min(92vw,380px)] items-start gap-3 rounded-[var(--radius-paper)] border border-line bg-paper px-4 py-3.5 text-ink shadow-[0_16px_40px_-16px_hsl(var(--shadow)/0.45)]",
          title: "text-[0.95rem] font-semibold leading-snug",
          description: "mt-0.5 text-sm text-ink-2",
          icon: "mt-0.5 shrink-0",
          success: "border-ok/40",
          error: "border-danger/50 bg-[color-mix(in_oklch,var(--danger)_8%,var(--paper))]",
          warning: "border-coral/50",
          actionButton: "ml-auto shrink-0 rounded-full bg-coral px-3 py-1 text-sm font-semibold text-on-coral",
          cancelButton: "ml-auto shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-ink-2 hover:bg-paper-2",
          closeButton:
            "!left-auto !right-1 !top-1 !translate-x-0 !translate-y-0 flex size-7 items-center justify-center rounded-full !border-0 !bg-transparent !text-ink-3 hover:!bg-paper-2 hover:!text-ink",
        },
      }}
    />
  );
}

type Options = Parameters<typeof sonner>[1];

/** Plain calls pick a tone from the wording: "Đã ..." is success, "Chưa/Không/Lỗi ..." is an error. */
const tone = (message: string) =>
  /^(Chưa|Không|Lỗi|Thất bại|Sai|Bạn không)/i.test(message) ? "error" : /^Đã\b/.test(message) ? "success" : "info";

function notifyBase(message: string, options?: Options) {
  const t = tone(message);
  return t === "error" ? sonner.error(message, options) : t === "success" ? sonner.success(message, options) : sonner(message, options);
}

export const notify = Object.assign(notifyBase, {
  success: (m: string, o?: Options) => sonner.success(m, o),
  error: (m: string, o?: Options) => sonner.error(m, { duration: 6000, ...o }),
  warning: (m: string, o?: Options) => sonner.warning(m, o),
  info: (m: string, o?: Options) => sonner.info(m, o),
  loading: (m: string, o?: Options) => sonner.loading(m, o),
  promise: sonner.promise,
  dismiss: sonner.dismiss,
});

export type Notify = typeof notify;
