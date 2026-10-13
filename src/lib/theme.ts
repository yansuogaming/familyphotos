"use client";

import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "fp-theme";
const listeners = new Set<() => void>();

function systemDark() {
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function setThemePref(pref: ThemePref) {
  if (pref === "system") localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, pref);
  document.documentElement.classList.toggle("dark", pref === "dark" || (pref === "system" && systemDark()));
  listeners.forEach((l) => l());
}

/** Flip between light and dark from whatever is showing now. */
export function toggleTheme() {
  setThemePref(document.documentElement.classList.contains("dark") ? "light" : "dark");
}

export function useThemePref(): ThemePref | undefined {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getThemePref,
    () => undefined,
  );
}
