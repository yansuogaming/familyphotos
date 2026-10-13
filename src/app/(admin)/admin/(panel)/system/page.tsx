import type { Metadata } from "next";
import { SystemScreen } from "@/components/admin/SystemScreen";

export const metadata: Metadata = { title: "Cài đặt hệ thống" };

export default function Page() {
  return <SystemScreen />;
}
