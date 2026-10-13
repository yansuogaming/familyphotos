// Chat extras: attachments, reactions, replies, groups, contacts, calls, realtime.
// Endpoints: docs/api/chat.md. Without NEXT_PUBLIC_API_URL everything is mock.
import { ApiError, BASE, fake, http, wait } from "./core";
import * as base from "./mock-data";
import * as mock from "./chat-ext-mock";
import type { Attachment } from "./types";
import type {
  CallSession,
  ChatConversation,
  ChatEvent,
  ChatMessage,
  Contact,
  ConversationMedia,
  NewGroupInput,
  Reaction,
  SendInput,
} from "./chat-ext-types";

const meId = base.me.id;

// ---------- mock realtime ----------

const listeners = new Set<(e: ChatEvent) => void>();
const emit = (e: ChatEvent) => listeners.forEach((l) => l(e));

function liveMessages(): ChatMessage[] {
  const reactions = mock.store.reactions.get();
  return [...mock.threads, ...mock.sent].map((m) => (m.id in reactions ? { ...m, reactions: reactions[m.id] } : m));
}

function liveConversations(): ChatConversation[] {
  const left = new Set(mock.store.left.get());
  const muted = new Set(mock.store.muted.get());
  const msgs = liveMessages();
  return [...mock.store.groups.get(), ...base.conversations]
    .filter((c) => !left.has(c.id))
    .map((c) => {
      const last = msgs.filter((m) => m.conversationId === c.id).at(-1);
      const lastMessage = last
        ? { text: last.text || previewOf(last), sentAt: last.sentAt, senderId: last.senderId }
        : c.lastMessage;
      return { ...c, muted: muted.has(c.id), lastMessage };
    })
    .sort((a, b) => (b.lastMessage?.sentAt ?? "").localeCompare(a.lastMessage?.sentAt ?? ""));
}

export function previewOf(m: Pick<ChatMessage, "text" | "attachments">) {
  if (m.text) return m.text;
  const a = m.attachments?.[0];
  if (!a) return "";
  return a.kind === "image" ? "Đã gửi một ảnh" : a.kind === "file" ? `Tệp: ${a.name}` : `Vị trí: ${a.label}`;
}

/** After you send, someone else reads it, types a bit, then answers. */
function simulateReply(m: ChatMessage) {
  const conv = liveConversations().find((c) => c.id === m.conversationId);
  if (!conv) return;
  const others = conv.memberIds.filter((id) => id !== meId);
  if (others.length === 0) return;
  const who = others[Math.floor(Math.random() * others.length)];
  const bank = mock.replies[who] ?? ["Ừ."];
  setTimeout(() => {
    for (const id of others) {
      const msg = mock.sent.find((s) => s.id === m.id);
      if (msg) msg.seenBy = [...new Set([...(msg.seenBy ?? []), id])];
      emit({ type: "seen", conversationId: m.conversationId, userId: id, messageId: m.id });
    }
  }, 1100);
  setTimeout(() => emit({ type: "typing", conversationId: m.conversationId, userId: who, typing: true }), 1700);
  setTimeout(() => {
    emit({ type: "typing", conversationId: m.conversationId, userId: who, typing: false });
    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId: m.conversationId,
      senderId: who,
      text: bank[Math.floor(Math.random() * bank.length)],
      sentAt: new Date().toISOString(),
    };
    mock.sent.push(reply);
    emit({ type: "message", message: reply });
  }, 3900);
}

function imageSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 640, height: img.naturalHeight || 480 });
    img.onerror = () => resolve({ width: 640, height: 480 });
    img.src = url;
  });
}

async function mockAttachments(input: SendInput): Promise<Attachment[]> {
  const out: Attachment[] = [];
  for (const f of input.files ?? []) {
    const url = URL.createObjectURL(f);
    if (f.type.startsWith("image/")) out.push({ kind: "image", url, ...(await imageSize(url)) });
    else out.push({ kind: "file", name: f.name, size: f.size, url });
  }
  if (input.location) out.push({ kind: "location", ...input.location });
  return out;
}

const wsUrl = () => (BASE ?? "").replace(/^http/, "ws") + "/realtime";

// ---------- API ----------

