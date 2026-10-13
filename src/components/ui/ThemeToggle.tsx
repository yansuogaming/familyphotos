"use client";

import { useSyncExternalStore } from "react";
import { icons, Morph } from "@/components/ui/icons";
import { toggleTheme } from "@/lib/theme";
import { IconButton } from "./Button";

// Follows the class on <html>, so every toggle on the page stays in step.
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return (
    <IconButton label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} onClick={toggleTheme} className={className}>
      {/* the sun morphs into the moon and back */}
      <Morph icon={dark ? icons.Sun : icons.Moon} size={20} />
    </IconButton>
  );
}
