"use client";

import { Eye, EyeSlash, QrCode, Password } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SiteText } from "@/components/admin/site/SiteSlots";
import { CAPTCHA_MISSING, useCaptcha } from "@/components/security/useCaptcha";
import { Button, IconButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { QrLogin } from "@/components/ui/QrLogin";
import { api, ApiError } from "@/lib/api/client";
import { session } from "@/lib/session";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

type Tab = "qr" | "password";

export function LoginPanel() {
  const [chosen, setTab] = useState<Tab | null>(null);
  // Phones can't scan their own screen: start them on the password form.
  const isPhone = useMediaQuery("(max-width: 767px)");
  const tab = chosen ?? (isPhone ? "password" : "qr");

  return (
    <div className="w-full max-w-md">
      <h1 className="text-4xl font-bold"><SiteText k="login.greetingTitle" /></h1>
      <p className="mt-2 text-ink-2"><SiteText k="login.greeting" /></p>

      <div role="tablist" aria-label="Cách đăng nhập" className="mt-8 grid grid-cols-2 rounded-full border border-line bg-paper-2 p-1">
        {([
          ["qr", "Mã QR", QrCode],
          ["password", "Mật khẩu", Password],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors ${
              tab === key ? "bg-paper text-ink shadow-[0_1px_3px_hsl(var(--shadow)/0.15)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-8" role="tabpanel">
        {tab === "qr" ? (
          <div className="flex flex-col items-center gap-6 rounded-[var(--radius-paper)] border border-line bg-paper-2 px-6 py-8">
            <QrLogin />
          </div>
        ) : (
          <PasswordForm />
        )}
      </div>

      <p className="mt-8 text-center text-sm text-ink-2">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className="font-semibold text-coral-ink underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}

function PasswordForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; captcha?: string; form?: string }>({});
  const captcha = useCaptcha("login");
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const next: typeof errors = {};
    if (!identifier) next.identifier = "Nhập email hoặc số điện thoại.";
    if (!password) next.password = "Nhập mật khẩu.";
    if (captcha.missing) next.captcha = CAPTCHA_MISSING;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      session.set(await api.auth.login(identifier, password, captcha.token));
      router.push("/anh");
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : "Không kết nối được. Thử lại sau ít phút." });
      captcha.reset();
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {errors.form && (
        <p role="alert" className="rounded-[var(--radius-paper)] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
          {errors.form}
        </p>
      )}
      <Field label="Email hoặc số điện thoại" name="identifier" autoComplete="username" inputMode="email" error={errors.identifier} />
      <Field
        label="Mật khẩu"
        name="password"
        type={show ? "text" : "password"}
        autoComplete="current-password"
        error={errors.password}
        trailing={
          <IconButton type="button" label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow((s) => !s)}>
            {show ? <EyeSlash size={20} /> : <Eye size={20} />}
          </IconButton>
        }
      />
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-ink-2">
          <input type="checkbox" name="remember" defaultChecked className="size-4 accent-[var(--coral)]" />
          Nhớ máy này
        </label>
        <Link href="/dang-nhap" className="font-semibold text-ink-2 underline hover:text-ink">
          Quên mật khẩu?
        </Link>
      </div>
      {captcha.widget && (
        <div className="flex flex-col gap-2">
          {captcha.widget}
          {errors.captcha && !captcha.token && <p className="text-sm text-danger">{errors.captcha}</p>}
        </div>
      )}
      <Button type="submit" size="lg" disabled={busy} className="mt-2 w-full">
        {busy ? "Đang mở cửa..." : "Vào nhà"}
      </Button>
    </form>
  );
}
