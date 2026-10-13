"use client";

import { ArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import { LoadError } from "@/components/album/PhotosScreen";
import { formatBytes } from "@/components/settings/shared";
import { Avatar } from "@/components/ui/Avatar";
import { adminApi } from "@/lib/api/admin";
import type { AdminOverview } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { PageHeader, timeAgo } from "./ui";

const shortcuts = [
  { href: "/admin/content", label: "Sửa chữ và ảnh trang chủ" },
  { href: "/admin/members#invites", label: "Tạo mã mời người nhà" },
  { href: "/admin/library", label: "Tải ảnh lên thư viện" },
  { href: "/admin/lessons", label: "Soạn bài học" },
  { href: "/admin/albums", label: "Chia sẻ album cho khách" },
  { href: "/admin/system", label: "Xem nhật ký thay đổi" },
];

export function OverviewScreen() {
  const data = useApi(adminApi.overview);
  const s = useSession();
  const hello = s ? `Chào ${s.user.nickname ?? s.user.name}` : "Tổng quan";

  if (data.status === "loading")
    return (
      <>
        <PageHeader title={hello} description="Đang mở sổ nhà..." />
        <div aria-busy="true" className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <div className="h-7 w-56 animate-pulse rounded bg-paper-3" />
            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />)}
          </div>
          <div className="h-72 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
        </div>
      </>
    );

  if (data.status === "error")
    return (
      <>
        <PageHeader title={hello} />
        <div className="mt-8"><LoadError onRetry={data.reload} what="tổng quan" /></div>
      </>
    );

  const o = data.data;
  return (
    <>
      <PageHeader
        title={hello}
        description={`Nhà mình có ${o.memberCount} người trong nhà và ${o.guestCount} khách. Đây là những việc đáng xem hôm nay.`}
      />
      <div className="mt-8 grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-12">
          <Household o={o} />
          <Activity o={o} />
        </div>
        <aside aria-labelledby="shortcuts-h" className="lg:sticky lg:top-10 lg:self-start">
          <h2 id="shortcuts-h" className="text-xl font-bold">Lối tắt</h2>
          <ul className="mt-3 flex flex-col">
            {shortcuts.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group flex h-12 items-center gap-3 border-b border-line text-ink-2 transition-colors hover:text-ink">
                  <span className="shrink-0 font-medium">{l.label}</span>
                  <span aria-hidden="true" className="h-px flex-1 translate-y-1 border-b border-dotted border-rule" />
                  <ArrowRight size={16} className="shrink-0 text-ink-3 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:text-coral-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}

const weekday = (offsetFromToday: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetFromToday);
  return offsetFromToday === 0 ? "Nay" : ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
};

/** People, storage and photos, each in the form that suits it. */
function Household({ o }: { o: AdminOverview }) {
  const pct = Math.min(100, Math.round((o.storage.usedBytes / o.storage.quotaBytes) * 100));
  const max = Math.max(1, ...o.photosThisWeek.perDay);
  const rest = o.storage.usedBytes - o.storage.top.reduce((n, t) => n + t.bytes, 0);
  const shades = ["bg-coral", "bg-coral/70", "bg-coral/45", "bg-coral/25"];

  return (
    <section aria-labelledby="home-h">
      <h2 id="home-h" className="text-2xl font-bold">Nhà mình tuần này</h2>
      <div className="mt-5 grid gap-10 md:grid-cols-2">
        <div>
          <p className="text-lg leading-relaxed text-ink-2">
            <span className="font-display text-3xl font-semibold text-ink">{o.photosThisWeek.total}</span> ảnh mới trong 7 ngày qua.
          </p>
          <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={`Ảnh mới mỗi ngày: ${o.photosThisWeek.perDay.join(", ")}`}>
            {o.photosThisWeek.perDay.map((n, i, all) => {
              const today = i === all.length - 1;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="tabular text-xs text-ink-3">{n || ""}</span>
                  <span className={`w-full rounded-t-[3px] ${today ? "bg-coral" : "bg-ink-3/35"}`} style={{ height: `${Math.max(3, (n / max) * 72)}px` }} />
                  <span className={`text-xs ${today ? "font-semibold text-ink" : "text-ink-3"}`}>{weekday(all.length - 1 - i)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-lg leading-relaxed text-ink-2">
            Đã dùng <span className="font-display text-3xl font-semibold text-ink">{formatBytes(o.storage.usedBytes)}</span> trên {formatBytes(o.storage.quotaBytes)}.
          </p>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-paper-3" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Dung lượng đã dùng">
            {o.storage.top.map((t, i) => (
              <span key={t.user.id} className={`h-full ${shades[i]} border-r border-paper last:border-r-0`} style={{ width: `${(t.bytes / o.storage.quotaBytes) * 100}%` }} />
            ))}
            {rest > 0 && <span className="h-full bg-ink-3/40" style={{ width: `${(rest / o.storage.quotaBytes) * 100}%` }} />}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {o.storage.top.map((t, i) => (
              <li key={t.user.id} className="flex items-center gap-2 text-ink-2">
                <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${shades[i]}`} />
                <span className="truncate">{t.user.name}</span>
                <span className="tabular ml-auto shrink-0 text-ink-3">{formatBytes(t.bytes)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-8 border-t border-line pt-4 text-ink-2">
        <Link href="/admin/members" className="font-semibold text-ink underline decoration-rule hover:decoration-coral">{o.memberCount} người trong nhà</Link>
        , trong đó {o.kidCount} con đang đi học.{" "}
        <Link href="/admin/members" className="font-semibold text-ink underline decoration-rule hover:decoration-coral">{o.guestCount} khách</Link> được xem album chia sẻ.
      </p>
    </section>
  );
}

function Activity({ o }: { o: AdminOverview }) {
  return (
    <section aria-labelledby="activity-h">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="activity-h" className="text-2xl font-bold">Hoạt động gần đây</h2>
        <Link href="/admin/system" className="shrink-0 text-sm font-semibold text-coral-ink underline">Nhật ký đầy đủ</Link>
      </div>
      {o.activity.length === 0 ? (
        <p className="mt-2 text-ink-2">Chưa có hoạt động nào. Khi cả nhà thêm ảnh, học bài hay bạn đổi cài đặt, mọi việc sẽ ghi ở đây.</p>
      ) : (
        <ol className="mt-4 flex flex-col">
          {o.activity.map((a) => (
            <li key={a.id} className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
              <Avatar user={{ name: a.actor.name }} size="sm" />
              <p className="min-w-0 flex-1 text-ink-2">
                <span className="font-semibold text-ink">{a.actor.name}</span> {a.action.charAt(0).toLowerCase() + a.action.slice(1)}
                {a.target && <>: <span className="text-ink">{a.target}</span></>}
              </p>
              <time dateTime={a.at} className="shrink-0 pt-0.5 text-sm text-ink-3">{timeAgo(a.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
