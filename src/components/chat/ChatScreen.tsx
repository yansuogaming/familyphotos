"use client";

import {
  ArrowLeft,
  BellSlash,
  CaretDown,
  CaretUp,
  DotsThreeVertical,
  Images,
  MagnifyingGlass,
  NotePencil,
  SignOut,
  UsersThree,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Lightbox, type LightboxItem } from "@/components/album/Lightbox";
import { ConfirmDialog } from "@/components/album/Modal";
import { LoadError } from "@/components/album/PhotosScreen";
import { ToastProvider, useToast } from "@/components/settings/shared";
import { chatExtApi, previewOf } from "@/lib/api/chat-ext";
import type { ChatConversation, ChatEvent, ChatMessage, Contact, SendInput } from "@/lib/api/chat-ext-types";
import { isMock } from "@/lib/api/core";
import { me, userById } from "@/lib/api/mock-data";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useSession } from "@/lib/session";
import { ChatBubble, matches } from "./ChatBubble";
import { Composer } from "./Composer";
import { ContactsDialog, NewGroupDialog } from "./PeopleDialogs";
import { SentMediaDialog } from "./SentMediaDialog";
import { VideoCall } from "./VideoCall";

type Handler = (e: ChatEvent) => void;
type Subscribe = (h: Handler) => () => void;

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const shortTime = (iso: string) => {
  const d = new Date(iso);
  return sameDay(d, new Date())
    ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return "Hôm nay";
  if (sameDay(d, y)) return "Hôm qua";
  const s = d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Avatar({ name, group = false }: { name: string; group?: boolean }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-paper-3 font-display text-sm font-semibold text-ink-2" aria-hidden="true">
      {group ? <UsersThree size={20} weight="fill" /> : initials(name)}
    </span>
  );
}

export function ChatScreen() {
  return (
    <ToastProvider>
      <Chat />
    </ToastProvider>
  );
}

type ListState = { status: "loading" } | { status: "error" } | { status: "ready"; list: ChatConversation[] };

