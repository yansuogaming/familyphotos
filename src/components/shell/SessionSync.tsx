"use client";

import { useEffect } from "react";
import { api } from "@/lib/api/client";
import { UNAUTHORIZED_EVENT } from "@/lib/api/core";
import { session } from "@/lib/session";

/**
 * Keeps the cached signed-in user honest: refreshes it from GET /auth/me on load
 * and forgets it whenever the backend answers 401 (expired or signed out elsewhere).
 */
export function SessionSync() {
  useEffect(() => {
    const forget = () => session.clear();
    window.addEventListener(UNAUTHORIZED_EVENT, forget);
    if (session.get()) {
      api.account.me().then(
        (user) => session.set({ user }),
        () => {
          /* 401 already handled by the event; network errors keep the cache */
        },
      );
    }
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, forget);
  }, []);
  return null;
}
