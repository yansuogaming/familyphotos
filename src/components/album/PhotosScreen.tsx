"use client";

import { ArrowClockwise, FolderPlus, UploadSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ToastProvider, useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import { mediaApi } from "@/lib/api/media";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { AlbumCover } from "./AlbumCover";
import { DropOverlay } from "./DropOverlay";
import { Lightbox, photoToItem } from "./Lightbox";
import { NewAlbumDialog } from "./NewAlbumDialog";
import { OnThisDay } from "./OnThisDay";
import { PhotoTile } from "./PhotoTile";
import { UploadDialog } from "./UploadDialog";
import { useFileDrop } from "./useFileDrop";

export function PhotosScreen() {
  return (
    <ToastProvider>
      <Photos />
    </ToastProvider>
  );
}

function Photos() {
  const albums = useApi(mediaApi.albums);
  const recent = useApi(mediaApi.recent);
  const router = useRouter();
  const toast = useToast();
  const s = useSession();
  // Everyone signed in, guests included, can create albums and upload photos.
  const canEdit = !!s;

  const [dialog, setDialog] = useState<null | "upload" | "album">(null);
  const [dropped, setDropped] = useState<File[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const stale = useRef(false);
  const items = useMemo(() => (recent.status === "ready" ? recent.data.map(photoToItem) : []), [recent]);

  const dragging = useFileDrop(
    (files) => {
      setDropped(files);
      setDialog("upload");
    },
    canEdit && dialog === null && albums.status === "ready",
  );

  const openUpload = () => {
    setDropped([]);
    setDialog("upload");
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Ảnh</h1>
          <p className="mt-1 text-ink-2">
            {albums.status === "ready" ? `${albums.data.length} album, ${albums.data.reduce((n, a) => n + a.photoCount, 0).toLocaleString("vi-VN")} ảnh` : "Đang mở album..."}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDialog("album")}><FolderPlus size={18} /> Album mới</Button>
            <Button onClick={openUpload} disabled={albums.status !== "ready"}><UploadSimple size={18} weight="bold" /> Thêm ảnh</Button>
          </div>
        )}
      </div>

      <section aria-labelledby="albums-h" className="mt-10">
        <h2 id="albums-h" className="sr-only">Album</h2>
        {albums.status === "loading" && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[8px] bg-paper-3" />)}
          </div>
        )}
        {albums.status === "error" && <LoadError onRetry={albums.reload} what="album" />}
        {albums.status === "ready" && albums.data.length === 0 && (
          <div className="oli oli-margin rounded-[var(--radius-paper)] border border-line py-16 pl-20 pr-6">
            <p className="font-display text-2xl font-semibold">Cuốn album đầu tiên đang chờ.</p>
            <p className="mt-2 max-w-[48ch] text-ink-2">Tạo một album cho dịp gần nhất, Tết, sinh nhật hay chuyến đi, rồi kéo ảnh vào.</p>
            {canEdit && <Button className="mt-6" onClick={() => setDialog("album")}><FolderPlus size={18} /> Tạo album</Button>}
          </div>
        )}
        {albums.status === "ready" && albums.data.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {albums.data.map((a) => (
              <AlbumCover key={a.id} href={`/anh/${a.id}`} title={a.title} coverUrl={a.coverUrl} meta={`${a.photoCount} ảnh, ${new Date(a.takenFrom).getFullYear()}`} />
            ))}
          </div>
        )}
      </section>

      <OnThisDay />

      <section aria-labelledby="recent-h" className="mt-16">
        <h2 id="recent-h" className="text-2xl font-bold">Mới thêm vào</h2>
        {recent.status === "loading" && (
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />)}
          </div>
        )}
        {recent.status === "error" && <LoadError onRetry={recent.reload} />}
        {recent.status === "ready" && recent.data.length === 0 && (
          <p className="mt-4 text-ink-2">Chưa có ảnh mới. Ảnh cả nhà vừa thêm sẽ hiện ở đây.</p>
        )}
        {recent.status === "ready" && recent.data.length > 0 && (
          <div className="mt-6 columns-2 gap-5 md:columns-3 xl:columns-4 [&>*]:mb-5 [&>*]:break-inside-avoid">
            {recent.data.map((p, i) => (
              <PhotoTile
                key={p.id}
                photo={p}
                layoutId={`recent-${p.id}`}
                onOpen={() => setOpen(i)}
                footer={<p className="mt-1.5 px-1 text-xs text-ink-3">{p.uploadedBy.name} thêm</p>}
              />
            ))}
          </div>
        )}
      </section>

      <Lightbox items={items} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} layoutPrefix="recent" />

      <UploadDialog
          open={dialog === "upload"}
          onClose={() => {
            setDialog(null);
            if (stale.current) {
              stale.current = false;
              albums.reload();
              recent.reload();
            }
          }}
          albums={albums.status === "ready" ? albums.data : []}
          initialFiles={dropped}
          onUploaded={(to, photos, created) => {
            stale.current = true;
            toast(created ? `Đã tạo album ${created.title}` : `Đã thêm ${photos.length} ảnh`);
          }}
        />
      <NewAlbumDialog
        open={dialog === "album"}
        onClose={() => setDialog(null)}
        onCreated={(a) => {
          setDialog(null);
          toast(`Đã tạo album ${a.title}`);
          router.push(`/anh/${a.id}`);
        }}
      />
      <DropOverlay show={dragging} />
    </div>
  );
}

export function LoadError({ onRetry, what = "ảnh" }: { onRetry: () => void; what?: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-5 py-4">
      <p className="text-ink-2">Chưa tải được {what}. Có thể mạng đang chập chờn.</p>
      <Button variant="secondary" size="sm" onClick={onRetry}><ArrowClockwise size={16} /> Tải lại</Button>
    </div>
  );
}
