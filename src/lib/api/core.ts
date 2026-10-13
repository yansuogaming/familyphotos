// Shared HTTP plumbing for every API module (src/lib/api/*.ts).
// The backend lives at NEXT_PUBLIC_API_URL and authenticates with an httpOnly cookie.

export const BASE = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Fired when the backend says the session is gone (401), so the UI can sign out. */
export const UNAUTHORIZED_EVENT = "fp:unauthorized";

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new ApiError(0, "Chưa cấu hình địa chỉ máy chủ (NEXT_PUBLIC_API_URL).");
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: isForm ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