export const chatExtApi = {
  conversations(): Promise<ChatConversation[]> {
    if (BASE) return http("/conversations");
    return fake(liveConversations());
  },

  /** Oldest first. */
  messages(conversationId: string): Promise<ChatMessage[]> {
    if (BASE) return http(`/conversations/${conversationId}/messages`);
    return fake(liveMessages().filter((m) => m.conversationId === conversationId), 400);
  },

  async send(conversationId: string, input: SendInput): Promise<ChatMessage> {
    if (BASE) {
      if (input.files?.length) {
        const form = new FormData();
        if (input.text) form.append("text", input.text);
        if (input.replyToId) form.append("replyToId", input.replyToId);
        input.files.forEach((f) => form.append("files", f));
        return http(`/conversations/${conversationId}/messages`, { method: "POST", body: form });
      }
      const { files: _files, ...json } = input;
      void _files;
      return http(`/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify(json) });
    }
    const replied = input.replyToId ? liveMessages().find((m) => m.id === input.replyToId) : undefined;
    const attachments = await mockAttachments(input);
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: meId,
      text: input.text?.trim() || undefined,
      attachments: attachments.length ? attachments : undefined,
      replyTo: replied ? { id: replied.id, senderId: replied.senderId, text: replied.text, kind: replied.attachments?.[0]?.kind } : undefined,
      sentAt: new Date().toISOString(),
      seenBy: [],
    };
    mock.sent.push(msg);
    await wait(input.files?.length ? 700 : 200);
    simulateReply(msg);
    return structuredClone(msg);
  },

  /** Toggles your reaction. One reaction per person per emoji. */
  react(messageId: string, emoji: string): Promise<Reaction[]> {
    if (BASE) return http(`/messages/${messageId}/reactions`, { method: "POST", body: JSON.stringify({ emoji }) });
    const msg = liveMessages().find((m) => m.id === messageId);
    const cur = msg?.reactions ?? [];
    const has = cur.some((r) => r.emoji === emoji && r.userIds.includes(meId));
    const next = has
      ? cur.map((r) => (r.emoji === emoji ? { ...r, userIds: r.userIds.filter((u) => u !== meId) } : r)).filter((r) => r.userIds.length)
      : cur.some((r) => r.emoji === emoji)
        ? cur.map((r) => (r.emoji === emoji ? { ...r, userIds: [...r.userIds, meId] } : r))
        : [...cur, { emoji, userIds: [meId] }];
    mock.store.reactions.update((all) => ({ ...all, [messageId]: next }));
    return fake(next, 120);
  },

  /** Tell others you are typing. Call at most every 3 seconds while typing. */
  typing(conversationId: string): Promise<void> {
    if (BASE) return http(`/conversations/${conversationId}/typing`, { method: "POST" });
    return Promise.resolve();
  },

  markSeen(conversationId: string, messageId: string): Promise<void> {
    if (BASE) return http(`/conversations/${conversationId}/seen`, { method: "POST", body: JSON.stringify({ messageId }) });
    return Promise.resolve();
  },

  /** Realtime events. Returns an unsubscribe function. */
  subscribe(onEvent: (e: ChatEvent) => void): () => void {
    if (BASE) {
      const ws = new WebSocket(wsUrl());
      ws.onmessage = (e) => {
        try {
          onEvent(JSON.parse(e.data) as ChatEvent);
        } catch {}
      };
      return () => ws.close();
    }
    listeners.add(onEvent);
    return () => listeners.delete(onEvent);
  },

  contacts(): Promise<Contact[]> {
    if (BASE) return http("/contacts");
    return fake(mock.contacts);
  },

  createGroup(input: NewGroupInput): Promise<ChatConversation> {
    if (BASE) return http("/conversations", { method: "POST", body: JSON.stringify({ kind: "group", ...input }) });
    const conv: ChatConversation = {
      id: `g-${Date.now().toString(36)}`,
      title: input.title.trim(),
      kind: "group",
      memberIds: [meId, ...input.memberIds],
      unread: 0,
      lastMessage: { text: "Nhóm mới được tạo", sentAt: new Date().toISOString(), senderId: meId },
    };
    mock.store.groups.update((g) => [conv, ...g]);
    return fake(conv, 500);
  },

  /** Finds or creates the 1-1 conversation with someone. */
  openDirect(userId: string): Promise<ChatConversation> {
    if (BASE) return http("/conversations", { method: "POST", body: JSON.stringify({ kind: "direct", memberIds: [userId] }) });
    const found = liveConversations().find((c) => c.kind === "direct" && c.memberIds.includes(userId));
    if (found) return fake(found, 150);
    const person = mock.contacts.find((c) => c.id === userId);
    if (!person) return wait(200).then(() => { throw new ApiError(404, "Không tìm thấy người này."); });
    const conv: ChatConversation = { id: `d-${userId}`, title: person.name, kind: "direct", memberIds: [meId, userId], unread: 0 };
    mock.store.groups.update((g) => [conv, ...g]);
    return fake(conv, 300);
  },

  setMuted(conversationId: string, muted: boolean): Promise<void> {
    if (BASE) return http(`/conversations/${conversationId}/mute`, { method: muted ? "PUT" : "DELETE" });
    mock.store.muted.update((m) => (muted ? [...new Set([...m, conversationId])] : m.filter((id) => id !== conversationId)));
    return fake(undefined, 200);
  },

  leave(conversationId: string): Promise<void> {
    if (BASE) return http(`/conversations/${conversationId}/members/me`, { method: "DELETE" });
    mock.store.left.update((l) => [...new Set([...l, conversationId])]);
    return fake(undefined, 400);
  },

  /** Photos and files sent in one conversation, newest first. */
  media(conversationId: string): Promise<ConversationMedia> {
    if (BASE) return http(`/conversations/${conversationId}/attachments`);
    const out: ConversationMedia = { images: [], files: [] };
    for (const m of liveMessages().filter((m) => m.conversationId === conversationId).reverse()) {
      for (const a of m.attachments ?? []) {
        const meta = { messageId: m.id, senderId: m.senderId, sentAt: m.sentAt };
        if (a.kind === "image") out.images.push({ ...a, ...meta });
        if (a.kind === "file") out.files.push({ ...a, ...meta });
      }
    }
    return fake(out, 300);
  },

  startCall(conversationId: string): Promise<CallSession> {
    if (BASE) return http(`/conversations/${conversationId}/calls`, { method: "POST", body: JSON.stringify({ video: true }) });
    return fake({ id: crypto.randomUUID(), conversationId, iceServers: [] }, 200);
  },

  endCall(callId: string): Promise<void> {
    if (BASE) return http(`/calls/${callId}`, { method: "DELETE" });
    return fake(undefined, 100);
  },
};
