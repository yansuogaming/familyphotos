"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorNote, Modal, SelectField, TextField, errorText } from "@/components/admin/ui";
import { useUnsavedChanges } from "@/components/admin/unsaved";
import { adminApi } from "@/lib/api/admin";
import type { AdminUser } from "@/lib/api/admin-types";
import { ApiError } from "@/lib/api/core";
import { roleLabel, type Role } from "@/lib/api/types";
import { EMAIL_RE } from "./shared";

const ROLES: Role[] = ["admin", "member", "guest"];
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Add a person (no `user`) or edit one. */
export function UserFormModal({
  open,
  user,
  selfId,
  onClose,
  onSaved,
}: {
  open: boolean;
  user?: AdminUser | null;
  selfId?: string;
  onClose: () => void;
  onSaved: (u: AdminUser, created: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? `Sửa thông tin ${user.name}` : "Thêm người vào nhà"}
      description={user ? undefined : "Người này đăng nhập bằng email bạn nhập. Họ đặt mật khẩu ở lần đầu vào."}
    >
      {open && <UserForm key={user?.id ?? "new"} user={user ?? undefined} isSelf={!!user && user.id === selfId} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

type Errors = Partial<Record<"name" | "nickname" | "email", string>>;

function UserForm({ user, isSelf, onClose, onSaved }: { user?: AdminUser; isSelf: boolean; onClose: () => void; onSaved: (u: AdminUser, created: boolean) => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "member");
  const [grade, setGrade] = useState(user?.grade ? String(user.grade) : "");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = user
    ? name !== user.name || nickname !== (user.nickname ?? "") || role !== user.role || grade !== (user.grade ? String(user.grade) : "")
    : !!(name || nickname || email || grade);
  useUnsavedChanges(dirty);

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = "Nhập tên của người này.";
    else if (name.trim().length > 60) e.name = "Tên dài quá. Tối đa 60 ký tự.";
    if (nickname.trim().length > 30) e.nickname = "Tên gọi tối đa 30 ký tự.";
    if (!user) {
      if (!email.trim()) e.email = "Nhập email để người này đăng nhập.";
      else if (!EMAIL_RE.test(email.trim())) e.email = "Email chưa đúng. Ví dụ: ba.ngoai@gmail.com";
    }
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setServerError(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    const g = role === "member" && grade ? Number(grade) : undefined;
    try {
      const saved = user
        ? await adminApi.users.update(user.id, {
            name: name.trim(),
            nickname: nickname.trim(),
            ...(isSelf ? {} : { role }),
            grade: g ?? null,
          })
        : await adminApi.users.create({ name: name.trim(), nickname: nickname.trim() || undefined, email: email.trim(), role, grade: g });
      onSaved(saved, !user);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ email: err.message });
      else setServerError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <TextField
          label="Họ và tên"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
          autoComplete="off"
          autoFocus
          placeholder="Bà ngoại Thu Cúc"
        />
        <TextField
          label="Tên gọi trong nhà"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            if (errors.nickname) setErrors({ ...errors, nickname: undefined });
          }}
          error={errors.nickname}
          hint="Không bắt buộc. Ví dụ: Bà ngoại"
          autoComplete="off"
        />
      </div>

      {user ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold">Email đăng nhập</p>
          <p className="text-ink-2">{user.email ?? user.phone ?? "Chưa có"}</p>
          <p className="text-sm text-ink-3">Chỉ chính người này đổi được email trong phần Cài đặt.</p>
        </div>
      ) : (
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          error={errors.email}
          autoComplete="off"
          placeholder="ten@gmail.com"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Vai trò"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          disabled={isSelf}
          hint={isSelf ? "Bạn không thể bỏ quyền quản trị của chính mình." : role === "guest" ? "Khách chỉ xem album được chia sẻ." : role === "admin" ? "Quản trị vào được trang này." : "Xem mọi album và dùng góc học."}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{roleLabel[r]}</option>
          ))}
        </SelectField>
        {role === "member" && (
          <SelectField label="Lớp" value={grade} onChange={(e) => setGrade(e.target.value)} hint="Chọn lớp nếu là con cháu đang đi học.">
            <option value="">Không đi học</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>Lớp {g}</option>
            ))}
          </SelectField>
        )}
      </div>

      {serverError && <ErrorNote>{serverError}</ErrorNote>}

      <div className="-mx-6 -mb-5 mt-2 flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button type="submit" disabled={busy}>{busy ? "Đang lưu..." : user ? "Lưu thay đổi" : "Thêm người"}</Button>
      </div>
    </form>
  );
}
