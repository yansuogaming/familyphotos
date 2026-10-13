import type { Metadata } from "next";
import { Suspense } from "react";
import { BooksScreen } from "@/components/learn/books/BooksScreen";
import { PageFallback } from "@/components/learn/practice/PageFallback";

export const metadata: Metadata = { title: "Sách" };

export default function BooksPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <BooksScreen />
    </Suspense>
  );
}
