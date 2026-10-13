import type { AdminAlbum, AdminUser } from "@/lib/api/admin-types";

const dm = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
const dmy = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/** "18/02/2026", "18/02 - 22/02/2026" or "28/12/2025 - 03/01/2026". */
export function dateRange(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to || from);
  if (a.toDateString() === b.toDateString()) return dmy(a);
  if (a.getFullYear() === b.getFullYear()) return `${dm(a)} - ${dmy(b)}`;
  return `${dmy(a)} - ${dmy(b)}`;
}

/** Names of the guests an album is shared with, in the order of the guest list. */
export function sharedGuests(album: AdminAlbum, guests: AdminUser[]) {
  if (album.visibility.kind !== "shared") return [];
  const ids = new Set(album.visibility.guestIds);
  return guests.filter((g) => ids.has(g.id));
}
