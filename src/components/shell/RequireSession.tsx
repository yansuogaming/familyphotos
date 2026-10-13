"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/lib/api/types";
import { useSession } from "@/lib/session";

/**
 * Keeps the app rooms behind the front door.
 * Children always render (hidden until the session is known) so Next.js can
 * prerender every segment into the static shell for instant navigation.
 */
export function RequireSession({ children, role }: { children: ReactNode; role?: Role }) {
  const s = useSession();
  const router = useRouter();
  const allowed = !!s && (!role || s.user.role === role);

  useEffect(() => {
    if (s === null) router.replace("/dang-nhap");
    else if (s && role && s.user.role !== role) router.replace("/anh");
  }, [s, role, router]);

  return (
    <>
      {!allowed && (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-10 sm:px-6" aria-busy="true">
          <div className="h-10 w-48 animate-pulse rounded bg-paper-3" />
          <div className="h-64 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
        </div>
      )}
      <div hidden={!allowed}>
        {children}
      </div>
    </>
  );
}
