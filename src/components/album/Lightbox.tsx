"use client";

import {
  CaretLeft,
  CaretRight,
  ChatCircle,
  DownloadSimple,
  Heart,
  Info,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  PaperPlaneRight,
  X,
} from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { mediaApi } from "@/lib/api/media";
import type { PhotoSocial } from "@/lib/api/media-types";
import type { Photo } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/useApi";
import { Portal, useModal } from "./Modal";

export interface LightboxItem {
  id: string;
  url: string;
  width: number;
  height: number;
  memo?: string;
  /** ISO date or date-time. */
  date?: string;
  by?: { id: string; name: string };
  /** Hearts and comments (album photos). Off for chat images. */
  social?: boolean;
  /** "Ai thêm" vs "Ai gửi". */
  byLabel?: "thêm" | "gửi";
}

const ease = [0.16, 1, 0.3, 1] as const;
const isLocal = (url: string) => url.startsWith("blob:") || url.startsWith("data:");

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const commentTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/**
 * Full-screen photo viewer shared by albums, "Mới thêm vào", memories and chat.
 * The opened photo grows out of its tile through a shared layoutId.
 */
export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  layoutPrefix,
}: {
  items: LightboxItem[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  /** Tiles use layoutId `${layoutPrefix}-${item.id}`. */
  layoutPrefix?: string;
}) {
  const item = index === null ? undefined : items[index];
  return (
    <Portal>
      <AnimatePresence>
        {item && index !== null && (
          <View key="lightbox" items={items} index={index} onIndexChange={onIndexChange} onClose={onClose} layoutPrefix={layoutPrefix} />
        )}
      </AnimatePresence>
    </Portal>
  );
}

