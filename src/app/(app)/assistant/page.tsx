import type { Metadata } from "next";
import { AssistantChat } from "@/components/ai/AssistantChat";

export const metadata: Metadata = { title: "Trợ lý AI" };

export default function AssistantPage() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col max-md:h-[calc(100dvh-8rem)]">
      <AssistantChat wide />
    </div>
  );
}
