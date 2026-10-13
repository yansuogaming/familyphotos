"use client";

/* eslint-disable @next/next/no-img-element -- covers may be local data URLs */
import { CheckCircle } from "@/components/ui/icons";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/settings/shared";
import { adminApi } from "@/lib/api/admin";
import type { AdminAlbum, AdminUser, AlbumVisibility } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { ImageField } from "../ImageField";
import { ErrorNote, Modal, Tag, TextField, errorText } from "../ui";
import { useUnsavedChanges } from "../unsaved";

type Kind = AlbumVisibility["kind"];

/** Edit an album: name, cover, and who may see it. */
export function AlbumEditor({
  album,
  guests,
  open,
  onClose,
  onSaved,
}: {
  album: AdminAlbum;
  guests: AdminUser[];
  open: boolean;
  onClose: () => void;
  onSaved: (next: AdminAlbum) => void;
}) {
  const toast = useToast();
  const startIds = album.visibility.kind === "shared" ? album.visibility.guestIds : [];
  const [title, setTitle] = useState(album.title);
  const [cover, setCover] = useState(album.coverUrl);
  const [kind, setKind] = useState<Kind>(album.visibility.kind);
  const [ids, setIds] = useState<string[]>(startIds);
  const [errors, setErrors] = useState<{ title?: string; guests?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const groupId = useId();

  const sameIds = ids.length === startIds.length && ids.every((id) => startIds.includes(id));
  const dirty = open && (title.trim() !== album.title || cover !== album.coverUrl || kind !== album.visibility.kind || (kind === "shared" && !sameIds));
  useUnsavedChanges(dirty);

  function toggle(id: string) {
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    setErrors((e) => ({ ...e, guests: undefined }));
  }

  async function save() {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Album cần có tên.";
    if (kind === "shared" && ids.length === 0) next.guests = "Chọn ít nhất một khách, hoặc chọn Chỉ người trong nhà.";
    setErrors(next);
    if (next.title || next.guests) return;
    setError(null);
    setBusy(true);
    try {
      const visibility: AlbumVisibility = kind === "family" ? { kind: "family" } : { kind: "shared", guestIds: guests.filter((g) => ids.includes(g.id)).map((g) => g.id) };
      const saved = await adminApi.albums.update(album.id, { title: title.trim(), coverUrl: cover, visibility });
      onSaved(saved);
      toast(`Đã lưu album "${saved.title}".`);
      onClose();
    } catch (e) {
      setError(errorText(e, "Chưa lưu được album. Thử lại sau ít phút."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sửa album"
      description={album.title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button onClick={save} disabled={busy || !dirty}>{busy ? "Đang lưu..." : "Lưu"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <TextField
          label="Tên album"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((x) => ({ ...x, title: undefined }));
          }}
          error={errors.title}
          maxLength={80}
          required
        />

        <div className="flex flex-col gap-4">
          <ImageField label="Ảnh bìa" value={{ url: cover, alt: "" }} onChange={(v) => setCover(v.url)} showAlt={false} />
          <CoverFromAlbum albumId={album.id} value={cover} onPick={setCover} />
        </div>

        <fieldset className="flex flex-col gap-3" aria-describedby={errors.guests ? `${groupId}-err` : undefined}>
          <legend className="mb-2 text-sm font-semibold">Ai được xem</legend>
          {(
            [
              { value: "family", label: "Chỉ người trong nhà", hint: "Mọi thành viên trong nhà đều xem được. Khách không thấy album này." },
              { value: "shared", label: "Chia sẻ cho khách", hint: "Người trong nhà vẫn xem được, cộng thêm những khách bạn chọn." },
            ] as const
          ).map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-paper)] border px-4 py-3 transition-colors ${kind === o.value ? "border-coral bg-coral-wash/40" : "border-line hover:border-ink-3"}`}
            >
              <input
                type="radio"
                name={`${groupId}-kind`}
                value={o.value}
                checked={kind === o.value}
                onChange={() => {
                  setKind(o.value);
                  setErrors((x) => ({ ...x, guests: undefined }));
                }}
                className="mt-1 size-4 shrink-0 accent-[var(--coral)]"
              />
              <span>
                <span className="block font-medium">{o.label}</span>
                <span className="block text-sm text-ink-2">{o.hint}</span>
              </span>
            </label>
          ))}

          {kind === "shared" && (
            <div className="rounded-[var(--radius-paper)] border border-line">
              <p className="border-b border-line px-4 py-2.5 text-sm text-ink-2">
                Đã chọn <span className="tabular font-semibold text-ink">{ids.length}</span> trên {guests.length} khách
              </p>
              {guests.length === 0 ? (
                <p className="px-4 py-4 text-sm text-ink-2">Nhà chưa có khách nào. Duyệt lời xin vào hoặc tạo mã mời ở trang Thành viên.</p>
              ) : (
                <ul className="max-h-64 divide-y divide-line overflow-y-auto">
                  {guests.map((g) => {
                    const locked = g.status === "locked";
                    return (
                      <li key={g.id}>
                        <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 hover:bg-paper-2">
                          <input type="checkbox" checked={ids.includes(g.id)} onChange={() => toggle(g.id)} className="size-4 shrink-0 accent-[var(--coral)]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{g.name}</span>
                            <span className="block truncate text-xs text-ink-3">
                              {locked ? "Đang bị khoá, chưa xem được dù được chọn." : (g.email ?? g.phone ?? "Khách")}
                            </span>
                          </span>
                          {locked && <Tag tone="danger">Bị khoá</Tag>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          {errors.guests && <p id={`${groupId}-err`} className="text-sm text-danger">{errors.guests}</p>}
        </fieldset>

        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </Modal>
  );
}

/** Small grid of photos already in the album, to use one as the cover. */
function CoverFromAlbum({ albumId, value, onPick }: { albumId: string; value: string; onPick: (url: string) => void }) {
  const photos = useApi(() => adminApi.albums.photos(albumId), [albumId]);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-2">Hoặc chọn một ảnh trong album</p>
      {photos.status === "loading" && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-square animate-pulse rounded-[3px] bg-paper-3" />)}
        </div>
      )}
      {photos.status === "error" && (
        <p className="text-sm text-ink-2">
          Chưa tải được ảnh trong album.{" "}
          <button type="button" onClick={photos.reload} className="min-h-10 font-semibold text-coral-ink underline underline-offset-2">Tải lại</button>
        </p>
      )}
      {photos.status === "ready" && photos.data.length === 0 && <p className="text-sm text-ink-3">Album này chưa có ảnh để làm bìa.</p>}
      {photos.status === "ready" && photos.data.length > 0 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.data.map((p) => {
            const on = p.url === value;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`Dùng làm bìa: ${p.memo ?? "ảnh"}`}
                  onClick={() => onPick(p.url)}
                  className={`relative block aspect-square w-full overflow-hidden rounded-[3px] border-2 transition-colors ${on ? "border-coral" : "border-transparent hover:border-ink-3"}`}
                >
                  <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {on && <CheckCircle size={22} weight="fill" className="absolute right-1 top-1 rounded-full bg-paper text-coral" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
