import type { Metadata } from "next";
import { PhotosScreen } from "@/components/album/PhotosScreen";

export const metadata: Metadata = { title: "Ảnh" };

export default function PhotosPage() {
  return <PhotosScreen />;
}
