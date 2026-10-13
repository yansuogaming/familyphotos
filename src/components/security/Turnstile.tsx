"use client";

import { ArrowClockwise, CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget.
 * - With NEXT_PUBLIC_TURNSTILE_SITE_KEY set: the real widget (explicit render).
 *   Cloudflare's always-pass test key for local work: 1x00000000000000000000AA
 * - Without it: a demo stand-in with the same contract, so the mock app still works.
 * Tokens are single-use: remount the widget (change its `key`) after every submit attempt.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<TurnstileApi> | null = null;
function loadTurnstile() {
  loader ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    s.onerror = () => {
      loader = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

export type CaptchaAction = "login" | "register" | "admin-login" | "page";

export function Turnstile({ action, onToken }: { action: CaptchaAction; onToken: (token: string | null) => void }) {
  return SITE_KEY ? <CloudflareWidget siteKey={SITE_KEY} action={action} onToken={onToken} /> : <DemoWidget onToken={onToken} />;
}

function CloudflareWidget({ siteKey, action, onToken }: { siteKey: string; action: CaptchaAction; onToken: (t: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    let alive = true;
    let id: string | undefined;
    loadTurnstile().then(
      (ts) => {
        if (!alive || !box.current) return;
        id = ts.render(box.current, {
          sitekey: siteKey,
          action,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
          language: "vi",
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(null),
          "error-callback": () => {
            cb.current(null);
            setFailed(true);
          },
        });
      },
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
      if (id) window.turnstile?.remove(id);
    };
  }, [siteKey, action, attempt]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={box} className="min-h-[65px]" />
      {failed && (
        <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-danger">
          Chưa tải được bước xác minh. Kiểm tra mạng rồi thử lại.
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
            className="inline-flex items-center gap-1 font-semibold underline"
          >
            <ArrowClockwise size={14} /> Thử lại
          </button>
        </p>
      )}
    </div>
  );
}

/** Same shape and behaviour as the real widget, clearly marked as a demo. */
function DemoWidget({ onToken }: { onToken: (t: string | null) => void }) {
  const [state, setState] = useState<"idle" | "checking" | "ok">("idle");

  function check() {
    if (state !== "idle") return;
    setState("checking");
    setTimeout(() => {
      setState("ok");
      onToken(`demo-turnstile-${Date.now()}`);
    }, 900);
  }

  return (
    <div className="flex h-[65px] w-full max-w-[300px] items-center gap-3 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={state === "ok"}
        aria-label="Xác minh bạn là người thật"
        onClick={check}
        disabled={state !== "idle"}
        className={`flex size-7 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors ${
          state === "ok" ? "border-ok bg-paper" : "border-ink-3 bg-paper hover:border-coral"
        }`}
      >
        {state === "checking" && <span className="size-4 animate-spin rounded-full border-2 border-rule border-t-coral" />}
        {state === "ok" && <CheckCircle size={22} weight="fill" className="text-ok" />}
      </button>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-semibold text-ink">{state === "ok" ? "Đã xác minh" : state === "checking" ? "Đang xác minh..." : "Tôi là người thật"}</span>
        <span className="block truncate text-xs text-ink-3">Bản demo. Có site key sẽ dùng Cloudflare.</span>
      </span>
      <ShieldCheck size={22} className="shrink-0 text-ink-3" aria-hidden="true" />
    </div>
  );
}
