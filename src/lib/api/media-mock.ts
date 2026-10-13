// Demo data for media.ts. Fictional family, placeholder photos.
import * as base from "./mock-data";
import { persisted } from "./core";
import type { Album, Photo } from "./types";
import type { AlbumShare, AlbumSpace, Person, PhotoComment } from "./media-types";

const pic = (seed: string, w: number, h: number) => `https://picsum.photos/seed/fp-${seed}/${w}/${h}`;

export const people: Record<string, Person> = {
  bao: { id: "u-bao", name: "Gia Bảo" },
  ha: { id: "u-ha", name: "Mẹ Thu Hà" },
  quan: { id: "u-quan", name: "Bố Minh Quân" },
  na: { id: "u-na", name: "Khánh Na" },
  ba: { id: "u-ba", name: "Bà nội" },
  lan: { id: "u-co", name: "Cô Lan" },
  tu: { id: "u-tu", name: "Chú Tư Hải" },
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Today's day and month, n years back. Keeps "Ngày này năm xưa" alive in the demo. */
function yearsAgo(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return iso(d);
}

const memoryAlbums: Album[] = [
  { id: "ba-vi", title: "Ba Vì mùa thu", coverUrl: pic("bavi", 600, 760), photoCount: 26, takenFrom: yearsAgo(2), takenTo: yearsAgo(2) },
  { id: "na-lop-1", title: "Na vào lớp 1", coverUrl: pic("lop1", 600, 760), photoCount: 14, takenFrom: yearsAgo(4), takenTo: yearsAgo(4) },
];

/** Albums guests made for their own memories. Each guest sees only their own. */
const guestAlbums: Album[] = [
  { id: "co-lan-ghe-nha", title: "Cô Lan ghé nhà", coverUrl: pic("colan", 600, 760), photoCount: 6, takenFrom: "2026-09-21", takenTo: "2026-09-21" },
  { id: "chu-tu-di-hue", title: "Chú Tư đi Huế", coverUrl: pic("hue", 600, 760), photoCount: 5, takenFrom: "2026-08-02", takenTo: "2026-08-04" },
];

export const seedAlbums: Album[] = [...base.albums, ...memoryAlbums, ...guestAlbums];

export interface AccessRule {
  space: AlbumSpace;
  /** guest albums only */
  ownerId?: string;
  /** family albums: guests (user ids) allowed to view it. */
  sharedWith: string[];
}

/** Albums missing here are family albums shared with nobody. */
const accessSeed: Record<string, AccessRule> = {
  "co-lan-ghe-nha": { space: "guest", ownerId: people.lan.id, sharedWith: [] },
  "chu-tu-di-hue": { space: "guest", ownerId: people.tu.id, sharedWith: [] },
  "tet-2026": { space: "family", sharedWith: [people.lan.id] },
};

export const ownerOf = (id?: string) => Object.values(people).find((p) => p.id === id);

const details: Record<string, { description?: string; createdBy: Person }> = {
  "tet-2026": { description: "Ba ngày Tết ở nhà bà nội, Nam Định.", createdBy: people.ha },
  "da-lat": { description: "Năm ngày, bốn người, hai cái áo khoác mỏng quá.", createdBy: people.quan },
  "sinh-nhat-na": { description: "Tiệc nhỏ ở nhà, có cả lớp của Na.", createdBy: people.ha },
  "khai-giang": { createdBy: people.quan },
  "que-noi": { description: "Nghỉ Tết dương lịch ở quê.", createdBy: people.bao },
  "ba-vi": { description: "Đi cắm trại một đêm ở Ba Vì.", createdBy: people.quan },
  "na-lop-1": { createdBy: people.ha },
  "co-lan-ghe-nha": { description: "Ghé thăm cả nhà dịp Trung thu.", createdBy: people.lan },
  "chu-tu-di-hue": { description: "Chuyến đi Huế của chú.", createdBy: people.tu },
};
export const albumMeta = (id: string) => details[id] ?? { createdBy: people.ha };

const memos: Record<string, string[]> = {
  "tet-2026": ["Gói bánh chưng đêm 28", "Ông đồ viết chữ Phúc", "Mâm cỗ chiều 30", "Bắn pháo hoa ở hồ", "Na mặc áo dài đỏ", "Đi lễ chùa sáng mùng 2", "Bố ngủ quên trên võng", "Chơi bầu cua với các em"],
  "da-lat": ["Đồi chè Cầu Đất", "Sương còn trên mái", "Ăn bánh căn ở chợ", "Bảo chụp mẹ, mẹ chụp Bảo", "Thác Datanla", "Vườn dâu, tay đỏ hết"],
  "sinh-nhat-na": ["Thổi nến lần hai", "Quà của bà nội", "Các bạn lớp 5A", "Bóng bay khắp phòng"],
  "khai-giang": ["Cặp sách mới", "Đánh trống khai trường", "Cô chủ nhiệm mới"],
  "que-noi": ["Rơm phơi đầy sân", "Bếp củi của bà", "Thả diều trên đê", "Cá kho niêu đất", "Con Mướp ngủ trên ghế"],
  "ba-vi": ["Lều dựng hơi lệch", "Nướng ngô buổi tối", "Sáng sớm trên đỉnh", "Bố nhóm lửa"],
  "na-lop-1": ["Ngày đầu đi học", "Bố đưa Na tới cổng", "Lớp 1B"],
  "co-lan-ghe-nha": ["Bánh nướng cô mang tới", "Cô với bà ngồi uống trà"],
  "chu-tu-di-hue": ["Cầu Trường Tiền", "Chè Huế"],
};

const uploaders = [people.ha, people.quan, people.bao, people.ha, people.na, people.ba];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic photo list for one album, spread across its days. */
function generate(album: Album): Photo[] {
  const seeded = base.photos.filter((p) => p.albumId === album.id);
  const from = Date.parse(album.takenFrom);
  const days = Math.max(1, Math.round((Date.parse(album.takenTo) - from) / 864e5) + 1);
  const bank = memos[album.id] ?? [];
  const out: Photo[] = [...seeded];
  for (let i = out.length; i < album.photoCount; i++) {
    const h = hash(`${album.id}-${i}`);
    const portrait = h % 3 === 0;
    const w = portrait ? 600 : 800;
    const ht = portrait ? 800 : 600;
    const day = Math.min(days - 1, Math.floor((i / album.photoCount) * days));
    out.push({
      id: `${album.id}-${i}`,
      albumId: album.id,
      url: pic(`${album.id}-${i}`, w, ht),
      width: w,
      height: ht,
      takenAt: iso(new Date(from + day * 864e5)),
      memo: i % 3 === 0 ? bank[(i / 3) % Math.max(1, bank.length)] : undefined,
      uploadedBy: ownerOf(accessSeed[album.id]?.ownerId) ?? uploaders[h % uploaders.length],
    });
  }
  return out.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}

const cache = new Map<string, Photo[]>();
export function seedPhotos(album: Album) {
  if (!cache.has(album.id)) cache.set(album.id, generate(album));
  return cache.get(album.id)!;
}

export const seedComments: Record<string, PhotoComment[]> = {
  p1: [
    { id: "cm1", photoId: "p1", author: people.ba, text: "Cả nhà đông đủ, bà vui lắm.", createdAt: "2026-02-17T19:20:00" },
    { id: "cm2", photoId: "p1", author: people.na, text: "Con đứng sau bố mà không thấy mặt!", createdAt: "2026-02-17T20:02:00" },
  ],
  p2: [{ id: "cm3", photoId: "p2", author: people.ha, text: "Na cười tít mắt.", createdAt: "2026-02-18T08:15:00" }],
  p3: [{ id: "cm4", photoId: "p3", author: people.quan, text: "Dậy sớm mới có ảnh này đấy.", createdAt: "2026-06-29T09:40:00" }],
  p5: [
    { id: "cm5", photoId: "p5", author: people.ba, text: "Bánh đẹp quá, lần sau bà làm cho.", createdAt: "2026-08-09T21:00:00" },
    { id: "cm6", photoId: "p5", author: people.bao, text: "Phần anh đâu?", createdAt: "2026-08-09T21:12:00" },
  ],
  p8: [{ id: "cm7", photoId: "p8", author: people.ba, text: "Mướp béo quá rồi.", createdAt: "2025-12-30T10:05:00" }],
};

export const seedLikes: Record<string, string[]> = {
  p1: ["u-ha", "u-ba", "u-quan"],
  p2: ["u-ba"],
  p3: ["u-ha", "u-quan"],
  p5: ["u-ha", "u-ba", "u-quan", "u-bao"],
  p7: ["u-ba"],
  p8: ["u-ha", "u-na"],
};

/** Changes made during the demo. Survive reloads. */
export const store = {
  memos: persisted<Record<string, string>>("media:memos", {}),
  removed: persisted<string[]>("media:removed", []),
  moved: persisted<Record<string, string>>("media:moved", {}),
  likes: persisted<Record<string, string[]>>("media:likes", seedLikes),
  comments: persisted<Record<string, PhotoComment[]>>("media:comments", {}),
  albums: persisted<Album[]>("media:albums", []),
  shares: persisted<Record<string, AlbumShare>>("media:shares", {}),
  access: persisted<Record<string, AccessRule>>("media:access", accessSeed),
};

/** Photos uploaded in this tab. Kept in memory only: blob URLs die with the page. */
export const uploaded: Photo[] = [];
