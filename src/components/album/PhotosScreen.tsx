"use client";

import { ArrowClockwise, FolderPlus, LockKey, UploadSimple } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ToastProvider, useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import { mediaApi } from "@/lib/api/media";
import type { MediaAlbum } from "@/lib/api/media-types";
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
  const isGuest = s?.user.role === "guest";
  // Everyone signed in, guests included, can create albums and upload photos.
  const canEdit = !!s;
  const all = albums.status === "ready" ? albums.data : [];
  // Family photos and guest photos never share a shelf.
  const shelves: { id: string; title: string; note?: string; albums: MediaAlbum[]; empty?: string }[] = isGuest
    ? [
        {
          id: "mine",
          title: "Album của bạn",
          note: "Chỉ bạn và người trong nhà xem được. Khách khác không thấy.",
          albums: all.filter((a) => a.space === "guest"),
          empty: "Bạn chưa có album nào. Tạo một album để cất ảnh kỷ niệm của mình.",
        },
        { id: "shared", title: "Nhà chia sẻ với bạn", note: "Người trong nhà cho bạn xem. Bạn chỉ xem, không sửa.", albums: all.filter((a) => a.sharedWithMe) },
      ]
    : [
        { id: "family", title: "Album của nhà", albums: all.filter((a) => a.space === "family"), empty: "Tạo một album cho dịp gần nhất, Tết, sinh nhật hay chuyến đi, rồi kéo ảnh vào." },
        { id: "guests", title: "Ảnh khách gửi", note: "Album khách tự tạo. Để riêng, không lẫn với ảnh của nhà.", albums: all.filter((a) => a.space === "guest") },
      ];
  const uploadTargets = all.filter((a) => a.canUpload);

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
            {albums.status === "ready" ? `${all.length} album, ${all.reduce((n, a) => n + a.photoCount, 0).toLocaleString("vi-VN")} ảnh` : "Đang mở album..."}
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
        {albums.status === "ready" && (
          <div className="flex flex-col gap-14">
            {shelves.map((shelf) =>
              shelf.albums.length === 0 && !shelf.empty ? null : (
                <section key={shelf.id} aria-labelledby={`shelf-${shelf.id}`}>
                  <h2 id={`shelf-${shelf.id}`} className="text-2xl font-bold">{shelf.title}</h2>
                  {shelf.note && (
                    <p className="mt-1 flex items-center gap-2 text-sm text-ink-2">
                      <LockKey size={16} className="shrink-0 text-ink-3" /> {shelf.note}
                    </p>
                  )}
                  {shelf.albums.length === 0 ? (
                    <div className="oli oli-margin mt-5 rounded-[var(--radius-paper)] border border-line py-12 pl-20 pr-6">
                      <p className="font-display text-xl font-semibold">Cuốn album đầu tiên đang chờ.</p>
                      <p className="mt-2 max-w-[52ch] text-ink-2">{shelf.empty}</p>
                      {canEdit && <Button className="mt-6" onClick={() => setDialog("album")}><FolderPlus size={18} /> Tạo album</Button>}
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                      {shelf.albums.map((a) => (
                        <AlbumCover
                          key={a.id}
                          href={`/photos/${a.id}`}
                          title={a.title}
                          coverUrl={a.coverUrl}
                          meta={a.space === "guest" && !isGuest && a.owner ? `${a.owner.name}, ${a.photoCount} ảnh` : `${a.photoCount} ảnh, ${new Date(a.takenFrom).getFullYear()}`}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ),
            )}
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
          <p className="mt-4 text-ink-2">{isGuest ? "Chưa có ảnh nào. Ảnh bạn thêm sẽ hiện ở đây." : "Chưa có ảnh mới. Ảnh cả nhà vừa thêm sẽ hiện ở đây."}</p>
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
          albums={uploadTargets}
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
          router.push(`/photos/${a.id}`);
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
