// AI keys and who may use which. Endpoints: docs/api/ai.md.
// Keys go up once and are stored encrypted by the backend; only a masked hint comes back.
import { http } from "./core";
import type { AiAccess, AiKeyConfig, AiKeyInput, AiTestResult } from "./ai-types";

export const aiApi = {
  /** Which key the assistant uses for me, and why not when it cannot. */
  access: (): Promise<AiAccess> => http("/me/ai"),

  /** Admin: the family's shared key. */
  shared: {
    get: (): Promise<AiKeyConfig> => http("/admin/ai/shared"),
    save(input: AiKeyInput): Promise<AiKeyConfig> {
      return http("/admin/ai/shared", { method: "PUT", body: JSON.stringify(input) });
    },
    test: (input: AiKeyInput): Promise<AiTestResult> =>
      http("/admin/ai/shared/test", { method: "POST", body: JSON.stringify(input) }),
  },

  /** Guests: their own key. */
  mine: {
    save(input: AiKeyInput): Promise<AiKeyConfig> {
      return http("/me/ai", { method: "PUT", body: JSON.stringify(input) });
    },
    remove(): Promise<void> {
      return http("/me/ai", { method: "DELETE" });
    },
    test: (input: AiKeyInput): Promise<AiTestResult> =>
      http("/me/ai/test", { method: "POST", body: JSON.stringify(input) }),
  },
};
