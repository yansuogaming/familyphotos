import type { Metadata } from "next";
import { RegisterFlow } from "@/components/auth/RegisterFlow";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return <RegisterFlow />;
}
