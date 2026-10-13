// Mock database for the admin area. Lives in localStorage (persisted) so the
// demo keeps changes after a reload.
import { albums as baseAlbums, assistantSuggestions } from "./mock-data";
import { ApiError, persisted } from "./core";
import type {
  Actor,
  AdminAlbum,
  AdminPhoto,
  AdminUser,
  AssistantConfig,
  AuditEntry,
  InviteCode,
  JoinRequest,
  MediaAsset,
  SystemSettings,
} from "./admin-types";

const pic = (seed: string, w: number, h: number) => `https://picsum.photos/seed/fp-${seed}/${w}/${h}`;
const MB = 1024 ** 2;

const quan: Actor = { id: "u-quan", name: "Bố Minh Quân" };
const ha: Actor = { id: "u-ha", name: "Mẹ Thu Hà" };
const bao: Actor = { id: "u-bao", name: "Gia Bảo" };

const users: AdminUser[] = [
  { id: "u-quan", name: "Bố Minh Quân", nickname: "Bố", role: "admin", email: "admin@familyphotos.vn", phone: "0903 215 664", status: "active", lastActiveAt: "2026-10-13T10:24:00", createdAt: "2025-11-02T08:00:00", storageBytes: 3_812 * MB },
  { id: "u-ha", name: "Mẹ Thu Hà", nickname: "Mẹ", role: "member", email: "thuha@familyphotos.vn", phone: "0912 744 108", status: "active", lastActiveAt: "2026-10-13T09:51:00", createdAt: "2025-11-02T08:20:00", storageBytes: 4_406 * MB },
  { id: "u-bao", name: "Gia Bảo", nickname: "Bảo", role: "member", grade: 9, email: "demo@familyphotos.vn", phone: "0912 486 731", status: "active", lastActiveAt: "2026-10-13T08:12:00", createdAt: "2025-11-03T19:40:00", storageBytes: 1_320 * MB },
  { id: "u-na", name: "Khánh Na", nickname: "Na", role: "member", grade: 5, email: "khanhna@familyphotos.vn", status: "active", lastActiveAt: "2026-10-12T20:06:00", createdAt: "2025-11-03T19:52:00", storageBytes: 612 * MB },
  { id: "u-bin", name: "Minh Khôi", nickname: "Bin", role: "member", grade: 2, email: "bin@familyphotos.vn", status: "active", lastActiveAt: "2026-10-11T18:30:00", createdAt: "2026-01-14T10:00:00", storageBytes: 88 * MB },
  { id: "u-ba", name: "Bà nội", nickname: "Bà nội", role: "member", phone: "0386 120 557", status: "active", lastActiveAt: "2026-10-10T09:31:00", createdAt: "2025-12-26T15:10:00", storageBytes: 245 * MB },
  { id: "u-oanh", name: "Bà ngoại Kim Oanh", nickname: "Bà ngoại", role: "member", phone: "0977 301 842", status: "active", lastActiveAt: "2026-09-29T07:45:00", createdAt: "2026-02-10T11:00:00", storageBytes: 174 * MB },
  { id: "u-co", name: "Cô Lan", nickname: "Cô Lan", role: "guest", email: "khach@familyphotos.vn", status: "active", lastActiveAt: "2026-10-08T21:14:00", createdAt: "2026-02-15T09:00:00", storageBytes: 0 },
  { id: "u-tu", name: "Chú Tư Hải", nickname: "Chú Tư", role: "guest", phone: "0908 663 219", status: "active", lastActiveAt: "2026-09-21T12:02:00", createdAt: "2026-02-18T16:30:00", storageBytes: 0 },
  { id: "u-mai", name: "Dì Út Mai", nickname: "Dì Út", role: "guest", email: "utmai.ng@familyphotos.vn", status: "active", lastActiveAt: "2026-10-02T19:20:00", createdAt: "2026-06-30T08:00:00", storageBytes: 0 },
  { id: "u-thao", name: "Chị Phương Thảo", role: "guest", email: "phuongthao@familyphotos.vn", status: "active", createdAt: "2026-10-01T14:00:00", storageBytes: 0 },
  { id: "u-khoa", name: "Anh Đăng Khoa", role: "guest", phone: "0335 908 116", status: "locked", lastActiveAt: "2026-07-04T22:41:00", createdAt: "2026-03-08T10:10:00", storageBytes: 0 },
  { id: "u-hanh", name: "Bác Hai Hạnh", nickname: "Bác Hai", role: "guest", phone: "0869 552 071", status: "active", lastActiveAt: "2026-08-17T06:58:00", createdAt: "2026-04-19T17:25:00", storageBytes: 0 },
];

