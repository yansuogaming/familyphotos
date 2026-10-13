"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const studyModes = [
  { href: "/hoc/ly-thuyet", label: "Lý thuyết" },
  { href: "/hoc/luyen-tap", label: "Luyện tập" },
  { href: "/hoc/giai-bai-tap", label: "Giải bài tập" },
  { href: "/hoc/tien-ich", label: "Tiện ích" },
];

/** Switches between the four study modes. Shared by every /hoc sub-page. */
export function StudyModeTabs({ className = "" }: { className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Chế độ học" className={`inline-flex rounded-full border border-line bg-paper-2 p-1 ${className}`}>
      {studyModes.map((m) => {
        const on = path === m.href || path.startsWith(`${m.href}/`);
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={on ? "page" : undefined}
            className={`h-9 whitespace-nowrap rounded-full px-4 text-sm font-semibold leading-9 transition-colors ${
              on ? "bg-paper text-ink shadow-[0_1px_3px_hsl(var(--shadow)/0.15)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
