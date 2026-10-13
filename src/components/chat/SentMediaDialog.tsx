"use client";

import { DownloadSimple, FileText } from "@phosphor-icons/react";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { Lightbox } from "@/components/album/Lightbox";
import { Dialog } from "@/components/album/Modal";
import { chatExtApi } from "@/lib/api/chat-ext";
import { useApi } from "@/lib/hooks/useApi";
import { fileSize } from "./ChatBubble";

const day = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export function SentMediaDialog({
  open,
  onClose,
  conversationId,
  nameOf,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  nameOf: (id: string) => string;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Ảnh và tệp đã gửi" size="lg">
      <Body conversationId={conversationId} nameOf={nameOf} />
    </Dialog>
  );
}

function Body({ conversationId, nameOf }: { conversationId: string; nameOf: (id: string) => string }) {
  const media = useApi(() => chatExtApi.media(conversationId), [conversationId]);
  const [tab, setTab] = useState<"images" | "files">("images");
  const [open, setOpen] = useState<number | null>(null);
  const tabs = [
    { id: "images" as const, label: "Ảnh", n: media.status === "ready" ? media.data.images.length : null },
    { id: "files" as const, label: "Tệp", n: media.status === "ready" ? media.data.files.length : null },
  ];

  function onKey(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const next = tab === "images" ? "files" : "images";
      setTab(next);
      requestAnimationFrame(() => document.getElementById(`media-tab-${next}`)?.focus());
    }
  }

  const images = media.status === "ready" ? media.data.images : [];
  const items = images.map((a, i) => ({ id: `${a.messageId}-${i}`, url: a.url, width: a.width, height: a.height, by: { id: a.senderId, name: nameOf(a.senderId) }, date: a.sentAt, byLabel: "gửi" as const }));

  return (
    <div>
      <div role="tablist" aria-label="Loại" onKeyDown={onKey} className="flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`media-tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="media-panel"
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={`relative h-11 px-4 text-sm font-semibold ${tab === t.id ? "text-ink" : "text-ink-3 hover:text-ink"}`}
          >
            {t.label} {t.n !== null && <span className="tabular font-normal text-ink-3">{t.n}</span>}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-coral" aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div id="media-panel" role="tabpanel" aria-labelledby={`media-tab-${tab}`} className="pt-4">
        {media.status === "loading" && (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => <span key={i} className="aspect-square animate-pulse rounded-[3px] bg-paper-3" />)}
          </div>
        )}
        {media.status === "error" && (
          <p role="alert" className="text-sm text-ink-2">
            Chưa tải được. <button onClick={media.reload} className="font-semibold text-coral-ink underline">Tải lại</button>
          </p>
        )}
        {media.status === "ready" && tab === "images" && (
          images.length === 0 ? (
            <p className="py-6 text-ink-2">Chưa có ảnh nào. Bấm nút ảnh cạnh ô nhắn tin để gửi.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {images.map((a, i) => (
                <li key={`${a.messageId}-${i}`}>
                  <button onClick={() => setOpen(i)} aria-label={`Xem ảnh ${nameOf(a.senderId)} gửi ngày ${day(a.sentAt)}`} className="relative block aspect-square w-full overflow-hidden rounded-[3px] bg-paper-3">
                    <Image src={a.url} alt="" fill sizes="160px" unoptimized={a.url.startsWith("blob:")} className="object-cover transition-transform duration-500 hover:scale-105" />
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
        {media.status === "ready" && tab === "files" && (
          media.data.files.length === 0 ? (
            <p className="py-6 text-ink-2">Chưa có tệp nào. Bấm nút kẹp giấy để đính kèm tệp.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {media.data.files.map((f, i) => (
                <li key={`${f.messageId}-${i}`}>
                  <a href={f.url} download={f.name} className="flex items-center gap-3 py-3 hover:text-ink">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-coral-wash text-coral-ink"><FileText size={22} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{f.name}</span>
                      <span className="tabular text-sm text-ink-3">{fileSize(f.size)}, {nameOf(f.senderId)} gửi ngày {day(f.sentAt)}</span>
                    </span>
                    <DownloadSimple size={20} className="text-ink-2" aria-label="Tải về" />
                  </a>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <Lightbox items={items} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />
    </div>
  );
}
