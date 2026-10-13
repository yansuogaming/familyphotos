"use client";

import { ArrowClockwise } from "@/components/ui/icons";
import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget.
 * Needs NEXT_PUBLIC_TURNSTILE_SITE_KEY. Without it nothing renders (see useCaptcha);
 * the backend still decides whether a request needs a valid token.
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

/** Whether a Turnstile site key is configured. */
export const captchaAvailable = !!SITE_KEY;

export type CaptchaAction = "login" | "register" | "admin-login" | "page";

export function Turnstile({ action, onToken }: { action: CaptchaAction; onToken: (token: string | null) => void }) {
  return SITE_KEY ? <CloudflareWidget siteKey={SITE_KEY} action={action} onToken={onToken} /> : null;
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
