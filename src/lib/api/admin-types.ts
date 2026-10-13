// Admin area (/admin/dashboard). Every endpoint requires role "admin" (403 otherwise).
// See docs/api/admin.md.
import type { Album, Photo, Role, User } from "./types";

export type Actor = Pick<User, "id" | "name">;

export type AccountStatus = "active" | "locked";

export interface AdminUser extends Pick<User, "id" | "name" | "nickname" | "role" | "email" | "phone" | "grade" | "avatarUrl"> {
  status: AccountStatus;
  lastActiveAt?: string; // ISO; missing = never signed in
  createdAt: string;
  storageBytes: number;
}

export interface NewUserInput {
  name: string;
  nickname?: string;
  email: string;
  role: Role;
  grade?: number;
}

export interface UserPatch {
  name?: string;
  nickname?: string;
  role?: Role;
  grade?: number | null;
  status?: AccountStatus;
}

export interface InviteCode {
  id: string;
  code: string; // "NHA-4821"
  role: Exclude<Role, "admin">;
  note?: string; // who it is for
  createdBy: Actor;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
  revoked: boolean;
}

export interface NewInviteInput {
  role: Exclude<Role, "admin">;
  note?: string;
  validDays: number;
  maxUses: number;
}

export type AlbumVisibility = { kind: "family" } | { kind: "shared"; guestIds: string[] };

export interface AdminAlbum extends Album {
  visibility: AlbumVisibility;
  createdBy: Actor;
}

export interface AlbumPatch {
  title?: string;
  coverUrl?: string;
  visibility?: AlbumVisibility;
}

export type AdminPhoto = Photo;

export interface MediaAsset {
  id: string;
  url: string;
  name: string; // file name shown in the library
  alt: string;
  width: number;
  height: number;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: Actor;
  /** Where the asset is shown, e.g. "Trang chủ: album mở, ảnh 1". Computed by the server. */
  usedIn: string[];
}

export interface MediaUpload {
  file: File;
  name: string;
  alt: string;
}

export type AiProvider = "claude" | "openai";

export interface AssistantConfig {
  systemPrompt: string;
  /** Prompts shown as chips in the assistant panel, in order. */
  suggestions: string[];
  guestsAllowed: boolean;
  /** Guests may use the family's shared API key. Off: each guest adds their own key in Cài đặt. */
  guestsUseSharedKey: boolean;
  /** Questions per day for kids (members with a grade). 0 = unlimited. */
  kidDailyLimit: number;
  provider: AiProvider;
}

export interface SystemSettings {
  familyName: string;
  quotaPerUserGb: number;
  qrTtlSeconds: number;
  /** Public address of the site, e.g. "familyphotos.vn". Shown in sign-in instructions. Empty: use the browser's address. */
  siteUrl: string;
  /** Cloudflare Turnstile on login, register and admin login. */
  captchaOnAuth: boolean;
  /** Human check whenever someone opens a page and their last check has expired. */
  botCheckEnabled: boolean;
  /** Minutes a passed human check stays valid. */
  botCheckMinutes: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: Actor;
  action: string; // "Tạo mã mời"
  target: string; // "Chú Tư Hải"
}

export interface AdminOverview {
  memberCount: number;
  kidCount: number;
  guestCount: number;
  storage: { usedBytes: number; quotaBytes: number; top: { user: Actor; bytes: number }[] };
  photosThisWeek: { total: number; perDay: number[] }; // 7 values, oldest first, last = today
  activity: AuditEntry[];
}
