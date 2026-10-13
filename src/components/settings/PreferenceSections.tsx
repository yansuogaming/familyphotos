"use client";

import { ArrowSquareOut, Bell, BellSlash, Check, Warning } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { SwitchRow } from "@/components/ui/Switch";
import { api } from "@/lib/api/client";
import type { AiAccount, UserSettings } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/useApi";
import { session } from "@/lib/session";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/theme";
import { formatBytes, Section, useToast } from "./shared";

/* ---------- Trợ lý AI ---------- */

const providers: Record<AiAccount["provider"], { name: string; note: string }> = {
  claude: { name: "Claude", note: "Của Anthropic. Giỏi giảng bài và viết văn." },
  openai: { name: "ChatGPT / Codex", note: "Của OpenAI. Dùng chung tài khoản ChatGPT." },
};

export function AiSection() {
  const toast = useToast();
  const loaded = useApi(api.account.aiAccounts);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  return (
    <Section id="tro-ly-ai" title="Tài khoản AI riêng" description="Gắn tài khoản AI của bạn để Trợ lý AI trả lời bằng gói bạn đang dùng. Không gắn thì dùng gói chung của nhà.">
      {loaded.status === "loading" && <div className="h-28 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />}
      {loaded.status === "ready" && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {loaded.data.map((a) => {
            const connected = overrides[a.provider] ?? a.connected;
            const p = providers[a.provider];
            return (
              <li key={a.provider} className={`flex flex-col gap-4 rounded-[var(--radius-paper)] border p-5 ${connected ? "border-coral/60 bg-coral-wash/40" : "border-line"}`}>
                <div>
                  <p className="flex items-center gap-2 font-display text-xl font-semibold">
                    {p.name}
                    {connected && <Check size={18} weight="bold" className="text-coral-ink" aria-label="Đã gắn" />}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">{connected ? `Đã gắn: ${a.label ?? "tài khoản của bạn"}` : p.note}</p>
                </div>
                {connected ? (
                  <Button variant="ghost" size="sm" className="w-fit" onClick={() => { setOverrides((o) => ({ ...o, [a.provider]: false })); toast(`Đã gỡ ${p.name}`); }}>
                    Gỡ tài khoản
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" className="w-fit" onClick={() => { setOverrides((o) => ({ ...o, [a.provider]: true })); toast(`Đã gắn ${p.name}`); }}>
                    <ArrowSquareOut size={16} /> Đăng nhập {p.name}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/* ---------- Dung lượng ---------- */

export function StorageSection() {
  const loaded = useApi(api.account.storage);
  if (loaded.status !== "ready") {
    return (
      <Section id="dung-luong" title="Dung lượng">
        <div className="h-28 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      </Section>
    );
  }
  const { usedBytes, quotaBytes, breakdown } = loaded.data;
  const parts = [
    { key: "Ảnh", bytes: breakdown.photos, color: "bg-coral" },
    { key: "Video", bytes: breakdown.videos, color: "bg-cover-2 dark:bg-ink-2" },
    { key: "Tệp trong chat", bytes: breakdown.files, color: "bg-ink-3" },
  ];
  const free = quotaBytes - usedBytes;
  const nearlyFull = usedBytes / quotaBytes > 0.9;

  return (
    <Section id="dung-luong" title="Dung lượng" description="Ảnh, video và tệp bạn tải lên đều tính vào đây.">
      <p className="tabular font-display text-5xl font-bold tracking-tight">
        {formatBytes(usedBytes)} <span className="text-2xl font-semibold text-ink-3">/ {formatBytes(quotaBytes)}</span>
      </p>
      <div
        className="mt-5 flex h-3 overflow-hidden rounded-full"
        role="img"
        aria-label={`Đã dùng ${formatBytes(usedBytes)} trên ${formatBytes(quotaBytes)}`}
      >
        {parts.map((p) => (
          <span key={p.key} className={`${p.color} border-r-2 border-paper last:border-r-0`} style={{ width: `${(p.bytes / quotaBytes) * 100}%` }} />
        ))}
        <span className="flex-1 bg-paper-3" />
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2 text-ink-2">
            <span className={`size-3 rounded-sm ${p.color}`} aria-hidden="true" />
            {p.key} <span className="tabular font-semibold text-ink">{formatBytes(p.bytes)}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-ink-2">
          <span className="size-3 rounded-sm bg-paper-3" aria-hidden="true" />
          Còn trống <span className="tabular font-semibold text-ink">{formatBytes(free)}</span>
        </li>
      </ul>
      {nearlyFull && <p className="mt-4 text-sm font-semibold text-danger">Sắp đầy. Xoá bớt video hoặc nhờ người tạo nhà nâng dung lượng.</p>}
    </Section>
  );
}

/* ---------- Riêng tư + Thông báo share one settings object ---------- */

function useSettings() {
  const toast = useToast();
  const loaded = useApi(api.account.settings);
  const [local, setLocal] = useState<UserSettings | null>(null);
  const value = local ?? (loaded.status === "ready" ? loaded.data : null);

  async function patch<K extends keyof UserSettings>(key: K, next: UserSettings[K]) {
    if (!value) return;
    setLocal({ ...value, [key]: next });
    await api.account.updateSettings({ [key]: next });
    toast("Đã lưu");
  }
  return { value, patch };
}

export function PrivacySection() {
  const { value, patch } = useSettings();
  return (
    <Section id="rieng-tu" title="Riêng tư">
      {!value ? (
        <div className="h-28 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      ) : (
        <div className="divide-y divide-line">
          <SwitchRow
            label="Cho người khác tìm tôi bằng email"
            description="Phải gõ đúng cả địa chỉ email mới tìm thấy bạn. Tắt thì ô tìm kiếm báo như email này chưa có tài khoản."
            checked={value.privacy.discoverableByEmail}
            onChange={(v) => patch("privacy", { ...value.privacy, discoverableByEmail: v })}
          />
          <SwitchRow
            label="Nhận tin từ người chưa có trong danh bạ"
            description="Họ nhắn được tối đa 3 tin cho tới khi bạn trả lời. Tắt thì chỉ người trong nhà và người quen mới nhắn được."
            checked={value.privacy.allowMessagesFromNonContacts}
            onChange={(v) => patch("privacy", { ...value.privacy, allowMessagesFromNonContacts: v })}
          />
        </div>
      )}
    </Section>
  );
}

const noop = () => () => {};
type Permission = NotificationPermission | "unsupported";

export function NotificationSection() {
  const { value, patch } = useSettings();
  const toast = useToast();
  const initial = useSyncExternalStore<Permission | undefined>(
    noop,
    () => ("Notification" in window ? Notification.permission : "unsupported"),
    () => undefined,
  );
  const [asked, setAsked] = useState<Permission | null>(null);
  const permission = asked ?? initial;

  async function enable() {
    if (!("Notification" in window)) return setAsked("unsupported");
    const result = await Notification.requestPermission();
    setAsked(result);
    if (result === "granted" && value) {
      patch("notifications", { ...value.notifications, enabled: true });
      new Notification("Family Photos", { body: "Đã bật thông báo. Cả nhà nhắn là bạn biết ngay." });
    } else if (result === "denied") toast("Trình duyệt đã chặn thông báo");
  }

  const on = permission === "granted" && !!value?.notifications.enabled;

  return (
    <Section id="thong-bao" title="Thông báo" description="Được báo khi có tin nhắn hoặc cuộc gọi mới, kể cả khi bạn đang làm việc khác.">
      <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-paper)] border border-line bg-paper-2 p-5">
        {on ? <Bell size={28} weight="fill" className="text-coral-ink" /> : <BellSlash size={28} className="text-ink-3" />}
        <div className="mr-auto min-w-0">
          <p className="font-semibold">{on ? "Thông báo đang bật trên máy này" : "Thông báo đang tắt trên máy này"}</p>
          <p className="text-sm text-ink-2">
            {permission === "denied"
              ? "Trình duyệt đang chặn. Bấm biểu tượng ổ khoá cạnh thanh địa chỉ để cho phép lại."
              : permission === "unsupported"
                ? "Trình duyệt này không hỗ trợ thông báo."
                : on
                  ? "Chọn bên dưới những gì bạn muốn được báo."
                  : "Máy sẽ hỏi quyền một lần khi bạn bấm Bật thông báo."}
          </p>
        </div>
        {!on && permission !== "denied" && permission !== "unsupported" && (
          <Button onClick={enable}><Bell size={18} /> Bật thông báo</Button>
        )}
      </div>
      {value && (
        <div className="mt-2 divide-y divide-line">
          {([
            ["messages", "Tin nhắn mới", "Trong nhóm cả nhà và tin nhắn riêng."],
            ["calls", "Cuộc gọi video", "Đổ chuông khi có người gọi."],
            ["newPhotos", "Ảnh mới trong album", "Gom lại, tối đa một lần mỗi giờ."],
            ["studyReminder", "Nhắc học mỗi ngày", "Lúc 19:30 nếu hôm nay chưa làm đủ 10 câu."],
          ] as const).map(([key, label, desc]) => (
            <SwitchRow
              key={key}
              label={label}
              description={desc}
              disabled={!on}
              checked={value.notifications[key]}
              onChange={(v) => patch("notifications", { ...value.notifications, [key]: v })}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- Giao diện ---------- */

const themes: { key: ThemePref; label: string; swatch: string }[] = [
  { key: "light", label: "Sáng", swatch: "bg-[oklch(0.99_0.004_275)]" },
  { key: "dark", label: "Tối", swatch: "bg-[oklch(0.205_0.036_262)]" },
  { key: "system", label: "Theo máy", swatch: "bg-[linear-gradient(135deg,oklch(0.99_0.004_275)_50%,oklch(0.205_0.036_262)_50%)]" },
];

export function AppearanceSection() {
  const pref = useThemePref();
  const toast = useToast();
  const [lang, setLang] = useState<"vi" | "en">("vi");

  return (
    <Section id="giao-dien" title="Giao diện và ngôn ngữ">
      <p className="mb-3 font-semibold" id="theme-label">Giao diện</p>
      <div role="radiogroup" aria-labelledby="theme-label" className="grid max-w-xl grid-cols-3 gap-3">
        {themes.map((t) => {
          const active = pref === t.key;
          return (
            <button
              key={t.key}
              role="radio"
              aria-checked={active}
              onClick={() => { setThemePref(t.key); api.account.updateSettings({ theme: t.key }); }}
              className={`group flex flex-col gap-2 rounded-[var(--radius-paper)] border-2 p-2 text-left transition-colors ${active ? "border-coral" : "border-line hover:border-ink-3"}`}
            >
              <span className={`relative block aspect-[4/3] overflow-hidden rounded-[3px] border border-line ${t.swatch}`}>
                <span className="absolute left-2 right-6 top-3 h-1.5 rounded-full bg-[oklch(0.7_0.15_38)]" />
                <span className="absolute left-2 right-10 top-6 h-1 rounded-full bg-[oklch(0.6_0.03_265/0.5)]" />
                <span className="absolute left-2 right-8 top-8 h-1 rounded-full bg-[oklch(0.6_0.03_265/0.5)]" />
              </span>
              <span className="flex items-center justify-between px-1 text-sm font-semibold">
                {t.label}
                {active && <Check size={16} weight="bold" className="text-coral-ink" />}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mb-3 mt-8 font-semibold" id="lang-label">Ngôn ngữ</p>
      <div role="radiogroup" aria-labelledby="lang-label" className="inline-grid grid-cols-2 rounded-full border border-line bg-paper-2 p-1">
        {([["vi", "Tiếng Việt"], ["en", "English"]] as const).map(([k, l]) => (
          <button
            key={k}
            role="radio"
            aria-checked={lang === k}
            onClick={() => { setLang(k); if (k === "en") toast("Bản tiếng Anh sẽ có ở giai đoạn sau"); }}
            className={`h-10 rounded-full px-5 text-sm font-semibold transition-colors ${lang === k ? "bg-paper text-ink shadow-[0_1px_3px_hsl(var(--shadow)/0.15)]" : "text-ink-2 hover:text-ink"}`}
          >
            {l}
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Xoá tài khoản ---------- */

export function DangerSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = typed.trim().toUpperCase() === "XOÁ";

  async function confirm() {
    setBusy(true);
    await api.account.deleteAccount();
    session.clear();
    router.push("/");
  }

  return (
    <Section id="xoa" title="Xoá tài khoản" tone="danger" description="Tài khoản vào hàng chờ và bị xoá vĩnh viễn sau 30 ngày. Đăng nhập lại trước hạn để khôi phục. Ảnh và tài liệu bạn đã tải lên vẫn ở lại trong album của nhà.">
      {!open ? (
        <Button variant="secondary" className="border-danger/50 text-danger hover:border-danger hover:bg-danger/10" onClick={() => setOpen(true)}>
          Xoá tài khoản của tôi
        </Button>
      ) : (
        <div className="max-w-lg rounded-[var(--radius-paper)] border border-danger/50 bg-danger/5 p-5">
          <p className="flex items-center gap-2 font-semibold"><Warning size={20} className="text-danger" /> Bạn chắc chứ?</p>
          <label htmlFor="confirm-delete" className="mt-3 block text-sm text-ink-2">
            Gõ <span className="font-bold text-ink">XOÁ</span> để xác nhận.
          </label>
          <input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="mt-2 h-11 w-full rounded-[var(--radius-paper)] border border-line bg-paper px-3 outline-none focus:border-danger"
          />
          <div className="mt-4 flex gap-3">
            <Button disabled={!ready || busy} onClick={confirm} className="bg-danger text-white shadow-none hover:bg-danger">
              {busy ? "Đang xoá..." : "Xoá vĩnh viễn sau 30 ngày"}
            </Button>
            <Button variant="ghost" onClick={() => { setOpen(false); setTyped(""); }}>Giữ lại</Button>
          </div>
        </div>
      )}
    </Section>
  );
}