function View({
  items,
  index,
  onIndexChange,
  onClose,
  layoutPrefix,
}: {
  items: LightboxItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  layoutPrefix?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useModal(root, onClose);

  const item = items[index];
  const [openedId] = useState(item.id);
  const [dir, setDir] = useState(0);
  const [zoomState, setZoom] = useState<{ id: string; z: number; bounds: { x: number; y: number } }>({ id: "", z: 1, bounds: { x: 0, y: 0 } });
  const zoom = zoomState.id === item.id ? zoomState.z : 1;
  const [infoOpen, setInfoOpen] = useState(() => matchMedia("(min-width: 1024px)").matches);

  const go = (step: number) => {
    const next = index + step;
    if (next < 0 || next >= items.length) return;
    setDir(step);
    onIndexChange(next);
  };
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") goRef.current(1);
      if (e.key === "ArrowLeft") goRef.current(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toggleZoom() {
    if (zoom > 1) return setZoom({ id: item.id, z: 1, bounds: { x: 0, y: 0 } });
    const r = frame.current?.getBoundingClientRect();
    const z = 2.5;
    setZoom({ id: item.id, z, bounds: { x: ((r?.width ?? 0) * (z - 1)) / 2, y: ((r?.height ?? 0) * (z - 1)) / 2 } });
  }

  function onSwipe(_: unknown, info: PanInfo) {
    if (info.offset.x < -70 || info.velocity.x < -500) go(1);
    else if (info.offset.x > 70 || info.velocity.x > 500) go(-1);
  }

  // Hearts and comments
  const social = useApi<PhotoSocial | null>(() => (item.social ? mediaApi.social(item.id) : Promise.resolve(null)), [item.id, item.social]);
  const [local, setLocal] = useState<PhotoSocial | null>(null);
  const s = local?.photoId === item.id ? local : social.status === "ready" ? social.data : null;

  async function toggleLike() {
    if (!s) return;
    const liked = !s.likedByMe;
    setLocal({ ...s, likedByMe: liked, likeCount: s.likeCount + (liked ? 1 : -1) });
    try {
      setLocal(await mediaApi.setLike(item.id, liked));
    } catch {
      setLocal(s);
    }
  }

  const ratio = item.width / item.height;
  const useLayout = !reduce && !!layoutPrefix && item.id === openedId;
  const btn = "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-on-cover/85 transition-colors hover:bg-[oklch(1_0_0/0.1)] hover:text-on-cover disabled:opacity-30";

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={item.memo ? `Ảnh: ${item.memo}` : "Xem ảnh"}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[70] flex bg-[oklch(0.16_0.03_262)] text-on-cover outline-none"
    >
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-1 px-2 sm:px-4">
          <button onClick={onClose} aria-label="Đóng (Esc)" title="Đóng (Esc)" className={btn}>
            <X size={22} />
          </button>
          <p className="tabular ml-1 mr-auto text-sm font-semibold text-on-cover/80" aria-live="polite">
            {index + 1} / {items.length}
          </p>
          <button onClick={toggleZoom} aria-pressed={zoom > 1} aria-label={zoom > 1 ? "Thu nhỏ" : "Phóng to"} title={zoom > 1 ? "Thu nhỏ" : "Phóng to"} className={btn}>
            {zoom > 1 ? <MagnifyingGlassMinus size={22} /> : <MagnifyingGlassPlus size={22} />}
          </button>
          {item.social && (
            <button onClick={toggleLike} disabled={!s} aria-pressed={!!s?.likedByMe} aria-label={s?.likedByMe ? "Bỏ tim" : "Thả tim"} title={s?.likedByMe ? "Bỏ tim" : "Thả tim"} className={btn}>
              <Heart size={22} weight={s?.likedByMe ? "fill" : "regular"} className={s?.likedByMe ? "text-coral" : ""} />
            </button>
          )}
          <a href={mediaApi.downloadUrl(item)} download target="_blank" rel="noopener" aria-label="Tải ảnh về" title="Tải ảnh về" className={btn}>
            <DownloadSimple size={22} />
          </a>
          <button onClick={() => setInfoOpen((o) => !o)} aria-pressed={infoOpen} aria-label="Thông tin ảnh" title="Thông tin ảnh" className={`${btn} ${infoOpen ? "bg-[oklch(1_0_0/0.12)] text-on-cover" : ""}`}>
            <Info size={22} weight={infoOpen ? "fill" : "regular"} />
          </button>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 pb-3 sm:px-16">
          <button onClick={() => go(-1)} disabled={index === 0} aria-label="Ảnh trước" title="Ảnh trước" className={`${btn} absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-[oklch(0_0_0/0.25)] max-sm:hidden`}>
            <CaretLeft size={24} weight="bold" />
          </button>
          <button onClick={() => go(1)} disabled={index === items.length - 1} aria-label="Ảnh sau" title="Ảnh sau" className={`${btn} absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-[oklch(0_0_0/0.25)] max-sm:hidden`}>
            <CaretRight size={24} weight="bold" />
          </button>

          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={item.id}
              ref={frame}
              layoutId={useLayout ? `${layoutPrefix}-${item.id}` : undefined}
              custom={dir}
              variants={{
                enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 80 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -80 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease }}
              drag={zoom === 1 && items.length > 1 ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.25}
              onDragEnd={onSwipe}
              onDoubleClick={toggleZoom}
              style={{ aspectRatio: `${item.width} / ${item.height}`, width: `min(100%, calc((100dvh - 9.5rem) * ${ratio}))` }}
              className="relative max-h-full touch-pan-y overflow-hidden rounded-[3px] bg-[oklch(0.22_0.035_262)]"
            >
              <motion.div
                className={`absolute inset-0 ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                animate={{ scale: zoom, ...(zoom === 1 ? { x: 0, y: 0 } : {}) }}
                transition={{ duration: reduce ? 0 : 0.4, ease }}
                drag={zoom > 1}
                dragConstraints={{ left: -zoomState.bounds.x, right: zoomState.bounds.x, top: -zoomState.bounds.y, bottom: zoomState.bounds.y }}
                dragElastic={0.05}
              >
                <Image
                  src={item.url}
                  alt={item.memo ? `Ảnh: ${item.memo}` : "Ảnh gia đình"}
                  fill
                  priority
                  draggable={false}
                  unoptimized={isLocal(item.url)}
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  className="select-none object-cover"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {!infoOpen && (item.memo || item.by) && (
          <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
            {item.memo && <p className="font-hand text-xl text-on-cover">{item.memo}</p>}
            {item.by && (
              <p className="text-xs text-on-cover/70">
                {item.by.name} {item.byLabel ?? "thêm"}
                {item.date ? `, ${new Date(item.date).toLocaleDateString("vi-VN")}` : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {infoOpen && (
          <motion.aside
            key="info"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease }}
            aria-label="Thông tin ảnh"
            className="flex flex-col bg-paper text-ink max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:max-h-[62dvh] max-lg:rounded-t-[14px] max-lg:shadow-[0_-16px_40px_-16px_hsl(var(--shadow)/0.6)] lg:w-[360px] lg:shrink-0 lg:border-l lg:border-line"
          >
            <div className="flex items-center justify-between px-5 pt-4 lg:hidden">
              <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden="true" />
            </div>
            <Details item={item} social={s} socialStatus={social.status} onRetry={social.reload} onLike={toggleLike} onChange={setLocal} />
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Details({
  item,
  social,
  socialStatus,
  onRetry,
  onLike,
  onChange,
}: {
  item: LightboxItem;
  social: PhotoSocial | null;
  socialStatus: "loading" | "error" | "ready";
  onRetry: () => void;
  onLike: () => void;
  onChange: (s: PhotoSocial) => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !social) return;
    setSending(true);
    setError(null);
    try {
      const c = await mediaApi.addComment(item.id, text);
      onChange({ ...social, comments: [...social.comments, c] });
      setDraft("");
      requestAnimationFrame(() => list.current?.lastElementChild?.scrollIntoView({ block: "nearest" }));
    } catch {
      setError("Chưa gửi được. Thử lại nhé.");
    } finally {
      setSending(false);
    }
  }

  const likedNames = social?.likedBy.map((p) => p.name) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3 lg:pt-6">
        {item.memo ? (
          <p className="memo-lines font-hand text-[1.35rem] leading-6 text-ink">{item.memo}</p>
        ) : (
          <p className="text-sm text-ink-3">Ảnh này chưa có ghi chú.</p>
        )}
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {item.by && (
            <>
              <dt className="text-ink-3">{item.byLabel === "gửi" ? "Người gửi" : "Người thêm"}</dt>
              <dd className="flex items-center gap-2 font-semibold"><Avatar user={item.by} size="sm" /> {item.by.name}</dd>
            </>
          )}
          {item.date && (
            <>
              <dt className="text-ink-3">{item.byLabel === "gửi" ? "Lúc" : "Ngày chụp"}</dt>
              <dd className="first-letter:uppercase">{item.byLabel === "gửi" ? commentTime(item.date) : longDate(item.date)}</dd>
            </>
          )}
          <dt className="text-ink-3">Kích thước</dt>
          <dd className="tabular">{item.width} x {item.height}</dd>
        </dl>

        {item.social && (
          <div className="mt-6 border-t border-line pt-5">
            {socialStatus === "loading" && !social && (
              <div className="flex flex-col gap-3" aria-hidden="true">
                <span className="h-4 w-40 animate-pulse rounded bg-paper-3" />
                <span className="h-12 animate-pulse rounded bg-paper-3" />
              </div>
            )}
            {socialStatus === "error" && !social && (
              <p className="text-sm text-ink-2">
                Chưa tải được bình luận.{" "}
                <button onClick={onRetry} className="font-semibold text-coral-ink underline">Tải lại</button>
              </p>
            )}
            {social && (
              <>
                <button onClick={onLike} aria-pressed={social.likedByMe} className="flex min-h-10 items-center gap-2 rounded-full pr-3 text-left text-sm hover:text-ink">
                  <Heart size={22} weight={social.likedByMe ? "fill" : "regular"} className={social.likedByMe ? "text-coral" : "text-ink-2"} />
                  <span className="text-ink-2">
                    {social.likeCount === 0
                      ? "Chưa ai thả tim. Bấm để thả tim."
                      : likedNames.length <= 2
                        ? `${likedNames.join(" và ")} thả tim`
                        : `${likedNames.slice(0, 2).join(", ")} và ${likedNames.length - 2} người khác thả tim`}
                  </span>
                </button>

                <h3 className="mt-5 flex items-center gap-2 text-base font-semibold">
                  <ChatCircle size={18} /> Cả nhà nói gì
                </h3>
                {social.comments.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-3">Chưa có bình luận. Viết lời đầu tiên.</p>
                ) : (
                  <ol ref={list} className="mt-3 flex flex-col gap-3">
                    {social.comments.map((c) => (
                      <li key={c.id} className="flex gap-2.5">
                        <Avatar user={c.author} size="sm" />
                        <div className="min-w-0 rounded-[var(--radius-paper)] bg-paper-2 px-3 py-2">
                          <p className="text-sm">
                            <span className="font-semibold">{c.author.name}</span>{" "}
                            <span className="tabular text-xs text-ink-3">{commentTime(c.createdAt)}</span>
                          </p>
                          <p className="text-sm text-ink-2">{c.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {item.social && social && (
        <form onSubmit={send} className="border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <label htmlFor="lb-comment" className="sr-only">Viết bình luận</label>
            <input
              id="lb-comment"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={300}
              placeholder="Viết một câu ngắn..."
              autoComplete="off"
              aria-invalid={!!error}
              aria-describedby={error ? "lb-comment-err" : undefined}
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-paper-2 px-4 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-coral focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_22%,transparent)]"
            />
            <button type="submit" disabled={!draft.trim() || sending} aria-label="Gửi bình luận" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-coral text-on-coral transition-opacity disabled:opacity-40">
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </div>
          {error && <p id="lb-comment-err" className="mt-1.5 px-2 text-sm text-danger">{error}</p>}
        </form>
      )}
    </div>
  );
}

export function photoToItem(p: Photo): LightboxItem {
  return { id: p.id, url: p.url, width: p.width, height: p.height, memo: p.memo, date: p.takenAt, by: p.uploadedBy, social: true, byLabel: "thêm" };
}
