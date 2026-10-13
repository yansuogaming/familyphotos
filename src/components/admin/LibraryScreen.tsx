"use client";

/* eslint-disable @next/next/no-img-element -- library images may be local data URLs */
import { ImageSquare, MagnifyingGlass, UploadSimple } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/settings/shared";
import { adminApi } from "@/lib/api/admin";
import type { MediaAsset } from "@/lib/api/admin-types";
import { wait } from "@/lib/api/core";
import { useApi } from "@/lib/hooks/useApi";
import { IMAGE_ACCEPT, checkImageFile, readImageFile } from "./image-file";
import { formatSize } from "./library/format";
import { MediaDetail } from "./library/MediaDetail";
import { UploadQueue, type UploadRow } from "./library/UploadQueue";
import { EmptyState, PageHeader, RibbonMark, Tag, errorText, inputClass, selectClass } from "./ui";

type Usage = "all" | "used" | "unused";
type Sort = "new" | "name" | "size";

const usageTabs: { value: Usage; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "used", label: "Đang dùng" },
  { value: "unused", label: "Chưa dùng" },
];

export function LibraryScreen() {
  const media = useApi(adminApi.media.list);

  return (
    <div className="flex flex-col gap-6">
      {media.status === "ready" ? (
        <Library initial={media.data} />
      ) : (
        <>
          <PageHeader title="Thư viện ảnh" description="Ảnh dùng cho trang chủ, trang đăng nhập và bìa album. Tải lên một lần, dùng lại ở nhiều chỗ." />
          {media.status === "loading" ? <LibrarySkeleton /> : <LoadError onRetry={media.reload} what="thư viện ảnh" />}
        </>
      )}
    </div>
  );
}

