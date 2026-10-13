// AI provider keys: the family's shared key (admin) and a guest's own key.
// Mirrored in docs/api/ai.md.

export type AiProviderId = "anthropic" | "openai" | "gemini" | "custom";

export const AI_PROVIDERS: { id: AiProviderId; name: string; body: string; keyHint: string; models: string[] }[] = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    body: "Giảng bài kỹ, viết tiếng Việt tự nhiên.",
    keyHint: "Bắt đầu bằng sk-ant-",
    models: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-4-5-20251001"],
  },
  { id: "openai", name: "OpenAI (ChatGPT)", body: "Dùng khoá API của tài khoản OpenAI.", keyHint: "Bắt đầu bằng sk-", models: [] },
  { id: "gemini", name: "Google Gemini", body: "Dùng khoá API từ Google AI Studio.", keyHint: "Bắt đầu bằng AIza", models: [] },
  { id: "custom", name: "Máy chủ tương thích OpenAI", body: "Tự đặt địa chỉ máy chủ, ví dụ máy chủ AI riêng của nhà.", keyHint: "Theo máy chủ của bạn", models: [] },
];

/** What the backend returns. The full key never comes back, only a masked hint. */
export interface AiKeyConfig {
  provider: AiProviderId;
  model: string;
  /** Only for "custom". */
  baseUrl?: string;
  /** e.g. "sk-ant-...4f2c". null: no key saved yet. */
  keyHint: string | null;
  updatedAt: string | null;
}

/** What the frontend sends. Leave apiKey out to keep the saved key. */
export interface AiKeyInput {
  provider: AiProviderId;
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface AiTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

/** Which key the assistant will use for the signed-in person. */
export interface AiAccess {
  mode: "shared" | "own" | "none";
  /** When mode is "none": why, in plain Vietnamese. */
  reason?: string;
  /** Guests: true when they can fix "none" by adding their own key. */
  canAddOwnKey: boolean;
  /** Guests: whether the family lets them use the shared key. */
  sharedAllowed: boolean;
  own: AiKeyConfig | null;
  /** Provider and model in use, for display. */
  using?: Pick<AiKeyConfig, "provider" | "model">;
}
