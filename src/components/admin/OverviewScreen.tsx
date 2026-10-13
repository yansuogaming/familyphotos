"use client";

import { ArrowRight, Check, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { formatBytes, useToast } from "@/components/settings/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";
import type { AdminOverview, JoinRequest } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { ConfirmDialog, ErrorNote, PageHeader, RibbonMark, errorText, timeAgo } from "./ui";

const shortcuts = [
  { href: "/quan-tri/noi-dung", label: "Sửa chữ và ảnh trang chủ" },
  { href: "/quan-tri/thanh-vien#ma-moi", label: "Tạo mã mời người nhà" },
  { href: "/quan-tri/thu-vien", label: "Tải ảnh lên thư viện" },
  { href: "/quan-tri/hoc-lieu", label: "Soạn bài học" },
  { href: "/quan-tri/album", label: "Chia sẻ album cho khách" },
  { href: "/quan-tri/he-thong", label: "Xem nhật ký thay đổi" },
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
          <Pending initial={o.pending} />
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

/** First thing on the page: guests waiting at the door. */
function Pending({ initial }: { initial: JoinRequest[] }) {
  const toast = useToast();
  const [list, setList] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<JoinRequest | null>(null);

  async function approve(r: JoinRequest) {
    setBusy(r.id);
    setError(null);
    try {
      await adminApi.requests.approve(r.id);
      setList((l) => l.filter((x) => x.id !== r.id));
      toast(`Đã cho ${r.name} vào nhà.`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="pending-h">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="pending-h" className="flex items-center gap-3 text-2xl font-bold">
          {list.length > 0 && <RibbonMark className="h-7 w-3" />}
          {list.length > 0 ? `${list.length} người đang chờ bạn duyệt` : "Không có ai đang chờ duyệt"}
        </h2>
        <Link href="/quan-tri/thanh-vien#cho-duyet" className="shrink-0 text-sm font-semibold text-coral-ink underline">Xem tất cả</Link>
      </div>
      {list.length === 0 ? (
        <p className="mt-2 text-ink-2">Khi họ hàng đăng ký làm khách, lời xin vào sẽ hiện ở đây để bạn duyệt.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-[var(--radius-paper)] border border-line">
          {list.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar user={{ name: r.name }} size="sm" className="mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {r.name} <span className="font-normal text-ink-3">· {timeAgo(r.requestedAt)}</span>
                  </p>
                  <p className="truncate text-sm text-ink-2">{r.identifier}</p>
                  {r.message && <p className="mt-1 text-sm text-ink-2">“{r.message}”</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2 pl-11 sm:pl-0">
                <Button size="sm" onClick={() => approve(r)} disabled={busy === r.id}>
                  <Check size={16} weight="bold" /> {busy === r.id ? "Đang duyệt..." : "Duyệt"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRejecting(r)} disabled={busy === r.id}>
                  <X size={16} /> Từ chối
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>}
      <ConfirmDialog
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={`Từ chối ${rejecting?.name ?? ""}?`}
        body="Lời xin vào sẽ bị xoá. Người này vẫn có thể đăng ký lại sau."
        confirmLabel="Từ chối"
        onConfirm={async () => {
          if (!rejecting) return;
          await adminApi.requests.reject(rejecting.id);
          setList((l) => l.filter((x) => x.id !== rejecting.id));
          toast(`Đã từ chối ${rejecting.name}.`);
        }}
      />
    </section>
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
        <Link href="/quan-tri/thanh-vien" className="font-semibold text-ink underline decoration-rule hover:decoration-coral">{o.memberCount} người trong nhà</Link>
        , trong đó {o.kidCount} con đang đi học.{" "}
        <Link href="/quan-tri/thanh-vien" className="font-semibold text-ink underline decoration-rule hover:decoration-coral">{o.guestCount} khách</Link> được xem album chia sẻ.
      </p>
    </section>
  );
}

function Activity({ o }: { o: AdminOverview }) {
  return (
    <section aria-labelledby="activity-h">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="activity-h" className="text-2xl font-bold">Hoạt động gần đây</h2>
        <Link href="/quan-tri/he-thong" className="shrink-0 text-sm font-semibold text-coral-ink underline">Nhật ký đầy đủ</Link>
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
