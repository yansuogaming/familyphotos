"use client";

import type { ReactNode } from "react";
import { notify, type Notify } from "@/components/ui/Toaster";

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
/**
 * Sub-block inside a section. Same rhythm everywhere: title and description on the
 * left, one action on the right (vertically centred on the text), content below.
 */
export function Block({
  id,
  title,
  description,
  aside,
  children,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 py-6 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-[60ch]">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/**
 * Notifications go through Sonner (see components/ui/Toaster). `useToast()` keeps the
 * old call style: `toast("Đã lưu")`, plus `toast.success / error / warning / info / promise`.
 */
export const useToast = (): Notify => notify;

/** Kept so existing screens compile; the single <AppToaster /> lives in the root layout. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const formatBytes = (n: number) =>
  n >= 1024 ** 3
    ? `${(n / 1024 ** 3).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} GB`
    : `${Math.round(n / 1024 ** 2).toLocaleString("vi-VN")} MB`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