function Chat() {
  const toast = useToast();
  const s = useSession();
  const myId = isMock ? me.id : (s?.user.id ?? me.id);
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<null | "group" | "contacts">(null);
  const [call, setCall] = useState<{ id: string; title: string; group: boolean } | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    let alive = true;
    chatExtApi.conversations().then(
      (list) => alive && setState({ status: "ready", list }),
      () => alive && setState({ status: "error" }),
    );
    chatExtApi.contacts().then((c) => alive && setContacts(c), () => {});
    return () => {
      alive = false;
    };
  }, [nonce]);

  const reload = () => {
    setState({ status: "loading" });
    setNonce((n) => n + 1);
  };

  // One realtime connection for the whole screen; the open thread listens through it.
  const handlers = useRef(new Set<Handler>());
  const activeRef = useRef<string | null>(null);
  useEffect(() => {
    return chatExtApi.subscribe((e) => {
      handlers.current.forEach((h) => h(e));
      if (e.type !== "message") return;
      const m = e.message;
      setState((st) =>
        st.status !== "ready"
          ? st
          : {
              ...st,
              list: st.list
                .map((c) =>
                  c.id === m.conversationId
                    ? { ...c, lastMessage: { text: previewOf(m), sentAt: m.sentAt, senderId: m.senderId }, unread: activeRef.current === c.id ? 0 : c.unread + 1 }
                    : c,
                )
                .sort((a, b) => (b.lastMessage?.sentAt ?? "").localeCompare(a.lastMessage?.sentAt ?? "")),
            },
      );
    });
  }, []);
  const subscribe = useCallback<Subscribe>((h) => {
    handlers.current.add(h);
    return () => {
      handlers.current.delete(h);
    };
  }, []);

  const nameOf = useCallback(
    (id: string) => (id === myId ? "Bạn" : (contacts.find((c) => c.id === id)?.name ?? userById(id)?.name ?? "Người trong nhà")),
    [contacts, myId],
  );

  const conversations = state.status === "ready" ? state.list : [];
  const activeId = picked ?? (isDesktop ? (conversations[0]?.id ?? null) : null);
  const active = conversations.find((c) => c.id === activeId);
  useEffect(() => {
    activeRef.current = activeId;
  });
  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));

  const patch = (id: string, p: Partial<ChatConversation>) =>
    setState((st) => (st.status === "ready" ? { ...st, list: st.list.map((c) => (c.id === id ? { ...c, ...p } : c)) } : st));

  function open(id: string) {
    setPicked(id);
    patch(id, { unread: 0 });
  }

  function addOrOpen(c: ChatConversation) {
    setState((st) => (st.status === "ready" ? { ...st, list: st.list.some((x) => x.id === c.id) ? st.list : [c, ...st.list] } : st));
    open(c.id);
  }

  async function messageContact(c: Contact) {
    setDialog(null);
    try {
      addOrOpen(await chatExtApi.openDirect(c.id));
    } catch {
      toast("Chưa mở được cuộc trò chuyện.");
    }
  }

  const iconBtn = "inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink";

  return (
    <div className="mx-auto grid h-[calc(100dvh-4rem)] max-w-[1400px] gap-4 p-0 max-md:h-[calc(100dvh-8rem)] md:grid-cols-[320px_minmax(0,1fr)] md:p-6">
      {/* conversation list */}
      <aside className={`flex min-h-0 flex-col border-line bg-paper-2 md:rounded-[var(--radius-paper)] md:border ${active ? "max-md:hidden" : ""}`}>
        <div className="flex items-center gap-1 px-4 pb-2 pt-4">
          <h1 className="mr-auto text-xl font-bold">Trò chuyện</h1>
          <button onClick={() => setDialog("group")} aria-label="Tạo nhóm" title="Tạo nhóm" className={iconBtn}>
            <NotePencil size={20} />
          </button>
          <button onClick={() => setDialog("contacts")} aria-label="Người trong nhà" title="Người trong nhà" className={iconBtn}>
            <UsersThree size={20} />
          </button>
        </div>
        <div className="px-4 pb-3">
          <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-paper px-3.5 transition-[border-color,box-shadow] focus-within:border-coral focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_22%,transparent)]">
            <MagnifyingGlass size={16} className="text-ink-3" />
            <span className="sr-only">Tìm cuộc trò chuyện</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm người hoặc nhóm" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3" />
          </label>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {state.status === "loading" &&
            Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-3" aria-hidden="true">
                <span className="size-11 animate-pulse rounded-full bg-paper-3" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className="h-3 w-24 animate-pulse rounded bg-paper-3" />
                  <span className="h-3 w-40 animate-pulse rounded bg-paper-3" />
                </span>
              </li>
            ))}
          {state.status === "error" && <li className="p-2"><LoadError onRetry={reload} what="tin nhắn" /></li>}
          {state.status === "ready" && conversations.length === 0 && (
            <li className="px-3 py-6">
              <p className="font-semibold">Chưa có cuộc trò chuyện nào</p>
              <p className="mt-1 text-sm text-ink-2">Bấm nút người để nhắn cho ai đó trong nhà.</p>
            </li>
          )}
          {state.status === "ready" && conversations.length > 0 && filtered.length === 0 && (
            <li className="px-3 py-6 text-sm text-ink-2">Không thấy ai tên “{query}”.</li>
          )}
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => open(c.id)}
                aria-current={c.id === activeId}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-paper)] px-2 py-2.5 text-left transition-colors ${
                  c.id === activeId ? "bg-paper shadow-[0_1px_2px_hsl(var(--shadow)/0.12)]" : "hover:bg-paper-3/60"
                }`}
              >
                <Avatar name={c.title} group={c.kind === "group"} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`flex min-w-0 items-center gap-1.5 ${c.unread ? "font-bold" : "font-semibold"}`}>
                      <span className="truncate">{c.title}</span>
                      {c.muted && <BellSlash size={14} className="shrink-0 text-ink-3" aria-label="Đã tắt thông báo" />}
                    </span>
                    {c.lastMessage && <span className="tabular shrink-0 text-xs text-ink-3">{shortTime(c.lastMessage.sentAt)}</span>}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${c.unread ? "text-ink" : "text-ink-3"}`}>
                      {c.lastMessage?.senderId === myId ? "Bạn: " : ""}
                      {c.lastMessage?.text}
                    </span>
                    {c.unread > 0 && (
                      <span className="tabular flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-coral px-1.5 text-[0.7rem] font-bold text-on-coral" aria-label={`${c.unread} tin chưa đọc`}>
                        {c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* thread */}
      <section className={`flex min-h-0 flex-col border-line bg-paper md:rounded-[var(--radius-paper)] md:border ${active ? "" : "max-md:hidden"}`}>
        {active ? (
          <Thread
            key={active.id}
            conversation={active}
            myId={myId}
            nameOf={nameOf}
            subscribe={subscribe}
            onBack={() => setPicked(null)}
            onCall={() => setCall({ id: active.id, title: active.title, group: active.kind === "group" })}
            onSent={(m) => patch(active.id, { lastMessage: { text: previewOf(m), sentAt: m.sentAt, senderId: m.senderId } })}
            onMuted={(muted) => patch(active.id, { muted })}
            onLeft={() => {
              setState((st) => (st.status === "ready" ? { ...st, list: st.list.filter((c) => c.id !== active.id) } : st));
              setPicked(null);
              toast(`Bạn đã rời nhóm ${active.title}`);
            }}
          />
        ) : (
          <NoThread hasAny={conversations.length > 0} />
        )}
      </section>

      <NewGroupDialog
        open={dialog === "group"}
        onClose={() => setDialog(null)}
        onCreated={(c) => {
          setDialog(null);
          addOrOpen(c);
          toast(`Đã tạo nhóm ${c.title}`);
        }}
      />
      <ContactsDialog
        open={dialog === "contacts"}
        onClose={() => setDialog(null)}
        onMessage={messageContact}
        onCall={(c) => {
          setDialog(null);
          setCall({ id: `d-${c.id}`, title: c.name, group: false });
        }}
      />
      <VideoCall open={!!call} conversationId={call?.id ?? ""} title={call?.title ?? ""} isGroup={!!call?.group} onClose={() => setCall(null)} />
    </div>
  );
}

