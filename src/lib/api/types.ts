// Shared contract between this frontend and the backend.
// Every shape here is mirrored in API_CONTRACT.md.

export type Role = "admin" | "member" | "guest";

export const roleLabel: Record<Role, string> = {
  admin: "Quản trị",
  member: "Người trong nhà",
  guest: "Khách",
};

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  grade?: number; // 1-12 for kids
  email?: string;
  phone?: string;
  /** What the family calls this person, e.g. "Bố", "Bà nội". */
  nickname?: string;
  birthday?: string; // ISO date
}

export interface ProfileUpdate {
  name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  grade?: number | null;
  birthday?: string | null;
  /** data URL or uploaded file id; backend decides. */
  avatar?: string | null;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  language: "vi" | "en";
  privacy: {
    discoverableByEmail: boolean;
    allowMessagesFromNonContacts: boolean;
  };
  notifications: {
    enabled: boolean;
    messages: boolean;
    calls: boolean;
    newPhotos: boolean;
    studyReminder: boolean;
  };
}

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  breakdown: { photos: number; videos: number; files: number };
}

export interface Device {
  id: string;
  name: string; // "Chrome trên Windows"
  kind: "desktop" | "phone" | "tablet";
  lastActiveAt: string;
  location: string;
  current: boolean;
}

/** Sign-in result. The credential itself is the backend's httpOnly cookie. */
export interface Session {
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "member" | "guest";
  /** Members only. */
  inviteCode?: string;
  captchaToken?: string | null;
}

/** Sign-up waiting for the code sent by email. Nothing is created until the code is right. */
export interface PendingSignup {
  id: string;
  /** Masked, e.g. "ba***@gmail.com". */
  emailHint: string;
  /** When the code stops working (ISO). */
  expiresAt: string;
  /** Earliest moment "Gửi lại mã" is allowed (ISO). */
  resendAt: string;
  codeLength: number;
}

export type QrStatus = "pending" | "scanned" | "confirmed" | "expired";

export interface QrLoginSession {
  id: string;
  /** Payload encoded into the QR image. Opaque to the frontend. */
  code: string;
  expiresAt: string; // ISO
}

export interface QrLoginState {
  status: QrStatus;
  /** Present once scanned: who is approving on their phone. */
  approver?: Pick<User, "id" | "name">;
  /** Present once confirmed. */
  session?: Session;
}

export interface Album {
  id: string;
  title: string;
  coverUrl: string;
  photoCount: number;
  takenFrom: string; // ISO date
  takenTo: string;
}

export interface Photo {
  id: string;
  albumId: string;
  url: string;
  width: number;
  height: number;
  takenAt: string;
  memo?: string; // short handwritten-style caption
  uploadedBy: Pick<User, "id" | "name">;
}

export interface Conversation {
  id: string;
  title: string;
  kind: "direct" | "group";
  memberIds: string[];
  lastMessage?: Pick<Message, "text" | "sentAt" | "senderId">;
  unread: number;
}

export type Attachment =
  | { kind: "image"; url: string; width: number; height: number }
  | { kind: "file"; name: string; size: number; url: string }
  | { kind: "location"; lat: number; lng: number; label: string };

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: Attachment[];
  sentAt: string;
}

export interface LearningToday {
  goal: number;
  done: number;
  streakDays: number;
  resume?: { grade: number; subject: string; topicIndex: number; topicTitle: string };
}

export interface LearningArea {
  id: "cac-mon" | "de-thi" | "sach";
  title: string;
  description: string;
  itemCount: number;
  href: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}
