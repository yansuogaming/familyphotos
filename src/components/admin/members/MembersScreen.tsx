"use client";

import { Plus, Ticket } from "@/components/ui/icons";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useNow } from "@/lib/hooks/useNow";
import { useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import { PageHeader, RibbonMark } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { AdminUser } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { session, useSession } from "@/lib/session";
import { InviteFormModal } from "./InviteFormModal";
import { InvitesTab, inviteState } from "./InvitesTab";
import { RequestsTab } from "./RequestsTab";
import { UserFormModal } from "./UserFormModal";
import { UsersTab } from "./UsersTab";
import { useHashTab, useLocalList, type TabKey } from "./shared";

const TABS: TabKey[] = ["members", "requests", "invites"];
const TAB_LABEL: Record<TabKey, string> = { members: "Thành viên", requests: "Chờ duyệt", invites: "Mã mời" };

export function MembersScreen() {
  const toast = useToast();
  const me = useSession()?.user;
  const [tab, setTab] = useHashTab();
  const now = useNow();

  const users = useApi(() => adminApi.users.list(), []);
  const requests = useApi(() => adminApi.requests.list(), []);
  const invites = useApi(() => adminApi.invites.list(), []);
  const [userList, updateUsers] = useLocalList(users.status === "ready" ? users.data : undefined);
  const [requestList, updateRequests] = useLocalList(requests.status === "ready" ? requests.data : undefined);
  const [inviteList, updateInvites] = useLocalList(invites.status === "ready" ? invites.data : undefined);

  const [form, setForm] = useState<{ user: AdminUser | null } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const counts: Record<TabKey, number | undefined> = {
    members: userList?.length,
    requests: requestList?.length,
    invites: inviteList?.filter((i) => inviteState(i, now).usable).length,
  };
  const countLabel: Record<TabKey, string> = {
    members: "người",
    requests: "người đang chờ",
    invites: "mã còn dùng được",
  };

  const baseId = useId();
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ members: null, requests: null, invites: null });

  function onTabKey(e: KeyboardEvent) {
    const i = TABS.indexOf(tab);
    const next =
      e.key === "ArrowRight" ? TABS[(i + 1) % TABS.length] : e.key === "ArrowLeft" ? TABS[(i - 1 + TABS.length) % TABS.length] : e.key === "Home" ? TABS[0] : e.key === "End" ? TABS[TABS.length - 1] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  const headerAction =
    tab === "members" ? (
      <Button onClick={() => setForm({ user: null })}>
        <Plus size={18} weight="bold" aria-hidden="true" /> Thêm người
      </Button>
    ) : tab === "invites" ? (
      <Button onClick={() => setInviteOpen(true)}>
        <Ticket size={18} aria-hidden="true" /> Tạo mã mời
      </Button>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Thành viên"
        description="Ai đang ở trong nhà, ai đang xin vào, và mã mời bạn đã gửi đi."
        actions={headerAction}
      />

      <div role="tablist" aria-label="Thành viên" onKeyDown={onTabKey} className="-mt-2 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const selected = tab === t;
          const n = counts[t];
          const hot = t === "requests" && !!n;
          return (
            <button
              key={t}
              ref={(el) => {
                tabRefs.current[t] = el;
              }}
              id={`${baseId}-tab-${t}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t)}
              className={`relative -mb-px flex h-12 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 font-semibold transition-colors ${selected ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {selected && <RibbonMark className="absolute left-1.5 top-0 h-4 w-2" />}
              {TAB_LABEL[t]}
              {n !== undefined && (
                <span
                  aria-hidden="true"
                  className={`tabular inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${hot ? "bg-coral text-on-coral" : "bg-paper-3 text-ink-2"}`}
                >
                  {n}
                </span>
              )}
              {n !== undefined && <span className="sr-only">, {n} {countLabel[t]}</span>}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${baseId}-panel-${tab}`} aria-labelledby={`${baseId}-tab-${tab}`} tabIndex={-1} className="outline-none">
        {tab === "members" && (
          <UsersTab
            status={users.status}
            users={userList}
            selfId={me?.id}
            onRetry={users.reload}
            onAdd={() => setForm({ user: null })}
            onEdit={(u) => setForm({ user: u })}
            update={updateUsers}
          />
        )}
        {tab === "requests" && (
          <RequestsTab
            status={requests.status}
            requests={requestList}
            onRetry={requests.reload}
            update={updateRequests}
            onApproved={(u) => (userList ? updateUsers((l) => [...l, u]) : users.reload())}
          />
        )}
        {tab === "invites" && (
          <InvitesTab
            status={invites.status}
            invites={inviteList}
            now={now}
            onRetry={invites.reload}
            onCreate={() => setInviteOpen(true)}
            update={updateInvites}
          />
        )}
      </div>

      <UserFormModal
        open={!!form}
        user={form?.user}
        selfId={me?.id}
        onClose={() => setForm(null)}
        onSaved={(u, created) => {
          if (created) {
            if (userList) updateUsers((l) => [...l, u]);
            else users.reload();
            toast(`Đã thêm ${u.name}`);
          } else {
            updateUsers((l) => l.map((x) => (x.id === u.id ? u : x)));
            if (u.id === me?.id) session.updateUser({ name: u.name, nickname: u.nickname });
            toast("Đã lưu thay đổi");
          }
        }}
      />
      <InviteFormModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={(c) => (inviteList ? updateInvites((l) => [c, ...l]) : invites.reload())}
      />
    </div>
  );
}
