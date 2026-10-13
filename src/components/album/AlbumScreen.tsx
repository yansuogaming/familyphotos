"use client";

import {
  ArrowLeft,
  ArrowsLeftRight,
  CheckSquare,
  DownloadSimple,
  ShareNetwork,
  Trash,
  UploadSimple,
  X,
  Eye,
} from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "@/components/ui/Image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastProvider, useToast } from "@/components/settings/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button, buttonClass } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/core";
import { mediaApi } from "@/lib/api/media";
import type { AlbumDetail, AlbumShare } from "@/lib/api/media-types";
import type { Album, Photo } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/useApi";
import { DropOverlay } from "./DropOverlay";
import { Lightbox, photoToItem } from "./Lightbox";
import { ConfirmDialog } from "./Modal";
import { MovePhotosDialog } from "./MovePhotosDialog";
import { PhotoTile } from "./PhotoTile";
import { LoadError } from "./PhotosScreen";
import { ShareAlbumDialog } from "./ShareAlbumDialog";
import { UploadDialog } from "./UploadDialog";
import { useFileDrop } from "./useFileDrop";

const dmy = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const dayTitle = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

export function dateRange(from: string, to: string) {
  return from === to ? dmy(from) : `${dmy(from)} - ${dmy(to)}`;
}

export function AlbumScreen() {
  const { id } = useParams<{ id: string }>();
  return (
    <ToastProvider>
      <AlbumView key={id} id={id} />
    </ToastProvider>
  );
}

