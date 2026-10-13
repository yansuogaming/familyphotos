// Bot protection with Cloudflare Turnstile. Endpoints: docs/api/security.md.
// The widget gives a one-time token; the backend verifies it with Cloudflare
// (siteverify, secret key) and decides. The frontend never trusts itself.
import { http } from "./core";

export interface HumanPass {
  /** Epoch ms. After this the next page visit asks again. */
  validUntil: number;
}

export const securityApi = {
  /** Exchange a Turnstile token for a time-limited "human" pass (backend also sets an httpOnly cookie). */
  verifyHuman(token: string, path: string): Promise<HumanPass> {
    return http("/security/human-check", { method: "POST", body: JSON.stringify({ token, path }) });
  },
};
