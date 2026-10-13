"use client";

/* eslint-disable @next/next/no-img-element -- covers may be local data URLs */
import { Images, MagnifyingGlass, PencilSimple, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Button, IconButton } from "@/components/ui/Button";
import { useToast } from "@/components/settings/shared";
import { adminApi } from "@/lib/api/admin";
import type { AdminAlbum, AdminUser } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { AlbumEditor } from "./albums/AlbumEditor";
import { AlbumPhotos } from "./albums/AlbumPhotos";
import { dateRange, sharedGuests } from "./albums/shared";
import { ConfirmDialog, EmptyState, PageHeader, RowsSkeleton, Tag, inputClass, selectClass } from "./ui";

const loadAll = () => Promise.all([adminApi.albums.list(), adminApi.users.list()]);

export function AlbumsScreen() {
  const data = useApi(loadAll);
  if (data.status === "ready") return <Albums initial={data.data[0]} guests={data.data[1].filter((u) => u.role === "guest")} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Album" description="Đổi tên, ảnh bìa và người được xem của từng album. Xoá ảnh không hợp." />
      {data.status === "loading" ? <RowsSkeleton rows={5} cols={4} /> : <LoadError onRetry={data.reload} what="danh sách album" />}
    </div>
  );
}

function Albums({ initial, guests }: { initial: AdminAlbum[]; guests: AdminUser[] }) {
  const toast = useToast();
  const [albums, setAlbums] = useState(initial);
  const [q, setQ] = useState("");
  const [who, setWho] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ album: AdminAlbum; n: number; open: boolean } | null>(null);
  const [removing, setRemoving] = useState<AdminAlbum | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return albums.filter((a) => {
      if (needle && !a.title.toLowerCase().includes(needle)) return false;
      if (who === "family") return a.visibility.kind === "family";
      if (who === "shared") return a.visibility.kind === "shared";
      if (who.startsWith("g:")) return a.visibility.kind === "shared" && a.visibility.guestIds.includes(who.slice(2));
      return true;
    });
  }, [albums, q, who]);

  const edit = (album: AdminAlbum) => setEditing((e) => ({ album, n: (e?.n ?? 0) + 1, open: true }));
  const opened = openId ? albums.find((a) => a.id === openId) : undefined;

  const dialogs = (
    <>
      {editing && (
        <AlbumEditor
          key={editing.n}
          album={editing.album}
          guests={guests}
          open={editing.open}
          onClose={() => setEditing((e) => e && { ...e, open: false })}
          onSaved={(next) => setAlbums((list) => list.map((a) => (a.id === next.id ? next : a)))}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Xoá cả album?"
        typeToConfirm={removing?.title}
        confirmLabel="Xoá album"
        body={
          removing && (
            <p>
              Album &quot;{removing.title}&quot; và{" "}
              <strong className="text-ink">{removing.photoCount > 0 ? `cả ${removing.photoCount} ảnh trong đó` : "mọi thông tin của nó"}</strong> sẽ bị xoá vĩnh viễn. Người trong nhà và khách sẽ không xem được nữa. Không thể hoàn tác.
            </p>
          )
        }
        onConfirm={async () => {
          if (!removing) return;
          await adminApi.albums.remove(removing.id);
          setAlbums((list) => list.filter((a) => a.id !== removing.id));
          if (openId === removing.id) setOpenId(null);
          toast(`Đã xoá album "${removing.title}".`);
        }}
      />
    </>
  );

  if (opened) {
    return (
      <>
        <AlbumPhotos
          key={opened.id}
          album={opened}
          onBack={() => setOpenId(null)}
          onEdit={() => edit(opened)}
          onRemoved={(count) => setAlbums((list) => list.map((a) => (a.id === opened.id ? { ...a, photoCount: Math.max(0, a.photoCount - count) } : a)))}
        />
        {dialogs}
      </>
    );
  }

  const filtered = q.trim() !== "" || who !== "all";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Album" description="Đổi tên, ảnh bìa và người được xem của từng album. Bấm vào tên album để xem và xoá ảnh." />

      {albums.length === 0 ? (
        <EmptyState title="Nhà chưa có album nào." body="Album được tạo khi người trong nhà tải ảnh lên ở trang Album. Khi có album, bạn sẽ quản lý chúng ở đây." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block min-w-0 flex-1 basis-60">
              <span className="sr-only">Tìm album</span>
              <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên album" className={`${inputClass} pl-10`} />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              Ai được xem
              <select value={who} onChange={(e) => setWho(e.target.value)} className={selectClass}>
                <option value="all">Tất cả</option>
                <option value="family">Chỉ người trong nhà</option>
                <option value="shared">Có chia sẻ cho khách</option>
                {guests.length > 0 && (
                  <optgroup label="Chia sẻ cho">
                    {guests.map((g) => (
                      <option key={g.id} value={`g:${g.id}`}>{g.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <p className="tabular ml-auto text-sm text-ink-3" aria-live="polite">
              {filtered ? `${shown.length} trên ${albums.length} album` : `${albums.length} album`}
            </p>
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-paper)] border border-line py-12 text-center">
              <p className="text-ink-2">Không có album nào khớp với bộ lọc.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQ("");
                  setWho("all");
                }}
              >
                Xoá bộ lọc
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-paper)] border border-line">
              <table className="w-full text-left text-sm">
                <thead className="hidden border-b border-line bg-paper-2 text-ink-2 md:table-header-group">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Album</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Số ảnh</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Thời gian</th>
                    <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Người tạo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Ai được xem</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((a) => {
                    const people = sharedGuests(a, guests);
                    const range = dateRange(a.takenFrom, a.takenTo);
                    return (
                      <tr key={a.id} className="align-middle hover:bg-paper-2/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="sleeve block h-12 w-16 shrink-0 overflow-hidden rounded-[3px] border border-line bg-paper-3">
                              {a.coverUrl && <img src={a.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
                            </span>
                            <div className="min-w-0">
                              <button type="button" onClick={() => setOpenId(a.id)} className="min-h-10 text-left text-base font-semibold text-ink hover:text-coral-ink hover:underline hover:underline-offset-2">
                                {a.title}
                              </button>
                              <p className="tabular text-xs text-ink-3 md:hidden">
                                {a.photoCount} ảnh, {range}
                              </p>
                              <div className="mt-1 md:hidden">
                                <Visibility album={a} people={people} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="tabular hidden px-4 py-3 text-right md:table-cell">{a.photoCount}</td>
                        <td className="tabular hidden whitespace-nowrap px-4 py-3 text-ink-2 md:table-cell">{range}</td>
                        <td className="hidden px-4 py-3 text-ink-2 lg:table-cell">{a.createdBy.name}</td>
                        <td className="hidden max-w-60 px-4 py-3 md:table-cell">
                          <Visibility album={a} people={people} />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex justify-end">
                            <IconButton label={`Xem ảnh trong ${a.title}`} onClick={() => setOpenId(a.id)}>
                              <Images size={18} />
                            </IconButton>
                            <IconButton label={`Sửa ${a.title}`} onClick={() => edit(a)}>
                              <PencilSimple size={18} />
                            </IconButton>
                            <IconButton label={`Xoá ${a.title}`} onClick={() => setRemoving(a)} className="hover:text-danger">
                              <Trash size={18} />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {dialogs}
    </div>
  );
}

function Visibility({ album, people }: { album: AdminAlbum; people: AdminUser[] }) {
  if (album.visibility.kind === "family") return <Tag>Cả nhà</Tag>;
  return (
    <div className="flex flex-col items-start gap-1">
      <Tag tone="coral">Chia sẻ cho {people.length} khách</Tag>
      {people.length > 0 && <p className="text-xs text-ink-3">{people.map((p) => p.nickname ?? p.name).join(", ")}</p>}
    </div>
  );
}
