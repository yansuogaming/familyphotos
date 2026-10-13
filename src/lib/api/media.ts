// Albums, photos, hearts, comments, uploads and guest sharing.
// Endpoints: docs/api/media.md. Without NEXT_PUBLIC_API_URL everything is mock.
import { session } from "@/lib/session";
import { ApiError, BASE, fake, http, wait } from "./core";
import * as base from "./mock-data";
import * as mock from "./media-mock";
import type { Album, Photo } from "./types";
import type {
  AlbumAccess,
  AlbumDetail,
  MediaAlbum,
  AlbumShare,
  Memory,
  NewAlbumInput,
  Person,
  PhotoComment,
  PhotoPage,
  PhotoSocial,
  ShareInput,
  UploadOptions,
} from "./media-types";

const PAGE = 36;

const meNow = (): Person => {
  const u = typeof localStorage === "undefined" ? null : session.get()?.user;
  return { id: u?.id ?? base.me.id, name: u?.name ?? base.me.name };
};

const viewer = () => {
  const u = typeof localStorage === "undefined" ? null : session.get()?.user;
  return { id: u?.id ?? base.me.id, isGuest: u?.role === "guest" };
};

// ---------- access (the backend must enforce the same rules server-side) ----------

const NONE: AlbumAccess = { space: "family", canUpload: false, canManage: false, canShare: false };

/** What the current viewer may do with an album, or null when they may not even see it. */
function accessFor(albumId: string): AlbumAccess | null {
  const rule = mock.store.access.get()[albumId] ?? { space: "family" as const, sharedWith: [] };
  const v = viewer();
  if (rule.space === "family") {
    if (!v.isGuest) return { space: "family", canUpload: true, canManage: true, canShare: true };
    if (rule.sharedWith.includes(v.id)) return { ...NONE, sharedWithMe: true };
    return null;
  }
  const owner = mock.ownerOf(rule.ownerId) ?? (rule.ownerId === v.id ? meNow() : undefined);
  if (rule.ownerId === v.id) return { space: "guest", owner, canUpload: true, canManage: true, canShare: false };
  if (!v.isGuest) return { ...NONE, space: "guest", owner };
  return null;
}

/** Each person's loose photos ("ảnh lẻ") live in a system album with this id. */
export const looseAlbumId = (userId: string) => `anh-le-${userId}`;
const isLoose = (albumId: string) => albumId.startsWith("anh-le-");

function visibleAlbums(): MediaAlbum[] {
  return allAlbums().flatMap((a) => {
    const acc = accessFor(a.id);
    if (!acc || (isLoose(a.id) && a.photoCount === 0)) return [];
    return [{ ...a, ...acc, loose: isLoose(a.id) || undefined }];
  });
}

/** Creates (once) the system album that holds this person's loose photos. */
function ensureLooseAlbum(): string {
  const me = meNow();
  const id = looseAlbumId(me.id);
  if (!mock.store.albums.get().some((a) => a.id === id)) {
    const today = new Date().toISOString().slice(0, 10);
    mock.store.albums.update((a) => [
      ...a,
      { id, title: `Ảnh lẻ của ${me.name}`, coverUrl: `https://picsum.photos/seed/fp-le-${me.id}/600/760`, photoCount: 0, takenFrom: today, takenTo: today },
    ]);
    const v = viewer();
    mock.store.access.update((acc) => ({
      ...acc,
      [id]: v.isGuest ? { space: "guest", ownerId: v.id, sharedWith: [] } : { space: "family", sharedWith: [] },
    }));
  }
  return id;
}

/** Feed and memories: members see family photos only; guests see their own plus what was shared with them. */
function feedAlbumIds() {
  const isGuest = viewer().isGuest;
  return new Set(visibleAlbums().filter((a) => (isGuest ? true : a.space === "family")).map((a) => a.id));
}

const notFound = () => wait(250).then(() => { throw new ApiError(404, "Không tìm thấy album này."); });
const forbidden = () => wait(200).then(() => { throw new ApiError(403, "Bạn không có quyền làm việc này."); });

function photoAccess(photoId: string) {
  const photo = allPhotos().find((p) => p.id === photoId);
  return photo ? accessFor(photo.albumId) : null;
}

// ---------- mock helpers ----------

function allPhotos(): Photo[] {
  const removed = new Set(mock.store.removed.get());
  const moved = mock.store.moved.get();
  const memos = mock.store.memos.get();
  return [...mock.seedAlbums.flatMap(mock.seedPhotos), ...mock.uploaded]
    .filter((p) => !removed.has(p.id))
    .map((p) => ({ ...p, albumId: moved[p.id] ?? p.albumId, memo: p.id in memos ? memos[p.id] || undefined : p.memo }));
}

