import type { Metadata } from "next";
import { MembersScreen } from "@/components/admin/members/MembersScreen";

export const metadata: Metadata = { title: "Thành viên" };

export default function Page() {
  return <MembersScreen />;
}