function AlbumView({ id }: { id: string }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const detail = useApi(() => mediaApi.album(id), [id]);
  // The API says what this viewer may do; the UI never guesses from the role.
  const perm = detail.status === "ready" ? detail.data : null;
  const canUpload = !!perm?.canUpload;
  const canEdit = !!perm?.canManage;
  const canShare = !!perm?.canShare;
  const first = useApi(() => mediaApi.photos(id), [id]);
  const [share, setShare] = useState<AlbumShare | null | undefined>(undefined);
  const [more, setMore] = useState<Photo[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [added, setAdded] = useState<Photo[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [memos, setMemos] = useState<Record<string, string>>({});

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState<number | null>(null);
  const [dialog, setDialog] = useState<null | "upload" | "share" | "move" | "delete">(null);
  const [dropped, setDropped] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const albums = useApi(mediaApi.albums);
  const dragging = useFileDrop(
    (files) => {
      setDropped(files);
      setDialog("upload");
    },
    canUpload && dialog === null && detail.status === "ready",
  );

  const photos = useMemo(() => {
    if (first.status !== "ready") return [];
    const seen = new Set<string>();
    return [...first.data.items, ...more, ...added]
      .filter((p) => !removed.has(p.id) && !seen.has(p.id) && !!seen.add(p.id))
      .map((p) => (p.id in memos ? { ...p, memo: memos[p.id] || undefined } : p))
      .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  }, [first, more, added, removed, memos]);

  const titleText = detail.status === "ready" ? detail.data.title : null;
  useEffect(() => {
    if (titleText) document.title = `${titleText} | Family Photos`;
  }, [titleText]);

  const nextCursor = cursor === undefined ? (first.status === "ready" ? first.data.nextCursor : null) : cursor;
  const total = first.status === "ready" ? first.data.total - removed.size + added.length : 0;

  const groups = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of photos) {
      const day = p.takenAt.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), p]);
    }
    return [...map.entries()];
  }, [photos]);
  const indexOf = useMemo(() => new Map(photos.map((p, i) => [p.id, i])), [photos]);
  const items = useMemo(() => photos.map(photoToItem), [photos]);

  // Load the next page when the sentinel scrolls into view.
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await mediaApi.photos(id, nextCursor);
      setMore((m) => [...m, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      toast("Chưa tải thêm được ảnh. Thử lại nhé.");
    } finally {
      setLoadingMore(false);
    }
  }
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMoreRef.current(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [nextCursor, detail.status, first.status]);

  if (detail.status === "loading") return <AlbumSkeleton />;
  if (detail.status === "error") {
    const missing = detail.error instanceof ApiError && detail.error.status === 404;
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10">
        <BackLink />
        {missing ? (
          <div className="oli oli-margin mt-6 rounded-[var(--radius-paper)] border border-line py-14 pl-20 pr-6">
            <p className="font-hand text-3xl text-ink">Không có album này trong sổ.</p>
            <p className="mt-2 max-w-[48ch] text-ink-2">Có thể album đã bị xoá hoặc đường dẫn bị gõ nhầm.</p>
            <Link href="/photos" className={buttonClass("primary", "md", "mt-6")}>Xem tất cả album</Link>
          </div>
        ) : (
          <div className="mt-6"><LoadError onRetry={detail.reload} what="album" /></div>
        )}
      </div>
    );
  }

  const album: AlbumDetail = { ...detail.data, share: share === undefined ? detail.data.share : share, photoCount: total || detail.data.photoCount };
  const selCount = selected.size;

  const toggle = (pid: string) => {
    setSelecting(true);
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };
  const endSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  async function saveMemo(pid: string, memo: string) {
    await mediaApi.updateMemo(pid, memo);
    setMemos((m) => ({ ...m, [pid]: memo }));
  }

  async function removeSelected() {
    setBusy(true);
    try {
      await mediaApi.deletePhotos([...selected]);
      setRemoved((r) => new Set([...r, ...selected]));
      toast(`Đã xoá ${selCount} ảnh`);
      endSelect();
      setDialog(null);
    } catch {
      toast("Chưa xoá được. Thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  async function moveSelected(to: Album) {
    await mediaApi.movePhotos([...selected], to.id);
    setRemoved((r) => new Set([...r, ...selected]));
    toast(`Đã chuyển ${selCount} ảnh sang ${to.title}`);
    endSelect();
    setDialog(null);
  }

  async function downloadSelected() {
    toast(`Đang gói ${selCount} ảnh...`);
    try {
      const res = await mediaApi.downloadMany([...selected]);
      if (res.url) window.location.assign(res.url);
      else toast(`Đã gói xong ${res.fileName}. Khi có máy chủ, tệp sẽ tự tải về.`);
    } catch {
      toast("Chưa tải về được. Thử lại nhé.");
    }
  }

  const contributors = album.contributors;
  const names =
    contributors.length <= 2
      ? contributors.map((c) => c.name).join(" và ")
      : `${contributors.slice(0, 2).map((c) => c.name).join(", ")} và ${contributors.length - 2} người khác`;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10">
      <BackLink />

      {/* the open cover */}
      <header className="vinyl relative mt-4 overflow-hidden rounded-[10px] p-5 pl-8 text-on-cover paper-shadow sm:p-8 sm:pl-12">
        <span className="absolute inset-y-0 left-0 w-4 bg-[oklch(0_0_0/0.18)] sm:w-5" aria-hidden="true" />
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-10">
          <div className="sleeve relative aspect-[4/5] w-40 -rotate-2 overflow-hidden rounded-[4px] ring-1 ring-[oklch(1_0_0/0.14)] shadow-[0_18px_36px_-18px_oklch(0_0_0/0.6)] sm:w-48 md:w-full">
            <Image src={album.coverUrl} alt="" fill priority sizes="(min-width: 768px) 220px, 192px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="inline-block max-w-full rounded-[3px] bg-[oklch(0.97_0.008_275)] px-5 py-4 text-[oklch(0.25_0.045_265)] shadow-[0_2px_0_oklch(0_0_0/0.15)]">
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{album.title}</h1>
              <p className="tabular mt-1 text-sm text-[oklch(0.45_0.035_265)]">
                {dateRange(album.takenFrom, album.takenTo)}, {album.photoCount.toLocaleString("vi-VN")} ảnh
              </p>
            </div>
            {album.description && <p className="mt-4 max-w-[52ch] font-hand text-xl leading-snug text-on-cover/90">{album.description}</p>}
            {contributors.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <span className="flex -space-x-2">
                  {contributors.slice(0, 4).map((c) => (
                    <Avatar key={c.id} user={c} size="sm" className="ring-2 ring-cover" />
                  ))}
                </span>
                <p className="text-sm text-on-cover/80">{names} đã góp ảnh</p>
              </div>
            )}
            {canUpload && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={() => { setDropped([]); setDialog("upload"); }}>
                  <UploadSimple size={18} weight="bold" /> Thêm ảnh
                </Button>
                {canShare && (
                  <Button variant="secondary" onClick={() => setDialog("share")}>
                    <ShareNetwork size={18} /> {album.share ? "Đang chia sẻ" : "Chia sẻ cho khách"}
                  </Button>
                )}
                {canEdit && photos.length > 0 && (
                  <button
                    onClick={() => (selecting ? endSelect() : setSelecting(true))}
                    aria-pressed={selecting}
                    className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[0.95rem] font-semibold text-on-cover/90 transition-colors hover:bg-[oklch(1_0_0/0.1)] hover:text-on-cover"
                  >
                    <CheckSquare size={18} /> {selecting ? "Thôi chọn" : "Chọn ảnh"}
                  </button>
                )}
              </div>
            )}
            {perm && !canUpload && (
              <p className="mt-6 flex items-center gap-2 text-sm text-on-cover/85">
                <Eye size={18} className="shrink-0" />
                {perm.sharedWithMe
                  ? "Nhà chia sẻ album này cho bạn xem. Bạn không thêm hay sửa ảnh ở đây."
                  : `Album riêng của ${perm.owner?.name ?? "khách"}. Người trong nhà chỉ xem, không sửa.`}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* photos by day */}
      <div className="mt-10">
        {first.status === "loading" && <GridSkeleton />}
        {first.status === "error" && <LoadError onRetry={first.reload} />}
        {first.status === "ready" && photos.length === 0 && (
          <div className="oli oli-margin rounded-[var(--radius-paper)] border border-line py-14 pl-20 pr-6">
            <p className="font-display text-2xl font-semibold">Album còn trống.</p>
            <p className="mt-2 max-w-[48ch] text-ink-2">
              {canUpload ? "Kéo ảnh từ máy vào trang này, hoặc bấm Thêm ảnh." : "Cả nhà chưa thêm ảnh nào vào album này."}
            </p>
            {canUpload && (
              <Button className="mt-6" onClick={() => setDialog("upload")}>
                <UploadSimple size={18} weight="bold" /> Thêm ảnh
              </Button>
            )}
          </div>
        )}
        {groups.map(([day, list]) => (
          <section key={day} aria-labelledby={`d-${day}`} className="mb-12">
            <h2 id={`d-${day}`} className="flex items-baseline gap-3 border-b border-line pb-2 text-xl font-semibold">
              <span className="first-letter:uppercase">{dayTitle(day)}</span>
              <span className="tabular text-sm font-normal text-ink-3">{list.length} ảnh</span>
            </h2>
            <div className="mt-5 columns-2 gap-4 sm:gap-5 md:columns-3 xl:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid sm:[&>*]:mb-5">
              {list.map((p) => (
                <PhotoTile
                  key={p.id}
                  photo={p}
                  layoutId={`album-${p.id}`}
                  onOpen={() => setOpen(indexOf.get(p.id) ?? 0)}
                  selecting={selecting}
                  selected={selected.has(p.id)}
                  onToggleSelect={canEdit ? () => toggle(p.id) : undefined}
                  onSaveMemo={canEdit ? (m) => saveMemo(p.id, m) : undefined}
                  showDate={false}
                />
              ))}
            </div>
          </section>
        ))}
        {first.status === "ready" && nextCursor && (
          <div ref={sentinel} className="flex justify-center py-6">
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Đang mở thêm trang..." : `Xem thêm ảnh (còn ${Math.max(0, total - photos.length)})`}
            </Button>
          </div>
        )}
      </div>

      {/* selection bar */}
      <AnimatePresence>
        {selecting && (
          <motion.div
            role="toolbar"
            aria-label="Thao tác với ảnh đã chọn"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 bottom-[5.5rem] z-40 mx-auto flex max-w-xl items-center gap-1 rounded-full border border-line bg-paper p-1.5 pl-4 paper-shadow md:bottom-6"
          >
            <p className="tabular mr-auto text-sm font-semibold" aria-live="polite">
              {selCount ? `Đã chọn ${selCount}` : "Bấm vào ảnh để chọn"}
            </p>
            <SelAction label="Tải về" onClick={downloadSelected} disabled={!selCount}><DownloadSimple size={20} /></SelAction>
            <SelAction label="Chuyển album" onClick={() => setDialog("move")} disabled={!selCount}><ArrowsLeftRight size={20} /></SelAction>
            <SelAction label="Xoá" onClick={() => setDialog("delete")} disabled={!selCount} danger><Trash size={20} /></SelAction>
            <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
            <SelAction label="Thôi chọn" onClick={endSelect}><X size={20} /></SelAction>
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox items={items} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} layoutPrefix="album" />

      <UploadDialog
        open={dialog === "upload"}
        onClose={() => setDialog(null)}
        albums={albums.status === "ready" ? albums.data.filter((a) => a.canUpload) : [detail.data]}
        albumId={id}
        initialFiles={dropped}
        onUploaded={(to, ps) => {
          if (to === id) setAdded((a) => [...a, ...ps]);
          if (ps.length) toast(`Đã thêm ${ps.length} ảnh`);
        }}
      />
      <ShareAlbumDialog
        open={dialog === "share"}
        onClose={() => setDialog(null)}
        albumId={id}
        albumTitle={album.title}
        share={album.share}
        onChange={(sh) => {
          setShare(sh);
          toast(sh ? "Đã lưu đường dẫn chia sẻ" : "Đã ngừng chia sẻ");
        }}
      />
      <MovePhotosDialog open={dialog === "move"} onClose={() => setDialog(null)} fromAlbumId={id} count={selCount} onMoved={moveSelected} />
      <ConfirmDialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        onConfirm={removeSelected}
        busy={busy}
        title={`Xoá ${selCount} ảnh?`}
        description="Ảnh sẽ biến mất khỏi album của cả nhà, kèm tim và bình luận. Không lấy lại được."
        confirmLabel="Xoá ảnh"
      />
      <DropOverlay show={dragging} target={album.title} />
    </div>
  );
}

