// AI keys and who may use which. Endpoints: docs/api/ai.md.
// Keys go up once and are stored encrypted by the backend; only a masked hint comes back.
import { session } from "@/lib/session";
import { adminStore } from "./admin-mock";
import { ApiError, BASE, fake, http, persisted, wait } from "./core";
import type { AiAccess, AiKeyConfig, AiKeyInput, AiTestResult } from "./ai-types";

const mask = (key: string) => (key.length <= 10 ? "****" : `${key.slice(0, key.startsWith("sk-ant-") ? 7 : 4)}...${key.slice(-4)}`);

// ---------- mock stores (hints only, never the key itself) ----------

const sharedStore = persisted<AiKeyConfig>("ai:shared", {
  provider: "anthropic",
  model: "claude-sonnet-5-5",
  keyHint: "sk-ant-...4f2c",
  updatedAt: "2026-10-02T09:15:00",
});
const ownStore = persisted<Record<string, AiKeyConfig>>("ai:own", {});

/** Assistant settings from the admin area, with defaults for older demo data. */
export function assistantPolicy() {
  const a = adminStore.get().assistant as { guestsAllowed: boolean; guestsUseSharedKey?: boolean };
  return { guestsAllowed: a.guestsAllowed, guestsUseSharedKey: a.guestsUseSharedKey ?? false };
}

function me() {
  const u = typeof localStorage === "undefined" ? null : session.get()?.user;
  return { id: u?.id ?? "u-bao", isGuest: u?.role === "guest" };
}

function apply(current: AiKeyConfig | null, input: AiKeyInput): AiKeyConfig {
  const key = input.apiKey?.trim();
  if (!key && !current?.keyHint) throw new ApiError(400, "Nhập API key.");
  return {
    provider: input.provider,
    model: input.model.trim(),
    baseUrl: input.provider === "custom" ? input.baseUrl?.trim() : undefined,
    keyHint: key ? mask(key) : current!.keyHint,
    updatedAt: new Date().toISOString(),
  };
}

function mockTest(input: AiKeyInput, saved: AiKeyConfig | null): Promise<AiTestResult> {
  const key = input.apiKey?.trim();
  if (!key && !saved?.keyHint) return fake({ ok: false, message: "Chưa có API key để kiểm tra." }, 400);
  if (key && key.length < 20) return fake({ ok: false, message: "Khoá quá ngắn, có thể bị thiếu ký tự khi dán." }, 600);
  if (!input.model.trim()) return fake({ ok: false, message: "Chọn hoặc nhập tên model." }, 300);
  return fake({ ok: true, message: `Kết nối được với ${input.model.trim()}.`, latencyMs: 412 }, 900);
}

function access(): AiAccess {
  const v = me();
  const shared = sharedStore.get();
  const sharedReady = !!shared.keyHint;
  const using = (c: AiKeyConfig) => ({ provider: c.provider, model: c.model });

  if (!v.isGuest) {
    return sharedReady
      ? { mode: "shared", canAddOwnKey: false, sharedAllowed: true, own: null, using: using(shared) }
      : { mode: "none", reason: "Quản trị chưa cấu hình API AI chung của nhà.", canAddOwnKey: false, sharedAllowed: true, own: null };
  }
  const policy = assistantPolicy();
  const own = ownStore.get()[v.id] ?? null;
  if (!policy.guestsAllowed)
    return { mode: "none", reason: "Nhà đang tắt trợ lý AI cho khách.", canAddOwnKey: false, sharedAllowed: false, own };
  if (own?.keyHint) return { mode: "own", canAddOwnKey: true, sharedAllowed: policy.guestsUseSharedKey, own, using: using(own) };
  if (policy.guestsUseSharedKey && sharedReady)
    return { mode: "shared", canAddOwnKey: true, sharedAllowed: true, own: null, using: using(shared) };
  return {
    mode: "none",
    reason: "Thêm API AI của bạn trong Cài đặt để dùng trợ lý.",
    canAddOwnKey: true,
    sharedAllowed: policy.guestsUseSharedKey,
    own: null,
  };
}

export const aiApi = {
  /** Which key the assistant uses for me, and why not when it cannot. */
  access: (): Promise<AiAccess> => (BASE ? http("/me/ai") : fake(access(), 200)),

  /** Admin: the family's shared key. */
  shared: {
    get: (): Promise<AiKeyConfig> => (BASE ? http("/admin/ai/shared") : fake(sharedStore.get(), 300)),
    save(input: AiKeyInput): Promise<AiKeyConfig> {
      if (BASE) return http("/admin/ai/shared", { method: "PUT", body: JSON.stringify(input) });
      try {
        return fake(sharedStore.set(apply(sharedStore.get(), input)), 600);
      } catch (e) {
        return wait(200).then(() => { throw e; });
      }
    },
    test: (input: AiKeyInput): Promise<AiTestResult> =>
      BASE ? http("/admin/ai/shared/test", { method: "POST", body: JSON.stringify(input) }) : mockTest(input, sharedStore.get()),
  },

  /** Guests: their own key. */
  mine: {
    save(input: AiKeyInput): Promise<AiKeyConfig> {
      if (BASE) return http("/me/ai", { method: "PUT", body: JSON.stringify(input) });
      const v = me();
      if (!v.isGuest) return wait(200).then(() => { throw new ApiError(403, "Người trong nhà dùng API AI chung của nhà."); });
      try {
        const next = apply(ownStore.get()[v.id] ?? null, input);
        ownStore.update((all) => ({ ...all, [v.id]: next }));
        return fake(next, 600);
      } catch (e) {
        return wait(200).then(() => { throw e; });
      }
    },
    remove(): Promise<void> {
      if (BASE) return http("/me/ai", { method: "DELETE" });
      const v = me();
      ownStore.update((all) => {
        const next = { ...all };
        delete next[v.id];
        return next;
      });
      return fake(undefined, 300);
    },
    test: (input: AiKeyInput): Promise<AiTestResult> =>
      BASE ? http("/me/ai/test", { method: "POST", body: JSON.stringify(input) }) : mockTest(input, ownStore.get()[me().id] ?? null),
  },
};
