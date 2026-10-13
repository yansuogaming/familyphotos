import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFallback } from "@/components/learn/practice/PageFallback";
import { ToolsScreen } from "@/components/learn/tools/ToolsScreen";

export const metadata: Metadata = { title: "Tiện ích học tập" };

export default function ToolsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ToolsScreen />
    </Suspense>
  );
}
