// Single entry point for data. When NEXT_PUBLIC_API_URL is set, calls go to
// the real backend (see API_CONTRACT.md); otherwise mock data is returned.
import * as mock from "./mock-data";
import type {
  PendingSignup,
  RegisterInput,
  AiAccount,
  Device,
  ProfileUpdate,
  StorageUsage,
  User,
  UserSettings,
  Album,
  AssistantMessage,
  Conversation,
  LearningArea,
  LearningToday,
  Message,
  Photo,
  QrLoginSession,
  QrLoginState,
  Session,
  TopicDetail,
} from "./types";

import { ApiError, BASE, fake, http, wait } from "./core";
import { mockPublicConfig } from "./public-config";
import { mockRequireCaptcha } from "./security";
import { practiceApi } from "./practice";

export { ApiError, isMock } from "./core";

// Mock sign-up: the emailed code is always 123456 in the demo (see DEMO_ACCOUNTS.txt).
const MOCK_OTP = "123456";
const pendingSignups = new Map<string, { input: RegisterInput; tries: number }>();
const maskEmail = (e: string) => {
  const [user, domain] = e.split("@");
  return `${user.slice(0, 2)}${"*".repeat(Math.max(1, user.length - 2))}@${domain ?? ""}`;
};
const pendingFor = (id: string, email: string): PendingSignup => ({
  id,
  emailHint: maskEmail(email),
  expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  resendAt: new Date(Date.now() + 60_000).toISOString(),
  codeLength: 6,
});

// Mock QR flow: pending until simulateScan(), then scanned, confirmed 3s later.
const qrStarted = new Map<string, number>();
const qrScanned = new Map<string, number>();
const qrExpires = new Map<string, number>();


