// Admin area data (/quan-tri). Every endpoint is admin-only; see docs/api/admin.md.
import { ApiError, BASE, fake, http, wait } from "./core";
import { adminStore, logMockAudit, mockActor, mockRequireAdmin, writeDb } from "./admin-mock";
import { siteStore } from "./site-mock";
import type {
  AdminAlbum,
  AdminOverview,
  AdminPhoto,
  AdminUser,
  AlbumPatch,
  AssistantConfig,
  AuditEntry,
  InviteCode,
  JoinRequest,
  MediaAsset,
  MediaUpload,
  NewInviteInput,
  NewUserInput,
  SystemSettings,
  UserPatch,
} from "./admin-types";
import { roleLabel } from "./types";

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

/** Run a mock call as the signed-in admin, with a little latency. */
async function asAdmin<T>(fn: () => T, ms = 350): Promise<T> {
  await wait(ms);
  mockRequireAdmin();
  return structuredClone(fn());
}

function notFound(what: string): never {
  throw new ApiError(404, `Không tìm thấy ${what}. Có thể ai đó vừa xoá.`);
}

/** Where each image is shown on the site. The real backend computes this. */
function usageOf(url: string, id: string): string[] {
  const site = siteStore.get();
  const hit = (img: { url: string; mediaId?: string }) => img.mediaId === id || img.url === url;
  const out: string[] = [];
  site.landing.album.forEach((p, i) => hit(p) && out.push(`Trang chủ: album mở, ảnh ${i + 1}`));
  site.login.coverPhotos.forEach((p, i) => hit(p) && out.push(`Trang đăng nhập: ảnh bìa ${i + 1}`));
  adminStore.get().albums.forEach((a) => a.coverUrl === url && out.push(`Ảnh bìa album "${a.title}"`));
  return out;
}

const inviteCode = () => `NHA-${Math.floor(1000 + Math.random() * 9000)}`;

