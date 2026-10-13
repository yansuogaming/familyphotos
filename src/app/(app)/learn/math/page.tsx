import type { Metadata } from "next";
import { MathCorner } from "@/components/learn/practice/MathCorner";

export const metadata: Metadata = { title: "Góc Toán" };

export default function MathPage() {
  return <MathCorner />;
}
