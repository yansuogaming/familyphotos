import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RequireSession } from "@/components/shell/RequireSession";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | Quản trị | Family Photos" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession role="admin">
      <AdminShell>{children}</AdminShell>
    </RequireSession>
  );
}
