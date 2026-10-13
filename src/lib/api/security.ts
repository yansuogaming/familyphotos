// Bot protection with Cloudflare Turnstile. Endpoints: docs/api/security.md.
// The widget gives a one-time token; the backend verifies it with Cloudflare
// (siteverify, secret key) and decides. The frontend never trusts itself.
import { ApiError, BASE, fake, http, wait } from "./core";
import { mockPublicConfig } from "./public-config";

export interface HumanPass {
  /** Epoch ms. After this the next page visit asks again. */
  validUntil: number;
}

export const securityApi = {
  /** Exchange a Turnstile token for a time-limited "human" pass (backend also sets an httpOnly cookie). */
  verifyHuman(token: string, path: string): Promise<HumanPass> {
    if (BASE) return http("/security/human-check", { method: "POST", body: JSON.stringify({ token, path }) });
    if (!token) return wait(300).then(() => { throw new ApiError(400, "Chưa xác minh được. Thử lại nhé."); });
    return fake({ validUntil: Date.now() + mockPublicConfig().botCheckMinutes * 60_000 }, 400);
  },
};

/** Mock-side check used by auth endpoints: a captcha token is required while the setting is on. */
export function mockRequireCaptcha(token?: string | null) {
  if (mockPublicConfig().captchaOnAuth && !token) throw new ApiError(400, "Hãy xác minh bạn không phải người máy.");
}
