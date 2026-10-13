// Demo threads for chat-ext.ts. Fictional family, placeholder photos.
import { persisted } from "./core";
import type { ChatConversation, ChatMessage, Contact } from "./chat-ext-types";

const pic = (seed: string, w: number, h: number) => `https://picsum.photos/seed/fp-${seed}/${w}/${h}`;

export const threads: ChatMessage[] = [
  // Nhà mình
  { id: "n1", conversationId: "c-nha", senderId: "u-ha", text: "Lịch học kỳ 1 của hai đứa đây, cả nhà xem nhé.", attachments: [{ kind: "file", name: "Lich-hoc-ky-1-2026.pdf", size: 418_302, url: "#" }], sentAt: "2026-10-11T20:14:00", seenBy: ["u-quan", "u-bao", "u-na", "u-ba"] },
  { id: "n2", conversationId: "c-nha", senderId: "u-quan", text: "Thứ Năm Bảo học thêm đến 7 giờ, bố đón.", sentAt: "2026-10-11T20:31:00", replyTo: { id: "n1", senderId: "u-ha", text: "Lịch học kỳ 1 của hai đứa đây, cả nhà xem nhé." }, seenBy: ["u-ha", "u-bao"] },
  { id: "n3", conversationId: "c-nha", senderId: "u-ba", text: "Bà về đến nhà rồi nhé.", attachments: [{ kind: "location", lat: 20.4388, lng: 106.1621, label: "Nhà bà nội, Nam Định" }], sentAt: "2026-10-12T16:05:00", reactions: [{ emoji: "❤️", userIds: ["u-ha", "u-bao"] }], seenBy: ["u-ha", "u-quan", "u-bao", "u-na"] },
  { id: "m1", conversationId: "c-nha", senderId: "u-quan", text: "Cuối tuần này về quê nội nhé, bà nhắc mãi.", sentAt: "2026-10-13T17:58:00", seenBy: ["u-ha", "u-bao", "u-na", "u-ba"] },
  { id: "m2", conversationId: "c-nha", senderId: "u-ba", text: "Ừ, bà làm bánh chưng sẵn rồi.", sentAt: "2026-10-13T18:03:00", reactions: [{ emoji: "😍", userIds: ["u-na"] }, { emoji: "👍", userIds: ["u-quan", "u-ha"] }], seenBy: ["u-ha", "u-bao", "u-na"] },
  { id: "m3", conversationId: "c-nha", senderId: "u-na", attachments: [{ kind: "image", url: pic("chat-cat", 640, 480), width: 640, height: 480 }], text: "Con Mướp lớn chưa bà?", sentAt: "2026-10-13T18:20:00", seenBy: ["u-ha", "u-bao", "u-ba"] },
  { id: "m4", conversationId: "c-nha", senderId: "u-bao", text: "Con học xong bài Toán rồi về luôn.", sentAt: "2026-10-13T18:31:00", seenBy: ["u-ha", "u-quan"] },
  { id: "m5", conversationId: "c-nha", senderId: "u-ha", text: "Tối nay ăn lẩu nhé cả nhà", sentAt: "2026-10-13T18:42:00", replyTo: { id: "m4", senderId: "u-bao", text: "Con học xong bài Toán rồi về luôn." }, seenBy: ["u-bao"] },

  // Mẹ
  { id: "me1", conversationId: "c-me", senderId: "u-bao", text: "Mẹ ơi chiều nay con về muộn, con ở lại đá bóng.", sentAt: "2026-10-12T15:20:00", seenBy: ["u-ha"] },
  { id: "me2", conversationId: "c-me", senderId: "u-ha", text: "Ừ, nhớ về trước 6 giờ.", sentAt: "2026-10-12T15:24:00", reactions: [{ emoji: "👍", userIds: ["u-bao"] }], seenBy: ["u-bao"] },
  { id: "me3", conversationId: "c-me", senderId: "u-ha", attachments: [{ kind: "image", url: pic("chat-coat", 600, 800), width: 600, height: 800 }], text: "Con nhớ mang áo khoác", sentAt: "2026-10-13T07:10:00", seenBy: ["u-bao"] },
  { id: "me4", conversationId: "c-me", senderId: "u-bao", text: "Dạ con mang rồi", sentAt: "2026-10-13T07:12:00", replyTo: { id: "me3", senderId: "u-ha", text: "Con nhớ mang áo khoác", kind: "image" }, seenBy: ["u-ha"] },

  // Na
  { id: "na1", conversationId: "c-na", senderId: "u-na", attachments: [{ kind: "image", url: pic("chat-homework", 800, 600), width: 800, height: 600 }], sentAt: "2026-10-12T20:03:00", seenBy: ["u-bao"] },
  { id: "na2", conversationId: "c-na", senderId: "u-na", text: "Anh ơi giảng em bài phân số với", sentAt: "2026-10-12T20:05:00" },

  // Bà nội
  { id: "ba1", conversationId: "c-ba", senderId: "u-bao", attachments: [{ kind: "image", url: pic("chat-field", 800, 600), width: 800, height: 600 }], text: "Bà ơi, ảnh cánh đồng sau nhà bà đây ạ.", sentAt: "2026-10-10T09:12:00", seenBy: ["u-ba"] },
  { id: "ba2", conversationId: "c-ba", senderId: "u-ba", text: "Ảnh đẹp quá cháu ạ", sentAt: "2026-10-10T09:30:00", reactions: [{ emoji: "❤️", userIds: ["u-bao"] }], seenBy: ["u-bao"] },
];

export const contacts: Contact[] = [
  { id: "u-ha", name: "Mẹ Thu Hà", nickname: "Mẹ", role: "member", online: true },
  { id: "u-quan", name: "Bố Minh Quân", nickname: "Bố", role: "admin", online: false, lastSeenAt: "2026-10-13T18:50:00" },
  { id: "u-na", name: "Khánh Na", nickname: "Na", role: "member", online: true },
  { id: "u-ba", name: "Bà nội", nickname: "Bà", role: "member", online: false, lastSeenAt: "2026-10-13T12:15:00" },
  { id: "u-co", name: "Cô Lan", nickname: "Cô Lan", role: "guest", online: false, lastSeenAt: "2026-10-09T08:40:00" },
];

/** Canned answers for simulated replies in the demo. */
export const replies: Record<string, string[]> = {
  "u-ha": ["Ừ con.", "Mẹ biết rồi.", "Nhớ ăn tối đầy đủ nhé.", "Để mẹ xem đã."],
  "u-quan": ["Ok con.", "Bố đang họp, lát bố gọi.", "Được."],
  "u-na": ["Dạ!", "Hihi", "Anh giỏi quá", "Em cảm ơn anh"],
  "u-ba": ["Bà nghe rồi cháu.", "Cháu ngoan quá.", "Nhớ giữ ấm nhé cháu."],
  "u-co": ["Cô cảm ơn nhé."],
};

export const store = {
  groups: persisted<ChatConversation[]>("chat:groups", []),
  left: persisted<string[]>("chat:left", []),
  muted: persisted<string[]>("chat:muted", []),
  reactions: persisted<Record<string, ChatMessage["reactions"]>>("chat:reactions", {}),
};

/** Messages sent in this tab. Memory only: attachment blob URLs die with the page. */
export const sent: ChatMessage[] = [];
