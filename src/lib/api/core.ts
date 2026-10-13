// Shared plumbing for every API module (src/lib/api/*.ts).
// When NEXT_PUBLIC_API_URL is set, calls go to the real backend; otherwise
// each module returns mock data.

export const BASE = process.env.NEXT_PUBLIC_API_URL;
export const isMock = !BASE;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: isForm ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fake<T>(value: T, ms = 350): Promise<T> {
  await wait(ms);
  return structuredClone(value);
}

/**
 * Mock-only store that survives reloads (localStorage), so edits made in the
 * admin area show up on the public pages during the demo.
 */
export function persisted<T>(key: string, initial: T) {
  const storageKey = `fp-mock:${key}`;
  const read = (): T => {
    if (typeof localStorage === "undefined") return structuredClone(initial);
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : structuredClone(initial);
    } catch {
      return structuredClone(initial);
    }
  };
  return {
    get: read,
    set(value: T) {
      localStorage.setItem(storageKey, JSON.stringify(value));
      return value;
    },
    update(fn: (current: T) => T) {
      const next = fn(read());
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    },
    reset() {
      localStorage.removeItem(storageKey);
    },
  };
}
