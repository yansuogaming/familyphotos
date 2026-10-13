import type { Metadata } from "next";
import { ReviewScreen } from "@/components/learn/practice/ReviewScreen";

export const metadata: Metadata = { title: "Ôn câu sai" };

export default function ReviewPage() {
  return <ReviewScreen />;
}
