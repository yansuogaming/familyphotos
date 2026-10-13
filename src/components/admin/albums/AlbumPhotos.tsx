"use client";

/* eslint-disable @next/next/no-img-element -- photos may be local data URLs */
import { ArrowLeft, PencilSimple, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Button, IconButton } from "@/components/ui/Button";
import { useToast } from "@/components/settings/shared";
import { adminApi } from "@/lib/api/admin";
import type { AdminAlbum, AdminPhoto } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { ConfirmDialog, EmptyState, RibbonMark, dangerButton, errorText, formatDate } from "../ui";
import { dateRange } from "./shared";

/** One album opened: its photos, delete one or many. */
export function AlbumPhotos({ album, onBack, onEdit, onRemoved }: { album: AdminAlbum; onBack: () => void; onEdit: () => void; onRemoved: (count: number) => void }) {
  const photos = useApi(() => adminApi.albums.photos(album.id), [album.id]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
          <ArrowLeft size={16} /> Danh sách album
        </Button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
        <div className="relative min-w-0 pl-7">
          <RibbonMark className="absolute left-0 top-0 h-9 w-4" />
          <h1 className="text-3xl font-bold sm:text-4xl">{album.title}</h1>
          <p className="tabular mt-1.5 text-ink-2">
            {album.photoCount} ảnh, {dateRange(album.takenFrom, album.takenTo)}, {album.createdBy.name} tạo
          </p>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          <PencilSimple size={18} /> Sửa album
        </Button>
      </div>

      {photos.status === "loading" && (
        <div aria-busy="true" aria-label="Đang tải ảnh" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="rounded-[var(--radius-paper)] border border-line p-2">
              <div className="aspect-[4/3] animate-pulse rounded-[3px] bg-paper-3" />
              <div className="mt-2.5 h-4 w-2/3 animate-pulse rounded bg-paper-3" />
              <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-paper-3" />
            </div>
          ))}
        </div>
      )}
      {photos.status === "error" && <LoadError onRetry={photos.reload} what="ảnh trong album" />}
      {photos.status === "ready" && <PhotoGrid album={album} initial={photos.data} onRemoved={onRemoved} />}
    </div>
  );
}

function PhotoGrid({ album, initial, onRemoved }: { album: AdminAlbum; initial: AdminPhoto[]; onRemoved: (count: number) => void }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [confirm, setConfirm] = useState<{ ids: string[] } | null>(null);

  if (items.length === 0) {
    return <EmptyState title="Album này chưa có ảnh." body="Ảnh người trong nhà tải lên album này ở trang Album sẽ hiện ở đây." />;
  }

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const all = picked.size === items.length;

  async function remove(ids: string[]) {
    const gone: string[] = [];
    let failure: unknown = null;
    for (const id of ids) {
      try {
        await adminApi.albums.removePhoto(album.id, id);
        gone.push(id);
      } catch (e) {
        failure = e;
        break;
      }
    }
    if (gone.length) {
      setItems((list) => list.filter((p) => !gone.includes(p.id)));
      setPicked((s) => new Set([...s].filter((id) => !gone.includes(id))));
      onRemoved(gone.length);
    }
    if (failure) throw new Error(`Đã xoá ${gone.length} ảnh, còn ${ids.length - gone.length} ảnh chưa xoá được. ${errorText(failure)}`);
    toast(gone.length === 1 ? "Đã xoá 1 ảnh." : `Đã xoá ${gone.length} ảnh.`);
  }

  const one = confirm && confirm.ids.length === 1 ? items.find((p) => p.id === confirm.ids[0]) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`sticky top-2 z-10 flex min-h-14 flex-wrap items-center gap-3 rounded-[var(--radius-paper)] border px-4 py-2 transition-colors ${picked.size ? "border-coral bg-paper paper-shadow" : "border-line bg-paper"}`}
      >
        <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={all}
            ref={(el) => {
              if (el) el.indeterminate = picked.size > 0 && !all;
            }}
            onChange={() => setPicked(all ? new Set() : new Set(items.map((p) => p.id)))}
            className="size-4 accent-[var(--coral)]"
          />
          {picked.size ? `Đã chọn ${picked.size} ảnh` : `Chọn tất cả ${items.length} ảnh`}
        </label>
        {picked.size > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPicked(new Set())}>Bỏ chọn</Button>
            <button type="button" onClick={() => setConfirm({ ids: [...picked] })} className={`${dangerButton} h-10! px-4! text-sm!`}>
              <Trash size={16} /> Xoá {picked.size} ảnh
            </button>
          </div>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => {
          const on = picked.has(p.id);
          return (
            <li key={p.id}>
              <figure className={`relative rounded-[var(--radius-paper)] border bg-paper p-2 transition-colors ${on ? "border-coral ring-2 ring-coral/40" : "border-line"}`}>
                <div className="sleeve relative aspect-[4/3] overflow-hidden rounded-[3px] bg-paper-3">
                  <img src={p.url} alt={p.memo ?? `Ảnh trong ${album.title}`} loading="lazy" className="h-full w-full object-cover" />
                  <label className="absolute left-1.5 top-1.5 flex size-10 cursor-pointer items-center justify-center rounded-full bg-paper/90">
                    <input type="checkbox" checked={on} onChange={() => toggle(p.id)} aria-label={`Chọn ảnh ${p.memo ?? formatDate(p.takenAt)}`} className="size-4 accent-[var(--coral)]" />
                  </label>
                  <IconButton label={`Xoá ảnh ${p.memo ?? ""}`.trim()} onClick={() => setConfirm({ ids: [p.id] })} className="absolute right-1.5 top-1.5 bg-paper/90 hover:bg-paper hover:text-danger">
                    <Trash size={18} />
                  </IconButton>
                </div>
                <figcaption className="px-1 pt-2">
                  <p className="memo-lines truncate font-hand text-[1.05rem] leading-6 text-ink-2">{p.memo ?? "Không có ghi chú"}</p>
                  <p className="tabular mt-1 truncate text-xs text-ink-3">
                    {formatDate(p.takenAt)}, {p.uploadedBy.name}
                  </p>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm && confirm.ids.length > 1 ? `Xoá ${confirm.ids.length} ảnh?` : "Xoá ảnh này?"}
        body={
          confirm && confirm.ids.length > 1
            ? `${confirm.ids.length} ảnh đã chọn sẽ bị xoá khỏi album "${album.title}". Không thể hoàn tác.`
            : `Ảnh "${one?.memo ?? "không có ghi chú"}" sẽ bị xoá khỏi album "${album.title}". Không thể hoàn tác.`
        }
        confirmLabel={confirm && confirm.ids.length > 1 ? `Xoá ${confirm.ids.length} ảnh` : "Xoá ảnh"}
        onConfirm={() => remove(confirm?.ids ?? [])}
      />
    </div>
  );
}
