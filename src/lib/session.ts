"use client";

// Signed-in user, shared across the app. The backend's httpOnly cookie is the real
// credential; this only caches who is signed in (no token) so the UI renders at once.
// It is re-checked against GET /auth/me (see SessionSync) and cleared on any 401.
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
  set(s: Pick<Session, "user">) {
    // never persist a token, even if one is returned
    localStorage.setItem(KEY, JSON.stringify({ user: s.user }));
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
