"use client";

import { ArrowLeft, HouseLine, UserCirclePlus } from "@/components/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CAPTCHA_MISSING, useCaptcha } from "@/components/security/useCaptcha";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api } from "@/lib/api/client";
import { session } from "@/lib/session";
import { useSiteContent } from "@/lib/api/site";
import { publicConfigApi } from "@/lib/api/public-config";
import { useApi } from "@/lib/hooks/useApi";
import type { Role } from "@/lib/api/types";

export function RegisterFlow() {
  const [role, setRole] = useState<Exclude<Role, "admin"> | null>(null);
  const [done, setDone] = useState(false);
  const copy = useSiteContent().register;
  const config = useApi(publicConfigApi.get);
  const guestClosed = config.status === "ready" && !config.data.allowGuestSelfSignup;

  if (done) {
    return (
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold">{copy.sentTitle}</h1>
        <p className="mt-3 text-ink-2">
          {copy.sentBody}
        </p>
        <Link href="/login" className="mt-8 inline-block font-semibold text-coral-ink underline">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-ink-2">{copy.lead}</p>
        <div className="mt-8 flex flex-col gap-3">
          {([
            ["member", copy.member.title, copy.member.body, HouseLine],
            ["guest", copy.guest.title, copy.guest.body, UserCirclePlus],
          ] as const).map(([key, title, desc, Icon]) => {
            const closed = key === "guest" && guestClosed;
            return (
            <button
              key={key}
              disabled={closed}
              onClick={() => setRole(key)}
              className="group flex items-start gap-4 rounded-[var(--radius-paper)] border border-line bg-paper p-5 text-left transition-[border-color,background-color] enabled:hover:border-coral enabled:hover:bg-coral-wash disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon size={28} className="mt-0.5 shrink-0 text-coral-ink" />
              <span>
                <span className="block font-display text-xl font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-ink-2">
                  {closed ? "Nhà đang tạm đóng đăng ký khách. Nhờ người trong nhà mời bạn vào." : desc}
                </span>
              </span>
            </button>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-ink-2">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-coral-ink underline">Quay lại đăng nhập</Link>
        </p>
      </div>
    );
  }

  return <RegisterForm role={role} onBack={() => setRole(null)} onGuestDone={() => setDone(true)} />;
}

function RegisterForm({ role, onBack, onGuestDone }: { role: Exclude<Role, "admin">; onBack: () => void; onGuestDone: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const captcha = useCaptcha("register");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!d.name?.trim()) next.name = "Cho cả nhà biết tên bạn.";
    if (!d.identifier?.trim()) next.identifier = "Nhập email hoặc số điện thoại.";
    if ((d.password ?? "").length < 8) next.password = "Mật khẩu cần ít nhất 8 ký tự.";
    if (role === "member" && !d.inviteCode?.trim()) next.inviteCode = "Xin mã mời từ bố, mẹ hoặc người tạo nhà.";
    if (captcha.missing) next.captcha = CAPTCHA_MISSING;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const s = await api.auth.register({ name: d.name, identifier: d.identifier, password: d.password, role, inviteCode: d.inviteCode, captchaToken: captcha.token }).catch((err: unknown) => {
      setErrors({ form: err instanceof Error ? err.message : "Chưa gửi được. Thử lại sau ít phút." });
      captcha.reset();
      setBusy(false);
      return null;
    });
    if (!s) return;
    if (role === "guest") return onGuestDone();
    session.set({ ...s, user: { ...s.user, email: d.identifier } });
    router.push("/photos");
  }

  return (
    <div className="w-full max-w-md">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Chọn lại
      </button>
      <h1 className="text-4xl font-bold">{role === "member" ? "Người trong nhà" : "Đăng ký làm khách"}</h1>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        {role === "member" && (
          <Field label="Mã mời" name="inviteCode" autoComplete="off" placeholder="VD: NHA-4821" hint="Có trong mục Cài đặt > Mời người nhà." error={errors.inviteCode} />
        )}
        <Field label="Tên gọi trong nhà" name="name" autoComplete="nickname" placeholder="VD: Bà nội, Khánh Na" error={errors.name} />
        <Field label="Email hoặc số điện thoại" name="identifier" autoComplete="username" error={errors.identifier} />
        <Field label="Mật khẩu" name="password" type="password" autoComplete="new-password" hint="Ít nhất 8 ký tự." error={errors.password} />
        {captcha.widget && (
          <div className="flex flex-col gap-2">
            {captcha.widget}
            {errors.captcha && !captcha.token && <p className="text-sm text-danger">{errors.captcha}</p>}
          </div>
        )}
        {errors.form && (
          <p role="alert" className="rounded-[var(--radius-paper)] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">{errors.form}</p>
        )}
        <Button type="submit" size="lg" disabled={busy} className="mt-2 w-full">
          {busy ? "Đang gửi..." : role === "member" ? "Vào nhà" : "Gửi lời xin vào"}
        </Button>
      </form>
    </div>
  );
}
