import type { Metadata } from "next";
import { ContentScreen } from "@/components/admin/content/ContentScreen";

export const metadata: Metadata = { title: "Nội dung trang" };

export default function Page() {
  return <ContentScreen />;
}
