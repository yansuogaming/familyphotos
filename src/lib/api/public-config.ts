// Settings the admin controls that public pages need to read (no admin rights).
import { adminStore, systemSettings } from "./admin-mock";
import { BASE, fake, http } from "./core";

export interface PublicConfig {
  assistantSuggestions: string[];
  assistantGuestsAllowed: boolean;
  allowGuestSelfSignup: boolean;
  qrTtlSeconds: number;
  captchaOnAuth: boolean;
  botCheckEnabled: boolean;
  botCheckMinutes: number;
}

export function mockPublicConfig(): PublicConfig {
  const db = adminStore.get();
  const sys = systemSettings();
  return {
    assistantSuggestions: db.assistant.suggestions,
    assistantGuestsAllowed: db.assistant.guestsAllowed,
    allowGuestSelfSignup: sys.allowGuestSelfSignup,
    qrTtlSeconds: sys.qrTtlSeconds,
    captchaOnAuth: sys.captchaOnAuth,
    botCheckEnabled: sys.botCheckEnabled,
    botCheckMinutes: sys.botCheckMinutes,
  };
}

export const publicConfigApi = {
  get: (): Promise<PublicConfig> => (BASE ? http("/config/public") : fake(mockPublicConfig(), 120)),
};