const requests: JoinRequest[] = [
  { id: "r1", name: "Chú Sáu Thành", identifier: "0918 402 336", message: "Chú là em bà nội, muốn xem ảnh Tết của các cháu.", requestedAt: "2026-10-13T07:42:00" },
  { id: "r2", name: "Chị Ngọc Ánh", identifier: "ngocanh.le@familyphotos.vn", message: "Bạn cùng phòng của Hà hồi đại học.", requestedAt: "2026-10-12T21:05:00" },
  { id: "r3", name: "Cô Hồng Nhung", identifier: "0904 771 290", requestedAt: "2026-10-10T16:18:00" },
];

const invites: InviteCode[] = [
  { id: "i1", code: "NHA-4821", role: "member", note: "Cho bà ngoại", createdBy: quan, createdAt: "2026-10-01T09:00:00", expiresAt: "2026-10-31T23:59:00", maxUses: 2, uses: 1, revoked: false },
  { id: "i2", code: "NHA-7305", role: "guest", note: "Họ nhà nội về ăn giỗ", createdBy: ha, createdAt: "2026-08-20T10:30:00", expiresAt: "2026-09-05T23:59:00", maxUses: 10, uses: 6, revoked: false },
  { id: "i3", code: "NHA-1964", role: "guest", createdBy: quan, createdAt: "2026-06-11T08:15:00", expiresAt: "2026-07-11T23:59:00", maxUses: 5, uses: 0, revoked: true },
];

const memos: Record<string, string[]> = {
  "tet-2026": ["Mùng 1, cả nhà ở sân", "Bà lì xì Na", "Gói bánh chưng", "Hoa đào trước cổng", "Mâm cỗ chiều 30", "Đi chùa đầu năm", "Bố đốt pháo giấy", "Bin mặc áo dài"],
  "da-lat": ["Hồ Tuyền Lâm, 6 giờ sáng", "Chợ đêm, lạnh run", "Đồi chè Cầu Đất", "Ăn bánh căn", "Thác Datanla", "Vườn dâu"],
  "sinh-nhat-na": ["Bánh kem dâu", "Thổi nến", "Quà của anh Bảo", "Cả lớp đến chơi", "Na và bà ngoại"],
  "khai-giang": ["Na vào lớp 5", "Cổng trường sáng sớm", "Bin lần đầu đi học", "Chào cờ"],
  "que-noi": ["Cánh đồng sau nhà bà", "Ông bà và con mèo Mướp", "Ao cá", "Bếp củi", "Chợ quê", "Đạp xe ra đê", "Bà nấu canh cua"],
};

const uploaders = [ha, quan, bao];

const photos: AdminPhoto[] = baseAlbums.flatMap((a) =>
  (memos[a.id] ?? []).map((memo, i) => {
    const tall = i % 3 === 1;
    const day = new Date(a.takenFrom);
    day.setDate(day.getDate() + Math.min(i, 3));
    return {
      id: `${a.id}-${i + 1}`,
      albumId: a.id,
      url: pic(`${a.id}-${i + 1}`, tall ? 600 : 800, tall ? 800 : 600),
      width: tall ? 600 : 800,
      height: tall ? 800 : 600,
      takenAt: day.toISOString().slice(0, 10),
      memo,
      uploadedBy: uploaders[i % 3],
    };
  }),
);

