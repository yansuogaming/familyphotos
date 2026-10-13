import type { Metadata } from "next";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export const metadata: Metadata = { title: "Đăng nhập quản trị" };

export default function AdminLoginPage() {
  return <AdminLoginScreen />;
}
