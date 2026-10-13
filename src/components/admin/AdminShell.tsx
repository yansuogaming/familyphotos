"use client";

import {
  ArrowSquareOut,
  BookOpenText,
  Books,
  Browser,
  GearSix,
  House,
  Images,
  List,
  SignOut,
  Sparkle,
  UsersThree,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ToastProvider } from "@/components/settings/shared";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { api } from "@/lib/api/client";
import { roleLabel } from "@/lib/api/types";
import { session, useSession } from "@/lib/session";
import { Modal } from "./ui";
import { Button } from "@/components/ui/Button";
import { UnsavedProvider, useUnsavedGuard } from "./unsaved";

const sections: { href: string; label: string; icon: Icon }[][] = [
  [
    { href: "/quan-tri", label: "Tổng quan", icon: House },
    { href: "/quan-tri/thanh-vien", label: "Thành viên", icon: UsersThree },
    { href: "/quan-tri/album", label: "Album", icon: Books },
    { href: "/quan-tri/thu-vien", label: "Thư viện ảnh", icon: Images },
  ],
  [
    { href: "/quan-tri/noi-dung", label: "Nội dung trang", icon: Browser },
    { href: "/quan-tri/hoc-lieu", label: "Học liệu", icon: BookOpenText },
    { href: "/quan-tri/tro-ly", label: "Trợ lý AI", icon: Sparkle },
  ],
  [{ href: "/quan-tri/he-thong", label: "Cài đặt hệ thống", icon: GearSix }],
];

const isActive = (path: string, href: string) => (href === "/quan-tri" ? path === href : path === href || path.startsWith(`${href}/`));

/** Link that asks before throwing away unsaved edits. */
function useGuardedNavigate() {
  const guard = useUnsavedGuard();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const onClick = (href: string, after?: () => void) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (guard.isDirty()) {
      e.preventDefault();
      setPending(href);
      return;
    }
    after?.();
  };

  const dialog = (
    <Modal open={pending !== null} onClose={() => setPending(null)} title="Rời trang khi chưa lưu?" size="sm">
      <p className="text-ink-2">Các thay đổi bạn vừa làm chưa được lưu. Nếu rời trang, chúng sẽ mất.</p>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => setPending(null)} autoFocus>Ở lại</Button>
        <Button
          onClick={() => {
            const href = pending;
            guard.clear();
            setPending(null);
            if (href) router.push(href);
          }}
        >
          Rời trang
        </Button>
      </div>
    </Modal>
  );

  return { onClick, dialog };
}

function Sidebar({ onNavigate, layoutId }: { onNavigate?: () => void; layoutId: string }) {
  const path = usePathname();
  const s = useSession();
  const router = useRouter();
  const reduce = useReducedMotion();
  const { onClick, dialog } = useGuardedNavigate();

  async function logout() {
    await api.auth.logout();
    session.clear();
    router.push("/dang-nhap");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6 [&_*]:text-on-cover">
        <Logo href="/quan-tri" tagline={false} />
        <p className="mt-2 pl-[2.6rem] text-sm opacity-75">Trang quản trị</p>
      </div>

      <LayoutGroup id={layoutId}>
        <nav aria-label="Các mục quản trị" className="flex-1 overflow-y-auto px-3">
          {sections.map((group, gi) => (
            <ul key={gi} className="flex flex-col gap-0.5 border-t border-[oklch(1_0_0/0.1)] py-3 first:border-t-0 first:pt-0">
              {group.map(({ href, label, icon: Icon }) => {
                const active = isActive(path, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClick(href, onNavigate)}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex h-11 items-center gap-3 rounded-[var(--radius-paper)] pl-6 pr-3 text-[0.95rem] transition-colors ${
                        active ? "bg-cover-2 font-semibold text-on-cover" : "text-on-cover/75 hover:bg-[oklch(1_0_0/0.06)] hover:text-on-cover"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-ribbon"
                          transition={reduce ? { duration: 0 } : { type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          aria-hidden="true"
                          className="absolute -top-1 left-2 h-[calc(100%+0.5rem)] w-2.5 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-5px),0_100%)]"
                        />
                      )}
                      <Icon size={20} weight={active ? "fill" : "regular"} className={active ? "text-coral" : ""} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </nav>
      </LayoutGroup>

      <div className="border-t border-[oklch(1_0_0/0.1)] px-3 py-4">
        <Link
          href="/anh"
          onClick={onClick("/anh", onNavigate)}
          className="flex h-11 items-center gap-3 rounded-full border border-[oklch(1_0_0/0.18)] px-4 text-sm font-semibold text-on-cover transition-colors hover:bg-[oklch(1_0_0/0.06)]"
        >
          <ArrowSquareOut size={18} /> Xem trang chính
        </Link>
        <div className="mt-3 flex items-center gap-3 px-1">
          {s ? <Avatar user={s.user} size="sm" /> : <span className="size-8 rounded-full bg-cover-2" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-cover">{s?.user.name ?? "..."}</p>
            <p className="truncate text-xs text-on-cover/70">{s ? roleLabel[s.user.role] : ""}</p>
          </div>
          <ThemeToggle className="text-on-cover/80! hover:bg-[oklch(1_0_0/0.08)]! hover:text-on-cover!" />
          <button
            onClick={logout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="inline-flex size-10 items-center justify-center rounded-full text-on-cover/80 transition-colors hover:bg-[oklch(1_0_0/0.08)] hover:text-on-cover"
          >
            <SignOut size={20} />
          </button>
        </div>
      </div>
      {dialog}
    </div>
  );
}

/** Phones and small tablets: the sidebar slides in as a drawer. */
function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Menu quản trị"
      onCancel={(e) => {
        // React re-dispatches "cancel" to parent dialogs: only the top one closes.
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 h-dvh max-h-none w-[min(18rem,85vw)] max-w-none bg-transparent p-0 backdrop:bg-[oklch(0.2_0.04_262/0.55)]"
    >
      {open && (
        <motion.div
          initial={reduce ? false : { x: "-100%" }}
          animate={{ x: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="vinyl relative h-full text-on-cover"
        >
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            className="absolute right-2 top-5 z-10 inline-flex size-10 items-center justify-center rounded-full text-on-cover/80 hover:bg-[oklch(1_0_0/0.08)]"
          >
            <X size={20} />
          </button>
          <Sidebar onNavigate={onClose} layoutId="admin-nav-drawer" />
        </motion.div>
      )}
    </dialog>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const current = sections.flat().find((s) => isActive(path, s.href));

  return (
    <UnsavedProvider>
      <ToastProvider>
        <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="vinyl sticky top-0 hidden h-dvh text-on-cover lg:block">
            <Sidebar layoutId="admin-nav" />
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="vinyl sticky top-0 z-30 flex h-14 items-center gap-2 px-2 text-on-cover lg:hidden">
              <button
                onClick={() => setMenu(true)}
                aria-label="Mở menu quản trị"
                aria-expanded={menu}
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-[oklch(1_0_0/0.08)]"
              >
                <List size={22} />
              </button>
              <p className="min-w-0 flex-1 truncate font-display text-lg font-semibold">{current?.label ?? "Quản trị"}</p>
              <ThemeToggle className="text-on-cover/80! hover:bg-[oklch(1_0_0/0.08)]! hover:text-on-cover!" />
            </header>
            <Drawer open={menu} onClose={() => setMenu(false)} />

            <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-8 lg:py-10">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </UnsavedProvider>
  );
}
