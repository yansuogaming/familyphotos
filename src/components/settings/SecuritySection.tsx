"use client";

import { Desktop, DeviceMobile, DeviceTablet, QrCode, SignOut, Morph, icons } from "@/components/ui/icons";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api, ApiError } from "@/lib/api/client";
import type { Device } from "@/lib/api/types";
import { publicConfigApi } from "@/lib/api/public-config";
import { useApi } from "@/lib/hooks/useApi";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Block, formatDateTime, Section, useToast } from "./shared";

const deviceIcon = { desktop: Desktop, phone: DeviceMobile, tablet: DeviceTablet };

function PasswordBlock() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!d.current) next.current = "Nhập mật khẩu đang dùng.";
    if ((d.next ?? "").length < 8) next.next = "Mật khẩu mới cần ít nhất 8 ký tự.";
    else if (d.next === d.current) next.next = "Mật khẩu mới phải khác mật khẩu cũ.";
    if (d.confirm !== d.next) next.confirm = "Hai lần nhập chưa khớp nhau.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await api.account.changePassword(d.current, d.next);
      form.reset();
      setOpen(false);
      toast("Đã đổi mật khẩu");
    } catch (err) {
      setErrors({ current: err instanceof ApiError ? err.message : "Chưa đổi được, thử lại sau." });
    } finally {
      setBusy(false);
    }
  }

  const eye = (
    <IconButton type="button" label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow((s) => !s)}>
      <Morph icon={show ? icons.EyeSlash : icons.Eye} size={20} />
    </IconButton>
  );

  return (
    <Block
      title="Mật khẩu"
      description="Nên đổi nếu bạn từng đăng nhập trên máy của người khác."
      aside={!open && <Button variant="secondary" onClick={() => setOpen(true)}>Đổi mật khẩu</Button>}
    >
      {open && (
        <form onSubmit={onSubmit} noValidate className="flex max-w-md flex-col gap-5">
          <Field label="Mật khẩu hiện tại" name="current" type={show ? "text" : "password"} autoComplete="current-password" error={errors.current} trailing={eye} />
          <Field label="Mật khẩu mới" name="next" type={show ? "text" : "password"} autoComplete="new-password" hint="Ít nhất 8 ký tự." error={errors.next} />
          <Field label="Nhập lại mật khẩu mới" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" error={errors.confirm} />
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>{busy ? "Đang đổi..." : "Lưu mật khẩu"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setErrors({}); }}>Huỷ</Button>
          </div>
        </form>
      )}
    </Block>
  );
}

const noop = () => () => {};

function QrSignInBlock() {
  const isPhone = useMediaQuery("(max-width: 767px)");
  const browserHost = useSyncExternalStore(noop, () => location.host, () => "");
  const config = useApi(publicConfigApi.get);
  // The admin sets the real address (Cài đặt hệ thống > Địa chỉ web); fall back to this browser's host.
  const host = (config.status === "ready" && config.data.siteUrl ? config.data.siteUrl : browserHost).replace(/^https?:\/\//, "").replace(/\/$/, "");
  const [tried, setTried] = useState(false);
  const steps = [
    <>Trên máy tính, mở <span className="font-semibold text-ink">{host}</span>.</>,
    <>Bấm <span className="font-semibold text-ink">Vào nhà</span>, chọn tab <span className="font-semibold text-ink">Mã QR</span>.</>,
    <>Bấm <span className="font-semibold text-ink">Quét mã QR</span> ở đây rồi hướng camera vào mã trên màn hình.</>,
  ];
  return (
    <Block
      id="link-device"
      title="Đăng nhập trên máy tính"
      description="Dùng điện thoại đã đăng nhập để mở cửa cho máy tính, không cần gõ mật khẩu."
      aside={
        <Button variant="secondary" onClick={() => setTried(true)}>
          <QrCode size={18} /> Quét mã QR
        </Button>
      }
    >
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-ink-2">
              <span className="tabular flex size-7 shrink-0 items-center justify-center border border-rule bg-paper font-hand text-lg text-coral-ink">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        {tried && (
          <p role="status" className="mt-3 max-w-[56ch] text-sm text-ink-2">
            {isPhone
              ? "Hãy mở camera của điện thoại hoặc ứng dụng quét mã, rồi hướng vào mã QR trên máy tính."
              : "Bạn đang dùng máy tính. Mở trang Cài đặt này trên điện thoại để quét mã."}
          </p>
        )}
    </Block>
  );
}

function DevicesBlock() {
  const toast = useToast();
  const loaded = useApi(api.account.devices);
  const [revoked, setRevoked] = useState<string[]>([]);
  const devices = loaded.status === "ready" ? loaded.data.filter((d) => !revoked.includes(d.id)) : [];
  const others = devices.filter((d) => !d.current);

  async function revoke(d: Device) {
    await api.account.revokeDevice(d.id);
    setRevoked((r) => [...r, d.id]);
    toast(`Đã đăng xuất ${d.name}`);
  }
  async function revokeAll() {
    await api.account.revokeAllDevices();
    setRevoked((r) => [...r, ...others.map((d) => d.id)]);
    toast("Đã đăng xuất mọi thiết bị khác");
  }

  return (
    <Block
      title="Thiết bị đã đăng nhập"
      description="Mỗi lần đăng nhập trên thiết bị lạ, bạn nhận email báo kèm vị trí gần đúng."
      aside={
        others.length > 0 && (
          <Button variant="secondary" onClick={revokeAll}>
            <SignOut size={18} /> Đăng xuất máy khác
          </Button>
        )
      }
    >
      {loaded.status === "loading" && <div className="h-32 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />}
      <ul className="divide-y divide-line">
        {devices.map((d) => {
          const Icon = deviceIcon[d.kind];
          return (
            <li key={d.id} className="flex items-center gap-4 py-3.5">
              <Icon size={26} className="shrink-0 text-ink-3" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {d.name}
                  {d.current && <span className="rounded-full bg-coral-wash px-2 py-0.5 text-xs font-semibold text-coral-ink">Thiết bị này</span>}
                </p>
                <p className="tabular text-sm text-ink-3">
                  {d.current ? "Đang dùng" : `Lần cuối ${formatDateTime(d.lastActiveAt)}`}, {d.location}
                </p>
              </div>
              {!d.current && (
                <Button variant="ghost" size="sm" onClick={() => revoke(d)}>
                  <SignOut size={16} /> Đăng xuất
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Block>
  );
}

export function SecuritySection() {
  return (
    <Section id="security" title="Bảo mật" description="Mật khẩu, đăng nhập bằng điện thoại và những nơi bạn đang đăng nhập.">
      <div className="divide-y divide-line">
        <PasswordBlock />
        <QrSignInBlock />
        <DevicesBlock />
      </div>
    </Section>
  );
}