function Library({ initial }: { initial: MediaAsset[] }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [items, setItems] = useState(initial);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [q, setQ] = useState("");
  const [usage, setUsage] = useState<Usage>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [detail, setDetail] = useState<{ asset: MediaAsset; n: number; open: boolean } | null>(null);
  const [over, setOver] = useState(false);
  const dragDepth = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const files = useRef(new Map<string, File>());
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearInterval(id));
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter(
      (m) =>
        (usage === "all" || (usage === "used" ? m.usedIn.length > 0 : m.usedIn.length === 0)) &&
        (!needle || `${m.name} ${m.alt}`.toLowerCase().includes(needle)),
    );
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    else if (sort === "size") list.sort((a, b) => b.sizeBytes - a.sizeBytes);
    else list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return list;
  }, [items, q, usage, sort]);

  const patchRow = (id: string, fn: (r: UploadRow) => UploadRow) => setRows((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));

  /** Fake progress while the file is read and saved; resolves to the new asset or null. */
  async function sendOne(id: string, file: File): Promise<MediaAsset | null> {
    patchRow(id, (r) => ({ ...r, state: "uploading", progress: 0, error: undefined }));
    const timer = window.setInterval(() => {
      patchRow(id, (r) => (r.state === "uploading" ? { ...r, progress: Math.min(92, r.progress + 6 + Math.random() * 12) } : r));
    }, 140);
    timers.current.add(timer);
    try {
      const [img] = await Promise.all([readImageFile(file), wait(700)]);
      const asset = await adminApi.media.upload({ file, name: file.name, alt: "", dataUrl: img.dataUrl, width: img.width, height: img.height, sizeBytes: img.sizeBytes });
      patchRow(id, (r) => ({ ...r, state: "done", progress: 100 }));
      setItems((prev) => [asset, ...prev]);
      setFresh((s) => new Set(s).add(asset.id));
      files.current.delete(id);
      return asset;
    } catch (e) {
      patchRow(id, (r) => ({ ...r, state: "error", error: errorText(e, "Chưa lưu được ảnh này."), retryable: true }));
      return null;
    } finally {
      window.clearInterval(timer);
      timers.current.delete(timer);
    }
  }

  async function addFiles(list: FileList | File[] | null | undefined) {
    const picked = Array.from(list ?? []);
    if (fileRef.current) fileRef.current.value = "";
    if (picked.length === 0) return;
    const next: UploadRow[] = picked.map((f) => {
      const problem = checkImageFile(f);
      return { id: crypto.randomUUID(), name: f.name, size: f.size, progress: 0, state: problem ? "error" : "uploading", error: problem ?? undefined };
    });
    setRows((rs) => [...next, ...rs.filter((r) => r.state !== "done")]);
    const jobs = next.flatMap((r, i) => {
      if (r.state === "error") return [];
      files.current.set(r.id, picked[i]);
      return [sendOne(r.id, picked[i])];
    });
    const done = (await Promise.all(jobs)).filter(Boolean).length;
    if (done > 0) toast(`Đã tải lên ${done} ảnh`);
  }

  async function retry(id: string) {
    const file = files.current.get(id);
    if (!file) return;
    if (await sendOne(id, file)) toast("Đã tải lên 1 ảnh");
  }

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
  const dropHandlers = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e) || detail?.open) return;
      e.preventDefault();
      dragDepth.current += 1;
      setOver(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e) || detail?.open) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setOver(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e) || detail?.open) return;
      e.preventDefault();
      dragDepth.current = 0;
      setOver(false);
      addFiles(e.dataTransfer.files);
    },
  };

  const pick = () => fileRef.current?.click();
  const filtered = q.trim() !== "" || usage !== "all";

  return (
    <div {...dropHandlers} className="relative flex flex-col gap-6">
      <PageHeader
        title="Thư viện ảnh"
        description="Ảnh dùng cho trang chủ, trang đăng nhập và bìa album. Tải lên một lần, dùng lại ở nhiều chỗ."
        actions={
          <Button onClick={pick}>
            <UploadSimple size={18} /> Tải ảnh lên
          </Button>
        }
      />
      <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => addFiles(e.target.files)} />

      {items.length > 0 && (
        <button
          type="button"
          onClick={pick}
          className={`flex min-h-16 items-center justify-center gap-3 rounded-[var(--radius-paper)] border border-dashed px-4 py-4 text-sm text-ink-2 transition-colors hover:border-coral hover:text-ink ${over ? "border-coral bg-coral-wash text-coral-ink" : "border-line"}`}
        >
          <UploadSimple size={20} className="shrink-0" />
          <span>
            Kéo ảnh vào bất kỳ chỗ nào trên trang, hoặc <span className="font-semibold text-coral-ink underline underline-offset-2">chọn tệp</span>. JPG, PNG, WebP, tối đa 5 MB mỗi ảnh.
          </span>
        </button>
      )}

      <UploadQueue
        rows={rows}
        onRetry={retry}
        onDismiss={(id) => {
          files.current.delete(id);
          setRows((rs) => rs.filter((r) => r.id !== id));
        }}
        onClear={() => {
          files.current.clear();
          setRows([]);
        }}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Thư viện còn trống."
          body="Kéo ảnh từ máy tính thả vào trang này, hoặc bấm Tải ảnh lên. Ảnh ở đây dùng được cho trang chủ, trang đăng nhập và bìa album."
          action={
            <Button onClick={pick}>
              <UploadSimple size={18} /> Tải ảnh lên
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block min-w-0 flex-1 basis-60">
              <span className="sr-only">Tìm ảnh</span>
              <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc mô tả" className={`${inputClass} pl-10`} />
            </label>
            <div role="group" aria-label="Lọc theo chỗ dùng" className="flex rounded-full border border-line p-0.5">
              {usageTabs.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={usage === t.value}
                  onClick={() => setUsage(t.value)}
                  className={`h-10 rounded-full px-4 text-sm font-medium transition-colors ${usage === t.value ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              Sắp xếp
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass}>
                <option value="new">Mới nhất</option>
                <option value="name">Tên A-Z</option>
                <option value="size">Dung lượng</option>
              </select>
            </label>
            <p className="tabular ml-auto text-sm text-ink-3" aria-live="polite">
              {filtered ? `${shown.length} trên ${items.length} ảnh` : `${items.length} ảnh`}
            </p>
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-paper)] border border-line py-12 text-center">
              <p className="text-ink-2">{q.trim() ? `Không có ảnh nào khớp với "${q.trim()}".` : usage === "used" ? "Chưa có ảnh nào đang được dùng." : "Ảnh nào cũng đang được dùng."}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQ("");
                  setUsage("all");
                }}
              >
                Xoá bộ lọc
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <AnimatePresence initial={false}>
                {shown.map((m) => (
                  <motion.li
                    key={m.id}
                    layout={!reduce}
                    initial={reduce || !fresh.has(m.id) ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <MediaTile asset={m} isNew={fresh.has(m.id)} onOpen={() => setDetail((d) => ({ asset: m, n: (d?.n ?? 0) + 1, open: true }))} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}

      {detail && (
        <MediaDetail
          key={detail.n}
          asset={detail.asset}
          open={detail.open}
          onClose={() => setDetail((d) => d && { ...d, open: false })}
          onSaved={(next) => setItems((list) => list.map((m) => (m.id === next.id ? next : m)))}
          onRemoved={(id) => {
            setItems((list) => list.filter((m) => m.id !== id));
            setDetail((d) => d && { ...d, open: false });
          }}
        />
      )}

      {over && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-3 z-40 flex items-center justify-center rounded-[var(--radius-paper)] border-2 border-dashed border-coral bg-coral-wash/85">
          <p className="flex items-center gap-3 font-display text-2xl font-semibold text-coral-ink">
            <ImageSquare size={30} /> Thả ảnh vào để tải lên
          </p>
        </div>
      )}
    </div>
  );
}

function MediaTile({ asset, isNew, onOpen }: { asset: MediaAsset; isNew: boolean; onOpen: () => void }) {
  const used = asset.usedIn.length;
  return (
    <button type="button" onClick={onOpen} className="group block w-full rounded-[var(--radius-paper)] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral">
      <span className="sleeve relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper-3 transition-[border-color] group-hover:border-ink-3">
        <img src={asset.url} alt={asset.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]" />
        {isNew && <RibbonMark className="absolute right-3 top-0 h-7 w-4" />}
      </span>
      <span className="mt-2 block truncate text-sm font-medium text-ink">{asset.name}</span>
      <span className="tabular mt-0.5 block text-xs text-ink-3">
        {asset.width} x {asset.height} px, {formatSize(asset.sizeBytes)}
      </span>
      <span className="mt-1.5 block">{used > 0 ? <Tag tone="coral">Đang dùng ở {used} chỗ</Tag> : <Tag>Chưa dùng</Tag>}</span>
      {isNew && <span className="sr-only">Vừa tải lên</span>}
    </button>
  );
}

function LibrarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải thư viện ảnh" className="flex flex-col gap-6">
      <div className="h-16 rounded-[var(--radius-paper)] border border-dashed border-line" />
      <div className="flex flex-wrap gap-3">
        <div className="h-10 flex-1 basis-60 animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />
        <div className="h-10 w-64 animate-pulse rounded-full bg-paper-3" />
        <div className="h-10 w-40 animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />
            <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-paper-3" />
            <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-paper-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
