import type { Metadata } from "next";
import { AssistantScreen } from "@/components/admin/AssistantScreen";

export const metadata: Metadata = { title: "Trợ lý AI" };

export default function Page() {
  return <AssistantScreen />;
}
