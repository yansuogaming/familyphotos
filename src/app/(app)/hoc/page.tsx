import type { Metadata } from "next";
import { LearnHome } from "@/components/learn/LearnHome";

export const metadata: Metadata = { title: "Học" };

export default function LearnPage() {
  return <LearnHome />;
}
