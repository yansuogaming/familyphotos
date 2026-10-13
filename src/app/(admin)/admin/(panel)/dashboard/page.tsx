import type { Metadata } from "next";
import { OverviewScreen } from "@/components/admin/OverviewScreen";

export const metadata: Metadata = { title: "Tổng quan" };

export default function Page() {
  return <OverviewScreen />;
}
