import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFallback } from "@/components/learn/practice/PageFallback";
import { SolutionsScreen } from "@/components/learn/practice/SolutionsScreen";

export const metadata: Metadata = { title: "Giải bài tập" };

export default function SolutionsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <SolutionsScreen />
    </Suspense>
  );
}
