// Admin area data (/admin/dashboard). Every endpoint is admin-only; see docs/api/admin.md.
import { http } from "./core";
import type {
  AdminAlbum,
  AdminOverview,
  AdminPhoto,
  AdminUser,
  AlbumPatch,
  AssistantConfig,
  AuditEntry,
  InviteCode,
  MediaAsset,
  MediaUpload,
  NewInviteInput,
  NewUserInput,
  SystemSettings,
  UserPatch,
} from "./admin-types";

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const adminApi = {
  overview(): Promise<AdminOverview> {
    return http("/admin/overview");
  },

  users: {
    list(): Promise<AdminUser[]> {
      return http("/admin/users");
    },
    create(input: NewUserInput): Promise<AdminUser> {
      return http("/admin/users", json("POST", input));
    },
    update(id: string, patch: UserPatch): Promise<AdminUser> {
      return http(`/admin/users/${id}`, json("PATCH", patch));
    },
    remove(id: string): Promise<void> {
      return http(`/admin/users/${id}`, json("DELETE"));
    },
  },

  invites: {
    list(): Promise<InviteCode[]> {
      return http("/admin/invites");
    },
    create(input: NewInviteInput): Promise<InviteCode> {
      return http("/admin/invites", json("POST", input));
    },
    revoke(id: string): Promise<InviteCode> {
      return http(`/admin/invites/${id}/revoke`, json("POST"));
    },
  },

  albums: {
    list(): Promise<AdminAlbum[]> {
      return http("/admin/albums");
    },
    update(id: string, patch: AlbumPatch): Promise<AdminAlbum> {
      return http(`/admin/albums/${id}`, json("PATCH", patch));
    },
    remove(id: string): Promise<void> {
      return http(`/admin/albums/${id}`, json("DELETE"));
    },
    photos(albumId: string): Promise<AdminPhoto[]> {
      return http(`/admin/albums/${albumId}/photos`);
    },
    removePhoto(albumId: string, photoId: string): Promise<void> {
      return http(`/admin/albums/${albumId}/photos/${photoId}`, json("DELETE"));
    },
  },

  media: {
    list(): Promise<MediaAsset[]> {
      return http("/admin/media");
    },
    /** Multipart with `file`, `name`, `alt`. */
    upload(input: MediaUpload): Promise<MediaAsset> {
      const form = new FormData();
      form.append("file", input.file);
      form.append("name", input.name);
      form.append("alt", input.alt);
      return http("/admin/media", { method: "POST", body: form });
    },
    /** Add an image from a web address. The backend downloads and keeps its own copy. */
    async addFromUrl(input: { url: string; name: string; alt: string; width: number; height: number }): Promise<MediaAsset> {
      return http("/admin/media/from-url", json("POST", { url: input.url, name: input.name, alt: input.alt }));
    },
    update(id: string, patch: { name?: string; alt?: string }): Promise<MediaAsset> {
      return http(`/admin/media/${id}`, json("PATCH", patch));
    },
    remove(id: string): Promise<void> {
      return http(`/admin/media/${id}`, json("DELETE"));
    },
  },

  assistant: {
    get(): Promise<AssistantConfig> {
      return http("/admin/assistant");
    },
    save(config: AssistantConfig): Promise<AssistantConfig> {
      return http("/admin/assistant", json("PUT", config));
    },
  },

  system: {
    get(): Promise<SystemSettings> {
      return http("/admin/system");
    },
    save(s: SystemSettings): Promise<SystemSettings> {
      return http("/admin/system", json("PUT", s));
    },
  },

  audit(): Promise<AuditEntry[]> {
    return http("/admin/audit?limit=200");
  },

};
