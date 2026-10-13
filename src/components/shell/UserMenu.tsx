"use client";

import { CaretDown, GearSix, QrCode, ShieldStar, SignOut, UserCircleGear } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api/client";
import { roleLabel } from "@/lib/api/types";
import { session, useSession } from "@/lib/session";
import { LinkDeviceDialog } from "./LinkDeviceDialog";

export function UserMenu() {
  const s = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!s) return <span className="size-10 animate-pulse rounded-full bg-paper-3" aria-hidden="true" />;
  const { user } = s;

  async function logout() {
    await api.auth.logout();
    session.clear();
    router.push("/dang-nhap");
  }

  const item = "flex w-full items-center gap-3 rounded-[var(--radius-paper)] px-3 py-2.5 text-left text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-ink";

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tài khoản của ${user.name}`}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-paper-2 lg:pr-3"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-semibold lg:block">{user.name}</span>
        <CaretDown size={14} weight="bold" className={`hidden text-ink-3 transition-transform lg:block ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-[var(--radius-paper)] border border-line bg-paper p-2 paper-shadow"
          >
            <div className="flex items-center gap-3 px-3 pb-3 pt-2">
              <Avatar user={user} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-sm text-ink-3">{user.email}</p>
                <p className="mt-0.5 font-hand text-base text-coral-ink">{roleLabel[user.role]}</p>
              </div>
            </div>
            <div className="border-t border-line pt-2">
              {user.role === "admin" && (
                <Link role="menuitem" href="/quan-tri" onClick={() => setOpen(false)} className={`${item} font-semibold text-ink`}>
                  <ShieldStar size={20} weight="fill" className="text-coral-ink" /> Trang quản trị
                </Link>
              )}
              <Link role="menuitem" href="/cai-dat#ho-so" onClick={() => setOpen(false)} className={item}>
                <UserCircleGear size={20} /> Sửa thông tin cá nhân
              </Link>
              <Link role="menuitem" href="/cai-dat" onClick={() => setOpen(false)} className={item}>
                <GearSix size={20} /> Cài đặt
              </Link>
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setLinking(true);
                }}
                className={item}
              >
                <QrCode size={20} /> Đăng nhập trên máy khác
              </button>
            </div>
            <div className="mt-2 border-t border-line pt-2">
              <button role="menuitem" onClick={logout} className={item}>
                <SignOut size={20} /> Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LinkDeviceDialog open={linking} onClose={() => setLinking(false)} />
    </div>
  );
}
