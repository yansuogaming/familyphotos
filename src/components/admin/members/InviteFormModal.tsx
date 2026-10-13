"use client";

import { Copy } from "@/components/ui/icons";
import { useState, type FormEvent } from "react";
import { useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import { ErrorNote, Modal, RibbonMark, SelectField, TextField, errorText, formatDate } from "@/components/admin/ui";
import { adminApi } from "@/lib/api/admin";
import type { InviteCode, NewInviteInput } from "@/lib/api/admin-types";
import { roleLabel } from "@/lib/api/types";
import { copyText } from "./shared";

const DAYS = [1, 7, 30];

export function InviteFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: InviteCode) => void }) {
  const [created, setCreated] = useState<InviteCode | null>(null);
  const close = () => {
    setCreated(null);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={created ? "Mã mời đã sẵn sàng" : "Tạo mã mời"}
      description={created ? "Gửi mã này cho người được mời. Họ nhập mã ở trang đăng ký." : "Người có mã tự tạo tài khoản ở trang đăng ký."}
      size="sm"
    >
      {open &&
        (created ? (
          <CreatedCode code={created} onDone={close} />
        ) : (
          <InviteForm
            onClose={close}
            onCreated={(c) => {
              setCreated(c);
              onCreated(c);
            }}
          />
        ))}
    </Modal>
  );
}

type Errors = Partial<Record<"note" | "maxUses", string>>;

function InviteForm({ onClose, onCreated }: { onClose: () => void; onCreated: (c: InviteCode) => void }) {
  const [role, setRole] = useState<NewInviteInput["role"]>("guest");
  const [note, setNote] = useState("");
  const [days, setDays] = useState("7");
  const [uses, setUses] = useState("1");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: Errors = {};
    const n = Number(uses);
    if (!uses.trim() || !Number.isInteger(n) || n < 1 || n > 50) e.maxUses = "Nhập một số từ 1 đến 50.";
    if (note.trim().length > 80) e.note = "Ghi chú tối đa 80 ký tự.";
    setErrors(e);
    setServerError(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      onCreated(await adminApi.invites.create({ role, note: note.trim() || undefined, validDays: Number(days), maxUses: n }));
    } catch (err) {
      setServerError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">Dành cho</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["member", "guest"] as const).map((r) => (
            <label
              key={r}
              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[var(--radius-paper)] border px-3 py-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-coral ${role === r ? "border-coral bg-coral-wash text-coral-ink" : "border-line hover:border-ink-3"}`}
            >
              <input type="radio" name="invite-role" value={r} checked={role === r} onChange={() => setRole(r)} className="size-4 accent-[var(--coral)]" />
              <span className="font-semibold">{roleLabel[r]}</span>
            </label>
          ))}
        </div>
        <p className="text-sm text-ink-3">{role === "guest" ? "Khách chỉ xem album được chia sẻ với họ." : "Người trong nhà xem mọi album và dùng góc học."}</p>
      </fieldset>

      <TextField
        label="Ghi chú"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        error={errors.note}
        hint="Không bắt buộc. Mã này cho ai, để sau còn nhớ."
        placeholder="Cho bà ngoại"
        autoComplete="off"
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Hạn dùng" value={days} onChange={(e) => setDays(e.target.value)}>
          {DAYS.map((d) => (
            <option key={d} value={d}>{d} ngày</option>
          ))}
        </SelectField>
        <TextField
          label="Số lần dùng"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          value={uses}
          onChange={(e) => {
            setUses(e.target.value);
            if (errors.maxUses) setErrors({ ...errors, maxUses: undefined });
          }}
          error={errors.maxUses}
          hint="Từ 1 đến 50 người."
        />
      </div>

      {serverError && <ErrorNote>{serverError}</ErrorNote>}

      <div className="-mx-6 -mb-5 mt-2 flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
        <Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button type="submit" disabled={busy}>{busy ? "Đang tạo..." : "Tạo mã"}</Button>
      </div>
    </form>
  );
}

function CreatedCode({ code, onDone }: { code: InviteCode; onDone: () => void }) {
  const toast = useToast();
  return (
    <div className="flex flex-col gap-5">
      <div className="relative rounded-[var(--radius-paper)] border border-line bg-paper-2 px-5 pb-5 pt-7 text-center">
        <RibbonMark className="absolute left-5 top-0 h-7 w-3.5" />
        <p className="select-all font-mono text-4xl font-bold tracking-[0.12em] tabular-nums text-ink">
          {code.code}
        </p>
        <p className="mt-2 text-sm text-ink-2">
          {roleLabel[code.role]}, dùng được {code.maxUses} lần, hết hạn {formatDate(code.expiresAt)}
        </p>
        {code.note && <p className="mt-1 text-sm text-ink-3">{code.note}</p>}
      </div>
      <div className="-mx-6 -mb-5 flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
        <Button variant="secondary" onClick={onDone}>Xong</Button>
        <Button onClick={() => copyText(code.code, toast)} autoFocus>
          <Copy size={18} aria-hidden="true" /> Sao chép mã
        </Button>
      </div>
    </div>
  );
}
