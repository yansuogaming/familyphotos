"use client";

import { ArrowBendUpLeft, DownloadSimple, FilePdf, FileText, MapPin, Smiley } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState, type MouseEvent, type ReactNode } from "react";
import type { ChatMessage } from "@/lib/api/chat-ext-types";
import { QUICK_REACTIONS } from "./emoji";
import { StaticMap } from "./StaticMap";

const time = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

export const fileSize = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024)).toLocaleString("vi-VN")} KB` : `${(n / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

/** Wraps matches of `query` (accent-insensitive) in <mark>. */
export function highlight(text: string, query: string, strong: boolean, mine: boolean): ReactNode {
  const q = fold(query.trim());
  if (!q) return text;
  const hay = fold(text);
  const out: ReactNode[] = [];
  let i = 0;
  let at = hay.indexOf(q);
  while (at !== -1) {
    if (at > i) out.push(text.slice(i, at));
    out.push(
      <mark key={at} className={`rounded-sm px-0.5 ${strong ? "bg-ink text-paper" : mine ? "bg-paper/70 text-ink" : "bg-coral-wash text-ink"}`}>
        {text.slice(at, at + q.length)}
      </mark>,
    );
    i = at + q.length;
    at = hay.indexOf(q, i);
  }
  out.push(text.slice(i));
  return out;
}

export const matches = (text: string | undefined, query: string) => !!text && !!query.trim() && fold(text).includes(fold(query.trim()));

const kindLabel = { image: "Ảnh", file: "Tệp", location: "Vị trí" } as const;

export function ChatBubble({
  message,
  mine,
  myId,
  senderName,
  showName = true,
  nameOf,
  onReply,
  onReact,
  onOpenImage,
  onJumpTo,
  query = "",
  currentHit = false,
  status,
}: {
  message: ChatMessage;
  mine: boolean;
  myId: string;
  senderName?: string;
  showName?: boolean;
  nameOf: (id: string) => string;
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  onOpenImage?: (attachmentIndex: number) => void;
  onJumpTo?: (id: string) => void;
  query?: string;
  currentHit?: boolean;
  status?: string;
}) {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [picking, setPicking] = useState(false);
  const atts = message.attachments ?? [];
  const images = atts.map((a, i) => ({ a, i })).filter((x) => x.a.kind === "image");
  const others = atts.filter((a) => a.kind !== "image");
  const wide = images.length > 0 || atts.some((a) => a.kind === "location");

  function onBubbleClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    setRevealed((r) => !r);
  }

  return (
    <div id={`msg-${message.id}`} className={`group/msg flex scroll-mt-24 flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
      {!mine && showName && senderName && <span className="px-3 text-xs font-semibold text-ink-3">{senderName}</span>}

      <div className={`flex max-w-full items-center gap-1 ${mine ? "flex-row-reverse" : ""}`}>
        <div
          onClick={onBubbleClick}
          className={`min-w-0 overflow-hidden rounded-2xl transition-shadow ${wide ? "w-72 max-w-[78vw]" : "max-w-[min(26rem,78vw)]"} ${
            mine ? "rounded-br-md bg-coral text-on-coral" : "rounded-bl-md border border-line bg-paper-2 text-ink"
          } ${currentHit ? "shadow-[0_0_0_3px_var(--ink)]" : ""}`}
        >
          {message.replyTo && (
            <button
              type="button"
              onClick={() => onJumpTo?.(message.replyTo!.id)}
              className={`mx-1.5 mt-1.5 block w-[calc(100%-0.75rem)] rounded-xl px-3 py-1.5 text-left ${mine ? "bg-paper/35" : "bg-paper-3"}`}
              aria-label={`Trả lời ${nameOf(message.replyTo.senderId)}: ${message.replyTo.text ?? kindLabel[message.replyTo.kind ?? "image"]}. Bấm để xem tin gốc.`}
            >
              <span className="flex items-center gap-1 text-xs font-semibold opacity-80">
                <ArrowBendUpLeft size={12} weight="bold" /> {nameOf(message.replyTo.senderId)}
              </span>
              <span className="block truncate text-sm opacity-90">{message.replyTo.text || kindLabel[message.replyTo.kind ?? "image"]}</span>
            </button>
          )}

          {images.length > 0 && (
            <div className={`grid gap-0.5 ${images.length > 1 ? "grid-cols-2" : ""} ${message.replyTo ? "mt-1.5" : ""}`}>
              {images.map(({ a, i }) =>
                a.kind === "image" ? (
                  <button key={i} type="button" onClick={() => onOpenImage?.(i)} aria-label="Xem ảnh lớn" className="block cursor-zoom-in focus-visible:outline-offset-[-3px]">
                    <motion.span
                      layoutId={reduce ? undefined : `chat-${message.id}-${i}`}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="relative block overflow-hidden bg-paper-3"
                      style={{ aspectRatio: images.length > 1 ? "1 / 1" : `${a.width} / ${a.height}` }}
                    >
                      <Image src={a.url} alt="" fill sizes="288px" unoptimized={a.url.startsWith("blob:")} className="object-cover" />
                    </motion.span>
                  </button>
                ) : null,
              )}
            </div>
          )}

          {others.map((a, k) =>
            a.kind === "file" ? (
              <a
                key={k}
                href={a.url}
                download={a.name}
                className={`m-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 ${mine ? "bg-paper/35 hover:bg-paper/50" : "bg-paper hover:bg-paper-3"}`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${mine ? "bg-paper/60 text-ink" : "bg-coral-wash text-coral-ink"}`}>
                  {/\.pdf$/i.test(a.name) ? <FilePdf size={22} /> : <FileText size={22} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{a.name}</span>
                  <span className="tabular text-xs opacity-80">{fileSize(a.size)}</span>
                </span>
                <DownloadSimple size={18} className="shrink-0 opacity-80" aria-label="Tải về" />
              </a>
            ) : a.kind === "location" ? (
              <div key={k}>
                <StaticMap lat={a.lat} lng={a.lng} className="h-32 w-full" />
                <div className="flex items-center gap-2 px-3 py-2">
                  <MapPin size={18} weight="fill" className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{a.label}</span>
                    <span className="tabular block text-xs opacity-80">{a.lat.toFixed(4)}, {a.lng.toFixed(4)}</span>
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold underline-offset-2 hover:underline ${mine ? "bg-paper/40" : "bg-paper"}`}
                  >
                    Mở bản đồ
                  </a>
                </div>
              </div>
            ) : null,
          )}

          {message.text && <p className="whitespace-pre-wrap break-words px-4 py-2.5 text-[0.95rem] leading-relaxed">{highlight(message.text, query, currentHit, mine)}</p>}
        </div>

        {(onReply || onReact) && (
          <div
            className={`relative flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover/msg:opacity-100 ${revealed || picking ? "opacity-100" : ""}`}
          >
            {onReact && (
              <button
                type="button"
                onClick={() => setPicking((p) => !p)}
                aria-expanded={picking}
                aria-label="Thả cảm xúc"
                title="Thả cảm xúc"
                className="inline-flex size-10 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"
              >
                <Smiley size={20} />
              </button>
            )}
            {onReply && (
              <button type="button" onClick={onReply} aria-label="Trả lời tin này" title="Trả lời" className="inline-flex size-10 items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink">
                <ArrowBendUpLeft size={20} />
              </button>
            )}
            <AnimatePresence>
              {picking && onReact && (
                <motion.div
                  role="group"
                  aria-label="Chọn cảm xúc"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute bottom-full z-20 mb-1 flex rounded-full border border-line bg-paper p-1 paper-shadow ${mine ? "right-0" : "left-0"}`}
                  onKeyDown={(e) => e.key === "Escape" && setPicking(false)}
                >
                  {QUICK_REACTIONS.map((e) => {
                    const mineOn = message.reactions?.some((r) => r.emoji === e && r.userIds.includes(myId));
                    return (
                      <button
                        key={e}
                        type="button"
                        aria-label={`${mineOn ? "Bỏ" : "Thả"} ${e}`}
                        aria-pressed={mineOn}
                        onClick={() => {
                          onReact(e);
                          setPicking(false);
                          setRevealed(false);
                        }}
                        className={`flex size-10 items-center justify-center rounded-full text-xl transition-transform hover:scale-110 hover:bg-paper-2 ${mineOn ? "bg-coral-wash" : ""}`}
                      >
                        {e}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {message.reactions && message.reactions.length > 0 && (
        <div className={`-mt-2.5 flex flex-wrap gap-1 px-2 ${mine ? "justify-end" : ""}`}>
          {message.reactions.map((r) => {
            const on = r.userIds.includes(myId);
            return (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact?.(r.emoji)}
                aria-pressed={on}
                aria-label={`${r.emoji} ${r.userIds.length}: ${r.userIds.map(nameOf).join(", ")}. Bấm để ${on ? "bỏ" : "thả"}.`}
                title={r.userIds.map(nameOf).join(", ")}
                className={`tabular relative inline-flex h-8 items-center gap-1 rounded-full border px-2 text-sm leading-none paper-shadow before:absolute before:-inset-1 before:content-[""] ${
                  on ? "border-coral bg-coral-wash text-coral-ink" : "border-line bg-paper text-ink-2"
                }`}
              >
                <span className="text-base">{r.emoji}</span>
                {r.userIds.length > 1 && <span className="text-xs font-semibold">{r.userIds.length}</span>}
              </button>
            );
          })}
        </div>
      )}

      <span className="tabular px-3 text-[0.7rem] text-ink-3">
        {time(message.sentAt)}
        {status && <span className="font-semibold">{`, ${status}`}</span>}
      </span>
    </div>
  );
}
