// Public page content (landing, login, register). See docs/api/site.md.
import { useSyncExternalStore } from "react";
import { ApiError, BASE, fake, http, wait } from "./core";
import { defaultSite, siteStore } from "./site-mock";
import type { SiteContent } from "./site-types";
import { mockActor, mockRequireAdmin, logMockAudit } from "./admin-mock";

export { defaultSite } from "./site-mock";

const STORAGE_KEY = "fp-mock:site";

/** Saved content may predate new fields: fill gaps from the defaults. */
function withDefaults<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(saved) && saved.length === base.length ? saved : base) as T;
  if (base && typeof base === "object") {
    const s = (saved && typeof saved === "object" ? saved : {}) as Record<string, unknown>;
    const out: Record<string, unknown> = { ...s };
    for (const [k, v] of Object.entries(base as Record<string, unknown>)) out[k] = withDefaults(v, s[k]);
    return out as T;
  }
  return (typeof saved === typeof base ? saved : base) as T;
}

// Live snapshot for the public pages. Server render always uses the defaults;
// the client swaps in saved content after hydration (no mismatch, no flash
// unless the content really changed).
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: SiteContent } = { raw: null, value: defaultSite };
let remote: SiteContent | null = null;
let remoteRequested = false;

function emit() {
  listeners.forEach((l) => l());
}

function readSnapshot(): SiteContent {
  if (BASE) return remote ?? defaultSite;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache.raw) {
    let value = defaultSite;
    try {
      value = raw ? withDefaults(defaultSite, JSON.parse(raw)) : defaultSite;
    } catch {
      value = defaultSite;
    }
    cache = { raw, value };
  }
  return cache.value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (BASE && !remoteRequested) {
    remoteRequested = true;
    siteApi.get().then(
      (c) => {
        remote = c;
        emit();
      },
      () => {
        remoteRequested = false;
      },
    );
  }
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Current public content. Defaults on the server and during hydration. */
export function useSiteContent(): SiteContent {
  return useSyncExternalStore(subscribe, readSnapshot, () => defaultSite);
}

export const siteApi = {
  get(): Promise<SiteContent> {
    if (BASE) return http("/site");
    return fake(readSnapshot(), 250);
  },
  async save(content: SiteContent): Promise<SiteContent> {
    if (BASE) {
      const saved = await http<SiteContent>("/site", { method: "PUT", body: JSON.stringify(content) });
      remote = saved;
      emit();
      return saved;
    }
    await wait(450);
    mockRequireAdmin();
    const next: SiteContent = { ...content, updatedAt: new Date().toISOString(), updatedBy: mockActor().name };
    try {
      siteStore.set(next);
    } catch {
      throw new ApiError(413, "Bộ nhớ của bản demo đã đầy. Hãy dùng ảnh nhỏ hơn hoặc chọn ảnh từ thư viện.");
    }
    logMockAudit("Sửa nội dung trang công khai", "Trang chủ, đăng nhập, đăng ký");
    emit();
    return structuredClone(next);
  },
  async reset(): Promise<SiteContent> {
    if (BASE) {
      const saved = await http<SiteContent>("/site/reset", { method: "POST" });
      remote = saved;
      emit();
      return saved;
    }
    await wait(350);
    mockRequireAdmin();
    siteStore.reset();
    logMockAudit("Khôi phục nội dung mặc định", "Trang chủ, đăng nhập, đăng ký");
    emit();
    return structuredClone(defaultSite);
  },
};
