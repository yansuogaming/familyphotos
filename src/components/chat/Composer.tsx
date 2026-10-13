"use client";

/* eslint-disable @next/next/no-img-element -- attachment previews are local blob URLs */
import { ArrowBendUpLeft, FileText, ImageSquare, MapPin, Paperclip, PaperPlaneRight, Plus, Smiley, WarningCircle, X } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Dialog } from "@/components/album/Modal";
import { isMock } from "@/lib/api/core";
import { ATTACH_LIMIT_BYTES, ATTACH_MAX_FILES, type ChatMessage, type LocationShare, type SendInput } from "@/lib/api/chat-ext-types";
import { fileSize } from "./ChatBubble";
import { EmojiPicker } from "./EmojiPicker";
import { StaticMap } from "./StaticMap";

interface Pending {
  id: string;
  file: File;
  preview: string | null;
}

const tool = "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink aria-expanded:bg-paper-3 aria-expanded:text-ink";

export function Composer({
  placeholder,
  replyTo,
  replyName,
  onCancelReply,
  onSend,
  onTyping,
}: {
  placeholder: string;
  replyTo: ChatMessage | null;
  replyName?: string;
  onCancelReply: () => void;
  onSend: (input: SendInput) => Promise<void>;
  onTyping: () => void;
}) {
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [emoji, setEmoji] = useState(false);
  const [more, setMore] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const text = useRef<HTMLTextAreaElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastTyping = useRef(0);
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  });
  useEffect(() => () => filesRef.current.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)), []);

  // Focus the box when a reply starts.
  useEffect(() => {
    if (replyTo) text.current?.focus();
  }, [replyTo]);

  function add(list: FileList | null) {
    const picked = [...(list ?? [])];
    const tooBig = picked.filter((f) => f.size > ATTACH_LIMIT_BYTES);
    const ok = picked.filter((f) => f.size <= ATTACH_LIMIT_BYTES).slice(0, Math.max(0, ATTACH_MAX_FILES - files.length));
    setError(
      tooBig.length
        ? `${tooBig.map((f) => f.name).join(", ")} quá lớn. Mỗi tệp tối đa 25 MB.`
        : picked.length > ok.length
          ? `Mỗi lần gửi tối đa ${ATTACH_MAX_FILES} tệp.`
          : null,
    );
    setFiles((cur) => [...cur, ...ok.map((file) => ({ id: crypto.randomUUID(), file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null }))]);
    setMore(false);
  }

  function pickMore(kind: "image" | "file" | "location") {
    if (kind === "image") imageInput.current?.click();
    if (kind === "file") fileInput.current?.click();
    if (kind === "location") {
      setMore(false);
      setLocating(true);
    }
  }

  function removeFile(p: Pending) {
    if (p.preview) URL.revokeObjectURL(p.preview);
    setFiles((cur) => cur.filter((f) => f.id !== p.id));
  }

  function insertEmoji(e: string) {
    const el = text.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + e + draft.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + e.length, start + e.length);
    });
  }

  function autosize() {
    const el = text.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const t = draft.trim();
    if ((!t && files.length === 0) || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend({ text: t || undefined, files: files.map((f) => f.file), replyToId: replyTo?.id });
      setDraft("");
      setFiles([]);
      requestAnimationFrame(autosize);
    } catch {
      setError("Chưa gửi được. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSending(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
    if (e.key === "Escape" && replyTo) onCancelReply();
  }

  const canSend = (!!draft.trim() || files.length > 0) && !sending;

  return (
    <div className="relative border-t border-line">
      <AnimatePresence initial={false}>
        {replyTo && (
          <motion.div
            key="reply"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 pt-3 md:px-6">
              <ArrowBendUpLeft size={18} className="shrink-0 text-coral-ink" />
              <div className="min-w-0 flex-1 rounded-[var(--radius-paper)] bg-paper-2 px-3 py-1.5">
                <p className="text-xs font-semibold text-coral-ink">Trả lời {replyName}</p>
                <p className="truncate text-sm text-ink-2">{replyTo.text || (replyTo.attachments?.[0]?.kind === "image" ? "Ảnh" : replyTo.attachments?.[0]?.kind === "file" ? "Tệp" : "Vị trí")}</p>
              </div>
              <button type="button" onClick={onCancelReply} aria-label="Bỏ trả lời" className={tool}><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <ul className="flex gap-2 overflow-x-auto px-4 pt-3 md:px-6" aria-label="Tệp sẽ gửi">
          {files.map((f) => (
            <li key={f.id} className="relative shrink-0">
              {f.preview ? (
                <img src={f.preview} alt={f.file.name} className="size-20 rounded-[var(--radius-paper)] border border-line object-cover" />
              ) : (
                <div className="flex h-20 w-48 items-center gap-2 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-3">
                  <FileText size={26} className="shrink-0 text-coral-ink" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{f.file.name}</span>
                    <span className="tabular text-xs text-ink-3">{fileSize(f.file.size)}</span>
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(f)}
                aria-label={`Bỏ ${f.file.name}`}
                className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full border border-line bg-paper text-ink-2 paper-shadow before:absolute before:-inset-1.5 before:content-[''] hover:text-ink"
              >
                <X size={14} weight="bold" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-1.5 px-4 pt-2 text-sm text-danger md:px-6">
          <WarningCircle size={16} weight="fill" /> {error}
        </p>
      )}

      <form onSubmit={submit} className="flex items-end gap-1 px-2 py-3 md:px-4">
        <div className="hidden items-center sm:flex">
          <button type="button" onClick={() => imageInput.current?.click()} aria-label="Gửi ảnh" title="Gửi ảnh" className={tool}><ImageSquare size={20} /></button>
          <button type="button" onClick={() => fileInput.current?.click()} aria-label="Đính kèm tệp" title="Đính kèm tệp" className={tool}><Paperclip size={20} /></button>
          <button type="button" onClick={() => setLocating(true)} aria-label="Gửi vị trí" title="Gửi vị trí" className={tool}><MapPin size={20} /></button>
        </div>

        <div className="relative sm:hidden">
          <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} aria-haspopup="menu" aria-label="Gửi thêm ảnh, tệp, vị trí" className={tool}>
            <Plus size={20} weight="bold" className={`transition-transform ${more ? "rotate-45" : ""}`} />
          </button>
          {more && (
            <div role="menu" className="absolute bottom-full left-0 z-30 mb-2 w-48 rounded-[var(--radius-paper)] border border-line bg-paper p-1.5 paper-shadow" onKeyDown={(e) => e.key === "Escape" && setMore(false)}>
              {[
                { label: "Ảnh", icon: ImageSquare, run: "image" as const },
                { label: "Tệp", icon: Paperclip, run: "file" as const },
                { label: "Vị trí", icon: MapPin, run: "location" as const },
              ].map(({ label, icon: I, run }) => (
                <button key={label} role="menuitem" type="button" onClick={() => pickMore(run)} className="flex h-11 w-full items-center gap-3 rounded-[var(--radius-paper)] px-3 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
                  <I size={20} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex min-w-0 flex-1 items-end rounded-[22px] border border-line bg-paper-2 transition-[border-color,box-shadow] focus-within:border-coral focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_22%,transparent)]">
          <label htmlFor="chat-input" className="sr-only">Nhắn tin</label>
          <textarea
            id="chat-input"
            ref={text}
            rows={1}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autosize();
              if (Date.now() - lastTyping.current > 3000) {
                lastTyping.current = Date.now();
                onTyping();
              }
            }}
            onKeyDown={onKey}
            placeholder={placeholder}
            autoComplete="off"
            className="block max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 pl-4 text-[0.95rem] leading-6 outline-none placeholder:text-ink-3"
          />
          <button
            type="button"
            data-emoji-toggle
            onClick={() => setEmoji((v) => !v)}
            aria-expanded={emoji}
            aria-label="Biểu cảm"
            title="Biểu cảm"
            className={`${tool} m-0.5`}
          >
            <Smiley size={20} weight={emoji ? "fill" : "regular"} />
          </button>
          {emoji && (
            <EmojiPicker className="absolute bottom-full right-0 mb-2" onPick={insertEmoji} onClose={() => setEmoji(false)} />
          )}
        </div>

        <button type="submit" aria-label="Gửi" disabled={!canSend} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-coral text-on-coral transition-[opacity,transform] active:scale-95 disabled:opacity-40">
          <PaperPlaneRight size={18} weight="fill" />
        </button>

        <input ref={imageInput} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        <input ref={fileInput} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </form>

      <LocationDialog
        open={locating}
        onClose={() => setLocating(false)}
        onSend={async (loc) => {
          await onSend({ location: loc, replyToId: replyTo?.id });
          setLocating(false);
        }}
      />
    </div>
  );
}

type Loc = Omit<LocationShare, "kind">;
const DEMO_LOCATION: Loc = { lat: 21.0368, lng: 105.7826, label: "Nhà mình, Cầu Giấy, Hà Nội" };

function LocationDialog({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (l: Loc) => Promise<void> }) {
  return (
    <Dialog open={open} onClose={onClose} title="Gửi vị trí" description="Chỉ người trong cuộc trò chuyện này thấy vị trí của bạn." size="sm">
      <LocationBody onClose={onClose} onSend={onSend} />
    </Dialog>
  );
}

function LocationBody({ onClose, onSend }: { onClose: () => void; onSend: (l: Loc) => Promise<void> }) {
  const [state, setState] = useState<{ kind: "finding" } | { kind: "found"; loc: Loc } | { kind: "error"; reason: string }>(() =>
    typeof navigator !== "undefined" && "geolocation" in navigator ? { kind: "finding" } : { kind: "error", reason: "Trình duyệt này không hỗ trợ lấy vị trí." },
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let alive = true;
    navigator.geolocation.getCurrentPosition(
      (p) => alive && setState({ kind: "found", loc: { lat: p.coords.latitude, lng: p.coords.longitude, label: "Vị trí hiện tại của tôi" } }),
      (err) =>
        alive &&
        setState({
          kind: "error",
          reason: err.code === err.PERMISSION_DENIED ? "Bạn chưa cho trình duyệt dùng vị trí. Bật quyền vị trí cho trang này rồi thử lại." : "Chưa tìm được vị trí. Thử lại ở chỗ thoáng hơn.",
        }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
    return () => {
      alive = false;
    };
  }, []);

  const loc = state.kind === "found" ? state.loc : null;

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {state.kind === "finding" && (
        <div className="flex flex-col gap-3">
          <div className="h-36 animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />
          <p className="text-sm text-ink-2">Đang tìm vị trí của bạn...</p>
        </div>
      )}
      {loc && (
        <div className="overflow-hidden rounded-[var(--radius-paper)] border border-line">
          <StaticMap lat={loc.lat} lng={loc.lng} className="h-36 w-full" />
          <div className="px-4 py-3">
            <p className="font-semibold">{loc.label}</p>
            <p className="tabular text-sm text-ink-3">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
          </div>
        </div>
      )}
      {state.kind === "error" && (
        <div className="rounded-[var(--radius-paper)] border border-line bg-paper-2 px-4 py-3">
          <p className="text-sm text-ink-2">{state.reason}</p>
          {isMock && (
            <button onClick={() => setState({ kind: "found", loc: DEMO_LOCATION })} className="mt-2 text-sm font-semibold text-coral-ink underline decoration-dotted">
              Demo: dùng vị trí mẫu
            </button>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button className={buttonClass("ghost")} onClick={onClose}>Huỷ</button>
        <button
          className={buttonClass("primary")}
          disabled={!loc || sending}
          onClick={async () => {
            if (!loc) return;
            setSending(true);
            try {
              await onSend(loc);
            } catch {
              setSending(false);
            }
          }}
        >
          <MapPin size={18} weight="fill" /> {sending ? "Đang gửi..." : "Gửi vị trí"}
        </button>
      </div>
    </div>
  );
}
