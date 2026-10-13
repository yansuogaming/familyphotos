"use client";

/* eslint-disable @next/next/no-img-element -- previews are local blob URLs */
import { ArrowClockwise, CaretDown, CheckCircle, CloudArrowUp, ImageSquare, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import { formatBytes } from "@/components/settings/shared";
import { buttonClass } from "@/components/ui/Button";
import { mediaApi } from "@/lib/api/media";
import { checkUpload, UPLOAD_ACCEPT } from "@/lib/api/media-types";
import type { Album, Photo } from "@/lib/api/types";
import { Dialog, inputClass } from "./Modal";
import { useFileDrop } from "./useFileDrop";

type Status = "ready" | "invalid" | "uploading" | "done" | "failed" | "cancelled";
interface Item {
  id: string;
  file: File;
  preview: string | null;
  status: Status;
  progress: number;
  error?: string;
}

const NEW = "__new__";
const PARALLEL = 3;

const size = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : formatBytes(n));

function toItems(files: File[]): Item[] {
  return files.map((file) => {
    const error = checkUpload(file) ?? undefined;
    return {
      id: crypto.randomUUID(),
      file,
      preview: error ? null : URL.createObjectURL(file),
      status: error ? "invalid" : "ready",
      progress: 0,
      error,
    };
  });
}

export function UploadDialog({
  open,
  onClose,
  albums,
  albumId,
  initialFiles = [],
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  albums: Album[];
  /** Preselected target album. */
  albumId?: string;
  initialFiles?: File[];
  onUploaded: (albumId: string, photos: Photo[], created?: Album) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Thêm ảnh" description="Ảnh sẽ vào album bạn chọn. Cả nhà sẽ thấy ngay." size="lg">
      <Body albums={albums} albumId={albumId} initialFiles={initialFiles} onUploaded={onUploaded} onClose={onClose} />
    </Dialog>
  );
}

