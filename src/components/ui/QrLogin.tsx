"use client";

import { ArrowClockwise, CheckCircle, DeviceMobileCamera } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, isMock } from "@/lib/api/client";
import { session as sessionStore } from "@/lib/session";
import type { QrLoginSession, QrLoginState } from "@/lib/api/types";

type View =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "live"; session: QrLoginSession; state: QrLoginState };

/** Web shows a QR; a member signed in on their phone scans it to sign this browser in. */
export function QrLogin({ compact = false, redirectTo = "/photos" }: { compact?: boolean; redirectTo?: string }) {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [secondsLeft, setSecondsLeft] = useState(60);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    api.auth.createQrSession().then(
      (session) => {
        if (!alive) return;
        setSecondsLeft(Math.max(0, Math.round((Date.parse(session.expiresAt) - Date.now()) / 1000)));
        setView({ kind: "live", session, state: { status: "pending" } });
      },
      () => alive && setView({ kind: "error" }),
    );
    return () => {
      alive = false;
    };
  }, [attempt]);

  const start = useCallback(() => {
    setView({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const sessionId = view.kind === "live" ? view.session.id : null;
  const expiresAt = view.kind === "live" ? view.session.expiresAt : null;
  const status = view.kind === "live" ? view.state.status : null;

  // Poll the session state every 1.5s while it can still change.
  useEffect(() => {
    if (!sessionId || !expiresAt || status === "expired" || status === "confirmed") return;
    let cancelled = false;
    timer.current = setInterval(async () => {
      setSecondsLeft(Math.max(0, Math.round((Date.parse(expiresAt) - Date.now()) / 1000)));
      try {
        const state = await api.auth.getQrState(sessionId);
        if (cancelled) return;
        setView((v) => (v.kind === "live" ? { ...v, state } : v));
        if (state.status === "confirmed" && state.session) {
          sessionStore.set(state.session);
          setTimeout(() => router.push(redirectTo), 900);
        }
      } catch {
        /* keep polling; transient network errors are expected on phones */
      }
    }, 1500);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [sessionId, expiresAt, status, router, redirectTo]);

  const size = compact ? 112 : 196;
  const expired = status === "expired";

  return (
    <div className={compact ? "flex items-center gap-4" : "flex flex-col items-center gap-6 text-center"}>
      <div
        className="relative shrink-0 rounded-[var(--radius-paper)] border border-line bg-white p-3 paper-shadow"
        style={{ width: size + 24, height: size + 24 }}
      >
        {view.kind === "loading" && <div className="size-full animate-pulse rounded-sm bg-[oklch(0.93_0.01_270)]" />}
        {view.kind === "error" && (
          <button onClick={start} className="flex size-full flex-col items-center justify-center gap-1 text-xs font-semibold text-[oklch(0.3_0.05_265)]">
            <ArrowClockwise size={22} /> Thử lại
          </button>
        )}
        {view.kind === "live" && (
          <>
            <QRCodeSVG
              value={view.session.code}
              size={size}
              fgColor="#1d2541"
              bgColor="#ffffff"
              level="M"
              className={`transition-[filter,opacity] duration-300 ${expired || status !== "pending" ? "opacity-25 blur-[3px]" : ""}`}
            />
            {expired && (
              <button
                onClick={start}
                className="absolute inset-0 m-auto flex h-10 w-fit items-center gap-1.5 rounded-full bg-[#1d2541] px-4 text-sm font-semibold text-white"
              >
                <ArrowClockwise size={16} /> Tạo mã mới
              </button>
            )}
            {(status === "scanned" || status === "confirmed") && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle size={compact ? 40 : 56} weight="fill" className="text-[oklch(0.6_0.15_38)]" />
              </div>
            )}
          </>
        )}
      </div>

      <div className={compact ? "min-w-0" : "max-w-xs"} aria-live="polite">
        {status === "scanned" && view.kind === "live" ? (
          <>
            <p className="font-semibold text-ink">{view.state.approver?.name} đã quét mã</p>
            <p className="text-sm text-ink-2">Bấm xác nhận trên điện thoại để vào nhà.</p>
          </>
        ) : status === "confirmed" ? (
          <>
            <p className="font-semibold text-ink">Đã xác nhận</p>
            <p className="text-sm text-ink-2">Đang mở cửa...</p>
          </>
        ) : expired ? (
          <>
            <p className="font-semibold text-ink">Mã đã hết hạn</p>
            <p className="text-sm text-ink-2">Mỗi mã chỉ dùng được ít phút để giữ nhà an toàn.</p>
          </>
        ) : view.kind === "error" ? (
          <>
            <p className="font-semibold text-ink">Chưa tạo được mã</p>
            <p className="text-sm text-ink-2">Kiểm tra mạng rồi bấm Thử lại.</p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 font-semibold text-ink">
              <DeviceMobileCamera size={20} className="shrink-0 text-coral-ink" />
              Quét bằng điện thoại để vào
            </p>
            <p className="text-sm text-ink-2">
              Mở Family Photos trên điện thoại, chọn <span className="font-semibold text-ink">Quét mã</span>.
              {view.kind === "live" && <span className="tabular"> Còn {secondsLeft} giây.</span>}
            </p>
            {isMock && !compact && view.kind === "live" && (
              <button
                onClick={() => api.auth.simulateScan(view.session.id)}
                className="mt-3 text-sm font-semibold text-coral-ink underline decoration-dotted"
              >
                Demo: giả lập điện thoại quét
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
