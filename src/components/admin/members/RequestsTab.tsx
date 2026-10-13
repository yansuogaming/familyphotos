"use client";

import { Check, EnvelopeSimple, Phone } from "@/components/ui/icons";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { useToast } from "@/components/settings/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, EmptyState, ErrorNote, RowsSkeleton, errorText, formatDate, timeAgo } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AdminUser, JoinRequest } from "@/lib/api/admin-types";

export function RequestsTab({
  status,
  requests,
  onRetry,
  update,
  onApproved,
}: {
  status: "loading" | "error" | "ready";
  requests: JoinRequest[] | undefined;
  onRetry: () => void;
  update: (fn: (l: JoinRequest[]) => JoinRequest[]) => void;
  onApproved: (u: AdminUser) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<JoinRequest | null>(null);

  if (status === "loading") return <RowsSkeleton rows={3} cols={3} />;
  if (status === "error" || !requests) return <LoadError onRetry={onRetry} what="lời xin vào" />;
  if (requests.length === 0)
    return (
      <EmptyState
        title="Không có ai đang chờ."
        body="Khi người thân bấm Xin vào nhà ở trang đăng nhập, lời xin của họ hiện ở đây để bạn duyệt."
      />
    );

  async function approve(r: JoinRequest) {
    setBusy(r.id);
    setErrors((m) => {
      const next = { ...m };
      delete next[r.id];
      return next;
    });
    try {
      const user = await adminApi.requests.approve(r.id);
      update((l) => l.filter((x) => x.id !== r.id));
      onApproved(user);
      toast(`Đã duyệt ${r.name}. Người này vào với vai trò Khách.`);
    } catch (e) {
      setErrors((m) => ({ ...m, [r.id]: errorText(e) }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-2">Người được duyệt vào với vai trò Khách và chỉ xem album được chia sẻ. Đổi vai trò ở tab Thành viên.</p>
      <ul className="divide-y divide-line rounded-[var(--radius-paper)] border border-line">
        {requests.map((r) => {
          const isEmail = r.identifier.includes("@");
          const ContactIcon = isEmail ? EnvelopeSimple : Phone;
          return (
            <li key={r.id} className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="flex min-w-0 gap-3">
                <Avatar user={{ name: r.name }} size="md" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold">{r.name}</span>
                    <time dateTime={r.requestedAt} title={formatDate(r.requestedAt)} className="text-sm text-ink-3">
                      {timeAgo(r.requestedAt)}
                    </time>
                  </p>
                  <p className={`mt-0.5 flex items-center gap-1.5 text-sm text-ink-2 ${isEmail ? "" : "tabular"}`}>
                    <ContactIcon size={16} aria-hidden="true" className="shrink-0 text-ink-3" />
                    <span className="truncate">{r.identifier}</span>
                  </p>
                  {r.message ? (
                    <p className="mt-2 max-w-[60ch] font-hand text-lg leading-snug text-ink">&ldquo;{r.message}&rdquo;</p>
                  ) : (
                    <p className="mt-2 text-sm text-ink-3">Không để lại lời nhắn.</p>
                  )}
                  {errors[r.id] && <div className="mt-3"><ErrorNote>{errors[r.id]}</ErrorNote></div>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-14 md:pl-0">
                <Button onClick={() => approve(r)} disabled={busy === r.id}>
                  <Check size={18} weight="bold" aria-hidden="true" /> {busy === r.id ? "Đang duyệt..." : "Duyệt"}
                </Button>
                <Button variant="secondary" onClick={() => setRejecting(r)} disabled={busy === r.id}>Từ chối</Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={`Từ chối ${rejecting?.name ?? ""}?`}
        body={<p>Lời xin vào bị xoá. Người này vẫn có thể xin lại sau, hoặc bạn gửi mã mời cho họ.</p>}
        confirmLabel="Từ chối"
        onConfirm={async () => {
          const r = rejecting!;
          await adminApi.requests.reject(r.id);
          update((l) => l.filter((x) => x.id !== r.id));
          toast(`Đã từ chối ${r.name}`);
        }}
      />
    </div>
  );
}
