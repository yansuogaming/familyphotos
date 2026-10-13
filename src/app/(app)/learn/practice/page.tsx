import type { Metadata } from "next";
import { Suspense } from "react";
import { PracticeScreen } from "@/components/learn/practice/PracticeScreen";
import { PageFallback } from "@/components/learn/practice/PageFallback";

export const metadata: Metadata = { title: "Luyện tập" };

export default function PracticePage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <PracticeScreen />
    </Suspense>
  );
}
