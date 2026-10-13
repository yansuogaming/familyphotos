// Chat: conversations, messages, attachments, reactions, groups, contacts, calls, realtime.
// Contract: docs/api/chat.md.
import { BASE, http } from "./core";
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

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const wsUrl = () => (BASE ?? "").replace(/^http/, "ws") + "/realtime";

/** One-line summary of a message for the conversation list. */
export function previewOf(m: Pick<ChatMessage, "text" | "attachments">) {
  if (m.text) return m.text;
  const a = m.attachments?.[0];
  if (!a) return "";
  return a.kind === "image" ? "Đã gửi một ảnh" : a.kind === "file" ? `Tệp: ${a.name}` : `Vị trí: ${a.label}`;
}

export const chatExtApi = {
  conversations: (): Promise<ChatConversation[]> => http("/conversations"),
  /** Oldest first. */
  messages: (conversationId: string): Promise<ChatMessage[]> => http(`/conversations/${conversationId}/messages`),

  /** Files go as multipart; text, replies and locations as JSON. */
  send(conversationId: string, input: SendInput): Promise<ChatMessage> {
    const { files, ...rest } = input;
    if (files?.length) {
      const form = new FormData();
      if (rest.text) form.append("text", rest.text);
      if (rest.replyToId) form.append("replyToId", rest.replyToId);
      files.forEach((f) => form.append("files", f));
      return http(`/conversations/${conversationId}/messages`, { method: "POST", body: form });
    }
    return http(`/conversations/${conversationId}/messages`, json("POST", rest));
  },

  /** Toggles your reaction. One reaction per person per emoji. */
  react: (messageId: string, emoji: string): Promise<Reaction[]> => http(`/messages/${messageId}/reactions`, json("POST", { emoji })),
  /** Tell others you are typing. Call at most every 3 seconds while typing. */
  typing: (conversationId: string): Promise<void> => http(`/conversations/${conversationId}/typing`, { method: "POST" }),
  markSeen: (conversationId: string, messageId: string): Promise<void> =>
    http(`/conversations/${conversationId}/seen`, json("POST", { messageId })),

  /** Realtime events over WebSocket. Returns an unsubscribe function. */
  subscribe(onEvent: (e: ChatEvent) => void): () => void {
    if (!BASE) return () => {};
    const ws = new WebSocket(wsUrl());
    ws.onmessage = (e) => {
      try {
        onEvent(JSON.parse(e.data) as ChatEvent);
      } catch {}
    };
    return () => ws.close();
  },

  contacts: (): Promise<Contact[]> => http("/contacts"),
  createGroup: (input: NewGroupInput): Promise<ChatConversation> => http("/conversations", json("POST", { kind: "group", ...input })),
  /** Finds or creates the 1-1 conversation with someone. */
  openDirect: (userId: string): Promise<ChatConversation> => http("/conversations", json("POST", { kind: "direct", memberIds: [userId] })),
  setMuted: (conversationId: string, muted: boolean): Promise<void> =>
    http(`/conversations/${conversationId}/mute`, { method: muted ? "PUT" : "DELETE" }),
  leave: (conversationId: string): Promise<void> => http(`/conversations/${conversationId}/members/me`, { method: "DELETE" }),
  /** Photos and files sent in one conversation, newest first. */
  media: (conversationId: string): Promise<ConversationMedia> => http(`/conversations/${conversationId}/attachments`),
  startCall: (conversationId: string): Promise<CallSession> => http(`/conversations/${conversationId}/calls`, json("POST", { video: true })),
  endCall: (callId: string): Promise<void> => http(`/calls/${callId}`, { method: "DELETE" }),
};
