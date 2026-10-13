"use client";

import { Camera, PencilSimple, Trash } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api } from "@/lib/api/client";
import { roleLabel, type User } from "@/lib/api/types";
import { session } from "@/lib/session";
import { Section, useToast } from "./shared";

const dmy = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : undefined);

/** Identity shown as a Vietnamese notebook label: printed labels, handwritten values. */
function NotebookLabel({ user }: { user: User }) {
  const rows: [string, string | undefined][] = [
    ["Họ và tên", user.name],
    ["Tên gọi trong nhà", user.nickname],
    ["Vai trò", roleLabel[user.role]],
    ...(user.grade ? ([["Lớp", String(user.grade)]] as [string, string][]) : []),
    ["Sinh nhật", dmy(user.birthday)],
    ["Email", user.email],
    ["Điện thoại", user.phone],
  ];
  return (
    <dl className="grid gap-x-8 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-3 border-b border-dashed border-rule py-2">
          <dt className="shrink-0 text-sm text-ink-3">{label}:</dt>
          <dd className={`min-w-0 truncate font-hand text-xl leading-7 ${value ? "text-ink" : "text-ink-3"}`}>{value ?? "chưa có"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProfileSection({ user }: { user: User }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);
  const file = useRef<HTMLInputElement>(null);
  const preview = avatar === undefined ? user.avatarUrl : (avatar ?? undefined);

  function pickAvatar(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErrors({ avatar: "Chọn một tệp ảnh (JPG, PNG, WebP)." });
    if (f.size > 5 * 1024 ** 2) return setErrors({ avatar: "Ảnh tối đa 5 MB." });
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setErrors({});
      if (!editing) setEditing(true);
    };
    reader.readAsDataURL(f);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!d.name?.trim()) next.name = "Không để trống họ và tên.";
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) next.email = "Email chưa đúng dạng, ví dụ ten@gmail.com.";
    if (d.phone && !/^[0-9 +]{9,15}$/.test(d.phone)) next.phone = "Số điện thoại chỉ gồm số, 9 đến 15 ký tự.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const updated = await api.account.updateProfile({
      name: d.name.trim(),
      nickname: d.nickname?.trim() || undefined,
      email: d.email?.trim() || undefined,
      phone: d.phone?.trim() || undefined,
      grade: d.grade ? Number(d.grade) : null,
      birthday: d.birthday || null,
      avatar,
    });
    session.updateUser({ ...updated, role: user.role });
    setBusy(false);
    setEditing(false);
    setAvatar(undefined);
    toast("Đã lưu thông tin");
  }

  return (
    <Section id="ho-so" title="Hồ sơ" description="Cả nhà thấy tên, ảnh và tên gọi của bạn. Email và số điện thoại chỉ bạn thấy.">
      <div className="relative rounded-[14px] border-2 border-coral/70 bg-paper p-1.5">
        <div className="oli rounded-[10px] border border-coral/40 p-5 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="relative">
                <Avatar user={{ name: user.name, avatarUrl: preview }} size="lg" className="ring-4 ring-paper" />
                <button
                  type="button"
                  onClick={() => file.current?.click()}
                  aria-label="Đổi ảnh đại diện"
                  title="Đổi ảnh đại diện"
                  className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full border border-line bg-paper text-ink-2 paper-shadow hover:text-ink"
                >
                  <Camera size={18} />
                </button>
                <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pickAvatar(e.target.files?.[0])} />
              </div>
              {preview && editing && (
                <button type="button" onClick={() => setAvatar(null)} className="flex items-center gap-1 text-xs font-semibold text-ink-3 hover:text-danger">
                  <Trash size={14} /> Bỏ ảnh
                </button>
              )}
              {errors.avatar && <p className="max-w-36 text-center text-xs text-danger">{errors.avatar}</p>}
            </div>

            <div className="min-w-0 flex-1">
              {!editing ? (
                <>
                  <NotebookLabel user={user} />
                  <Button variant="secondary" className="mt-6" onClick={() => setEditing(true)}>
                    <PencilSimple size={18} /> Sửa thông tin
                  </Button>
                </>
              ) : (
                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded-[var(--radius-paper)] bg-paper p-1">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Họ và tên" name="name" defaultValue={user.name} autoComplete="name" error={errors.name} />
                    <Field label="Tên gọi trong nhà" name="nickname" defaultValue={user.nickname} placeholder="VD: Bảo, Bà nội" hint="Hiện trong chat của cả nhà." />
                    <Field label="Email" name="email" type="email" defaultValue={user.email} autoComplete="email" error={errors.email} />
                    <Field label="Điện thoại" name="phone" type="tel" defaultValue={user.phone} autoComplete="tel" error={errors.phone} />
                    <Field label="Sinh nhật" name="birthday" type="date" defaultValue={user.birthday} />
                    <div className="flex flex-col gap-2">
                      <label htmlFor="grade" className="text-sm font-semibold">Đang học lớp</label>
                      <select
                        id="grade"
                        name="grade"
                        defaultValue={user.grade ?? ""}
                        className="h-12 rounded-[var(--radius-paper)] border border-line bg-paper px-3 text-base outline-none hover:border-ink-3 focus:border-coral"
                      >
                        <option value="">Không đi học</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>Lớp {i + 1}</option>
                        ))}
                      </select>
                      <p className="text-sm text-ink-3">Góc Học sẽ mở đúng lớp này.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={busy}>{busy ? "Đang lưu..." : "Lưu thay đổi"}</Button>
                    <Button type="button" variant="ghost" onClick={() => { setEditing(false); setAvatar(undefined); setErrors({}); }}>
                      Huỷ
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
