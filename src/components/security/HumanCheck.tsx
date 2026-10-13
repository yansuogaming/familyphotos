"use client";

import { ShieldCheck } from "@/components/ui/icons";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/brand/Logo";
import { ApiError } from "@/lib/api/core";
import { publicConfigApi } from "@/lib/api/public-config";
import { securityApi, type HumanPass } from "@/lib/api/security";
import { useApi } from "@/lib/hooks/useApi";
import { Turnstile } from "./Turnstile";

const KEY = "fp-human";
const listeners = new Set<() => void>();

function readPass(): HumanPass | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HumanPass) : null;
  } catch {
    return null;
  }
}

function savePass(p: HumanPass) {
  localStorage.setItem(KEY, JSON.stringify(p));
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** True when the last check is still valid. Re-read on every render, so each page visit re-checks. */
const hasValidPass = () => (readPass()?.validUntil ?? 0) > Date.now();

/**
 * Bot check on page entry. Whatever page the visitor opens, if their last
 * check expired (admin setting, default 20 minutes) this page asks again.
 * The backend must enforce the same thing (cookie from /security/human-check,
 * or Cloudflare WAF challenge); this screen is the visible half of it.
 */
export function HumanCheck() {
  const path = usePathname();
  const config = useApi(publicConfigApi.get);
  // Server render: assume fine and draw nothing; the client decides after hydration.
  const valid = useSyncExternalStore(subscribe, hasValidPass, () => true);
  const enabled = config.status === "ready" && config.data.botCheckEnabled;
  const minutes = config.status === "ready" ? config.data.botCheckMinutes : 20;

  if (!enabled || valid) return null;
  return <CheckScreen key={path} path={path} minutes={minutes} />;
}

function CheckScreen({ path, minutes }: { path: string; minutes: number }) {
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const card = useRef<HTMLDivElement>(null);

  // Keep the page behind still and unreachable while the check is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    card.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function onToken(token: string | null) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      savePass(await securityApi.verifyHuman(token, path));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Chưa xác minh được. Thử lại nhé.");
      setAttempt((n) => n + 1);
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="human-check-title" className="vinyl fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <div className="mb-8 [&_*]:text-on-cover">
        <Logo href="/" />
      </div>
      <div
        ref={card}
        tabIndex={-1}
        className="w-full max-w-md rounded-[var(--radius-paper)] bg-paper p-7 text-ink shadow-[0_24px_60px_-20px_oklch(0_0_0/0.6)] outline-none focus-visible:outline-none sm:p-9"
      >
        <ShieldCheck size={32} weight="fill" className="text-coral-ink" />
        <h1 id="human-check-title" className="mt-4 text-3xl font-bold">Kiểm tra nhanh</h1>
        <p className="mt-2 text-ink-2">
          Xác minh bạn là người thật để vào trang. Lần kiểm tra này có hiệu lực {minutes} phút.
        </p>
        <div className="mt-6">
          <Turnstile key={attempt} action="page" onToken={onToken} />
        </div>
        <p className="mt-3 min-h-5 text-sm" aria-live="polite">
          {busy ? <span className="text-ink-2">Đang mở cửa...</span> : error ? <span className="text-danger">{error}</span> : null}
        </p>
      </div>
    </div>
  );
}