function allAlbums(): Album[] {
  const photos = allPhotos();
  const count = new Map<string, number>();
  for (const p of photos) count.set(p.albumId, (count.get(p.albumId) ?? 0) + 1);
  return [...mock.store.albums.get(), ...mock.seedAlbums].map((a) => ({ ...a, photoCount: count.get(a.id) ?? 0 }));
}

function social(photoId: string): PhotoSocial {
  const me = meNow();
  const likes = mock.store.likes.get()[photoId] ?? [];
  const comments = [...(mock.seedComments[photoId] ?? []), ...(mock.store.comments.get()[photoId] ?? [])];
  return {
    photoId,
    likeCount: likes.length,
    likedByMe: likes.includes(me.id),
    likedBy: likes.map((id) => base.userById(id) ?? { id, name: "Người trong nhà" }).map(({ id, name }) => ({ id, name })),
    comments,
  };
}

const abortError = () => new DOMException("Đã huỷ", "AbortError");

/** Simulated upload: progress ticks proportional to file size, abortable. */
function fakeUpload(file: File, opts: UploadOptions = {}) {
  const total = 900 + Math.min(5000, (file.size / (3 * 1024 * 1024)) * 1000);
  return new Promise<void>((resolve, reject) => {
    if (opts.signal?.aborted) return reject(abortError());
    const start = Date.now();
    const tick = setInterval(() => {
      const f = Math.min(1, (Date.now() - start) / total);
      opts.onProgress?.(f);
      if (f >= 1) {
        clearInterval(tick);
        resolve();
      }
    }, 120);
    opts.signal?.addEventListener("abort", () => {
      clearInterval(tick);
      reject(abortError());
    });
  });
}

function readSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = url;
  });
}

/** Shrinks a cover image to a small JPEG data URL so the demo can keep it in localStorage. */
async function coverDataUrl(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const { width, height } = await readSize(url);
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 600 / width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Real upload with progress events (fetch has none yet). */
function xhrUpload<T>(path: string, form: FormData, opts: UploadOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(JSON.parse(xhr.responseText) as T);
      let message = xhr.statusText;
      try {
        message = JSON.parse(xhr.responseText).message ?? message;
      } catch {}
      reject(new ApiError(xhr.status, message));
    };
    xhr.onerror = () => reject(new ApiError(0, "Mất kết nối khi tải lên."));
    opts.signal?.addEventListener("abort", () => {
      xhr.abort();
      reject(abortError());
    });
    xhr.send(form);
  });
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "album";

const shareUrl = (albumId: string) =>
  `${typeof location === "undefined" ? "" : location.origin}/share/album/${albumId}-${Math.random().toString(36).slice(2, 8)}`;

// ---------- API ----------

