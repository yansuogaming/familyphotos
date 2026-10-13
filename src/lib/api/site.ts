// Public page content (landing, login, register). Contract: docs/api/site.md.
import { useSyncExternalStore } from "react";
import { BASE, http } from "./core";
import { defaultSite } from "./site-defaults";
import type { SiteContent } from "./site-types";

export { defaultSite } from "./site-defaults";

// Live snapshot for the public pages. Server render uses the defaults; the client
// swaps in the backend's content once it arrives (no hydration mismatch).
const listeners = new Set<() => void>();
let remote: SiteContent | null = null;
let requested = false;
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (BASE && !requested) {
    requested = true;
    siteApi.get().then(
      (c) => {
        remote = c;
        emit();
      },
      () => {
        requested = false;
      },
    );
  }
  return () => listeners.delete(cb);
}

/** Current public content. Defaults on the server and until the backend answers. */
export function useSiteContent(): SiteContent {
  return useSyncExternalStore(subscribe, () => remote ?? defaultSite, () => defaultSite);
}

export const siteApi = {
  get: (): Promise<SiteContent> => http("/site"),
  async save(content: SiteContent): Promise<SiteContent> {
    remote = await http<SiteContent>("/site", { method: "PUT", body: JSON.stringify(content) });
    emit();
    return remote;
  },
  async reset(): Promise<SiteContent> {
    remote = await http<SiteContent>("/site/reset", { method: "POST" });
    emit();
    return remote;
  },
};
