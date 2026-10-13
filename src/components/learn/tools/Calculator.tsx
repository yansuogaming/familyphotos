"use client";

import { Backspace } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { evaluate, viNum } from "./math-utils";

type Key = { label: string; insert?: string; action?: "clear" | "back" | "equals"; tone?: "fn" | "num" | "op" | "eq"; aria?: string };

const keys: Key[] = [
  { label: "sin", insert: "sin(", tone: "fn" },
  { label: "cos", insert: "cos(", tone: "fn" },
  { label: "tan", insert: "tan(", tone: "fn" },
  { label: "ln", insert: "ln(", tone: "fn" },
  { label: "log", insert: "log(", tone: "fn" },
  { label: "√", insert: "√(", tone: "fn", aria: "Căn bậc hai" },
  { label: "x²", insert: "^2", tone: "fn", aria: "Bình phương" },
  { label: "xʸ", insert: "^", tone: "fn", aria: "Luỹ thừa" },
  { label: "(", insert: "(", tone: "fn" },
  { label: ")", insert: ")", tone: "fn" },
  { label: "7", insert: "7", tone: "num" },
  { label: "8", insert: "8", tone: "num" },
  { label: "9", insert: "9", tone: "num" },
  { label: "÷", insert: "÷", tone: "op", aria: "Chia" },
  { label: "⌫", action: "back", tone: "op", aria: "Xoá một kí tự" },
  { label: "4", insert: "4", tone: "num" },
  { label: "5", insert: "5", tone: "num" },
  { label: "6", insert: "6", tone: "num" },
  { label: "×", insert: "×", tone: "op", aria: "Nhân" },
  { label: "AC", action: "clear", tone: "op", aria: "Xoá hết" },
  { label: "1", insert: "1", tone: "num" },
  { label: "2", insert: "2", tone: "num" },
  { label: "3", insert: "3", tone: "num" },
  { label: "−", insert: "-", tone: "op", aria: "Trừ" },
  { label: "π", insert: "π", tone: "fn", aria: "Số pi" },
  { label: "0", insert: "0", tone: "num" },
  { label: ",", insert: ",", tone: "num", aria: "Dấu phẩy" },
  { label: "Ans", insert: "Ans", tone: "fn", aria: "Kết quả trước" },
  { label: "+", insert: "+", tone: "op", aria: "Cộng" },
  { label: "=", action: "equals", tone: "eq", aria: "Bằng" },
];

const toneClass: Record<NonNullable<Key["tone"]>, string> = {
  fn: "bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink text-sm",
  num: "bg-paper text-ink border border-line hover:border-ink-3 text-lg",
  op: "bg-paper-3 text-ink hover:bg-rule/60 text-lg",
  eq: "bg-coral text-on-coral hover:bg-coral-strong text-xl",
};

export function Calculator() {
  const [exprText, setExprText] = useState("");
  const [deg, setDeg] = useState(true);
  const [ans, setAns] = useState(0);
  const [history, setHistory] = useState<{ e: string; r: number }[]>([]);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  let preview: string | null = null;
  try {
    preview = exprText.trim() ? viNum(evaluate(exprText, { deg, ans })) : null;
  } catch {
    preview = null;
  }

  function insert(s: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? exprText.length;
    const end = el?.selectionEnd ?? exprText.length;
    const next = exprText.slice(0, start) + s + exprText.slice(end);
    setExprText(next);
    setError(undefined);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + s.length, start + s.length);
    });
  }

  function equals() {
    if (!exprText.trim()) return;
    try {
      const r = evaluate(exprText, { deg, ans });
      setHistory((h) => [{ e: exprText, r }, ...h].slice(0, 6));
      setAns(r);
      setExprText(viNum(r).replace(/\./g, ""));
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Phép tính viết sai");
    }
  }

  function press(k: Key) {
    if (k.action === "clear") {
      setExprText("");
      setError(undefined);
      inputRef.current?.focus();
    } else if (k.action === "back") {
      setExprText((t) => t.slice(0, -1));
      setError(undefined);
    } else if (k.action === "equals") equals();
    else if (k.insert) insert(k.insert);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="w-full max-w-[420px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            equals();
          }}
          className="rounded-[var(--radius-paper)] border border-line bg-paper-2 p-4"
        >
          <div className="flex items-center justify-between">
            <label htmlFor="calc-input" className="text-sm font-semibold text-ink-2">
              Phép tính
            </label>
            <div role="group" aria-label="Đơn vị góc" className="inline-flex rounded-full border border-line bg-paper p-0.5 text-xs font-semibold">
              {[true, false].map((d) => (
                <button key={String(d)} type="button" aria-pressed={deg === d} onClick={() => setDeg(d)} className={`h-8 rounded-full px-3 ${deg === d ? "bg-ink text-paper" : "text-ink-2"}`}>
                  {d ? "Độ" : "Radian"}
                </button>
              ))}
            </div>
          </div>
          <input
            id="calc-input"
            ref={inputRef}
            value={exprText}
            onChange={(e) => {
              setExprText(e.target.value);
              setError(undefined);
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="Ví dụ: 2√(16) + 3^2"
            aria-describedby="calc-out"
            className="tabular mt-2 h-12 w-full bg-transparent text-right font-display text-2xl outline-none placeholder:text-base placeholder:text-ink-3"
          />
          <p id="calc-out" aria-live="polite" className={`tabular min-h-10 text-right text-3xl font-semibold ${error ? "text-base font-normal text-danger" : "text-ink"}`}>
            {error ?? (preview !== null ? `= ${preview}` : "")}
          </p>
        </form>

        <div className="mt-3 grid grid-cols-5 gap-2">
          {keys.map((k) => (
            <button
              key={k.label}
              type="button"
              aria-label={k.aria ?? k.label}
              onClick={() => press(k)}
              className={`tabular flex h-12 items-center justify-center rounded-[var(--radius-paper)] font-semibold transition-colors active:scale-[0.97] ${toneClass[k.tone ?? "num"]}`}
            >
              {k.action === "back" ? <Backspace size={20} /> : k.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-3">Gõ bằng bàn phím cũng được. Enter để tính.</p>
      </div>

      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold">Vừa tính</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Các phép tính con bấm bằng sẽ hiện ở đây. Bấm vào một dòng để dùng lại.</p>
        ) : (
          <ul className="memo-lines mt-2">
            {history.map((h, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    setExprText(h.e);
                    inputRef.current?.focus();
                  }}
                  className="tabular flex h-12 w-full items-center justify-between gap-4 px-1 text-left hover:text-coral-ink"
                >
                  <span className="truncate font-hand text-lg text-ink-2">{h.e}</span>
                  <span className="shrink-0 font-semibold">= {viNum(h.r)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
