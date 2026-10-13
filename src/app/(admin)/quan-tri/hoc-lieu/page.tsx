import type { Metadata } from "next";
import { LessonsScreen } from "@/components/admin/lessons/LessonsScreen";

export const metadata: Metadata = { title: "Học liệu" };

export default function Page() {
  return <LessonsScreen />;
}
