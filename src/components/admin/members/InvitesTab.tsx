"use client";

import { Copy, Prohibit } from "@phosphor-icons/react";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { useToast } from "@/components/settings/shared";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog, EmptyState, RowsSkeleton, Tag, formatDate } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { InviteCode } from "@/lib/api/admin-types";
import { roleLabel } from "@/lib/api/types";
import { copyText } from "./shared";

type InviteState = { label: string; tone: "ok" | "warn" | "neutral" | "danger"; usable: boolean };

export function inviteState(i: InviteCode, now: number): InviteState {
  if (i.revoked) return { label: "Đã thu hồi", tone: "neutral", usable: false };
  if (Date.parse(i.expiresAt) <= now) return { label: "Hết hạn", tone: "neutral", usable: false };
  if (i.uses >= i.maxUses) return { label: "Hết lượt", tone: "warn", usable: false };
  return { label: "Còn dùng được", tone: "ok", usable: true };
}

function expiryText(i: InviteCode, now: number) {
  const days = Math.ceil((Date.parse(i.expiresAt) - now) / 864e5);
  if (days <= 0 || i.revoked) return null;
  return days === 1 ? "còn 1 ngày" : `còn ${days} ngày`;
}

export function InvitesTab({
  status,
  invites,
  now,
  onRetry,
  onCreate,
  update,
}: {
  status: "loading" | "error" | "ready";
  invites: InviteCode[] | undefined;
  now: number;
  onRetry: () => void;
  onCreate: () => void;
  update: (fn: (l: InviteCode[]) => InviteCode[]) => void;
}) {
  const toast = useToast();
  const [revoking, setRevoking] = useState<InviteCode | null>(null);

  if (status === "loading") return <RowsSkeleton rows={4} cols={5} />;
  if (status === "error" || !invites) return <LoadError onRetry={onRetry} what="danh sách mã mời" />;
  if (invites.length === 0)
    return (
      <EmptyState
        title="Chưa có mã mời nào"
        body="Tạo mã rồi gửi qua Zalo hay tin nhắn. Người nhận nhập mã ở trang đăng nhập là vào được, không cần chờ duyệt."
        action={<Button onClick={onCreate}>Tạo mã mời</Button>}
      />
    );

  const code = (i: InviteCode, usable: boolean) => (
    <span className={`font-mono text-lg font-bold tracking-[0.08em] tabular-nums ${usable ? "text-ink" : "text-ink-3 line-through decoration-1"}`}>{i.code}</span>
  );

  const used = (i: InviteCode) => (
    <span className="tabular">
      <span className="font-semibold text-ink">{i.uses}</span>/{i.maxUses}
    </span>
  );

  const expiry = (i: InviteCode) => {
    const left = expiryText(i, now);
    return (
      <>
        <span className="tabular">{formatDate(i.expiresAt)}</span>
        {left && <span className="block text-xs text-ink-3">{left}</span>}
      </>
    );
  };

  const actions = (i: InviteCode, usable: boolean) => (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton label={`Sao chép mã ${i.code}`} onClick={() => copyText(i.code, toast)} disabled={!usable} className="disabled:opacity-35">
        <Copy size={18} />
      </IconButton>
      <IconButton label={usable ? `Thu hồi mã ${i.code}` : "Mã này không còn dùng được"} onClick={() => setRevoking(i)} disabled={!usable} className="hover:text-danger disabled:opacity-35">
        <Prohibit size={18} />
      </IconButton>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden overflow-x-auto rounded-[var(--radius-paper)] border border-line md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Mã mời, mới nhất ở trên</caption>
          <thead className="border-b border-line bg-paper-2 text-ink-2">
            <tr>
              <th scope="col" className="h-11 px-4 font-semibold">Mã</th>
              <th scope="col" className="px-4 font-semibold">Dành cho</th>
              <th scope="col" className="hidden px-4 font-semibold lg:table-cell">Người tạo</th>
              <th scope="col" className="px-4 font-semibold">Hạn dùng</th>
              <th scope="col" className="px-4 font-semibold">Đã dùng</th>
              <th scope="col" className="px-4 font-semibold">Trạng thái</th>
              <th scope="col" className="px-4"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => {
              const st = inviteState(i, now);
              return (
                <tr key={i.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-paper-2">
                  <td className="px-4 py-3">
                    {code(i, st.usable)}
                    <span className="block max-w-[16rem] truncate text-ink-3">{i.note ?? "Không có ghi chú"}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-2">{roleLabel[i.role]}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-ink-2 lg:table-cell">
                    {i.createdBy.name}
                    <span className="tabular block text-xs text-ink-3">{formatDate(i.createdAt)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-2">{expiry(i)}</td>
                  <td className="px-4 py-3 text-ink-2">{used(i)}</td>
                  <td className="px-4 py-3"><Tag tone={st.tone}>{st.label}</Tag></td>
                  <td className="px-2 py-1.5">{actions(i, st.usable)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line rounded-[var(--radius-paper)] border border-line md:hidden">
        {invites.map((i) => {
          const st = inviteState(i, now);
          return (
            <li key={i.id} className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                {code(i, st.usable)}
                <Tag tone={st.tone}>{st.label}</Tag>
              </div>
              {i.note && <p className="text-ink-2">{i.note}</p>}
              <p className="text-sm text-ink-3">
                {roleLabel[i.role]}. Đã dùng {i.uses}/{i.maxUses}. Hạn {formatDate(i.expiresAt)}. {i.createdBy.name} tạo.
              </p>
              <div className="-mb-1 -mr-2">{actions(i, st.usable)}</div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title={`Thu hồi mã ${revoking?.code ?? ""}?`}
        body={<p>Mã này sẽ không dùng được nữa. Người đã vào bằng mã vẫn giữ tài khoản.</p>}
        confirmLabel="Thu hồi"
        onConfirm={async () => {
          const i = revoking!;
          const next = await adminApi.invites.revoke(i.id);
          update((l) => l.map((x) => (x.id === i.id ? next : x)));
          toast(`Đã thu hồi mã ${i.code}`);
        }}
      />
    </div>
  );
}