function SelAction({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors disabled:opacity-40 sm:px-4 ${
        danger ? "text-danger hover:bg-paper-2" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
      }`}
    >
      {children}
      <span className="max-sm:sr-only">{label}</span>
    </button>
  );
}

function BackLink() {
  return (
    <Link href="/photos" className="inline-flex h-10 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-ink-2 hover:text-ink">
      <ArrowLeft size={18} /> Tất cả album
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div aria-hidden="true">
      <span className="block h-6 w-56 animate-pulse rounded bg-paper-3" />
      <div className="mt-5 columns-2 gap-5 md:columns-3 xl:columns-4 [&>*]:mb-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-[var(--radius-paper)] border border-line bg-paper p-2">
            <div className={`animate-pulse rounded-[3px] bg-paper-3 ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-[4/3]"}`} />
            <div className="mt-2 h-6 w-2/3 animate-pulse rounded bg-paper-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlbumSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10" aria-busy="true" aria-label="Đang mở album">
      <span className="block h-10 w-32 animate-pulse rounded-full bg-paper-3" />
      <div className="vinyl mt-4 rounded-[10px] p-5 pl-8 sm:p-8 sm:pl-12">
        <div className="grid items-center gap-6 md:grid-cols-[220px_1fr] lg:gap-10">
          <div className="aspect-[4/5] w-40 animate-pulse rounded-[4px] bg-cover-2 sm:w-48 md:w-full" />
          <div>
            <div className="h-24 max-w-md animate-pulse rounded-[3px] bg-cover-2" />
            <div className="mt-4 h-5 w-2/3 max-w-sm animate-pulse rounded bg-cover-2" />
            <div className="mt-6 flex gap-2">
              <div className="h-11 w-32 animate-pulse rounded-full bg-cover-2" />
              <div className="h-11 w-40 animate-pulse rounded-full bg-cover-2" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10"><GridSkeleton /></div>
    </div>
  );
}
