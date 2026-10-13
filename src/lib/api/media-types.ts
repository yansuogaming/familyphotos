// Albums, photos, likes, comments, uploads and sharing.
// Mirrored in docs/api/media.md.
import type { Album, Photo, User } from "./types";

export type Person = Pick<User, "id" | "name">;

export interface AlbumShare {
  /** Link a guest opens to view the album. */
  url: string;
  createdAt: string;
  /** null: never expires. */
  expiresAt: string | null;
  allowDownload: boolean;
}

/**
 * Who an album belongs to.
 * - family: the family's own albums. Guests never see them unless shared with them by name.
 * - guest: an album a guest made to keep their own memories. Only that guest and family members see it.
 */
export type AlbumSpace = "family" | "guest";

/** What the current viewer may do. Computed by the backend per request; the UI only reads it. */
export interface AlbumAccess {
  space: AlbumSpace;
  /** guest albums: the guest who owns it. */
  owner?: Person;
  /** A family album a member shared with this guest (read-only for them). */
  sharedWithMe?: boolean;
  canUpload: boolean;
  /** Select, move, delete photos and edit memos. */
  canManage: boolean;
  canShare: boolean;
  /** System album holding someone's loose photos (uploaded without an album). */
  loose?: boolean;
}

export interface MediaAlbum extends Album, AlbumAccess {}

export interface AlbumDetail extends MediaAlbum {
  description?: string;
  createdBy: Person;
  /** Everyone who added at least one photo, most photos first. */
  contributors: Person[];
  share: AlbumShare | null;
}

export interface PhotoPage {
  items: Photo[];
  /** Pass back to get the next page. null: no more photos. */
  nextCursor: string | null;
  total: number;
}

export interface PhotoComment {
  id: string;
  photoId: string;
  author: Person;
  text: string;
  createdAt: string;
}

/** Hearts and comments under one photo. */
export interface PhotoSocial {
  photoId: string;
  likeCount: number;
  likedByMe: boolean;
  likedBy: Person[];
  comments: PhotoComment[];
}

export interface NewAlbumInput {
  title: string;
  takenFrom: string; // ISO date
  takenTo: string;
  cover?: File | null;
}

export interface ShareInput {
  /** null: link never expires. */
  expiresInDays: 7 | 30 | null;
  allowDownload: boolean;
}

/** "Ngày này năm xưa": photos taken on today's day and month in earlier years. */
export interface Memory {
  yearsAgo: number;
  date: string; // ISO date
  album: Pick<Album, "id" | "title">;
  photos: Photo[];
}

export interface UploadOptions {
  /** 0..1 */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export const UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;
export const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

/** Returns a short Vietnamese reason when the file cannot be uploaded. */
export function checkUpload(file: File): string | null {
  const isImage = file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
  if (!isImage) return "Không phải ảnh. Chỉ nhận JPG, PNG, WEBP, HEIC.";
  if (file.size > UPLOAD_LIMIT_BYTES) return "Tệp quá lớn. Mỗi ảnh tối đa 25 MB.";
  return null;
}
