"use client";

import { ArrowClockwise, Bell, BellSlash, Check, Pause, Play, SkipForward } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export type Phase = "focus" | "break" | "long";
const durations: Record<Phase, number> = { focus: 25 * 60, break: 5 * 60, long: 15 * 60 };
const phaseLabel: Record<Phase, string> = { focus: "Học", break: "Nghỉ ngắn", long: "Nghỉ dài" };

type State = { phase: Phase; running: boolean; endAt: number; remaining: number; cycles: number; finished: Phase | null };

export const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // no audio, the banner is enough
  }
}

function notify(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch {
      // some mobile browsers only allow notifications from a service worker
    }
  }
}

/** Study timer state. Lives in ToolsScreen so it keeps running while other tools are open. */
export function usePomodoro() {
  const [s, setS] = useState<State>({ phase: "focus", running: false, endAt: 0, remaining: durations.focus, cycles: 0, finished: null });
  const [now, setNow] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  const left = s.running ? Math.max(0, Math.ceil((s.endAt - now) / 1000)) : s.remaining;

  const completeRef = useRef<() => void>(() => {});
  useEffect(() => {
    completeRef.current = () => {
      const wasFocus = s.phase === "focus";
      const cycles = wasFocus ? s.cycles + 1 : s.cycles;
      const next: Phase = wasFocus ? (cycles % 4 === 0 ? "long" : "break") : "focus";
      beep();
      notify(
        wasFocus ? "Hết giờ học rồi" : "Hết giờ nghỉ",
        wasFocus ? `Con đã học xong ${cycles} lượt. Nghỉ ${durations[next] / 60} phút nhé.` : "Quay lại học tiếp 25 phút nào.",
      );
      setS({ phase: next, running: false, endAt: 0, remaining: durations[next], cycles, finished: s.phase });
    };
  });

  useEffect(() => {
    if (!s.running) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= s.endAt) completeRef.current();
    };
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [s.running, s.endAt]);

  useEffect(() => {
    if (!s.running) return;
    const original = document.title;
    document.title = `${mmss(left)} ${phaseLabel[s.phase]}`;
    return () => {
      document.title = original;
    };
  }, [s.running, left, s.phase]);

  return {
    phase: s.phase,
    running: s.running,
    left,
    total: durations[s.phase],
    cycles: s.cycles,
    finished: s.finished,
    permission,
    start() {
      if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().then(setPermission, () => {});
      const t = Date.now();
      setNow(t);
      setS((p) => ({ ...p, running: true, endAt: t + p.remaining * 1000, finished: null }));
    },
    pause() {
      const t = Date.now();
      setS((p) => ({ ...p, running: false, remaining: Math.max(0, Math.ceil((p.endAt - t) / 1000)) }));
    },
    reset() {
      setS((p) => ({ ...p, running: false, remaining: durations[p.phase], finished: null }));
    },
    choose(phase: Phase) {
      setS((p) => ({ ...p, phase, running: false, remaining: durations[phase], finished: null }));
    },
    skip() {
      completeRef.current();
    },
    askPermission() {
      if (typeof Notification !== "undefined") Notification.requestPermission().then(setPermission, () => {});
    },
  };
}

export type PomodoroState = ReturnType<typeof usePomodoro>;

export function Pomodoro({ p }: { p: PomodoroState }) {
  const pct = 1 - p.left / p.total;
  const doneInRound = p.cycles % 4;

  return (
    <div className="max-w-xl">
      <div role="group" aria-label="Chọn lượt" className="flex flex-wrap gap-1">
        {(Object.keys(durations) as Phase[]).map((ph) => (
          <button
            key={ph}
            type="button"
            aria-pressed={p.phase === ph}
            onClick={() => p.choose(ph)}
            disabled={p.running}
            className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${p.phase === ph ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"}`}
          >
            {phaseLabel[ph]} {durations[ph] / 60} phút
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {p.finished && (
          <p role="alert" className="mt-5 rounded-[var(--radius-paper)] border border-coral bg-coral-wash px-4 py-3 font-semibold">
            {p.finished === "focus" ? `Hết giờ học rồi! Nghỉ ${p.total / 60} phút cho mắt nghỉ nhé.` : "Hết giờ nghỉ. Quay lại học tiếp nào."}
          </p>
        )}
      </div>

      <div className="oli mt-6 rounded-[var(--radius-paper)] border border-line px-6 py-8 text-center">
        <p className="text-sm font-semibold text-ink-2">{p.running ? `Đang ${p.phase === "focus" ? "học" : "nghỉ"}` : p.left === p.total ? "Sẵn sàng" : "Đang tạm dừng"}</p>
        <p className="tabular mt-1 font-display text-7xl font-bold sm:text-8xl" role="timer" aria-label={`Còn ${Math.floor(p.left / 60)} phút ${p.left % 60} giây`}>
          {mmss(p.left)}
        </p>
        <div className="mx-auto mt-5 h-2 max-w-sm overflow-hidden rounded-full bg-paper-3" aria-hidden="true">
          <div className="h-full rounded-full bg-coral transition-[width] duration-300 ease-linear" style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {p.running ? (
            <Button size="lg" onClick={p.pause}>
              <Pause size={18} weight="fill" /> Tạm dừng
            </Button>
          ) : (
            <Button size="lg" onClick={p.start}>
              <Play size={18} weight="fill" /> {p.left === p.total ? (p.phase === "focus" ? "Bắt đầu học" : "Bắt đầu nghỉ") : "Tiếp tục"}
            </Button>
          )}
          <Button size="lg" variant="secondary" onClick={p.reset}>
            <ArrowClockwise size={18} /> Đặt lại
          </Button>
          <Button size="lg" variant="ghost" onClick={p.skip}>
            <SkipForward size={18} /> Bỏ qua
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1" role="img" aria-label={`Đã học ${doneInRound} trên 4 lượt của vòng này`}>
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="flex size-8 items-center justify-center border border-rule bg-paper">
                {i < doneInRound && <Check size={20} weight="bold" className="text-coral-ink" />}
              </span>
            ))}
          </div>
          <p className="tabular text-sm text-ink-2">
            <span className="font-semibold text-ink">{p.cycles}</span> lượt học hôm nay. Sau 4 lượt được nghỉ dài.
          </p>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-sm text-ink-2">
        {p.permission === "granted" ? (
          <>
            <Bell size={18} className="text-coral-ink" /> Hết giờ sẽ có thông báo và tiếng chuông.
          </>
        ) : p.permission === "denied" || p.permission === "unsupported" ? (
          <>
            <BellSlash size={18} /> Trình duyệt đang chặn thông báo. Hết giờ sẽ có tiếng chuông và dòng nhắc ở trên.
          </>
        ) : (
          <>
            <Bell size={18} /> Hết giờ sẽ có tiếng chuông.
            <button type="button" onClick={p.askPermission} className="h-10 font-semibold text-coral-ink underline">
              Bật thông báo
            </button>
          </>
        )}
      </p>
    </div>
  );
}