function Body({
  albums,
  albumId,
  initialFiles,
  onUploaded,
  onClose,
}: {
  albums: Album[];
  albumId?: string;
  initialFiles: File[];
  onUploaded: (albumId: string, photos: Photo[], created?: Album) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [items, setItems] = useState<Item[]>(() => toItems(initialFiles));
  const [target, setTarget] = useState(albumId ?? albums[0]?.id ?? NEW);
  const [newName, setNewName] = useState("");
  const [phase, setPhase] = useState<"pick" | "uploading" | "done">("pick");
  const [formError, setFormError] = useState<string | null>(null);
  const [destTitle, setDestTitle] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const cancelled = useRef(new Set<string>());
  const all = useRef(items);
  useEffect(() => {
    all.current = items;
  });

  // Abort and free previews when the dialog closes.
  useEffect(() => {
    const ctrls = controllers.current;
    return () => {
      ctrls.forEach((c) => c.abort());
      all.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
    };
  }, []);

  const add = (files: File[]) => setItems((cur) => [...cur, ...toItems(files)]);
  const dragging = useFileDrop(add, phase === "pick");
  const patch = (itemId: string, p: Partial<Item>) => setItems((cur) => cur.map((i) => (i.id === itemId ? { ...i, ...p } : i)));

  function remove(item: Item) {
    if (item.status === "uploading") {
      controllers.current.get(item.id)?.abort();
      return;
    }
    if (phase === "uploading" && item.status === "ready") {
      cancelled.current.add(item.id);
      patch(item.id, { status: "cancelled" });
      return;
    }
    if (item.preview) URL.revokeObjectURL(item.preview);
    setItems((cur) => cur.filter((i) => i.id !== item.id));
  }

  const ready = items.filter((i) => i.status === "ready" || i.status === "failed");

  async function start() {
    setFormError(null);
    if (ready.length === 0) return setFormError("Chọn ít nhất một ảnh hợp lệ.");
    if (target === NEW && !newName.trim()) return setFormError("Đặt tên cho album mới.");
    setPhase("uploading");

    let dest = target;
    let created: Album | undefined;
    try {
      if (target === NEW) {
        const today = new Date().toISOString().slice(0, 10);
        created = await mediaApi.createAlbum({ title: newName.trim(), takenFrom: today, takenTo: today });
        dest = created.id;
        setTarget(dest);
      }
    } catch {
      setPhase("pick");
      return setFormError("Chưa tạo được album. Thử lại nhé.");
    }
    setDestTitle(created?.title ?? albums.find((a) => a.id === dest)?.title ?? "album");

    const queue = ready.map((i) => i.id);
    const done: Photo[] = [];
    const worker = async () => {
      while (queue.length) {
        const itemId = queue.shift()!;
        const item = all.current.find((i) => i.id === itemId);
        if (!item || cancelled.current.has(itemId)) continue;
        const ctrl = new AbortController();
        controllers.current.set(itemId, ctrl);
        patch(itemId, { status: "uploading", progress: 0, error: undefined });
        try {
          const photo = await mediaApi.upload(dest, item.file, { signal: ctrl.signal, onProgress: (f) => patch(itemId, { progress: f }) });
          done.push(photo);
          patch(itemId, { status: "done", progress: 1 });
        } catch (e) {
          const aborted = e instanceof DOMException && e.name === "AbortError";
          patch(itemId, aborted ? { status: "cancelled" } : { status: "failed", error: e instanceof Error && e.message ? e.message : "Mạng chập chờn, chưa tải được." });
        } finally {
          controllers.current.delete(itemId);
        }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    setPhase("done");
    if (done.length || created) onUploaded(dest, done, created);
  }

  const doneCount = items.filter((i) => i.status === "done").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const running = phase === "uploading";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-album`} className="text-sm font-semibold">Vào album</label>
          <div className="relative">
            <select
              id={`${id}-album`}
              value={target}
              disabled={phase !== "pick"}
              onChange={(e) => setTarget(e.target.value)}
              className={`${inputClass} appearance-none pr-10`}
            >
              {albums.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
              <option value={NEW}>Tạo album mới...</option>
            </select>
            <CaretDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-3" />
          </div>
        </div>
        {target === NEW && phase === "pick" && (
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-name`} className="text-sm font-semibold">Tên album mới</label>
            <input
              id={`${id}-name`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={60}
              placeholder="Ví dụ: Trung thu 2026"
              aria-invalid={!!formError && !newName.trim()}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {phase === "pick" && (
        <div
          className={`flex flex-col items-center gap-3 rounded-[var(--radius-paper)] border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragging ? "border-coral bg-coral-wash" : "border-rule bg-paper-2"
          }`}
        >
          <CloudArrowUp size={36} className={dragging ? "text-coral-ink" : "text-ink-3"} />
          <div>
            <p className="font-semibold">{dragging ? "Thả ra để thêm" : "Kéo ảnh vào đây"}</p>
            <p className="text-sm text-ink-3">JPG, PNG, WEBP hoặc HEIC. Mỗi ảnh tối đa 25 MB.</p>
          </div>
          <button type="button" onClick={() => input.current?.click()} className={buttonClass("secondary", "sm")}>
            <ImageSquare size={18} /> Chọn ảnh từ máy
          </button>
          <input
            ref={input}
            type="file"
            multiple
            accept={UPLOAD_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              add([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-paper)] border border-line" aria-label="Ảnh sẽ tải lên">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-[3px] bg-paper-3">
                {it.preview ? (
                  <img src={it.preview} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-ink-3"><ImageSquare size={22} /></span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{it.file.name}</p>
                <p className="tabular text-xs text-ink-3">{size(it.file.size)}</p>
                {it.status === "uploading" && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      role="progressbar"
                      aria-label={`Đang tải ${it.file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(it.progress * 100)}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-3"
                    >
                      <span className="block h-full rounded-full bg-coral transition-[width] duration-150" style={{ width: `${it.progress * 100}%` }} />
                    </span>
                    <span className="tabular w-9 text-right text-xs text-ink-2">{Math.round(it.progress * 100)}%</span>
                  </div>
                )}
                {(it.status === "invalid" || it.status === "failed") && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-danger"><WarningCircle size={14} weight="fill" /> {it.error}</p>
                )}
                {it.status === "cancelled" && <p className="mt-0.5 text-xs text-ink-3">Đã huỷ</p>}
              </div>
              {it.status === "done" ? (
                <CheckCircle size={26} weight="fill" className="mx-2 shrink-0 text-ok" aria-label="Đã tải lên" />
              ) : it.status === "cancelled" && running ? null : (
                <button
                  type="button"
                  onClick={() => remove(it)}
                  aria-label={it.status === "uploading" ? `Huỷ tải ${it.file.name}` : `Bỏ ${it.file.name}`}
                  title={it.status === "uploading" ? "Huỷ tải" : "Bỏ ảnh này"}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink"
                >
                  <X size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] items-center justify-end gap-2 border-t border-line px-5 py-4 sm:-mx-6 sm:px-6" aria-live="polite">
        <p className="mr-auto text-sm text-ink-2">
          {phase === "done"
            ? `Đã thêm ${doneCount} ảnh vào ${destTitle}.${failedCount ? ` ${failedCount} ảnh chưa được.` : ""}`
            : running
              ? `Đang tải lên ${doneCount}/${doneCount + items.filter((i) => i.status === "uploading" || i.status === "ready").length}`
              : items.length
                ? `${ready.length} ảnh sẵn sàng${items.length - ready.length ? `, ${items.length - ready.length} ảnh bị bỏ qua` : ""}`
                : "Chưa chọn ảnh nào"}
        </p>
        {phase === "done" ? (
          <>
            {failedCount > 0 && (
              <button type="button" className={buttonClass("secondary")} onClick={() => void start()}>
                <ArrowClockwise size={18} /> Thử lại ảnh lỗi
              </button>
            )}
            <button type="button" className={buttonClass("primary")} onClick={onClose}>Xong</button>
          </>
        ) : (
          <>
            <button type="button" className={buttonClass("ghost")} onClick={onClose}>{running ? "Dừng và đóng" : "Huỷ"}</button>
            <button type="button" className={buttonClass("primary")} disabled={running || ready.length === 0} onClick={() => void start()}>
              {running ? "Đang tải lên..." : `Tải lên ${ready.length || ""} ảnh`.replace("  ", " ")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
