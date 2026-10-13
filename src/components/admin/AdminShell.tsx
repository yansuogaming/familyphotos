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
  icons,
  Morph,
  type Icon,
} from "@/components/ui/icons";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
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
    { href: "/admin/dashboard", label: "Tổng quan", icon: House },
    { href: "/admin/members", label: "Thành viên", icon: UsersThree },
    { href: "/admin/albums", label: "Album", icon: Books },
    { href: "/admin/library", label: "Thư viện ảnh", icon: Images },
  ],
  [
    { href: "/admin/content", label: "Nội dung trang", icon: Browser },
    { href: "/admin/lessons", label: "Học liệu", icon: BookOpenText },
    { href: "/admin/assistant", label: "Trợ lý AI", icon: Sparkle },
  ],
  [{ href: "/admin/system", label: "Cài đặt hệ thống", icon: GearSix }],
];

// Sidebar collapsed or not, remembered per browser. Server render: expanded.
const RAIL_KEY = "fp-admin-nav";
const railListeners = new Set<() => void>();
const readRail = () => localStorage.getItem(RAIL_KEY) === "rail";
function setRail(rail: boolean) {
  localStorage.setItem(RAIL_KEY, rail ? "rail" : "full");
  railListeners.forEach((l) => l());
}
function useRail() {
  return useSyncExternalStore(
    (cb) => {
      railListeners.add(cb);
      const onStorage = (e: StorageEvent) => e.key === RAIL_KEY && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        railListeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    readRail,
    () => false,
  );
}

/** Label shown beside an icon while the sidebar is collapsed (hover or keyboard focus). */
function RailTip({ children }: { children: ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-paper)] bg-ink px-2.5 py-1.5 text-sm font-semibold text-paper opacity-0 shadow-[0_8px_24px_-8px_hsl(var(--shadow)/0.5)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

const isActive = (path: string, href: string) => (href === "/admin/dashboard" ? path === href : path === href || path.startsWith(`${href}/`));

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

function Sidebar({ onNavigate, layoutId, rail = false, onToggleRail }: { onNavigate?: () => void; layoutId: string; rail?: boolean; onToggleRail?: () => void }) {
  const path = usePathname();
  const s = useSession();
  const router = useRouter();
  const reduce = useReducedMotion();
  const { onClick, dialog } = useGuardedNavigate();

  async function logout() {
    await api.auth.logout();
    session.clear();
    router.push("/admin");
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-start gap-2 pb-5 pt-6 ${rail ? "flex-col items-center px-2" : "px-5"}`}>
        {rail ? (
          <Link href="/admin/dashboard" aria-label="Tổng quan quản trị" className="rounded-md">
            <LogoMark className="size-8" />
          </Link>
        ) : (
          <div className="min-w-0 flex-1 [&_*]:text-on-cover">
            <Logo href="/admin/dashboard" tagline={false} />
            <p className="mt-2 pl-[2.6rem] text-sm opacity-75">Trang quản trị</p>
          </div>
        )}
        {onToggleRail && (
          <button
            type="button"
            onClick={onToggleRail}
            aria-label={rail ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            aria-expanded={!rail}
            title={`${rail ? "Mở rộng" : "Thu gọn"} (Ctrl + B)`}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-on-cover/75 transition-colors hover:bg-[oklch(1_0_0/0.08)] hover:text-on-cover"
          >
            <Morph icon={rail ? icons.SidebarExpand : icons.SidebarCollapse} size={20} />
          </button>
        )}
      </div>

      <LayoutGroup id={layoutId}>
        <nav aria-label="Các mục quản trị" className={`flex-1 px-3 ${rail ? "overflow-visible px-2" : "overflow-y-auto"}`}>
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
                      aria-label={rail ? label : undefined}
                      className={`group relative flex h-11 items-center gap-3 rounded-[var(--radius-paper)] text-[0.95rem] transition-colors ${rail ? "justify-center" : "pl-6 pr-3"} ${
                        active ? "bg-cover-2 font-semibold text-on-cover" : "text-on-cover/75 hover:bg-[oklch(1_0_0/0.06)] hover:text-on-cover"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-ribbon"
                          transition={reduce ? { duration: 0 } : { type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          aria-hidden="true"
                          className={`absolute -top-1 h-[calc(100%+0.5rem)] w-2.5 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-5px),0_100%)] ${rail ? "left-0" : "left-2"}`}
                        />
                      )}
                      <Icon size={20} weight={active ? "fill" : "regular"} className={active ? "text-coral" : ""} />
                      {rail ? <RailTip>{label}</RailTip> : label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </nav>
      </LayoutGroup>

      <div className={`border-t border-[oklch(1_0_0/0.1)] py-4 ${rail ? "px-2" : "px-3"}`}>
        <Link
          href="/photos"
          onClick={onClick("/photos", onNavigate)}
          aria-label={rail ? "Xem trang chính" : undefined}
          className={`group relative flex h-11 items-center gap-3 rounded-full border border-[oklch(1_0_0/0.18)] text-sm font-semibold text-on-cover transition-colors hover:bg-[oklch(1_0_0/0.06)] ${rail ? "justify-center" : "px-4"}`}
        >
          <ArrowSquareOut size={18} /> {rail ? <RailTip>Xem trang chính</RailTip> : "Xem trang chính"}
        </Link>
        {rail ? (
          <div className="mt-3 flex flex-col items-center gap-1">
            {s ? <Avatar user={s.user} size="sm" /> : <span className="size-8 rounded-full bg-cover-2" />}
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
        ) : (
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
        )}
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
  const rail = useRail();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b" && !(e.target as HTMLElement)?.closest?.("input, textarea, [contenteditable]")) {
        e.preventDefault();
        setRail(!readRail());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const path = usePathname();
  const current = sections.flat().find((s) => isActive(path, s.href));

  return (
    <UnsavedProvider>
      <ToastProvider>
        <div
          className={`min-h-dvh lg:grid lg:transition-[grid-template-columns] lg:duration-300 lg:ease-[var(--ease-out-expo)] motion-reduce:transition-none ${
            rail ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[264px_minmax(0,1fr)]"
          }`}
        >
          <aside className="vinyl sticky top-0 z-40 hidden h-dvh text-on-cover lg:block">
            <Sidebar layoutId="admin-nav" rail={rail} onToggleRail={() => setRail(!rail)} />
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

            {/* the lessons studio is a full-width workspace; other pages keep a readable measure */}
            <main className={`mx-auto w-full flex-1 px-4 py-6 sm:px-8 lg:py-10 ${path.startsWith("/admin/lessons") ? "max-w-none" : "max-w-[1240px]"}`}>{children}</main>
          </div>
        </div>
      </ToastProvider>
    </UnsavedProvider>
  );
}
