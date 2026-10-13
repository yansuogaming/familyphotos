// Albums, photos, hearts, comments, uploads and sharing. Contract: docs/api/media.md.
// Who may see or change what is decided by the backend; each album carries the
// viewer's rights (AlbumAccess) and the UI only follows them.
import { ApiError, BASE, http } from "./core";
import type { Photo } from "./types";
import type {
  AlbumDetail,
  AlbumShare,
  MediaAlbum,
  Memory,
  NewAlbumInput,
  PhotoComment,
  PhotoPage,
  PhotoSocial,
  ShareInput,
  UploadOptions,
} from "./media-types";

const PAGE = 36;
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** Upload with progress events (fetch has none yet). */
function xhrUpload<T>(path: string, form: FormData, opts: UploadOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    if (!BASE) return reject(new ApiError(0, "Chưa cấu hình địa chỉ máy chủ (NEXT_PUBLIC_API_URL)."));
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
      reject(new DOMException("Đã huỷ", "AbortError"));
    });
    xhr.send(form);
  });
}

export const mediaApi = {
  /** Only albums the viewer may see, each with what they may do. */
  albums: (): Promise<MediaAlbum[]> => http("/albums"),
  /** 404 when the viewer may not see it (never 403, so hidden albums stay hidden). */
  album: (id: string): Promise<AlbumDetail> => http(`/albums/${id}`),
  /** Oldest first. `cursor` comes from the previous page. */
  photos: (albumId: string, cursor?: string | null): Promise<PhotoPage> =>
    http(`/albums/${albumId}/photos?limit=${PAGE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`),
  recent: (): Promise<Photo[]> => http("/photos?sort=recent"),

  updateMemo: (photoId: string, memo: string): Promise<Photo> => http(`/photos/${photoId}`, json("PATCH", { memo })),
  deletePhotos: (ids: string[]): Promise<void> => http("/photos/delete", json("POST", { ids })),
  movePhotos: (ids: string[], albumId: string): Promise<void> => http("/photos/move", json("POST", { ids, albumId })),
  /** Several photos at once: the backend zips them and returns a short-lived link. */
  downloadMany: (ids: string[]): Promise<{ url: string; fileName: string }> => http("/photos/download", json("POST", { ids })),
  /** Original file of one photo. */
  downloadUrl: (photo: Pick<Photo, "id" | "url">): string => `${BASE}/photos/${photo.id}/original`,

  social: (photoId: string): Promise<PhotoSocial> => http(`/photos/${photoId}/social`),
  setLike: (photoId: string, liked: boolean): Promise<PhotoSocial> => http(`/photos/${photoId}/like`, { method: liked ? "PUT" : "DELETE" }),
  addComment: (photoId: string, text: string): Promise<PhotoComment> => http(`/photos/${photoId}/comments`, json("POST", { text })),

  /** `albumId: null` uploads a loose photo that belongs to no album. */
  upload(albumId: string | null, file: File, opts: UploadOptions = {}): Promise<Photo> {
    const form = new FormData();
    form.append("file", file);
    return xhrUpload<Photo>(albumId ? `/albums/${albumId}/photos` : "/photos", form, opts);
  },
  /** From a web address: the backend downloads and keeps its own copy. */
  uploadFromUrl(albumId: string | null, url: string, opts: UploadOptions = {}): Promise<Photo> {
    return http<Photo>(albumId ? `/albums/${albumId}/photos/from-url` : "/photos/from-url", { ...json("POST", { url }), signal: opts.signal });
  },

  /** Guests get a private guest album; members get a family album (decided by the backend). */
  createAlbum(input: NewAlbumInput): Promise<MediaAlbum> {
    const form = new FormData();
    form.append("title", input.title);
    form.append("takenFrom", input.takenFrom);
    form.append("takenTo", input.takenTo);
    if (input.cover) form.append("cover", input.cover);
    return http("/albums", { method: "POST", body: form });
  },
  share: (albumId: string, input: ShareInput): Promise<AlbumShare> => http(`/albums/${albumId}/share`, json("PUT", input)),
  unshare: (albumId: string): Promise<void> => http(`/albums/${albumId}/share`, { method: "DELETE" }),

  /** Photos taken on this day and month in earlier years, newest year first. */
  onThisDay(date = new Date()): Promise<Memory[]> {
    const md = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return http(`/memories/on-this-day?date=${date.getFullYear()}-${md}`);
  },
};
