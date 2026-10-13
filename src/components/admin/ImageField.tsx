"use client";

/* eslint-disable @next/next/no-img-element -- previews may be local data URLs or any pasted address, which next/image cannot load */
import { ArrowCounterClockwise, CheckCircle, ImageSquare, Images, LinkSimple, MagnifyingGlass, UploadSimple } from "@/components/ui/icons";
import { useId, useRef, useState, type DragEvent } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";
import type { MediaAsset } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { IMAGE_ACCEPT, assertImageFile } from "./image-file";
import { EmptyState, ErrorNote, Modal, TextField, errorText, inputClass } from "./ui";

export interface ImageValue {
  url: string;
  alt: string;
  mediaId?: string;
}

/**
 * One editable image: preview, upload (goes into the library), pick from the
 * library, paste an image address, restore the default. Alt text sits under it.
 * Lays itself out by its own width (container query): side by side in wide
 * forms, stacked in narrow side panels.
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
  const [byUrl, setByUrl] = useState(false);
  const [over, setOver] = useState(false);
  const labelId = useId();
  const urlPanelId = useId();
  const isDefault = !!defaultValue && defaultValue.url === value.url;

  async function takeFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      assertImageFile(file);
      const asset = await adminApi.media.upload({ file, name: file.name, alt: value.alt });
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
    <div role="group" aria-labelledby={labelId} className="@container flex min-w-0 flex-col gap-3">
      <p id={labelId} className="text-sm font-semibold">{label}</p>
      <div className="flex flex-col gap-3 @lg:flex-row @lg:items-start @lg:gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={`relative w-full shrink-0 overflow-hidden rounded-[var(--radius-paper)] border bg-paper-3 @lg:w-44 ${over ? "border-coral ring-2 ring-coral/40" : "border-line"}`}
          style={{ aspectRatio: ratio }}
        >
          {value.url ? (
            <img src={value.url} alt="" className={`h-full w-full object-cover ${busy ? "opacity-40" : ""}`} />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-ink-3">
              <ImageSquare size={22} aria-hidden="true" />
              <span className="text-xs">Chưa có ảnh</span>
            </span>
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink">Đang tải lên...</span>}
          {over && !busy && <span className="absolute inset-0 flex items-center justify-center bg-coral-wash/80 text-sm font-semibold text-coral-ink">Thả ảnh vào đây</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" className="!h-10" onClick={() => fileRef.current?.click()} disabled={busy}>
              <UploadSimple size={16} /> Tải ảnh lên
            </Button>
            <Button size="sm" variant="secondary" className="!h-10" onClick={() => setPicking(true)} disabled={busy}>
              <Images size={16} /> Chọn từ thư viện
            </Button>
            <Button
              size="sm"
              variant={byUrl ? "secondary" : "ghost"}
              className="!h-10"
              aria-expanded={byUrl}
              aria-controls={byUrl ? urlPanelId : undefined}
              onClick={() => setByUrl((v) => !v)}
              disabled={busy}
            >
              <LinkSimple size={16} /> Dùng URL
            </Button>
            {defaultValue && (
              <Button size="sm" variant="ghost" className="!h-10" onClick={() => onChange({ ...defaultValue })} disabled={busy || isDefault} title={isDefault ? "Đang dùng ảnh mặc định" : undefined}>
                <ArrowCounterClockwise size={16} /> Khôi phục mặc định
              </Button>
            )}
            <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => takeFile(e.target.files?.[0])} />
          </div>
          {byUrl && (
            <UrlPanel
              id={urlPanelId}
              onCancel={() => setByUrl(false)}
              onUse={(url) => {
                const rest = { ...value };
                delete rest.mediaId;
                onChange({ ...rest, url });
                setError(null);
                setByUrl(false);
              }}
            />
          )}
          <p className="text-xs leading-snug text-ink-3">JPG, PNG hoặc WebP, tối đa 5 MB. Kéo thả được.</p>
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

type UrlCheck = { status: "idle" } | { status: "checking" } | { status: "ok"; url: string } | { status: "error"; message: string };

/**
 * Paste an image address. The image is opened once in the browser to make
 * sure it loads; the field then keeps the address itself as its value.
 */
function UrlPanel({ id, onUse, onCancel }: { id: string; onUse: (url: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const [check, setCheck] = useState<UrlCheck>({ status: "idle" });
  const token = useRef(0);
  const url = text.trim();
  const insecure = /^http:\/\//i.test(url);

  function run() {
    if (!url) return setCheck({ status: "error", message: "Dán địa chỉ của ảnh vào ô trên." });
    if (!/^https?:\/\/[^\s/]+\.[^\s]+/i.test(url)) return setCheck({ status: "error", message: "Địa chỉ cần bắt đầu bằng https://" });
    const mine = ++token.current;
    setCheck({ status: "checking" });
    const img = new window.Image();
    img.onload = () => {
      if (mine === token.current) setCheck({ status: "ok", url });
    };
    img.onerror = () => {
      if (mine === token.current) setCheck({ status: "error", message: "Không mở được ảnh từ địa chỉ này." });
    };
    img.src = url;
  }

  const ready = check.status === "ok" && check.url === url;
  const inputError = check.status === "error" ? check.message : undefined;

  return (
    <div id={id} className="flex flex-col gap-3 rounded-[var(--radius-paper)] bg-paper-2 p-3">
      <TextField
        label="Địa chỉ ảnh"
        type="url"
        inputMode="url"
        autoFocus
        spellCheck={false}
        placeholder="https://..."
        value={text}
        error={inputError}
        hint={insecure ? "Địa chỉ http:// không được mã hoá. Ảnh có thể bị chặn trên trang https." : undefined}
        onChange={(e) => {
          token.current++;
          setText(e.target.value);
          setCheck({ status: "idle" });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (ready) onUse(url);
            else run();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
        }}
      />
      {ready && (
        <img src={check.url} alt="Xem trước ảnh từ địa chỉ vừa dán" className="aspect-video w-full rounded-[var(--radius-paper)] border border-line bg-paper-3 object-cover @lg:w-44" />
      )}
      <div className="flex flex-wrap gap-2" aria-live="polite">
        {ready ? (
          <Button size="sm" className="!h-10" onClick={() => onUse(url)}>
            <CheckCircle size={16} /> Dùng ảnh này
          </Button>
        ) : (
          <Button size="sm" variant="secondary" className="!h-10" onClick={run} disabled={check.status === "checking"}>
            {check.status === "checking" ? "Đang mở ảnh..." : "Kiểm tra ảnh"}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="!h-10" onClick={onCancel}>
          Huỷ
        </Button>
      </div>
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
