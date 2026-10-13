// Settings the admin controls that public pages need to read (no admin rights).
import { http } from "./core";

export interface PublicConfig {
  assistantSuggestions: string[];
  assistantGuestsAllowed: boolean;
  qrTtlSeconds: number;
  captchaOnAuth: boolean;
  botCheckEnabled: boolean;
  botCheckMinutes: number;
  siteUrl: string;
}

export const publicConfigApi = {
  get: (): Promise<PublicConfig> => http("/config/public"),
};
