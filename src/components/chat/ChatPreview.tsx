"use client";

import type { ChatMessage } from "@/lib/api/chat-ext-types";
import { ChatBubble } from "./ChatBubble";

/** Illustration for the public landing page: real chat bubbles, sample lines. */
const people: Record<string, string> = { me: "Bạn", grandma: "Bà nội", kid: "Con gái", mom: "Mẹ" };
const sample: ChatMessage[] = [
  { id: "s1", conversationId: "preview", senderId: "grandma", text: "Cuối tuần cả nhà về chơi nhé, bà gói bánh rồi.", sentAt: "2026-10-13T18:03:00" },
  { id: "s2", conversationId: "preview", senderId: "kid", text: "Con mang theo ảnh Trung thu cho bà xem!", sentAt: "2026-10-13T18:20:00" },
  { id: "s3", conversationId: "preview", senderId: "me", text: "Học xong bài là con về luôn.", sentAt: "2026-10-13T18:31:00" },
  { id: "s4", conversationId: "preview", senderId: "mom", text: "Tối nay ăn lẩu nhé cả nhà", sentAt: "2026-10-13T18:42:00" },
];

export function ChatPreview() {
  return (
    <>
      {sample.map((m) => (
        <ChatBubble key={m.id} message={m} mine={m.senderId === "me"} myId="me" senderName={people[m.senderId]} nameOf={(id) => people[id] ?? ""} />
      ))}
    </>
  );
}
