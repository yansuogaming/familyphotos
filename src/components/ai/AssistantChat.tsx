"use client";

import { Microphone, PaperPlaneRight, Plus, Sparkle, Waveform } from "@/components/ui/icons";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { assistantSuggestions as defaultSuggestions } from "@/lib/api/mock-data";
import { aiApi } from "@/lib/api/ai";
import { publicConfigApi } from "@/lib/api/public-config";
import { useApi } from "@/lib/hooks/useApi";
import type { AssistantMessage } from "@/lib/api/types";

/** Conversation body + composer. Used in the floating panel and the full page. */
export function AssistantChat({ wide = false, context }: { wide?: boolean; context?: string }) {
  const [history, setHistory] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const config = useApi(publicConfigApi.get);
  const access = useApi(aiApi.access);
  const blocked = access.status === "ready" && access.data.mode === "none" ? access.data : null;
  const assistantSuggestions = config.status === "ready" ? config.data.assistantSuggestions : defaultSuggestions;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history, thinking]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    const userMsg: AssistantMessage = { id: crypto.randomUUID(), role: "user", text: q };
    setHistory((h) => [...h, userMsg]);
    setDraft("");
    setThinking(true);
    try {
      const reply = await api.assistant.ask([...history, userMsg], q);
      setHistory((h) => [...h, reply]);
    } catch {
      setHistory((h) => [...h, { id: crypto.randomUUID(), role: "assistant", text: "Mình chưa trả lời được lúc này. Con thử hỏi lại sau một chút nhé." }]);
    } finally {
      setThinking(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  const measure = wide ? "mx-auto w-full max-w-3xl" : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className={`flex flex-col gap-5 ${measure}`}>
          {blocked ? (
            <div className="flex flex-col gap-2 pt-4" role="status">
              <Sparkle size={28} className="text-ink-3" />
              <p className="font-display text-2xl font-semibold">Trợ lý chưa dùng được</p>
              <p className="max-w-[48ch] text-ink-2">{blocked.reason}</p>
              {blocked.canAddOwnKey && (
                <Link href="/settings#ai" className="mt-2 w-fit font-semibold text-coral-ink underline">
                  Thêm API AI của bạn
                </Link>
              )}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col gap-2 pt-4">
              <Sparkle size={28} weight="fill" className="text-coral-ink" />
              <p className="font-display text-2xl font-semibold">Hỏi mình bất cứ điều gì.</p>
              <p className="text-ink-2">
                {context ? `Mình đang xem cùng con: ${context}.` : "Giảng bài, dịch câu, lên kế hoạch hay tìm lại ảnh cũ."}
              </p>
            </div>
          ) : (
            history.map((m) =>
              m.role === "user" ? (
                <p key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-paper-3 px-4 py-2.5">
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className="flex max-w-[60ch] gap-3">
                  <Sparkle size={18} weight="fill" className="mt-1 shrink-0 text-coral-ink" />
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              ),
            )
          )}
          {thinking && (
            <div className="flex items-center gap-3 text-ink-3" aria-live="polite">
              <Sparkle size={18} weight="fill" className="animate-pulse text-coral-ink" />
              <span className="h-3 w-40 animate-pulse rounded-full bg-paper-3" />
              <span className="sr-only">Trợ lý đang trả lời</span>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>

      <div className="border-t border-line px-4 pb-4 pt-3">
        <div className={measure}>
          {history.length === 0 && !blocked && (
            <div className="mb-3 flex flex-wrap gap-2">
              {assistantSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-line px-3.5 py-1.5 text-left text-sm text-ink-2 transition-colors hover:border-coral hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={onSubmit} className="flex items-center gap-1 rounded-full border border-line bg-paper py-1 pl-1 pr-1 transition-[border-color,box-shadow] focus-within:border-coral focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_22%,transparent)]">
            <button type="button" aria-label="Đính kèm ảnh hoặc tệp" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink">
              <Plus size={20} />
            </button>
            <label htmlFor="assistant-input" className="sr-only">Câu hỏi cho trợ lý</label>
            <input
              id="assistant-input"
              disabled={!!blocked}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Hỏi bất cứ điều gì..."
              autoComplete="off"
              className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[0.95rem] outline-none placeholder:text-ink-3"
            />
            <button type="button" aria-label="Trò chuyện bằng giọng nói" className="hidden size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink sm:inline-flex">
              <Waveform size={20} />
            </button>
            <button type="button" aria-label="Nhập bằng giọng nói" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink">
              <Microphone size={20} />
            </button>
            <button
              type="submit"
              aria-label="Gửi"
              disabled={!draft.trim() || thinking || !!blocked}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-coral text-on-coral transition-[opacity,transform] active:scale-95 disabled:opacity-40"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
