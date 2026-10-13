import type { Metadata } from "next";
import { LibraryScreen } from "@/components/admin/LibraryScreen";

export const metadata: Metadata = { title: "Thư viện ảnh" };

export default function Page() {
  return <LibraryScreen />;
}
