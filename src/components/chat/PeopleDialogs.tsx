"use client";

import { ChatCircle, Check, MagnifyingGlass, VideoCamera } from "@/components/ui/icons";
import { useId, useState, type FormEvent } from "react";
import { Dialog, inputClass } from "@/components/album/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { chatExtApi } from "@/lib/api/chat-ext";
import type { ChatConversation, Contact } from "@/lib/api/chat-ext-types";
import { roleLabel } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/useApi";

const ago = (iso?: string) => {
  if (!iso) return "Chưa hoạt động";
  const min = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (min < 60) return `Hoạt động ${min} phút trước`;
  if (min < 60 * 24) return `Hoạt động ${Math.round(min / 60)} giờ trước`;
  return `Hoạt động ${Math.round(min / 60 / 24)} ngày trước`;
};

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-1" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-2">
          <span className="size-11 animate-pulse rounded-full bg-paper-3" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-3 w-28 animate-pulse rounded bg-paper-3" />
            <span className="h-3 w-20 animate-pulse rounded bg-paper-3" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Retry({ onRetry }: { onRetry: () => void }) {
  return (
    <p role="alert" className="text-sm text-ink-2">
      Chưa tải được danh bạ. <button onClick={onRetry} className="font-semibold text-coral-ink underline">Tải lại</button>
    </p>
  );
}

/* ---------- Tạo nhóm ---------- */

export function NewGroupDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: ChatConversation) => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Tạo nhóm" description="Một nhóm nhỏ trong nhà, ví dụ để bàn chuyến đi hay sinh nhật." size="md">
      <NewGroupForm onClose={onClose} onCreated={onCreated} />
    </Dialog>
  );
}

function NewGroupForm({ onClose, onCreated }: { onClose: () => void; onCreated: (c: ChatConversation) => void }) {
  const contacts = useApi(chatExtApi.contacts);
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<{ title?: string; members?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const id = useId();

  const toggle = (uid: string) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Đặt tên cho nhóm.";
    if (picked.size < 2) next.members = "Chọn ít nhất 2 người.";
    setErrors(next);
    if (next.title || next.members) return;
    setBusy(true);
    try {
      onCreated(await chatExtApi.createGroup({ title: title.trim(), memberIds: [...picked] }));
    } catch {
      setErrors({ form: "Chưa tạo được nhóm. Thử lại nhé." });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Tên nhóm" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} placeholder="Ví dụ: Đi Sa Pa tháng 12" error={errors.title} data-autofocus />
      <fieldset aria-describedby={errors.members ? `${id}-m` : undefined}>
        <legend className="text-sm font-semibold">
          Thành viên <span className="tabular font-normal text-ink-3">({picked.size} người, chưa kể bạn)</span>
        </legend>
        <div className="mt-2">
          {contacts.status === "loading" && <ListSkeleton />}
          {contacts.status === "error" && <Retry onRetry={contacts.reload} />}
          {contacts.status === "ready" && (
            <ul className="flex flex-col gap-1">
              {contacts.data.map((c) => {
                const on = picked.has(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-paper)] border px-2 py-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-coral ${
                        on ? "border-coral bg-coral-wash" : "border-transparent hover:bg-paper-2"
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.id)} />
                      <Avatar user={c} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{c.name}</span>
                        <span className="text-sm text-ink-3">{roleLabel[c.role]}</span>
                      </span>
                      <span
                        className={`flex size-6 items-center justify-center rounded-full border-2 ${on ? "border-coral bg-coral text-on-coral" : "border-line text-transparent"}`}
                        aria-hidden="true"
                      >
                        <Check size={14} weight="bold" />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {errors.members && <p id={`${id}-m`} className="mt-2 text-sm text-danger">{errors.members}</p>}
      </fieldset>
      {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6">
        <button type="button" className={buttonClass("ghost")} onClick={onClose}>Huỷ</button>
        <button type="submit" className={buttonClass("primary")} disabled={busy}>{busy ? "Đang tạo..." : "Tạo nhóm"}</button>
      </div>
    </form>
  );
}

/* ---------- Người trong nhà ---------- */

export function ContactsDialog({
  open,
  onClose,
  onMessage,
  onCall,
}: {
  open: boolean;
  onClose: () => void;
  onMessage: (c: Contact) => void;
  onCall: (c: Contact) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Người trong nhà" description="Những người cùng ở trong Family Photos của nhà mình." size="md">
      <ContactsList onMessage={onMessage} onCall={onCall} />
    </Dialog>
  );
}

function ContactsList({ onMessage, onCall }: { onMessage: (c: Contact) => void; onCall: (c: Contact) => void }) {
  const contacts = useApi(chatExtApi.contacts);
  const [q, setQ] = useState("");
  const list = contacts.status === "ready" ? contacts.data.filter((c) => `${c.name} ${c.nickname ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) : [];
  const btn = "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor="contacts-q" className="sr-only">Tìm người</label>
        <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input id="contacts-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên" autoComplete="off" className={`${inputClass} pl-11`} />
      </div>
      {contacts.status === "loading" && <ListSkeleton />}
      {contacts.status === "error" && <Retry onRetry={contacts.reload} />}
      {contacts.status === "ready" && list.length === 0 && <p className="py-4 text-sm text-ink-2">Không thấy ai tên “{q}”.</p>}
      {list.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <span className="relative">
                <Avatar user={c} />
                {c.online && <span className="absolute bottom-0 right-0 size-3 rounded-full bg-ok ring-2 ring-paper" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {c.name}
                  {c.role === "guest" && <span className="ml-2 font-hand text-base font-normal text-coral-ink">Khách</span>}
                </span>
                <span className={`text-sm ${c.online ? "text-ok" : "text-ink-3"}`}>{c.online ? "Đang hoạt động" : ago(c.lastSeenAt)}</span>
              </span>
              <button onClick={() => onMessage(c)} aria-label={`Nhắn tin cho ${c.name}`} title="Nhắn tin" className={btn}><ChatCircle size={20} /></button>
              <button onClick={() => onCall(c)} aria-label={`Gọi video cho ${c.name}`} title="Gọi video" className={btn}><VideoCamera size={20} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