function NoThread({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="oli flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center md:rounded-[var(--radius-paper)]">
      <p className="font-display text-xl font-semibold">{hasAny ? "Chọn một người để bắt đầu" : "Nhà mình chưa nói chuyện gì"}</p>
      <p className="max-w-[36ch] text-sm text-ink-2">Hoặc bấm nút bút chì để tạo nhóm mới cho cả nhà.</p>
    </div>
  );
}

type MsgState = { status: "loading" } | { status: "error" } | { status: "ready"; list: ChatMessage[] };

function Thread({
  conversation,
  myId,
  nameOf,
  subscribe,
  onBack,
  onCall,
  onSent,
  onMuted,
  onLeft,
}: {
  conversation: ChatConversation;
  myId: string;
  nameOf: (id: string) => string;
  subscribe: Subscribe;
  onBack: () => void;
  onCall: () => void;
  onSent: (m: ChatMessage) => void;
  onMuted: (muted: boolean) => void;
  onLeft: () => void;
}) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [state, setState] = useState<MsgState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const [typing, setTyping] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hit, setHit] = useState(0);
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<null | "media" | "leave">(null);
  const [leaving, setLeaving] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    chatExtApi.messages(conversation.id).then(
      (list) => alive && setState({ status: "ready", list }),
      () => alive && setState({ status: "error" }),
    );
    return () => {
      alive = false;
    };
  }, [conversation.id, nonce]);

  useEffect(
    () =>
      subscribe((e) => {
        if (e.type === "typing" && e.conversationId === conversation.id)
          setTyping((t) => (e.typing ? [...new Set([...t, e.userId])] : t.filter((u) => u !== e.userId)));
        if (e.type === "message" && e.message.conversationId === conversation.id) {
          setTyping((t) => t.filter((u) => u !== e.message.senderId));
          setState((st) => (st.status === "ready" && !st.list.some((m) => m.id === e.message.id) ? { ...st, list: [...st.list, e.message] } : st));
          void chatExtApi.markSeen(conversation.id, e.message.id);
        }
        if (e.type === "seen" && e.conversationId === conversation.id)
          setState((st) =>
            st.status === "ready"
              ? { ...st, list: st.list.map((m) => (m.id === e.messageId ? { ...m, seenBy: [...new Set([...(m.seenBy ?? []), e.userId])] } : m)) }
              : st,
          );
        if (e.type === "reaction")
          setState((st) => (st.status === "ready" ? { ...st, list: st.list.map((m) => (m.id === e.messageId ? { ...m, reactions: e.reactions } : m)) } : st));
      }),
    [subscribe, conversation.id],
  );

  const msgs = useMemo(() => (state.status === "ready" ? state.list : []), [state]);

  // Follow new messages and the typing indicator.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: reduce || msgs.length < 2 ? "auto" : "smooth" });
  }, [msgs.length, typing.length, reduce]);

  // Search
  const hits = useMemo(() => (q.trim() ? msgs.filter((m) => matches(m.text, q)).map((m) => m.id) : []), [msgs, q]);
  const currentHit = hits.length ? hits[Math.min(hit, hits.length - 1)] : null;
  const jump = (id: string | null) => {
    if (!id) return;
    requestAnimationFrame(() => document.getElementById(`msg-${id}`)?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }));
  };
  function onQuery(v: string) {
    setQ(v);
    const next = v.trim() ? msgs.filter((m) => matches(m.text, v)).map((m) => m.id) : [];
    setHit(Math.max(0, next.length - 1));
    jump(next.at(-1) ?? null);
  }
  function step(d: number) {
    if (!hits.length) return;
    const i = (Math.min(hit, hits.length - 1) + d + hits.length) % hits.length;
    setHit(i);
    jump(hits[i]);
  }
  function closeSearch() {
    setSearchOpen(false);
    setQ("");
  }
  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      step(e.shiftKey ? 1 : -1);
    }
    if (e.key === "Escape") closeSearch();
  }

  function jumpTo(id: string) {
    jump(id);
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 1600);
  }

  async function send(input: SendInput) {
    const m = await chatExtApi.send(conversation.id, input);
    setState((st) => (st.status === "ready" ? { ...st, list: [...st.list, m] } : st));
    setReplyTo(null);
    onSent(m);
  }

  async function react(m: ChatMessage, emoji: string) {
    try {
      const reactions = await chatExtApi.react(m.id, emoji);
      setState((st) => (st.status === "ready" ? { ...st, list: st.list.map((x) => (x.id === m.id ? { ...x, reactions } : x)) } : st));
    } catch {
      toast("Chưa thả được cảm xúc.");
    }
  }

  async function toggleMute() {
    setMenu(false);
    const next = !conversation.muted;
    try {
      await chatExtApi.setMuted(conversation.id, next);
      onMuted(next);
      toast(next ? "Đã tắt thông báo" : "Đã bật lại thông báo");
    } catch {
      toast("Chưa đổi được. Thử lại nhé.");
    }
  }

  async function leave() {
    setLeaving(true);
    try {
      await chatExtApi.leave(conversation.id);
      setDialog(null);
      onLeft();
    } catch {
      toast("Chưa rời được nhóm. Thử lại nhé.");
      setLeaving(false);
    }
  }

  // Images in this thread, for the shared lightbox.
  const images = useMemo(() => {
    const out: (LightboxItem & { key: string })[] = [];
    for (const m of msgs)
      (m.attachments ?? []).forEach((a, i) => {
        if (a.kind === "image")
          out.push({ key: `${m.id}-${i}`, id: `${m.id}-${i}`, url: a.url, width: a.width, height: a.height, memo: m.text, date: m.sentAt, by: { id: m.senderId, name: nameOf(m.senderId) }, byLabel: "gửi" });
      });
    return out;
  }, [msgs, nameOf]);

  const lastMine = [...msgs].reverse().find((m) => m.senderId === myId);
  const others = conversation.memberIds.filter((id) => id !== myId);
  const seenCount = lastMine?.seenBy?.filter((u) => u !== myId).length ?? 0;
  const myStatus = !lastMine ? undefined : seenCount === 0 ? "Đã gửi" : conversation.kind === "direct" || seenCount >= others.length ? "Đã xem" : `${seenCount} người đã xem`;

  const tool = "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink aria-expanded:bg-paper-3 aria-pressed:bg-paper-3 aria-pressed:text-ink";

  return (
    <>
      <header className="relative flex h-16 shrink-0 items-center gap-1 border-b border-line px-2 md:gap-2 md:px-4">
        <button onClick={onBack} aria-label="Quay lại danh sách" className={`${tool} md:hidden`}>
          <ArrowLeft size={20} />
        </button>
        <Avatar name={conversation.title} group={conversation.kind === "group"} />
        <div className="ml-1 mr-auto min-w-0">
          <p className="flex items-center gap-1.5 truncate font-semibold">
            {conversation.title}
            {conversation.muted && <BellSlash size={14} className="shrink-0 text-ink-3" aria-label="Đã tắt thông báo" />}
          </p>
          <p className="truncate text-xs text-ink-3" aria-live="polite">
            {typing.length
              ? `${typing.map(nameOf).join(", ")} đang gõ...`
              : conversation.kind === "group"
                ? `${conversation.memberIds.length} người trong nhà`
                : "Người trong nhà"}
          </p>
        </div>
        <button onClick={onCall} aria-label="Gọi video" title="Gọi video" className={tool}><VideoCamera size={20} /></button>
        <button
          onClick={() => {
            if (searchOpen) return closeSearch();
            setSearchOpen(true);
            requestAnimationFrame(() => searchInput.current?.focus());
          }}
          aria-pressed={searchOpen}
          aria-label="Tìm trong cuộc trò chuyện"
          title="Tìm trong cuộc trò chuyện"
          className={tool}
        >
          <MagnifyingGlass size={20} />
        </button>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Thêm" title="Thêm" className={tool}>
            <DotsThreeVertical size={20} weight="bold" />
          </button>
          <AnimatePresence>
            {menu && (
              <ThreadMenu
                onClose={() => setMenu(false)}
                muted={!!conversation.muted}
                group={conversation.kind === "group"}
                onMute={toggleMute}
                onMedia={() => {
                  setMenu(false);
                  setDialog("media");
                }}
                onLeave={() => {
                  setMenu(false);
                  setDialog("leave");
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 overflow-hidden border-b border-line bg-paper-2"
          >
            <div role="search" className="flex items-center gap-1 px-3 py-2 md:px-4">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-paper px-3.5 transition-[border-color,box-shadow] focus-within:border-coral focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_22%,transparent)]">
                <MagnifyingGlass size={16} className="shrink-0 text-ink-3" />
                <span className="sr-only">Tìm tin nhắn</span>
                <input ref={searchInput} value={q} onChange={(e) => onQuery(e.target.value)} onKeyDown={onSearchKey} placeholder="Tìm chữ trong tin nhắn" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3" />
              </label>
              <span className="tabular w-16 shrink-0 text-center text-sm text-ink-2" aria-live="polite">
                {q.trim() ? (hits.length ? `${Math.min(hit, hits.length - 1) + 1}/${hits.length}` : "0 kết quả") : ""}
              </span>
              <button onClick={() => step(-1)} disabled={!hits.length} aria-label="Kết quả cũ hơn" title="Cũ hơn" className={`${tool} disabled:opacity-40`}><CaretUp size={18} weight="bold" /></button>
              <button onClick={() => step(1)} disabled={!hits.length} aria-label="Kết quả mới hơn" title="Mới hơn" className={`${tool} disabled:opacity-40`}><CaretDown size={18} weight="bold" /></button>
              <button onClick={closeSearch} aria-label="Đóng tìm kiếm" className={tool}><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6 md:px-8" aria-label={`Tin nhắn với ${conversation.title}`}>
        {state.status === "loading" && <ThreadSkeleton />}
        {state.status === "error" && (
          <LoadError
            onRetry={() => {
              setState({ status: "loading" });
              setNonce((n) => n + 1);
            }}
            what="tin nhắn"
          />
        )}
        {state.status === "ready" && msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="font-display text-xl font-semibold">Chưa có tin nhắn</p>
            <p className="text-sm text-ink-2">Gửi một lời chào để bắt đầu trò chuyện.</p>
          </div>
        )}
        {msgs.length > 0 && (
          <ol className="mx-auto flex max-w-3xl flex-col gap-4">
            {msgs.map((m, i) => {
              const prev = msgs[i - 1];
              const newDay = !prev || !sameDay(new Date(prev.sentAt), new Date(m.sentAt));
              const mine = m.senderId === myId;
              return (
                <li key={m.id} className="flex flex-col gap-4">
                  {newDay && (
                    <div className="flex items-center gap-3" role="separator" aria-label={dayLabel(m.sentAt)}>
                      <span className="h-px flex-1 bg-line" />
                      <span className="tabular text-xs font-semibold text-ink-3">{dayLabel(m.sentAt)}</span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )}
                  <div className={`rounded-2xl transition-colors duration-700 ${flash === m.id ? "bg-coral-wash" : ""}`}>
                    <ChatBubble
                      message={m}
                      mine={mine}
                      myId={myId}
                      senderName={nameOf(m.senderId)}
                      showName={conversation.kind === "group" && (newDay || prev?.senderId !== m.senderId)}
                      nameOf={nameOf}
                      onReply={() => setReplyTo(m)}
                      onReact={(e) => void react(m, e)}
                      onOpenImage={(ai) => setViewer(images.findIndex((x) => x.id === `${m.id}-${ai}`))}
                      onJumpTo={jumpTo}
                      query={searchOpen ? q : ""}
                      currentHit={searchOpen && currentHit === m.id}
                      status={m.id === lastMine?.id ? myStatus : undefined}
                    />
                  </div>
                </li>
              );
            })}
            {typing.length > 0 && (
              <li className="flex items-end gap-2" aria-label={`${typing.map(nameOf).join(", ")} đang gõ`}>
                <span className="flex h-10 items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-paper-2 px-4">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="size-1.5 rounded-full bg-ink-3"
                      animate={reduce ? undefined : { y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </span>
                {conversation.kind === "group" && <span className="pb-2 text-xs text-ink-3">{typing.map(nameOf).join(", ")}</span>}
              </li>
            )}
          </ol>
        )}
        <div ref={end} />
      </div>

      <Composer
        placeholder={`Nhắn cho ${conversation.title}`}
        replyTo={replyTo}
        replyName={replyTo ? nameOf(replyTo.senderId) : undefined}
        onCancelReply={() => setReplyTo(null)}
        onSend={send}
        onTyping={() => void chatExtApi.typing(conversation.id)}
      />

      <Lightbox items={images} index={viewer !== null && viewer >= 0 ? viewer : null} onIndexChange={setViewer} onClose={() => setViewer(null)} layoutPrefix="chat" />
      <SentMediaDialog open={dialog === "media"} onClose={() => setDialog(null)} conversationId={conversation.id} nameOf={nameOf} />
      <ConfirmDialog
        open={dialog === "leave"}
        onClose={() => setDialog(null)}
        onConfirm={leave}
        busy={leaving}
        title={`Rời nhóm ${conversation.title}?`}
        description="Bạn sẽ không nhận tin của nhóm nữa. Muốn quay lại thì nhờ một người trong nhóm thêm bạn."
        confirmLabel="Rời nhóm"
      />
    </>
  );
}

function ThreadMenu({
  onClose,
  muted,
  group,
  onMute,
  onMedia,
  onLeave,
}: {
  onClose: () => void;
  muted: boolean;
  group: boolean;
  onMute: () => void;
  onMedia: () => void;
  onLeave: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    root.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const down = (e: PointerEvent) => {
      if (!root.current?.parentElement?.contains(e.target as Node)) close.current();
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, []);

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const items = [...(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      close.current();
    }
  }

  const item = "flex h-11 w-full items-center gap-3 rounded-[var(--radius-paper)] px-3 text-left text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-ink focus-visible:bg-paper-2";

  return (
    <motion.div
      ref={root}
      role="menu"
      aria-label="Tuỳ chọn cuộc trò chuyện"
      onKeyDown={onKey}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-64 rounded-[var(--radius-paper)] border border-line bg-paper p-1.5 paper-shadow"
    >
      <button role="menuitemcheckbox" aria-checked={muted} onClick={onMute} className={item}>
        <BellSlash size={20} /> <span className="flex-1">Tắt thông báo</span>
        <span className={`h-5 w-9 rounded-full border p-0.5 transition-colors ${muted ? "border-coral bg-coral" : "border-line bg-paper-3"}`} aria-hidden="true">
          <span className={`block size-3.5 rounded-full bg-paper shadow transition-transform ${muted ? "translate-x-4" : ""}`} />
        </span>
      </button>
      <button role="menuitem" onClick={onMedia} className={item}>
        <Images size={20} /> Ảnh và tệp đã gửi
      </button>
      {group && (
        <div className="mt-1 border-t border-line pt-1">
          <button role="menuitem" onClick={onLeave} className={`${item} text-danger hover:text-danger`}>
            <SignOut size={20} /> Rời nhóm
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ThreadSkeleton() {
  const rows = [
    { mine: false, w: "w-56" },
    { mine: false, w: "w-40" },
    { mine: true, w: "w-64" },
    { mine: false, w: "w-72", tall: true },
    { mine: true, w: "w-44" },
  ];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4" aria-hidden="true">
      <span className="mx-auto h-3 w-16 animate-pulse rounded bg-paper-3" />
      {rows.map((r, i) => (
        <span key={i} className={`${r.w} ${r.tall ? "h-40" : "h-11"} max-w-[78%] animate-pulse rounded-2xl bg-paper-3 ${r.mine ? "self-end" : ""}`} />
      ))}
    </div>
  );
}
