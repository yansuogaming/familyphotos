// Settings the admin controls that public pages need to read (no admin rights).
import { adminStore } from "./admin-mock";
import { BASE, fake, http } from "./core";

export interface PublicConfig {
  assistantSuggestions: string[];
  assistantGuestsAllowed: boolean;
  allowGuestSelfSignup: boolean;
  qrTtlSeconds: number;
}

export function mockPublicConfig(): PublicConfig {
  const db = adminStore.get();
  return {
    assistantSuggestions: db.assistant.suggestions,
    assistantGuestsAllowed: db.assistant.guestsAllowed,
    allowGuestSelfSignup: db.system.allowGuestSelfSignup,
    qrTtlSeconds: db.system.qrTtlSeconds,
  };
}

export const publicConfigApi = {
  get: (): Promise<PublicConfig> => (BASE ? http("/config/public") : fake(mockPublicConfig(), 120)),
};
