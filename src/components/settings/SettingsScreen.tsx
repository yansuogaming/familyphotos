"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { AiSection, AppearanceSection, DangerSection, NotificationSection, PrivacySection, StorageSection } from "./PreferenceSections";
import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";
import { ToastProvider } from "./shared";

const toc = [
  { id: "ho-so", label: "Hồ sơ" },
  { id: "bao-mat", label: "Bảo mật" },
  { id: "tro-ly-ai", label: "Tài khoản AI riêng" },
  { id: "dung-luong", label: "Dung lượng" },
  { id: "rieng-tu", label: "Riêng tư" },
  { id: "giao-dien", label: "Giao diện và ngôn ngữ" },
  { id: "thong-bao", label: "Thông báo" },
  { id: "xoa", label: "Xoá tài khoản" },
];

/** Highlights the section currently near the top of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState(toc[0].id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return active;
}

export function SettingsScreen() {
  const s = useSession();
  const active = useActiveSection();
  if (!s) return null;

  return (
    <ToastProvider>
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="text-4xl font-bold">Cài đặt</h1>

        {/* phones: sections as a scrolling strip */}
        <nav aria-label="Các mục cài đặt" className="sticky top-16 z-20 -mx-4 mt-4 flex gap-1 overflow-x-auto border-b border-line bg-paper/95 px-4 py-2 backdrop-blur-md lg:hidden">
          {toc.map((t) => (
            <a key={t.id} href={`#${t.id}`} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${active === t.id ? "bg-coral-wash text-ink" : "text-ink-2"}`}>
              {t.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Các mục cài đặt" className="hidden lg:block">
            <ol className="sticky top-24 flex flex-col">
              {toc.map((t) => {
                const on = active === t.id;
                return (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      aria-current={on ? "true" : undefined}
                      className={`relative flex items-center py-2 pl-6 text-[0.95rem] transition-colors ${on ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"} ${t.id === "xoa" && !on ? "text-ink-3" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-1/2 h-6 w-3 -translate-y-1/2 bg-coral transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)] ${
                          on ? "opacity-100" : "-translate-x-1 opacity-0"
                        }`}
                      />
                      {t.label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="min-w-0 max-w-3xl">
            <ProfileSection user={s.user} />
            <SecuritySection />
            <AiSection />
            <StorageSection />
            <PrivacySection />
            <AppearanceSection />
            <NotificationSection />
            <DangerSection />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
