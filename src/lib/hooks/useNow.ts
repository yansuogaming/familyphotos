"use client";

import { useSyncExternalStore } from "react";

/** Fixed instant used while prerendering, so the static shell is deterministic. */
export const PRERENDER_NOW = Date.parse("2026-10-13T12:00:00+07:00");

let clientNow: number | null = null;
const noop = () => () => {};

/** Current time, read once per page load on the client. Safe to call during render. */
export function useNow(): number {
  return useSyncExternalStore(
    noop,
    () => (clientNow ??= Date.now()),
    () => PRERENDER_NOW,
  );
}
