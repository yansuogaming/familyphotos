import type { Metadata } from "next";
import { Suspense } from "react";
import { AlbumScreen, AlbumSkeleton } from "@/components/album/AlbumScreen";

export const metadata: Metadata = { title: "Album" };

// The album id is read on the client (useParams), so the shell stays static.
export default function AlbumPage() {
  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <AlbumScreen />
    </Suspense>
  );
}
