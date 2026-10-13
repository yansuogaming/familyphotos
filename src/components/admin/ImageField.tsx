"use client";

/* eslint-disable @next/next/no-img-element -- previews may be local data URLs */
import { ArrowCounterClockwise, CheckCircle, Images, MagnifyingGlass, UploadSimple } from "@/components/ui/icons";
import { useId, useRef, useState, type DragEvent } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";
import type { MediaAsset } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { IMAGE_ACCEPT, readImageFile } from "./image-file";
import { EmptyState, ErrorNote, Modal, TextField, errorText, inputClass } from "./ui";

export interface ImageValue {
  url: string;
  alt: string;
  mediaId?: string;
}

/**
 * One editable image: preview, upload (goes into the library), pick from the
 * library, restore the default. Alt text sits under it.
 */
export function ImageField({
  label,
  value,
  defaultValue,
  onChange,
  ratio = "4/3",
  showAlt = true,
  altHint = "Một câu tả ảnh cho người dùng trình đọc màn hình. Để trống nếu ảnh chỉ để trang trí.",
}: {
  label: string;
  value: ImageValue;
  defaultValue?: ImageValue;
  onChange: (next: ImageValue) => void;
  ratio?: string;
  showAlt?: boolean;
  altHint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [over, setOver] = useState(false);
  const labelId = useId();
  const isDefault = !!defaultValue && defaultValue.url === value.url;

  async function takeFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const img = await readImageFile(file);
      const asset = await adminApi.media.upload({
        file,
        name: file.name,
        alt: value.alt,
        dataUrl: img.dataUrl,
        width: img.width,
        height: img.height,
        sizeBytes: img.sizeBytes,
      });
      onChange({ ...value, url: asset.url, mediaId: asset.id });
    } catch (e) {
      setError(errorText(e, "Chưa tải được ảnh này."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    takeFile(e.dataTransfer.files[0]);
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-3">
      <p id={labelId} className="text-sm font-semibold">{label}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={`relative w-full shrink-0 overflow-hidden rounded-[var(--radius-paper)] border bg-paper-3 sm:w-44 ${over ? "border-coral ring-2 ring-coral/40" : "border-line"}`}
          style={{ aspectRatio: ratio }}
        >
          {value.url ? <img src={value.url} alt="" className={`h-full w-full object-cover ${busy ? "opacity-40" : ""}`} /> : null}
          {busy && <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink">Đang tải lên...</span>}
          {over && !busy && <span className="absolute inset-0 flex items-center justify-center bg-coral-wash/80 text-sm font-semibold text-coral-ink">Thả ảnh vào đây</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
              <UploadSimple size={16} /> Tải ảnh lên
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPicking(true)} disabled={busy}>
              <Images size={16} /> Chọn từ thư viện
            </Button>
            {defaultValue && (
              <Button size="sm" variant="ghost" onClick={() => onChange({ ...defaultValue })} disabled={busy || isDefault} title={isDefault ? "Đang dùng ảnh mặc định" : undefined}>
                <ArrowCounterClockwise size={16} /> Khôi phục mặc định
              </Button>
            )}
            <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => takeFile(e.target.files?.[0])} />
          </div>
          <p className="text-xs text-ink-3">JPG, PNG hoặc WebP, tối đa 5 MB. Có thể kéo thả ảnh vào khung.</p>
          {error && <ErrorNote>{error}</ErrorNote>}
          {showAlt && <TextField label="Mô tả ảnh" value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} hint={altHint} />}
        </div>
      </div>
      <LibraryPicker
        open={picking}
        onClose={() => setPicking(false)}
        selectedUrl={value.url}
        onPick={(m) => {
          onChange({ url: m.url, mediaId: m.id, alt: value.alt || m.alt });
          setPicking(false);
        }}
      />
    </div>
  );
}

/** Modal grid of the media library; pick one image. */
export function LibraryPicker({ open, onClose, onPick, selectedUrl }: { open: boolean; onClose: () => void; onPick: (m: MediaAsset) => void; selectedUrl?: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Chọn ảnh từ thư viện" description="Bấm vào một ảnh để dùng ngay." size="xl">
      {open && <PickerBody onPick={onPick} selectedUrl={selectedUrl} />}
    </Modal>
  );
}

function PickerBody({ onPick, selectedUrl }: { onPick: (m: MediaAsset) => void; selectedUrl?: string }) {
  const media = useApi(adminApi.media.list);
  const [q, setQ] = useState("");
  const shown = media.status === "ready" ? media.data.filter((m) => `${m.name} ${m.alt}`.toLowerCase().includes(q.trim().toLowerCase())) : [];

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block max-w-sm">
        <span className="sr-only">Tìm ảnh</span>
        <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc mô tả" className={`${inputClass} pl-10`} />
      </label>
      {media.status === "loading" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />)}
        </div>
      )}
      {media.status === "error" && <LoadError onRetry={media.reload} what="thư viện ảnh" />}
      {media.status === "ready" && media.data.length === 0 && (
        <EmptyState title="Thư viện còn trống." body="Đóng hộp này rồi bấm Tải ảnh lên, ảnh sẽ được cất vào thư viện để dùng lại." />
      )}
      {media.status === "ready" && media.data.length > 0 && shown.length === 0 && <p className="py-8 text-center text-ink-2">Không có ảnh nào khớp với “{q}”.</p>}
      {shown.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((m) => {
            const on = m.url === selectedUrl;
            return (
              <li key={m.id}>
                <button
                  onClick={() => onPick(m)}
                  aria-pressed={on}
                  className={`group block w-full rounded-[var(--radius-paper)] border bg-paper p-1.5 text-left transition-colors hover:border-coral ${on ? "border-coral ring-2 ring-coral/40" : "border-line"}`}
                >
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-[3px] bg-paper-3">
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    {on && <CheckCircle size={26} weight="fill" className="absolute right-1.5 top-1.5 text-coral" />}
                  </span>
                  <span className="mt-1.5 block truncate px-0.5 text-sm font-medium">{m.name}</span>
                  <span className="block truncate px-0.5 text-xs text-ink-3">{m.width} x {m.height}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
