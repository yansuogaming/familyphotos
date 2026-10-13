import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";

export const metadata: Metadata = { title: "Vào nhà" };

export default function LoginPage() {
  return <LoginPanel />;
}
