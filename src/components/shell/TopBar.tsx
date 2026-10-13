"use client";

import { BookOpenText, ChatsCircle, GearSix, Images, Sparkle } from "@/components/ui/icons";
import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "./UserMenu";

export const rooms = [
  { href: "/photos", label: "Ảnh", icon: Images },
  { href: "/chat", label: "Chat riêng", icon: ChatsCircle },
  { href: "/learn", label: "Học", icon: BookOpenText },
  { href: "/assistant", label: "Trợ lý AI", icon: Sparkle },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Ribbon bookmark hanging from the active room. */
function Ribbon() {
  return (
    <motion.span
      layoutId="room-ribbon"
      transition={{ type: "tween", duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -bottom-[calc(0.75rem+1px)] left-1/2 h-4 w-3 -translate-x-1/2 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_70%,0_100%)]"
      aria-hidden="true"
    />
  );
}

export function TopBar() {
  const path = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Logo href="/photos" />
          <LayoutGroup id="rooms-top">
            <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Các phòng">
              {rooms.map(({ href, label, icon: Icon }) => {
                const active = isActive(path, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                      active ? "text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                    }`}
                  >
                    <Icon size={18} weight={active ? "fill" : "regular"} className={active ? "text-coral-ink" : ""} />
                    {label}
                    {active && <Ribbon />}
                  </Link>
                );
              })}
            </nav>
          </LayoutGroup>
          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <Link href="/settings" aria-label="Cài đặt" title="Cài đặt" className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink">
              <GearSix size={20} weight={isActive(path, "/settings") ? "fill" : "regular"} className={isActive(path, "/settings") ? "text-coral-ink" : ""} />
            </Link>
            <span className="group/tt relative hidden sm:block">
              <button
                className="h-10 rounded-full px-2.5 text-sm font-bold text-ink-2 hover:bg-paper-3 hover:text-ink"
                aria-label="Chuyển sang tiếng Anh"
                aria-describedby="lang-soon"
              >
                EN
              </button>
              <span
                id="lang-soon"
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-[calc(100%+0.375rem)] z-50 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-paper)] bg-ink px-2.5 py-1 text-xs font-semibold text-paper opacity-0 shadow-[0_6px_16px_-8px_hsl(var(--shadow)/0.5)] transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100"
              >
                Sắp có
              </span>
            </span>
            <ThemeToggle />
            <span className="mx-1.5 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* phones: rooms move to a bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Các phòng">
        {rooms.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold ${active ? "text-ink" : "text-ink-3"}`}
            >
              {active && <span className="absolute top-0 h-1 w-8 bg-coral" aria-hidden="true" />}
              <Icon size={22} weight={active ? "fill" : "regular"} className={active ? "text-coral-ink" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
