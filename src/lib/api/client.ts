// Auth, account and learning-home endpoints. Contract: API_CONTRACT.md.
import { http } from "./core";
import type {
  AssistantMessage,
  Device,
  LearningArea,
  LearningToday,
  PendingSignup,
  ProfileUpdate,
  QrLoginSession,
  QrLoginState,
  RegisterInput,
  Session,
  StorageUsage,
  User,
  UserSettings,
} from "./types";

export { ApiError } from "./core";

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const api = {
  auth: {
    /** Family members and guests. Admin accounts use adminLogin (/admin). */
    login: (identifier: string, password: string, captchaToken?: string | null): Promise<Session> =>
      http("/auth/login", post({ identifier, password, captchaToken })),
    adminLogin: (identifier: string, password: string, captchaToken?: string | null): Promise<Session> =>
      http("/admin/auth/login", post({ identifier, password, captchaToken })),
    /** Step 1 of sign-up: the backend emails a one-time code. No account exists yet. */
    register: (input: RegisterInput): Promise<PendingSignup> => http("/auth/register", post(input)),
    /** Step 2: the emailed code. Creates the account and signs in. */
    verifyEmail: (pendingId: string, code: string): Promise<Session> => http("/auth/register/verify", post({ pendingId, code })),
    resendCode: (pendingId: string): Promise<PendingSignup> => http("/auth/register/resend", post({ pendingId })),
    createQrSession: (): Promise<QrLoginSession> => http("/auth/qr", { method: "POST" }),
    getQrState: (id: string): Promise<QrLoginState> => http(`/auth/qr/${id}`),
    logout: (): Promise<void> => http("/auth/logout", { method: "POST" }),
  },
  account: {
    me: (): Promise<User> => http("/auth/me"),
    updateProfile: (patch: ProfileUpdate): Promise<User> => http("/account/profile", { method: "PATCH", body: JSON.stringify(patch) }),
    changePassword: (current: string, next: string): Promise<void> => http("/account/password", post({ current, next })),
    settings: (): Promise<UserSettings> => http("/account/settings"),
    updateSettings: (patch: Partial<UserSettings>): Promise<UserSettings> =>
      http("/account/settings", { method: "PATCH", body: JSON.stringify(patch) }),
    storage: (): Promise<StorageUsage> => http("/account/storage"),
    devices: (): Promise<Device[]> => http("/account/devices"),
    revokeDevice: (id: string): Promise<void> => http(`/account/devices/${id}`, { method: "DELETE" }),
    revokeAllDevices: (): Promise<void> => http("/account/devices", { method: "DELETE" }),
    deleteAccount: (): Promise<{ purgeAt: string }> => http("/account", { method: "DELETE" }),
  },
  learning: {
    today: (): Promise<LearningToday> => http("/learning/today"),
    areas: (): Promise<LearningArea[]> => http("/learning/areas"),
  },
  assistant: {
    ask: (history: AssistantMessage[], text: string): Promise<AssistantMessage> => http("/assistant/messages", post({ history, text })),
  },
};
