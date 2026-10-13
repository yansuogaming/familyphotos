"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { toggleTheme } from "@/lib/theme";
import { IconButton } from "./Button";

export function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <IconButton label="Đổi giao diện sáng/tối" onClick={toggleTheme} className={className}>
      <Sun size={20} className="hidden dark:block" />
      <Moon size={20} className="dark:hidden" />
    </IconButton>
  );
}