export const mediaApi = {
  /** Only albums the viewer may see, each with what they may do. */
  albums(): Promise<MediaAlbum[]> {
    if (BASE) return http("/albums");
    return fake(visibleAlbums());
  },

  album(id: string): Promise<AlbumDetail> {
    if (BASE) return http(`/albums/${id}`);
    // Hidden albums answer 404, not 403, so a guest cannot tell they exist.
    const album = visibleAlbums().find((a) => a.id === id);
    if (!album) return notFound();
    const byPerson = new Map<string, { person: Person; n: number }>();
    for (const p of allPhotos().filter((p) => p.albumId === id)) {
      const e = byPerson.get(p.uploadedBy.id) ?? { person: p.uploadedBy, n: 0 };
      e.n++;
      byPerson.set(p.uploadedBy.id, e);
    }
    const meta = mock.albumMeta(id);
    return fake({
      ...album,
      ...meta,
      contributors: [...byPerson.values()].sort((a, b) => b.n - a.n).map((e) => e.person),
      share: mock.store.shares.get()[id] ?? null,
    });
  },

  /** Oldest first. `cursor` comes from the previous page. */
  photos(albumId: string, cursor?: string | null): Promise<PhotoPage> {
    if (BASE) return http(`/albums/${albumId}/photos?limit=${PAGE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!accessFor(albumId)) return notFound();
    const list = allPhotos().filter((p) => p.albumId === albumId).sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    const start = cursor ? Number(cursor) : 0;
    const end = start + PAGE;
    return fake({ items: list.slice(start, end), nextCursor: end < list.length ? String(end) : null, total: list.length }, 450);
  },

  recent(): Promise<Photo[]> {
    if (BASE) return http("/photos?sort=recent");
    const scope = feedAlbumIds();
    const live = allPhotos().filter((p) => scope.has(p.albumId));
    const liveIds = new Set(live.map((p) => p.id));
    const featured = new Set(base.photos.map((p) => p.id));
    const uploaded = mock.uploaded.slice().reverse().filter((p) => liveIds.has(p.id));
    const rest = live
      .filter((p) => !uploaded.some((u) => u.id === p.id) && (featured.has(p.id) || viewer().isGuest))
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
    return fake([...uploaded, ...rest].slice(0, 24));
  },

  updateMemo(photoId: string, memo: string): Promise<Photo> {
    if (BASE) return http(`/photos/${photoId}`, { method: "PATCH", body: JSON.stringify({ memo }) });
    if (!photoAccess(photoId)?.canManage) return forbidden();
    mock.store.memos.update((m) => ({ ...m, [photoId]: memo.trim() }));
    const photo = allPhotos().find((p) => p.id === photoId);
    if (!photo) return wait(200).then(() => { throw new ApiError(404, "Ảnh không còn nữa."); });
    return fake(photo, 300);
  },

  deletePhotos(ids: string[]): Promise<void> {
    if (BASE) return http("/photos/delete", { method: "POST", body: JSON.stringify({ ids }) });
    if (!ids.every((id) => photoAccess(id)?.canManage)) return forbidden();
    mock.store.removed.update((r) => [...new Set([...r, ...ids])]);
    return fake(undefined, 450);
  },

  movePhotos(ids: string[], albumId: string): Promise<void> {
    if (BASE) return http("/photos/move", { method: "POST", body: JSON.stringify({ ids, albumId }) });
    const dest = accessFor(albumId);
    if (!dest?.canUpload || !ids.every((id) => photoAccess(id)?.canManage && photoAccess(id)?.space === dest.space)) return forbidden();
    mock.store.moved.update((m) => ({ ...m, ...Object.fromEntries(ids.map((id) => [id, albumId])) }));
    return fake(undefined, 450);
  },

  /** Several photos at once: backend zips them and returns a short-lived link. */
  downloadMany(ids: string[]): Promise<{ url: string; fileName: string }> {
    if (BASE) return http("/photos/download", { method: "POST", body: JSON.stringify({ ids }) });
    return fake({ url: "", fileName: `family-photos-${ids.length}-anh.zip` }, 900);
  },

  /** Original file of one photo. */
  downloadUrl(photo: Pick<Photo, "id" | "url">): string {
    return BASE ? `${BASE}/photos/${photo.id}/original` : photo.url;
  },

  social(photoId: string): Promise<PhotoSocial> {
    if (BASE) return http(`/photos/${photoId}/social`);
    if (!photoAccess(photoId)) return notFound();
    return fake(social(photoId), 250);
  },

  setLike(photoId: string, liked: boolean): Promise<PhotoSocial> {
    if (BASE) return http(`/photos/${photoId}/like`, { method: liked ? "PUT" : "DELETE" });
    if (!photoAccess(photoId)) return notFound();
    const me = meNow().id;
    mock.store.likes.update((l) => {
      const cur = (l[photoId] ?? []).filter((id) => id !== me);
      return { ...l, [photoId]: liked ? [...cur, me] : cur };
    });
    return fake(social(photoId), 150);
  },

  addComment(photoId: string, text: string): Promise<PhotoComment> {
    if (BASE) return http(`/photos/${photoId}/comments`, { method: "POST", body: JSON.stringify({ text }) });
    if (!photoAccess(photoId)) return notFound();
    const c: PhotoComment = { id: crypto.randomUUID(), photoId, author: meNow(), text: text.trim(), createdAt: new Date().toISOString() };
    mock.store.comments.update((all) => ({ ...all, [photoId]: [...(all[photoId] ?? []), c] }));
    return fake(c, 300);
  },

  /**
   * Add a photo from a web address. The backend downloads and stores its own copy
   * (so the album never depends on someone else's link). `albumId: null`: loose photo.
   */
  async uploadFromUrl(albumId: string | null, url: string, opts: UploadOptions = {}): Promise<Photo> {
    if (BASE) {
      const path = albumId ? `/albums/${albumId}/photos/from-url` : "/photos/from-url";
      return http<Photo>(path, { method: "POST", body: JSON.stringify({ url }), signal: opts.signal });
    }
    if (albumId === null) albumId = ensureLooseAlbum();
    if (!accessFor(albumId)?.canUpload) throw new ApiError(403, "Bạn chỉ thêm được ảnh vào album của mình.");
    await fakeUpload(new File([], "url"), opts);
    const { width, height } = await readSize(url);
    const photo: Photo = { id: crypto.randomUUID(), albumId, url, width, height, takenAt: new Date().toISOString().slice(0, 10), uploadedBy: meNow() };
    mock.uploaded.push(photo);
    return photo;
  },

  /** `albumId: null` uploads a loose photo that belongs to no album. */
  async upload(albumId: string | null, file: File, opts: UploadOptions = {}): Promise<Photo> {
    if (BASE) {
      const form = new FormData();
      form.append("file", file);
      return xhrUpload<Photo>(albumId ? `/albums/${albumId}/photos` : "/photos", form, opts);
    }
    if (albumId === null) albumId = ensureLooseAlbum();
    if (!accessFor(albumId)?.canUpload) throw new ApiError(403, "Bạn chỉ thêm được ảnh vào album của mình.");
    await fakeUpload(file, opts);
    const url = URL.createObjectURL(file);
    const { width, height } = await readSize(url);
    const d = file.lastModified ? new Date(file.lastModified) : new Date();
    const photo: Photo = { id: crypto.randomUUID(), albumId, url, width, height, takenAt: d.toISOString().slice(0, 10), uploadedBy: meNow() };
    mock.uploaded.push(photo);
    return photo;
  },

  /** Guests get a private guest album; members get a family album. */
  async createAlbum(input: NewAlbumInput): Promise<MediaAlbum> {
    if (BASE) {
      const form = new FormData();
      form.append("title", input.title);
      form.append("takenFrom", input.takenFrom);
      form.append("takenTo", input.takenTo);
      if (input.cover) form.append("cover", input.cover);
      return http("/albums", { method: "POST", body: form });
    }
    const cover = input.cover ? await coverDataUrl(input.cover) : null;
    const album: Album = {
      id: `${slug(input.title)}-${Date.now().toString(36)}`,
      title: input.title.trim(),
      coverUrl: cover ?? `https://picsum.photos/seed/fp-new-${Date.now()}/600/760`,
      photoCount: 0,
      takenFrom: input.takenFrom,
      takenTo: input.takenTo || input.takenFrom,
    };
    mock.store.albums.update((a) => [album, ...a]);
    const v = viewer();
    mock.store.access.update((acc) => ({
      ...acc,
      [album.id]: v.isGuest ? { space: "guest", ownerId: v.id, sharedWith: [] } : { space: "family", sharedWith: [] },
    }));
    return fake({ ...album, ...accessFor(album.id)! }, 500);
  },

  share(albumId: string, input: ShareInput): Promise<AlbumShare> {
    if (BASE) return http(`/albums/${albumId}/share`, { method: "PUT", body: JSON.stringify(input) });
    if (!accessFor(albumId)?.canShare) return forbidden();
    const prev = mock.store.shares.get()[albumId];
    const share: AlbumShare = {
      url: prev?.url ?? shareUrl(albumId),
      createdAt: prev?.createdAt ?? new Date().toISOString(),
      expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 864e5).toISOString() : null,
      allowDownload: input.allowDownload,
    };
    mock.store.shares.update((s) => ({ ...s, [albumId]: share }));
    return fake(share, 400);
  },

  unshare(albumId: string): Promise<void> {
    if (BASE) return http(`/albums/${albumId}/share`, { method: "DELETE" });
    if (!accessFor(albumId)?.canShare) return forbidden();
    mock.store.shares.update((s) => {
      const next = { ...s };
      delete next[albumId];
      return next;
    });
    return fake(undefined, 300);
  },

  /** Photos taken on this day and month in earlier years, newest year first. */
  onThisDay(date = new Date()): Promise<Memory[]> {
    const md = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const year = date.getFullYear();
    if (BASE) return http(`/memories/on-this-day?date=${year}-${md}`);
    const albums = allAlbums();
    const scope = feedAlbumIds();
    const groups = new Map<string, Photo[]>();
    for (const p of allPhotos().filter((p) => scope.has(p.albumId))) {
      const y = Number(p.takenAt.slice(0, 4));
      if (p.takenAt.slice(5, 10) !== md || y >= year) continue;
      const key = `${y}|${p.albumId}`;
      groups.set(key, [...(groups.get(key) ?? []), p]);
    }
    const out: Memory[] = [...groups.entries()].map(([key, photos]) => {
      const [y, albumId] = key.split("|");
      const album = albums.find((a) => a.id === albumId);
      return { yearsAgo: year - Number(y), date: `${y}-${md}`, album: { id: albumId, title: album?.title ?? "Album" }, photos: photos.slice(0, 6) };
    });
    return fake(out.sort((a, b) => a.yearsAgo - b.yearsAgo));
  },
};
