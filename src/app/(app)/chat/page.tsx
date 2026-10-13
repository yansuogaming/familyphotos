import type { Metadata } from "next";
import { ChatScreen } from "@/components/chat/ChatScreen";

export const metadata: Metadata = { title: "Chat riêng" };

export default function ChatPage() {
  return <ChatScreen />;
}
