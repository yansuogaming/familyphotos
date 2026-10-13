import type { Metadata } from "next";
import { Suspense } from "react";
import { LessonReader } from "@/components/learn/lesson/LessonReader";
import { ReaderSkeleton } from "@/components/learn/lesson/Skeletons";

export const metadata: Metadata = { title: "Lý thuyết các môn" };

// The reader keeps grade, subject and lesson in the query string
// (?lop=9&mon=toan&bai=toan-9-c1-b1), read on the client with useSearchParams.
export default function TheoryPage() {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <LessonReader />
    </Suspense>
  );
}