const albums: AdminAlbum[] = baseAlbums.map((a, i) => ({
  ...a,
  photoCount: photos.filter((p) => p.albumId === a.id).length,
  createdBy: uploaders[i % 3],
  visibility:
    a.id === "tet-2026" ? { kind: "shared", guestIds: ["u-co", "u-tu", "u-hanh"] } : a.id === "sinh-nhat-na" ? { kind: "shared", guestIds: ["u-mai"] } : { kind: "family" },
}));

const asset = (id: string, seed: string, w: number, h: number, name: string, alt: string, kb: number, at: string, by: Actor): Omit<MediaAsset, "usedIn"> => ({
  id,
  url: pic(seed, w, h),
  name,
  alt,
  width: w,
  height: h,
  sizeBytes: kb * 1024,
  uploadedAt: at,
  uploadedBy: by,
});

const media: Omit<MediaAsset, "usedIn">[] = [
  asset("m1", "p1", 800, 600, "mung-1-ca-nha.jpg", "Cả nhà đứng ở sân sáng mùng 1", 214, "2026-02-18T09:10:00", ha),
  asset("m2", "p2", 800, 600, "ba-li-xi-na.jpg", "Bà lì xì cho Na", 188, "2026-02-18T09:11:00", ha),
  asset("m3", "p3", 800, 600, "ho-tuyen-lam.jpg", "Hồ Tuyền Lâm lúc 6 giờ sáng", 241, "2026-07-04T20:30:00", bao),
  asset("m4", "p5", 800, 600, "na-10-tuoi.jpg", "Na bên bánh kem sinh nhật", 176, "2026-08-10T08:02:00", ha),
  asset("m5", "p8", 600, 450, "ong-ba-meo-muop.jpg", "Ông bà và con mèo Mướp", 132, "2026-01-03T18:44:00", quan),
  asset("m6", "p3", 600, 450, "ho-tuyen-lam-nho.jpg", "Hồ Tuyền Lâm, ảnh nhỏ cho trang đăng nhập", 96, "2026-07-04T20:31:00", quan),
  asset("m7", "p6", 600, 450, "na-vao-lop-5.jpg", "Na trước cổng trường ngày khai giảng", 118, "2026-09-05T11:20:00", quan),
  asset("m8", "lib-hoa-dao", 800, 600, "hoa-dao-truoc-cong.jpg", "Cành hoa đào trước cổng nhà", 203, "2026-02-19T07:30:00", ha),
  asset("m9", "lib-dong-lua", 800, 600, "dong-lua-que-noi.jpg", "Cánh đồng lúa sau nhà bà nội", 257, "2026-01-03T18:50:00", bao),
  asset("m10", "lib-bep-cui", 600, 800, "bep-cui.jpg", "Bếp củi nhà bà nội", 164, "2026-01-03T18:52:00", bao),
  asset("m11", "lib-cau-dat", 800, 600, "doi-che-cau-dat.jpg", "Đồi chè Cầu Đất buổi chiều", 229, "2026-07-04T20:40:00", ha),
];

const assistant: AssistantConfig = {
  systemPrompt:
    "Bạn là trợ lý của gia đình. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện. Khi trẻ hỏi bài, gợi ý từng bước để các con tự làm, không đưa đáp án ngay. Không chia sẻ ảnh hay thông tin của nhà ra ngoài.",
  suggestions: [...assistantSuggestions],
  guestsAllowed: false,
  kidDailyLimit: 30,
  provider: "claude",
};

const system: SystemSettings = {
  familyName: "Nhà Minh Quân",
  quotaPerUserGb: 5,
  allowGuestSelfSignup: true,
  qrTtlSeconds: 60,
};

