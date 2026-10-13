"use client";

import { Check } from "@/components/ui/icons";
import Image from "next/image";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { mediaApi } from "@/lib/api/media";
import type { Album } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/useApi";
import { Dialog } from "./Modal";

export function MovePhotosDialog({
  open,
  onClose,
  fromAlbumId,
  count,
  onMoved,
}: {
  open: boolean;
  onClose: () => void;
  fromAlbumId: string;
  count: number;
  onMoved: (to: Album) => Promise<void>;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Chuyển ${count} ảnh`} description="Chọn album mới cho các ảnh này." size="md">
      <Body fromAlbumId={fromAlbumId} onClose={onClose} onMoved={onMoved} />
    </Dialog>
  );
}

function Body({ fromAlbumId, onClose, onMoved }: { fromAlbumId: string; onClose: () => void; onMoved: (to: Album) => Promise<void> }) {
  const albums = useApi(mediaApi.albums);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Photos only move between albums of the same kind (family to family, a guest's own albums).
  const from = albums.status === "ready" ? albums.data.find((a) => a.id === fromAlbumId) : undefined;
  const list = albums.status === "ready" ? albums.data.filter((a) => a.id !== fromAlbumId && a.canUpload && a.space === from?.space) : [];

  async function move() {
    const to = list.find((a) => a.id === pick);
    if (!to) return setError("Chọn một album.");
    setBusy(true);
    try {
      await onMoved(to);
    } catch {
      setError("Chưa chuyển được. Thử lại nhé.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {albums.status === "loading" && (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => <span key={i} className="h-16 animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />)}
        </div>
      )}
      {albums.status === "error" && (
        <p className="text-sm text-ink-2">
          Chưa tải được danh sách album. <button onClick={albums.reload} className="font-semibold text-coral-ink underline">Tải lại</button>
        </p>
      )}
      {albums.status === "ready" && list.length === 0 && <p className="text-ink-2">Chưa có album nào khác. Tạo album mới trước đã.</p>}
      {list.length > 0 && (
        <div role="radiogroup" aria-label="Album đích" className="flex flex-col gap-1.5">
          {list.map((a) => (
            <label
              key={a.id}
              className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-paper)] border p-2 pr-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-coral ${
                pick === a.id ? "border-coral bg-coral-wash" : "border-line hover:border-ink-3"
              }`}
            >
              <input type="radio" name="move-to" value={a.id} checked={pick === a.id} onChange={() => setPick(a.id)} className="sr-only" />
              <span className="vinyl relative size-12 shrink-0 overflow-hidden rounded-[4px] p-1">
                <span className="relative block size-full overflow-hidden rounded-[2px]">
                  <Image src={a.coverUrl} alt="" fill sizes="48px" unoptimized={a.coverUrl.startsWith("data:")} className="object-cover" />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{a.title}</span>
                <span className="tabular text-sm text-ink-3">{a.photoCount} ảnh, {new Date(a.takenFrom).getFullYear()}</span>
              </span>
              {pick === a.id && <Check size={20} weight="bold" className="text-coral-ink" />}
            </label>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6">
        <button className={buttonClass("ghost")} onClick={onClose}>Huỷ</button>
        <button className={buttonClass("primary")} onClick={move} disabled={busy || !pick}>{busy ? "Đang chuyển..." : "Chuyển ảnh"}</button>
      </div>
    </div>
  );
}
