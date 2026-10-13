// Chat extras: attachments, reactions, replies, groups, contacts, calls.
// Mirrored in docs/api/chat.md. Builds on Conversation / Message in types.ts.
import type { Attachment, Conversation, Message, User } from "./types";

export interface Reaction {
  emoji: string;
  userIds: string[];
}

/** Short copy of the message being answered, so the quote renders without a lookup. */
export interface ReplyRef {
  id: string;
  senderId: string;
  text?: string;
  kind?: Attachment["kind"];
}

export interface ChatMessage extends Message {
  replyTo?: ReplyRef;
  reactions?: Reaction[];
  /** Members (other than the sender) who have read this message. */
  seenBy?: string[];
}

export interface ChatConversation extends Conversation {
  muted?: boolean;
}

export type LocationShare = Extract<Attachment, { kind: "location" }>;

export interface SendInput {
  text?: string;
  replyToId?: string;
  files?: File[];
  location?: Omit<LocationShare, "kind">;
}

export interface NewGroupInput {
  title: string;
  memberIds: string[];
}

export interface Contact extends Pick<User, "id" | "name" | "role" | "nickname" | "avatarUrl"> {
  online: boolean;
  lastSeenAt?: string;
}

export interface ConversationMedia {
  images: (Extract<Attachment, { kind: "image" }> & { messageId: string; senderId: string; sentAt: string })[];
  files: (Extract<Attachment, { kind: "file" }> & { messageId: string; senderId: string; sentAt: string })[];
}

export interface CallSession {
  id: string;
  conversationId: string;
  /** WebRTC config from the backend. Empty in mock mode. */
  iceServers: { urls: string | string[]; username?: string; credential?: string }[];
}

/** Realtime events (WebSocket). Mock mode simulates them after you send a message. */
export type ChatEvent =
  | { type: "typing"; conversationId: string; userId: string; typing: boolean }
  | { type: "message"; message: ChatMessage }
  | { type: "seen"; conversationId: string; userId: string; messageId: string }
  | { type: "reaction"; messageId: string; reactions: Reaction[] };

export const ATTACH_LIMIT_BYTES = 25 * 1024 * 1024;
export const ATTACH_MAX_FILES = 10;
