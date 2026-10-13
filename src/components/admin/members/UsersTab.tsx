"use client";

import { CaretDown, CaretLeft, CaretRight, CaretUp, CaretUpDown, Lock, LockOpen, MagnifyingGlass, PencilSimple, Trash } from "@/components/ui/icons";
import { useMemo, useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { formatBytes, useToast } from "@/components/settings/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog, EmptyState, RowsSkeleton, Tag, errorText, inputClass, selectClass, timeAgo } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AccountStatus, AdminUser } from "@/lib/api/admin-types";
import { roleLabel, type Role } from "@/lib/api/types";
import { roleOrder } from "./shared";

const PAGE = 8;

type SortKey = "name" | "role" | "lastActive";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

type Pending = { kind: "lock" | "delete"; user: AdminUser } | null;

export function UsersTab({
  status,
  users,
  selfId,
  onRetry,
  onAdd,
  onEdit,
  update,
}: {
  status: "loading" | "error" | "ready";
  users: AdminUser[] | undefined;
  selfId?: string;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (u: AdminUser) => void;
  update: (fn: (l: AdminUser[]) => AdminUser[]) => void;
}) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [state, setState] = useState<AccountStatus | "all">("all");
  const [sort, setSort] = useState<Sort>({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!users) return [];
    const needle = fold(q.trim());
    const rows = users.filter(
      (u) =>
        (role === "all" || u.role === role) &&
        (state === "all" || u.status === state) &&
        (!needle || [u.name, u.nickname, u.email, u.phone, u.phone?.replace(/\s/g, "")].some((v) => v && fold(v).includes(needle))),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      if (sort.key === "role") return (roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name, "vi")) * dir;
      if (sort.key === "lastActive") return ((a.lastActiveAt ?? "").localeCompare(b.lastActiveAt ?? "") || a.name.localeCompare(b.name, "vi")) * dir;
      return a.name.localeCompare(b.name, "vi") * dir;
    });
  }, [users, q, role, state, sort]);

  if (status === "loading") return <RowsSkeleton rows={8} cols={5} />;
  if (status === "error" || !users) return <LoadError onRetry={onRetry} what="danh sách thành viên" />;
  if (users.length === 0)
    return (
      <EmptyState
        title="Nhà chưa có ai ngoài bạn"
        body="Thêm người trong nhà bằng email, hoặc tạo mã mời ở tab Mã mời để họ tự vào."
        action={<Button onClick={onAdd}>Thêm người</Button>}
      />
    );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pageCount);
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE);
  const filtering = !!q.trim() || role !== "all" || state !== "all";

  const clearFilters = () => {
    setQ("");
    setRole("all");
    setState("all");
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "lastActive" ? "desc" : "asc" }));
    setPage(1);
  };

  async function unlock(u: AdminUser) {
    setUnlocking(u.id);
    try {
      const next = await adminApi.users.update(u.id, { status: "active" });
      update((l) => l.map((x) => (x.id === u.id ? next : x)));
      toast(`Đã mở khoá cho ${u.name}`);
    } catch (e) {
      toast(errorText(e, "Chưa mở khoá được. Thử lại sau."));
    } finally {
      setUnlocking(null);
    }
  }

  const actions = (u: AdminUser) => {
    const self = u.id === selfId;
    return (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton label={`Sửa thông tin ${u.name}`} onClick={() => onEdit(u)}>
          <PencilSimple size={18} />
        </IconButton>
        {u.status === "locked" ? (
          <IconButton label={`Mở khoá cho ${u.name}`} onClick={() => unlock(u)} disabled={unlocking === u.id} className="disabled:opacity-50">
            <LockOpen size={18} />
          </IconButton>
        ) : (
          <IconButton
            label={self ? "Bạn không thể tự khoá chính mình" : `Khoá tài khoản ${u.name}`}
            onClick={() => setPending({ kind: "lock", user: u })}
            disabled={self}
            className="disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Lock size={18} />
          </IconButton>
        )}
        <IconButton
          label={self ? "Bạn không thể xoá chính mình" : `Xoá ${u.name}`}
          onClick={() => setPending({ kind: "delete", user: u })}
          disabled={self}
          className="hover:text-danger disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Trash size={18} />
        </IconButton>
      </div>
    );
  };

  const statusTag = (u: AdminUser) => (u.status === "locked" ? <Tag tone="danger">Đã khoá</Tag> : <Tag tone="ok">Đang dùng</Tag>);
  const lastSeen = (u: AdminUser) => (u.lastActiveAt ? timeAgo(u.lastActiveAt) : <span className="text-ink-3">Chưa đăng nhập</span>);
  const who = (u: AdminUser) => (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar user={u} size="sm" className={u.status === "locked" ? "opacity-50" : ""} />
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold">
          <span className="truncate">{u.name}</span>
          {u.id === selfId && <Tag tone="coral">Bạn</Tag>}
        </p>
        <p className="truncate text-sm text-ink-3">
          {[u.nickname, u.grade ? `Lớp ${u.grade}` : null].filter(Boolean).join(" · ") || "Chưa có tên gọi"}
        </p>
      </div>
    </div>
  );

  const sortHead = (key: SortKey, label: string, className = "") => {
    const active = sort.key === key;
    const Icon = !active ? CaretUpDown : sort.dir === "asc" ? CaretUp : CaretDown;
    return (
      <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`px-2 py-0 ${className}`}>
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex h-10 items-center gap-1.5 rounded-full px-2 font-semibold transition-colors hover:bg-paper-3 ${active ? "text-ink" : "text-ink-2"}`}
        >
          {label} <Icon size={14} aria-hidden="true" className={active ? "text-coral-ink" : "text-ink-3"} />
        </button>
      </th>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="search" className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <span className="sr-only">Tìm theo tên, email hoặc số điện thoại</span>
          <MagnifyingGlass size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm tên, email, số điện thoại"
            className={`${inputClass} pl-10`}
          />
        </label>
        <select
          aria-label="Lọc theo vai trò"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | "all");
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">Mọi vai trò</option>
          <option value="admin">{roleLabel.admin}</option>
          <option value="member">{roleLabel.member}</option>
          <option value="guest">{roleLabel.guest}</option>
        </select>
        <select
          aria-label="Lọc theo trạng thái"
          value={state}
          onChange={(e) => {
            setState(e.target.value as AccountStatus | "all");
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang dùng</option>
          <option value="locked">Đã khoá</option>
        </select>
        {filtering && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">Xoá bộ lọc</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Không có ai khớp bộ lọc"
          body={q.trim() ? `Không tìm thấy "${q.trim()}". Thử gõ ít chữ hơn, hoặc bỏ bớt bộ lọc.` : "Thử chọn vai trò hoặc trạng thái khác."}
          action={<Button variant="secondary" onClick={clearFilters}>Xoá bộ lọc</Button>}
        />
      ) : (
        <>
          {/* Wide screens: a real table. */}
          <div className="hidden overflow-x-auto rounded-[var(--radius-paper)] border border-line md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách thành viên, trang {cur} trên {pageCount}</caption>
              <thead className="border-b border-line bg-paper-2 text-ink-2">
                <tr>
                  {sortHead("name", "Người", "pl-3")}
                  {sortHead("role", "Vai trò")}
                  <th scope="col" className="hidden px-4 font-semibold lg:table-cell">Liên lạc</th>
                  {sortHead("lastActive", "Lần cuối vào")}
                  <th scope="col" className="px-4 font-semibold">Trạng thái</th>
                  <th scope="col" className="px-4 text-right font-semibold"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-paper-2">
                    <td className="max-w-[18rem] px-4 py-3">{who(u)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">{roleLabel[u.role]}</td>
                    <td className="hidden max-w-[16rem] px-4 py-3 lg:table-cell">
                      <p className="truncate">{u.email ?? <span className="text-ink-3">Không có email</span>}</p>
                      {u.phone && <p className="tabular text-ink-3">{u.phone}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">{lastSeen(u)}</td>
                    <td className="px-4 py-3">{statusTag(u)}</td>
                    <td className="px-2 py-1.5">{actions(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: one row per person, actions on the right. */}
          <ul className="divide-y divide-line rounded-[var(--radius-paper)] border border-line md:hidden">
            {rows.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 px-4 py-3">
                {who(u)}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-11 text-sm text-ink-2">
                  <span>{roleLabel[u.role]}</span>
                  {statusTag(u)}
                  <span>{lastSeen(u)}</span>
                </div>
                {(u.email || u.phone) && <p className="truncate pl-11 text-sm text-ink-3">{u.email ?? u.phone}</p>}
                <div className="-mb-1 -mr-2">{actions(u)}</div>
              </li>
            ))}
          </ul>

          <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
            <p className="tabular" aria-live="polite">
              Hiển thị {(cur - 1) * PAGE + 1}-{(cur - 1) * PAGE + rows.length} trong {filtered.length}
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <IconButton label="Trang trước" onClick={() => setPage(cur - 1)} disabled={cur === 1} className="disabled:opacity-35">
                  <CaretLeft size={18} />
                </IconButton>
                <span className="tabular min-w-[5.5rem] text-center">Trang {cur}/{pageCount}</span>
                <IconButton label="Trang sau" onClick={() => setPage(cur + 1)} disabled={cur === pageCount} className="disabled:opacity-35">
                  <CaretRight size={18} />
                </IconButton>
              </div>
            )}
          </nav>
        </>
      )}

      <ConfirmDialog
        open={pending?.kind === "lock"}
        onClose={() => setPending(null)}
        title={`Khoá tài khoản ${pending?.user.name ?? ""}?`}
        body={
          <p>
            {pending?.user.name} sẽ không đăng nhập được nữa cho tới khi bạn mở khoá. Ảnh và dữ liệu vẫn giữ nguyên.
          </p>
        }
        confirmLabel="Khoá tài khoản"
        onConfirm={async () => {
          const u = pending!.user;
          const next = await adminApi.users.update(u.id, { status: "locked" });
          update((l) => l.map((x) => (x.id === u.id ? next : x)));
          toast(`Đã khoá tài khoản ${u.name}`);
        }}
      />
      <ConfirmDialog
        open={pending?.kind === "delete"}
        onClose={() => setPending(null)}
        title={`Xoá ${pending?.user.name ?? ""} khỏi nhà?`}
        body={
          <p>
            Tài khoản bị xoá hẳn và không lấy lại được.
            {pending && pending.user.storageBytes > 0 ? ` Người này đang dùng ${formatBytes(pending.user.storageBytes)} lưu trữ.` : ""} Nếu chỉ muốn tạm chặn, hãy khoá tài khoản.
          </p>
        }
        confirmLabel="Xoá vĩnh viễn"
        typeToConfirm={pending?.user.name}
        onConfirm={async () => {
          const u = pending!.user;
          await adminApi.users.remove(u.id);
          update((l) => l.filter((x) => x.id !== u.id));
          toast(`Đã xoá ${u.name}`);
        }}
      />
    </div>
  );
}
