"use client";

// Signed-in user, shared across the app. In mock mode it lives in localStorage;
// with a real backend, the cookie is the source of truth and this is a cache
// filled from GET /auth/me.
import { useSyncExternalStore } from "react";
import type { Session, User } from "./api/types";

const KEY = "fp-session";
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: Session | null } = { raw: null, value: null };

function read(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (raw !== cached.raw) {
    let value: Session | null = null;
    try {
      value = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      value = null;
    }
    cached = { raw, value };
  }
  return cached.value;
}

function emit() {
  listeners.forEach((l) => l());
}

export const session = {
  get: read,
  set(s: Session) {
    localStorage.setItem(KEY, JSON.stringify(s));
    emit();
  },
  updateUser(patch: Partial<User>) {
    const s = read();
    if (s) session.set({ ...s, user: { ...s.user, ...patch } });
  },
  clear() {
    localStorage.removeItem(KEY);
    emit();
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** `undefined` while unknown (server render), `null` when signed out. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}