export const adminApi = {
  overview(): Promise<AdminOverview> {
    if (BASE) return http("/admin/overview");
    return asAdmin(() => {
      const db = adminStore.get();
      const people = db.users.filter((u) => u.role !== "guest");
      const used = db.users.reduce((n, u) => n + u.storageBytes, 0);
      const top = [...db.users]
        .filter((u) => u.storageBytes > 0)
        .sort((a, b) => b.storageBytes - a.storageBytes)
        .slice(0, 4)
        .map((u) => ({ user: { id: u.id, name: u.name }, bytes: u.storageBytes }));
      return {
        memberCount: people.length,
        kidCount: people.filter((u) => u.grade).length,
        guestCount: db.users.length - people.length,
        pending: db.requests,
        storage: { usedBytes: used, quotaBytes: db.system.quotaPerUserGb * 1024 ** 3 * Math.max(1, people.length), top },
        photosThisWeek: { total: db.photosPerDay.reduce((n, d) => n + d, 0), perDay: db.photosPerDay },
        activity: [...db.activity, ...db.audit].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8),
      };
    });
  },

  users: {
    list(): Promise<AdminUser[]> {
      if (BASE) return http("/admin/users");
      return asAdmin(() => adminStore.get().users);
    },
    create(input: NewUserInput): Promise<AdminUser> {
      if (BASE) return http("/admin/users", json("POST", input));
      return asAdmin(() => {
        const email = input.email.trim().toLowerCase();
        if (adminStore.get().users.some((u) => u.email?.toLowerCase() === email)) throw new ApiError(409, "Email này đã có tài khoản trong nhà.");
        const user: AdminUser = { id: `u-${crypto.randomUUID().slice(0, 8)}`, ...input, email, status: "active", createdAt: new Date().toISOString(), storageBytes: 0 };
        writeDb((db) => ({ ...db, users: [...db.users, user] }));
        logMockAudit("Thêm người", `${user.name} (${roleLabel[user.role]})`);
        return user;
      }, 500);
    },
    update(id: string, patch: UserPatch): Promise<AdminUser> {
      if (BASE) return http(`/admin/users/${id}`, json("PATCH", patch));
      return asAdmin(() => {
        const db = adminStore.get();
        const cur = db.users.find((u) => u.id === id) ?? notFound("người này");
        const me = mockActor();
        if (id === me.id && (patch.status === "locked" || (patch.role && patch.role !== "admin")))
          throw new ApiError(400, "Bạn không thể tự khoá hay bỏ quyền quản trị của chính mình.");
        const { grade, ...rest } = patch;
        const next: AdminUser = { ...cur, ...rest, ...(grade !== undefined ? { grade: grade ?? undefined } : {}) };
        writeDb((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? next : u)) }));
        if (patch.status && patch.status !== cur.status) logMockAudit(patch.status === "locked" ? "Khoá tài khoản" : "Mở khoá tài khoản", cur.name);
        else if (patch.role && patch.role !== cur.role) logMockAudit("Đổi vai trò", `${cur.name}: ${roleLabel[patch.role]}`);
        else logMockAudit("Sửa thông tin", cur.name);
        return next;
      });
    },
    remove(id: string): Promise<void> {
      if (BASE) return http(`/admin/users/${id}`, json("DELETE"));
      return asAdmin(() => {
        if (id === mockActor().id) throw new ApiError(400, "Bạn không thể xoá tài khoản của chính mình ở đây.");
        const cur = adminStore.get().users.find((u) => u.id === id) ?? notFound("người này");
        writeDb((db) => ({ ...db, users: db.users.filter((u) => u.id !== id) }));
        logMockAudit("Xoá tài khoản", cur.name);
      }, 500);
    },
  },

  requests: {
    list(): Promise<JoinRequest[]> {
      if (BASE) return http("/admin/join-requests");
      return asAdmin(() => adminStore.get().requests);
    },
    approve(id: string): Promise<AdminUser> {
      if (BASE) return http(`/admin/join-requests/${id}/approve`, json("POST"));
      return asAdmin(() => {
        const r = adminStore.get().requests.find((x) => x.id === id) ?? notFound("lời xin vào này");
        const isEmail = r.identifier.includes("@");
        const user: AdminUser = {
          id: `u-${r.id}-${Date.now().toString(36)}`,
          name: r.name,
          role: "guest",
          email: isEmail ? r.identifier : undefined,
          phone: isEmail ? undefined : r.identifier,
          status: "active",
          createdAt: new Date().toISOString(),
          storageBytes: 0,
        };
        writeDb((db) => ({ ...db, requests: db.requests.filter((x) => x.id !== id), users: [...db.users, user] }));
        logMockAudit("Duyệt khách", r.name);
        return user;
      });
    },
    reject(id: string): Promise<void> {
      if (BASE) return http(`/admin/join-requests/${id}/reject`, json("POST"));
      return asAdmin(() => {
        const r = adminStore.get().requests.find((x) => x.id === id) ?? notFound("lời xin vào này");
        writeDb((db) => ({ ...db, requests: db.requests.filter((x) => x.id !== id) }));
        logMockAudit("Từ chối khách", r.name);
      });
    },
  },

  invites: {
    list(): Promise<InviteCode[]> {
      if (BASE) return http("/admin/invites");
      return asAdmin(() => [...adminStore.get().invites].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    create(input: NewInviteInput): Promise<InviteCode> {
      if (BASE) return http("/admin/invites", json("POST", input));
      return asAdmin(() => {
        const now = new Date();
        const code: InviteCode = {
          id: crypto.randomUUID(),
          code: inviteCode(),
          role: input.role,
          note: input.note?.trim() || undefined,
          createdBy: mockActor(),
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + input.validDays * 864e5).toISOString(),
          maxUses: input.maxUses,
          uses: 0,
          revoked: false,
        };
        writeDb((db) => ({ ...db, invites: [code, ...db.invites] }));
        logMockAudit("Tạo mã mời", `${code.code} (${roleLabel[code.role]})`);
        return code;
      }, 450);
    },
    revoke(id: string): Promise<InviteCode> {
      if (BASE) return http(`/admin/invites/${id}/revoke`, json("POST"));
      return asAdmin(() => {
        const cur = adminStore.get().invites.find((i) => i.id === id) ?? notFound("mã mời này");
        const next = { ...cur, revoked: true };
        writeDb((db) => ({ ...db, invites: db.invites.map((i) => (i.id === id ? next : i)) }));
        logMockAudit("Thu hồi mã mời", cur.code);
        return next;
      });
    },
  },

  albums: {
    list(): Promise<AdminAlbum[]> {
      if (BASE) return http("/admin/albums");
      return asAdmin(() => [...adminStore.get().albums].sort((a, b) => b.takenFrom.localeCompare(a.takenFrom)));
    },
    update(id: string, patch: AlbumPatch): Promise<AdminAlbum> {
      if (BASE) return http(`/admin/albums/${id}`, json("PATCH", patch));
      return asAdmin(() => {
        const cur = adminStore.get().albums.find((a) => a.id === id) ?? notFound("album này");
        const next = { ...cur, ...patch };
        writeDb((db) => ({ ...db, albums: db.albums.map((a) => (a.id === id ? next : a)) }));
        logMockAudit(patch.visibility ? "Đổi người được xem album" : "Sửa album", next.title);
        return next;
      });
    },
    remove(id: string): Promise<void> {
      if (BASE) return http(`/admin/albums/${id}`, json("DELETE"));
      return asAdmin(() => {
        const cur = adminStore.get().albums.find((a) => a.id === id) ?? notFound("album này");
        writeDb((db) => ({ ...db, albums: db.albums.filter((a) => a.id !== id), photos: db.photos.filter((p) => p.albumId !== id) }));
        logMockAudit("Xoá album", `${cur.title} (${cur.photoCount} ảnh)`);
      }, 500);
    },
    photos(albumId: string): Promise<AdminPhoto[]> {
      if (BASE) return http(`/admin/albums/${albumId}/photos`);
      return asAdmin(() => adminStore.get().photos.filter((p) => p.albumId === albumId));
    },
    removePhoto(albumId: string, photoId: string): Promise<void> {
      if (BASE) return http(`/admin/albums/${albumId}/photos/${photoId}`, json("DELETE"));
      return asAdmin(() => {
        const db = adminStore.get();
        const album = db.albums.find((a) => a.id === albumId) ?? notFound("album này");
        const photo = db.photos.find((p) => p.id === photoId) ?? notFound("ảnh này");
        writeDb((d) => ({
          ...d,
          photos: d.photos.filter((p) => p.id !== photoId),
          albums: d.albums.map((a) => (a.id === albumId ? { ...a, photoCount: Math.max(0, a.photoCount - 1) } : a)),
        }));
        logMockAudit("Xoá ảnh", `${photo.memo ?? "Ảnh"} trong "${album.title}"`);
      });
    },
  },

  media: {
    list(): Promise<MediaAsset[]> {
      if (BASE) return http("/admin/media");
      return asAdmin(() =>
        [...adminStore.get().media].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).map((m) => ({ ...m, usedIn: usageOf(m.url, m.id) })),
      );
    },
    /** Real backend: multipart with `file`, `name`, `alt`. Mock: stores the data URL. */
    upload(input: MediaUpload & { file?: File }): Promise<MediaAsset> {
      if (BASE) {
        const form = new FormData();
        if (input.file) form.append("file", input.file);
        form.append("name", input.name);
        form.append("alt", input.alt);
        return http("/admin/media", { method: "POST", body: form });
      }
      return asAdmin(() => {
        const m = {
          id: `m-${crypto.randomUUID().slice(0, 8)}`,
          url: input.dataUrl,
          name: input.name,
          alt: input.alt,
          width: input.width,
          height: input.height,
          sizeBytes: input.sizeBytes,
          uploadedAt: new Date().toISOString(),
          uploadedBy: mockActor(),
        };
        writeDb((db) => ({ ...db, media: [m, ...db.media] }));
        logMockAudit("Tải ảnh lên thư viện", m.name);
        return { ...m, usedIn: [] };
      }, 200);
    },
    update(id: string, patch: { name?: string; alt?: string }): Promise<MediaAsset> {
      if (BASE) return http(`/admin/media/${id}`, json("PATCH", patch));
      return asAdmin(() => {
        const cur = adminStore.get().media.find((m) => m.id === id) ?? notFound("ảnh này");
        const next = { ...cur, ...patch };
        writeDb((db) => ({ ...db, media: db.media.map((m) => (m.id === id ? next : m)) }));
        logMockAudit("Sửa ảnh trong thư viện", next.name);
        return { ...next, usedIn: usageOf(next.url, next.id) };
      });
    },
    remove(id: string): Promise<void> {
      if (BASE) return http(`/admin/media/${id}`, json("DELETE"));
      return asAdmin(() => {
        const cur = adminStore.get().media.find((m) => m.id === id) ?? notFound("ảnh này");
        writeDb((db) => ({ ...db, media: db.media.filter((m) => m.id !== id) }));
        logMockAudit("Xoá ảnh khỏi thư viện", cur.name);
      });
    },
  },

  assistant: {
    get(): Promise<AssistantConfig> {
      if (BASE) return http("/admin/assistant");
      return asAdmin(() => adminStore.get().assistant);
    },
    save(config: AssistantConfig): Promise<AssistantConfig> {
      if (BASE) return http("/admin/assistant", json("PUT", config));
      return asAdmin(() => {
        writeDb((db) => ({ ...db, assistant: config }));
        logMockAudit("Sửa cài đặt trợ lý AI", `${config.suggestions.length} câu gợi ý, trẻ em ${config.kidDailyLimit || "không giới hạn"} câu/ngày`);
        return config;
      }, 450);
    },
  },

  system: {
    get(): Promise<SystemSettings> {
      if (BASE) return http("/admin/system");
      return asAdmin(() => adminStore.get().system);
    },
    save(s: SystemSettings): Promise<SystemSettings> {
      if (BASE) return http("/admin/system", json("PUT", s));
      return asAdmin(() => {
        writeDb((db) => ({ ...db, system: s }));
        logMockAudit("Sửa cài đặt hệ thống", s.familyName);
        return s;
      }, 450);
    },
  },

  audit(): Promise<AuditEntry[]> {
    if (BASE) return http("/admin/audit?limit=200");
    return asAdmin(() => adminStore.get().audit);
  },

  /** Mock only: wipe every admin change and start from the seed data. */
  resetDemo(): Promise<void> {
    if (BASE) return Promise.resolve();
    adminStore.reset();
    return fake(undefined, 200);
  },
};