const audit: AuditEntry[] = [
  { id: "a1", at: "2026-10-12T21:40:00", actor: quan, action: "Tạo mã mời", target: "NHA-4821 cho bà ngoại" },
  { id: "a2", at: "2026-10-11T08:05:00", actor: quan, action: "Chia sẻ album", target: "Tết Bính Ngọ cho Bác Hai Hạnh" },
  { id: "a3", at: "2026-10-09T19:22:00", actor: quan, action: "Sửa bài học", target: "Toán 9: Phương trình bậc nhất hai ẩn" },
  { id: "a4", at: "2026-10-05T10:14:00", actor: quan, action: "Đổi giới hạn trợ lý", target: "Trẻ em: 30 câu mỗi ngày" },
  { id: "a5", at: "2026-10-01T14:02:00", actor: quan, action: "Duyệt khách", target: "Chị Phương Thảo" },
  { id: "a6", at: "2026-09-28T16:40:00", actor: quan, action: "Sửa nội dung trang công khai", target: "Câu chào ở trang đăng nhập" },
  { id: "a7", at: "2026-07-05T09:00:00", actor: quan, action: "Khoá tài khoản", target: "Anh Đăng Khoa" },
];

/** Things the family did (not admin changes); mixed into the overview feed. */
const activity: AuditEntry[] = [
  { id: "e1", at: "2026-10-13T09:48:00", actor: ha, action: "Thêm 21 ảnh", target: "Ngày khai giảng" },
  { id: "e2", at: "2026-10-13T08:10:00", actor: bao, action: "Học xong bài", target: "Toán 9: Hệ hai phương trình" },
  { id: "e3", at: "2026-10-13T07:42:00", actor: { id: "r1", name: "Chú Sáu Thành" }, action: "Xin vào nhà", target: "Tài khoản khách" },
  { id: "e4", at: "2026-10-12T20:05:00", actor: { id: "u-na", name: "Khánh Na" }, action: "Hỏi trợ lý", target: "Bài phân số lớp 5" },
  { id: "e5", at: "2026-10-12T18:30:00", actor: quan, action: "Thêm 7 ảnh", target: "Về quê nội" },
  { id: "e6", at: "2026-10-10T09:31:00", actor: { id: "u-ba", name: "Bà nội" }, action: "Bình luận ảnh", target: "Ông bà và con mèo Mướp" },
];

export interface AdminDb {
  users: AdminUser[];
  requests: JoinRequest[];
  invites: InviteCode[];
  albums: AdminAlbum[];
  photos: AdminPhoto[];
  media: Omit<MediaAsset, "usedIn">[];
  assistant: AssistantConfig;
  system: SystemSettings;
  audit: AuditEntry[];
  activity: AuditEntry[];
  /** New photos per day this week, oldest first. */
  photosPerDay: number[];
}

export const adminSeed: AdminDb = {
  users,
  requests,
  invites,
  albums,
  photos,
  media,
  assistant,
  system,
  audit,
  activity,
  photosPerDay: [4, 0, 12, 3, 0, 7, 21],
};

export const adminStore = persisted<AdminDb>("admin", adminSeed);

/** Write through the store; localStorage can fill up with uploaded images. */
export function writeDb(fn: (db: AdminDb) => AdminDb | void): AdminDb {
  try {
    return adminStore.update((db) => fn(db) ?? db);
  } catch {
    throw new ApiError(413, "Bộ nhớ của bản demo đã đầy. Xoá bớt ảnh trong thư viện rồi thử lại.");
  }
}

function sessionUser(): { id: string; name: string; role: string } | null {
  try {
    const raw = localStorage.getItem("fp-session");
    return raw ? (JSON.parse(raw).user ?? null) : null;
  } catch {
    return null;
  }
}

/** Mirrors the backend rule: only role "admin" may call admin endpoints. */
export function mockRequireAdmin() {
  const u = sessionUser();
  if (!u) throw new ApiError(401, "Bạn cần đăng nhập lại.");
  if (u.role !== "admin") throw new ApiError(403, "Chỉ quản trị viên được làm việc này.");
}

export function mockActor(): Actor {
  const u = sessionUser();
  return u ? { id: u.id, name: u.name } : quan;
}

export function logMockAudit(action: string, target: string) {
  const entry: AuditEntry = { id: crypto.randomUUID(), at: new Date().toISOString(), actor: mockActor(), action, target };
  try {
    adminStore.update((db) => ({ ...db, audit: [entry, ...db.audit].slice(0, 200) }));
  } catch {
    /* audit is best effort in the demo */
  }
}
