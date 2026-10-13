"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { Role } from "@/lib/api/types";

/**
 * Local copy of a loaded list for optimistic edits. The copy is tied to the
 * array it was made from: when the loader returns a new array (reload), the
 * edits are dropped and the fresh data wins. No effect, no sync setState.
 */
export function useLocalList<T>(data: T[] | undefined) {
  const [edit, setEdit] = useState<{ base: T[] | undefined; list: T[] } | null>(null);
  const list = edit && edit.base === data ? edit.list : data;
  const update = useCallback(
    (fn: (list: T[]) => T[]) =>
      setEdit((prev) => {
        const cur = prev && prev.base === data ? prev.list : (data ?? []);
        return { base: data, list: fn(cur) };
      }),
    [data],
  );
  return [list, update] as const;
}

export type TabKey = "members" | "requests" | "invites";

const slugOf: Record<TabKey, string> = { members: "", requests: "cho-duyet", invites: "ma-moi" };

const hashListeners = new Set<() => void>();

function subscribeHash(cb: () => void) {
  hashListeners.add(cb);
  window.addEventListener("hashchange", cb);
  return () => {
    hashListeners.delete(cb);
    window.removeEventListener("hashchange", cb);
  };
}

const readHash = () => window.location.hash;

/** Selected tab lives in the URL hash (#cho-duyet, #ma-moi) so other pages can link to it. */
export function useHashTab(): [TabKey, (t: TabKey) => void] {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const tab: TabKey = hash === "#cho-duyet" ? "requests" : hash === "#ma-moi" ? "invites" : "members";
  const setTab = useCallback((t: TabKey) => {
    const { pathname, search } = window.location;
    const url = slugOf[t] ? `${pathname}${search}#${slugOf[t]}` : `${pathname}${search}`;
    window.history.replaceState(window.history.state, "", url);
    hashListeners.forEach((l) => l());
  }, []);
  return [tab, setTab];
}

export const roleOrder: Record<Role, number> = { admin: 0, member: 1, guest: 2 };

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Copy text and report the outcome as a toast. */
export async function copyText(text: string, toast: (m: string) => void, done = "Đã sao chép mã") {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast("Chưa sao chép được. Hãy chọn mã và sao chép tay.");
  }
}
