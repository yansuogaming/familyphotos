"use client";

import { ShieldWarning, SignOut } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import { roleLabel, type User } from "@/lib/api/types";
import { session, useSession } from "@/lib/session";

export const ADMIN_LOGIN = "/admin";

/** The admin area's own backdrop: the closed album cover, the same in light and dark. */
export function AdminCover({ children }: { children: ReactNode }) {
  return (
    <div className="vinyl relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
      <span className="absolute inset-y-0 left-0 w-4 bg-[oklch(0_0_0/0.2)] sm:w-6" aria-hidden="true" />
      <div className="mb-8 [&_*]:text-on-cover">
        <Logo href="/" />
      </div>
      {children}
    </div>
  );
}

/** Shown when a family or guest account reaches an admin page. */
export function WrongAccount({ user }: { user: User }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchAccount() {
    setBusy(true);
    await api.auth.logout();
    session.clear();
    router.replace(ADMIN_LOGIN);
  }

  return (
    <div role="alert" className="w-full max-w-md rounded-[var(--radius-paper)] bg-paper p-7 text-ink shadow-[0_24px_60px_-20px_oklch(0_0_0/0.6)] sm:p-9">
      <ShieldWarning size={36} weight="fill" className="text-danger" />
      <h1 className="mt-4 text-3xl font-bold">Trang này chỉ dành cho quản trị</h1>
      <p className="mt-3 text-ink-2">
        Bạn đang đăng nhập bằng <span className="font-semibold text-ink">{user.name}</span> ({roleLabel[user.role]}). Tài khoản này không vào được
        khu quản trị.
      </p>
      <p className="mt-2 text-ink-2">Muốn vào quản trị, hãy đăng xuất rồi đăng nhập lại bằng tài khoản quản trị.</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button onClick={switchAccount} disabled={busy}>
          <SignOut size={18} /> {busy ? "Đang đăng xuất..." : "Đăng xuất"}
        </Button>
        <ButtonLink href="/photos" variant="secondary">Về trang chính</ButtonLink>
      </div>
    </div>
  );
}

/**
 * Admin pages render only for admin sessions.
 * Signed out: go to the admin login. Wrong account: explain and offer to sign out.
 * Children always render (hidden) so Next.js can prerender every admin segment;
 * admin data itself is refused by the API for non-admins.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const s = useSession();
  const router = useRouter();
  const isAdmin = s?.user.role === "admin";

  useEffect(() => {
    if (s === null) router.replace(ADMIN_LOGIN);
  }, [s, router]);

  return (
    <>
      {!isAdmin && (
        <AdminCover>
          {s ? (
            <WrongAccount user={s.user} />
          ) : (
            <div className="h-72 w-full max-w-md animate-pulse rounded-[var(--radius-paper)] bg-[oklch(1_0_0/0.08)]" aria-busy="true" />
          )}
        </AdminCover>
      )}
      <div hidden={!isAdmin}>{children}</div>
    </>
  );
}
