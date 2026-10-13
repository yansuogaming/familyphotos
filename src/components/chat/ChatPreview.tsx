"use client";

import { messages, userById } from "@/lib/api/mock-data";
import { ChatBubble } from "./ChatBubble";

/** Real chat bubbles with demo messages, shown on the landing page. */
export function ChatPreview() {
  return (
    <>
      {messages.slice(1, 5).map((m) => (
        <ChatBubble
          key={m.id}
          message={m}
          mine={m.senderId === "u-bao"}
          myId="u-bao"
          senderName={userById(m.senderId)?.name}
          nameOf={(id) => userById(id)?.name ?? ""}
        />
      ))}
    </>
  );
}