export const api = {
  auth: {
    /** Family and guests only. Admin accounts are refused here and use adminLogin. */
    login(identifier: string, password: string, captchaToken?: string | null): Promise<Session> {
      if (BASE) return http("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password, captchaToken }) });
      try {
        mockRequireCaptcha(captchaToken);
      } catch (e) {
        return wait(300).then(() => { throw e; });
      }
      const account = mock.demoAccounts.find((a) => a.identifier === identifier.trim().toLowerCase() && a.password === password);
      if (!account) return wait(500).then(() => { throw new ApiError(401, "Sai email/số điện thoại hoặc mật khẩu."); });
      if (account.user.role === "admin")
        return wait(500).then(() => { throw new ApiError(403, "Tài khoản này chỉ đăng nhập được ở trang quản trị."); });
      return fake({ user: account.user, token: "demo" }, 600);
    },
    /** Admin door (/admin). Refuses every non-admin account. */
    adminLogin(identifier: string, password: string, captchaToken?: string | null): Promise<Session> {
      if (BASE) return http("/admin/auth/login", { method: "POST", body: JSON.stringify({ identifier, password, captchaToken }) });
      try {
        mockRequireCaptcha(captchaToken);
      } catch (e) {
        return wait(300).then(() => { throw e; });
      }
      const account = mock.demoAccounts.find((a) => a.identifier === identifier.trim().toLowerCase() && a.password === password);
      if (!account) return wait(600).then(() => { throw new ApiError(401, "Sai email hoặc mật khẩu."); });
      if (account.user.role !== "admin")
        return wait(600).then(() => { throw new ApiError(403, "Tài khoản này không có quyền quản trị."); });
      return fake({ user: account.user, token: "demo-admin" }, 700);
    },
    /**
     * Step 1 of sign-up: checks the details and emails a one-time code.
     * No account exists until verifyEmail() succeeds.
     */
    register(input: RegisterInput): Promise<PendingSignup> {
      if (BASE) return http("/auth/register", { method: "POST", body: JSON.stringify(input) });
      try {
        mockRequireCaptcha(input.captchaToken);
      } catch (e) {
        return wait(300).then(() => { throw e; });
      }
      const email = input.email.trim().toLowerCase();
      if (mock.demoAccounts.some((a) => a.identifier === email))
        return wait(500).then(() => { throw new ApiError(409, "Email này đã có tài khoản. Hãy đăng nhập."); });
      if (input.role === "member" && !/^NHA-\d{4}$/i.test(input.inviteCode?.trim() ?? ""))
        return wait(500).then(() => { throw new ApiError(400, "Mã mời không đúng hoặc đã hết hạn."); });
      const id = crypto.randomUUID();
      pendingSignups.set(id, { input: { ...input, email }, tries: 0 });
      return fake(pendingFor(id, email), 800);
    },
    /** Step 2: the code from the email. Creates the account and signs in. */
    verifyEmail(pendingId: string, code: string): Promise<Session> {
      if (BASE) return http("/auth/register/verify", { method: "POST", body: JSON.stringify({ pendingId, code }) });
      const p = pendingSignups.get(pendingId);
      if (!p) return wait(400).then(() => { throw new ApiError(410, "Mã đã hết hạn. Bấm Gửi lại mã để nhận mã mới."); });
      if (code !== MOCK_OTP) {
        p.tries++;
        const left = 5 - p.tries;
        if (left <= 0) {
          pendingSignups.delete(pendingId);
          return wait(400).then(() => { throw new ApiError(429, "Nhập sai quá nhiều lần. Hãy đăng ký lại sau ít phút."); });
        }
        return wait(500).then(() => { throw new ApiError(400, `Mã chưa đúng. Còn ${left} lần thử.`); });
      }
      pendingSignups.delete(pendingId);
      const { input } = p;
      return fake({ user: { id: crypto.randomUUID(), name: input.name, role: input.role, email: input.email }, token: "demo" }, 700);
    },
    /** Send a fresh code. Allowed once resendAt has passed. */
    resendCode(pendingId: string): Promise<PendingSignup> {
      if (BASE) return http("/auth/register/resend", { method: "POST", body: JSON.stringify({ pendingId }) });
      const p = pendingSignups.get(pendingId);
      if (!p) return wait(400).then(() => { throw new ApiError(410, "Phiên đăng ký đã hết. Hãy điền lại thông tin."); });
      p.tries = 0;
      return fake(pendingFor(pendingId, p.input.email), 600);
    },
    createQrSession(): Promise<QrLoginSession> {
      if (BASE) return http("/auth/qr", { method: "POST" });
      const id = crypto.randomUUID();
      const expires = Date.now() + mockPublicConfig().qrTtlSeconds * 1000;
      qrStarted.set(id, Date.now());
      qrExpires.set(id, expires);
      return fake({ id, code: `familyphotos://qr-login/${id}`, expiresAt: new Date(expires).toISOString() }, 250);
    },
    getQrState(id: string): Promise<QrLoginState> {
      if (BASE) return http(`/auth/qr/${id}`);
      const now = Date.now();
      const scannedAt = qrScanned.get(id);
      const approver = { id: "u-ha", name: "Mẹ Thu Hà" };
      if (scannedAt && now - scannedAt > 3_000) return fake({ status: "confirmed" as const, approver, session: { user: mock.me, token: "demo" } }, 50);
      if (scannedAt) return fake({ status: "scanned" as const, approver }, 50);
      if (now > (qrExpires.get(id) ?? now + 1)) return fake({ status: "expired" as const }, 50);
      return fake({ status: "pending" as const }, 50);
    },
    logout(): Promise<void> {
      if (BASE) return http("/auth/logout", { method: "POST" });
      return fake(undefined, 150);
    },
    /** Mock only: pretend a phone scanned the code. */
    simulateScan(id: string) {
      qrScanned.set(id, Date.now());
    },
  },
  account: {
    me: (): Promise<User> => (BASE ? http("/auth/me") : fake(mock.me)),
    updateProfile(patch: ProfileUpdate): Promise<User> {
      if (BASE) return http("/account/profile", { method: "PATCH", body: JSON.stringify(patch) });
      const { avatar, grade, birthday, ...rest } = patch;
      return fake(
        {
          ...mock.me,
          ...rest,
          avatarUrl: avatar === null ? undefined : (avatar ?? mock.me.avatarUrl),
          grade: grade === null ? undefined : (grade ?? mock.me.grade),
          birthday: birthday === null ? undefined : (birthday ?? mock.me.birthday),
        },
        500,
      );
    },
    changePassword(current: string, next: string): Promise<void> {
      if (BASE) return http("/account/password", { method: "POST", body: JSON.stringify({ current, next }) });
      if (!mock.demoAccounts.some((a) => a.password === current))
        return wait(400).then(() => { throw new ApiError(400, "Mật khẩu hiện tại chưa đúng."); });
      return fake(undefined, 500);
    },
    settings: (): Promise<UserSettings> => (BASE ? http("/account/settings") : fake(mock.settings)),
    updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
      if (BASE) return http("/account/settings", { method: "PATCH", body: JSON.stringify(patch) });
      Object.assign(mock.settings, patch);
      return fake(mock.settings, 200);
    },
    storage: (): Promise<StorageUsage> => (BASE ? http("/account/storage") : fake(mock.storage)),
    devices: (): Promise<Device[]> => (BASE ? http("/account/devices") : fake(mock.devices)),
    revokeDevice(id: string): Promise<void> {
      if (BASE) return http(`/account/devices/${id}`, { method: "DELETE" });
      return fake(undefined, 300);
    },
    revokeAllDevices(): Promise<void> {
      if (BASE) return http("/account/devices", { method: "DELETE" });
      return fake(undefined, 400);
    },
    aiAccounts: (): Promise<AiAccount[]> => (BASE ? http("/account/ai") : fake(mock.aiAccounts)),
    deleteAccount(): Promise<{ purgeAt: string }> {
      if (BASE) return http("/account", { method: "DELETE" });
      return fake({ purgeAt: new Date(Date.now() + 30 * 864e5).toISOString() }, 500);
    },
  },
  photos: {
    albums: (): Promise<Album[]> => (BASE ? http("/albums") : fake(mock.albums)),
    recent: (): Promise<Photo[]> => (BASE ? http("/photos?sort=recent") : fake(mock.photos)),
  },
  chat: {
    conversations: (): Promise<Conversation[]> => (BASE ? http("/conversations") : fake(mock.conversations)),
    messages: (conversationId: string): Promise<Message[]> =>
      BASE ? http(`/conversations/${conversationId}/messages`) : fake(mock.messages.filter((m) => m.conversationId === conversationId)),
    send(conversationId: string, text: string): Promise<Message> {
      if (BASE) return http(`/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ text }) });
      return fake({ id: crypto.randomUUID(), conversationId, senderId: mock.me.id, text, sentAt: new Date().toISOString() }, 150);
    },
  },
  learning: {
    async today(): Promise<LearningToday> {
      if (BASE) return http("/learning/today");
      // Mock: today's count comes from what was actually practised.
      const p = await practiceApi.today();
      return { ...mock.learningToday, goal: p.goal, done: p.done, streakDays: p.streakDays };
    },
    areas: (): Promise<LearningArea[]> => (BASE ? http("/learning/areas") : fake(mock.learningAreas)),
    topic: (grade: number, subject: string, index: number): Promise<TopicDetail> =>
      BASE ? http(`/learning/grades/${grade}/subjects/${encodeURIComponent(subject)}/topics/${index}`) : fake(mock.topicDetail),
  },
  assistant: {
    async ask(history: AssistantMessage[], text: string): Promise<AssistantMessage> {
      if (BASE) return http("/assistant/messages", { method: "POST", body: JSON.stringify({ history, text }) });
      await wait(900);
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `Đây là câu trả lời mẫu cho: "${text}". Khi nối backend, trợ lý sẽ trả lời thật ở đây.`,
      };
    },
  },
};
