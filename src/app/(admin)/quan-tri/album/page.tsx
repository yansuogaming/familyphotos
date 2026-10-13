import type { Metadata } from "next";
import { AlbumsScreen } from "@/components/admin/AlbumsScreen";

export const metadata: Metadata = { title: "Album" };

export default function Page() {
  return <AlbumsScreen />;
}
