"use client";

import { ShieldCheck, Morph, icons } from "@/components/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CAPTCHA_MISSING, useCaptcha } from "@/components/security/useCaptcha";
import { Button, IconButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api, ApiError } from "@/lib/api/client";
import { session, useSession } from "@/lib/session";
import { AdminCover, WrongAccount } from "./AdminGate";

/** The admin's own door. Family and guests sign in at /login instead. */
export function AdminLoginScreen() {
  const s = useSession();
  const router = useRouter();
  const isAdmin = s?.user.role === "admin";

  useEffect(() => {
    if (isAdmin) router.replace("/admin/dashboard");
  }, [isAdmin, router]);

  return (
    <AdminCover>
      {s && !isAdmin ? <WrongAccount user={s.user} /> : <AdminLoginForm />}
    </AdminCover>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; captcha?: string; form?: string }>({});
  const captcha = useCaptcha("admin-login");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const next: typeof errors = {};
    if (!identifier) next.identifier = "Nhập email quản trị.";
    if (!password) next.password = "Nhập mật khẩu.";
    if (captcha.missing) next.captcha = CAPTCHA_MISSING;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      session.set(await api.auth.adminLogin(identifier, password, captcha.token));
      router.replace("/admin/dashboard");
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : "Không kết nối được. Thử lại sau ít phút." });
      captcha.reset();
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[var(--radius-paper)] bg-paper p-7 text-ink shadow-[0_24px_60px_-20px_oklch(0_0_0/0.6)] sm:p-9">
      <p className="flex items-center gap-2 font-hand text-xl text-coral-ink">
        <ShieldCheck size={22} weight="fill" /> Sổ quản trị
      </p>
      <h1 className="mt-2 text-3xl font-bold">Đăng nhập quản trị</h1>
      <p className="mt-2 text-ink-2">Chỉ dành cho người quản lý nhà. Người trong nhà và khách vào ở trang chính.</p>

      <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-5">
        {errors.form && (
          <p role="alert" className="rounded-[var(--radius-paper)] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
            {errors.form}
          </p>
        )}
        <Field label="Email quản trị" name="identifier" type="email" autoComplete="username" inputMode="email" error={errors.identifier} />
        <Field
          label="Mật khẩu"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          error={errors.password}
          trailing={
            <IconButton type="button" label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow((v) => !v)}>
              <Morph icon={show ? icons.EyeSlash : icons.Eye} size={20} />
            </IconButton>
          }
        />
        {captcha.widget && (
          <div className="flex flex-col gap-2">
            {captcha.widget}
            {errors.captcha && !captcha.token && <p className="text-sm text-danger">{errors.captcha}</p>}
          </div>
        )}
        <Button type="submit" size="lg" disabled={busy} className="mt-2 w-full">
          {busy ? "Đang kiểm tra..." : "Vào trang quản trị"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-2">
        Không phải quản trị?{" "}
        <Link href="/login" className="font-semibold text-coral-ink underline">Về trang đăng nhập chính</Link>
      </p>
    </div>
  );
}
