"use client";

import { useState } from "react";
import { publicConfigApi } from "@/lib/api/public-config";
import { useApi } from "@/lib/hooks/useApi";
import { captchaAvailable, Turnstile, type CaptchaAction } from "./Turnstile";

/**
 * Captcha for a form. Shown when a site key is configured and the admin setting
 * is on (assumed on while the setting loads). The backend verifies the token.
 */
export function useCaptcha(action: CaptchaAction) {
  const config = useApi(publicConfigApi.get);
  const required = captchaAvailable && (config.status !== "ready" || config.data.captchaOnAuth);
  const [token, setToken] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  return {
    required,
    token,
    /** Tokens are single-use: call after every failed submit. */
    reset: () => {
      setToken(null);
      setKey((k) => k + 1);
    },
    widget: required ? <Turnstile key={key} action={action} onToken={setToken} /> : null,
    missing: required && !token,
  };
}

export const CAPTCHA_MISSING = "Hãy xác minh bạn không phải người máy.";
