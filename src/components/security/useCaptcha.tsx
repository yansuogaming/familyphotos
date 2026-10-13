"use client";

import { useState } from "react";
import { publicConfigApi } from "@/lib/api/public-config";
import { useApi } from "@/lib/hooks/useApi";
import { Turnstile, type CaptchaAction } from "./Turnstile";

/** Captcha for a form. While the setting loads, assume it is required. */
export function useCaptcha(action: CaptchaAction) {
  const config = useApi(publicConfigApi.get);
  const required = config.status !== "ready" || config.data.captchaOnAuth;
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
