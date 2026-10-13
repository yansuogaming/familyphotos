import type { Metadata } from "next";
import { Suspense } from "react";
import { ExamsScreen } from "@/components/learn/exams/ExamsScreen";
import { PageFallback } from "@/components/learn/practice/PageFallback";

export const metadata: Metadata = { title: "Đề thi" };

export default function ExamsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ExamsScreen />
    </Suspense>
  );
}
