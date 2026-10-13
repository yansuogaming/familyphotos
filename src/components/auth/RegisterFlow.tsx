"use client";

import { ArrowLeft, EnvelopeOpen, HouseLine, UserCirclePlus } from "@/components/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CAPTCHA_MISSING, useCaptcha } from "@/components/security/useCaptcha";
import { useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { OtpInput } from "@/components/ui/OtpInput";
import { api, ApiError } from "@/lib/api/client";
import { useSiteContent } from "@/lib/api/site";
import type { PendingSignup, Role } from "@/lib/api/types";
import { session } from "@/lib/session";

type SignupRole = Exclude<Role, "admin">;

/** Choose who you are, fill in the details, then confirm the code sent to your email. */
export function RegisterFlow() {
  const [role, setRole] = useState<SignupRole | null>(null);
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const copy = useSiteContent().register;

  if (pending) return <VerifyEmail pending={pending} onPending={setPending} onBack={() => setPending(null)} />;
  if (role) return <RegisterForm role={role} onBack={() => setRole(null)} onSent={setPending} />;

  return (
    <div className="w-full max-w-md">
      <h1 className="text-4xl font-bold">{copy.title}</h1>
      <p className="mt-2 text-ink-2">{copy.lead}</p>
      <div className="mt-8 flex flex-col gap-3">
        {([
          ["member", copy.member.title, copy.member.body, HouseLine],
          ["guest", copy.guest.title, copy.guest.body, UserCirclePlus],
        ] as const).map(([key, title, desc, Icon]) => (
          <button
            key={key}
            onClick={() => setRole(key)}
            className="group flex items-start gap-4 rounded-[var(--radius-paper)] border border-line bg-paper p-5 text-left transition-[border-color,background-color] hover:border-coral hover:bg-coral-wash"
          >
            <Icon size={28} className="mt-0.5 shrink-0 text-coral-ink" />
            <span>
              <span className="block font-display text-xl font-semibold">{title}</span>
              <span className="mt-1 block text-sm text-ink-2">{desc}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-ink-2">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-coral-ink underline">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}

function RegisterForm({ role, onBack, onSent }: { role: SignupRole; onBack: () => void; onSent: (p: PendingSignup) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const captcha = useCaptcha("register");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!d.name?.trim()) next.name = "Cho cả nhà biết tên bạn.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email?.trim() ?? "")) next.email = "Nhập email đúng dạng, ví dụ ten@gmail.com. Mã xác nhận sẽ gửi về đây.";
    if ((d.password ?? "").length < 8) next.password = "Mật khẩu cần ít nhất 8 ký tự.";
    if (role === "member" && !d.inviteCode?.trim()) next.inviteCode = "Xin mã mời từ bố, mẹ hoặc người tạo nhà.";
    if (captcha.missing) next.captcha = CAPTCHA_MISSING;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const pending = await api.auth.register({
        name: d.name.trim(),
        email: d.email.trim(),
        password: d.password,
        role,
        inviteCode: d.inviteCode?.trim(),
        captchaToken: captcha.token,
      });
      toast.success(`Đã gửi mã tới ${pending.emailHint}`);
      onSent(pending);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Chưa gửi được mã. Thử lại sau ít phút.";
      if (err instanceof ApiError && err.status === 409) setErrors({ email: message });
      else if (err instanceof ApiError && /mã mời/i.test(message)) setErrors({ inviteCode: message });
      else toast.error(message);
      captcha.reset();
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Chọn lại
      </button>
      <h1 className="text-4xl font-bold">{role === "member" ? "Người trong nhà" : "Đăng ký làm khách"}</h1>
      <p className="mt-2 text-ink-2">Điền thông tin, rồi nhập mã 6 số được gửi về email để hoàn tất.</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        {role === "member" && (
          <Field label="Mã mời" name="inviteCode" autoComplete="off" placeholder="VD: NHA-4821" hint="Có trong mục Cài đặt > Mời người nhà." error={errors.inviteCode} />
        )}
        <Field label="Tên gọi trong nhà" name="name" autoComplete="nickname" placeholder="VD: Bà nội, Khánh Na" error={errors.name} />
        <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" error={errors.email} hint="Mã xác nhận sẽ gửi về địa chỉ này." />
        <Field label="Mật khẩu" name="password" type="password" autoComplete="new-password" hint="Ít nhất 8 ký tự." error={errors.password} />
        {captcha.widget && (
          <div className="flex flex-col gap-2">
            {captcha.widget}
            {errors.captcha && !captcha.token && <p className="text-sm text-danger">{errors.captcha}</p>}
          </div>
        )}
        <Button type="submit" size="lg" disabled={busy} className="mt-2 w-full">
          {busy ? "Đang gửi mã..." : "Gửi mã xác nhận"}
        </Button>
      </form>
    </div>
  );
}

const secondsUntil = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 1000));

function VerifyEmail({ pending, onPending, onBack }: { pending: PendingSignup; onPending: (p: PendingSignup) => void; onBack: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const copy = useSiteContent().register;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(() => secondsUntil(pending.resendAt));

  // resend countdown
  useEffect(() => {
    const t = setInterval(() => setWait(secondsUntil(pending.resendAt)), 1000);
    return () => clearInterval(t);
  }, [pending.resendAt]);

  async function verify(value = code) {
    if (value.length !== pending.codeLength) return setError(`Nhập đủ ${pending.codeLength} số.`);
    setBusy(true);
    setError(null);
    try {
      const s = await api.auth.verifyEmail(pending.id, value);
      session.set(s);
      toast.success("Đã xác nhận email. Chào mừng về nhà!");
      router.push("/photos");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa xác nhận được. Thử lại nhé.");
      setCode("");
      setBusy(false);
    }
  }

  async function resend() {
    try {
      const next = await api.auth.resendCode(pending.id);
      onPending(next);
      setWait(secondsUntil(next.resendAt));
      setCode("");
      setError(null);
      toast.success(`Đã gửi mã mới tới ${next.emailHint}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Chưa gửi lại được mã.");
    }
  }

  return (
    <div className="w-full max-w-md">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Sửa thông tin
      </button>
      <EnvelopeOpen size={36} className="text-coral-ink" />
      <h1 className="mt-4 text-4xl font-bold">{copy.sentTitle}</h1>
      <p className="mt-3 text-ink-2">
        {copy.sentBody} Mã đã gửi tới <span className="font-semibold text-ink">{pending.emailHint}</span>, có hiệu lực 10 phút.
      </p>

      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
      >
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} length={pending.codeLength} invalid={!!error} disabled={busy} onComplete={verify} />
        <p className="min-h-5 text-sm" aria-live="polite">
          {error ? <span className="text-danger">{error}</span> : <span className="text-ink-3">Không thấy thư? Xem trong mục Thư rác hoặc Quảng cáo.</span>}
        </p>
        <Button type="submit" size="lg" disabled={busy || code.length !== pending.codeLength} className="w-full">
          {busy ? "Đang xác nhận..." : "Xác nhận và vào nhà"}
        </Button>
      </form>

      <p className="tabular mt-6 text-center text-sm text-ink-2">
        {wait > 0 ? (
          <>Gửi lại mã sau {wait} giây</>
        ) : (
          <button type="button" onClick={resend} className="font-semibold text-coral-ink underline">Gửi lại mã</button>
        )}
      </p>
    </div>
  );
}
