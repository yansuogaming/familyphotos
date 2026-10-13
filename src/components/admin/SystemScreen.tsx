"use client";

import { CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Section, formatDateTime, useToast } from "@/components/settings/shared";
import { Button, IconButton } from "@/components/ui/Button";
import { SwitchRow } from "@/components/ui/Switch";
import { adminApi } from "@/lib/api/admin";
import type { AuditEntry, SystemSettings } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { SaveBar } from "./SaveBar";
import { EmptyState, PageHeader, RowsSkeleton, SelectField, TextField, errorText, inputClass, selectClass, timeAgo } from "./ui";
import { useUnsavedChanges } from "./unsaved";

const NAME_MAX = 60;
const QUOTA_MIN = 1;
const QUOTA_MAX = 200;
const QR_OPTIONS = [30, 60, 90, 120];
const PAGE_SIZE = 10;

type Draft = Omit<SystemSettings, "quotaPerUserGb"> & { quotaPerUserGb: string };
const toDraft = (s: SystemSettings): Draft => ({ ...s, quotaPerUserGb: String(s.quotaPerUserGb) });
const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

function validate(d: Draft) {
  const errors: { familyName?: string; quotaPerUserGb?: string } = {};
  const name = d.familyName.trim();
  if (!name) errors.familyName = "Nhập tên nhà. Tên này hiện ở trang đăng nhập và đầu mọi trang.";
  else if (name.length > NAME_MAX) errors.familyName = `Tối đa ${NAME_MAX} ký tự.`;
  const q = Number(d.quotaPerUserGb);
  if (d.quotaPerUserGb.trim() === "" || !Number.isInteger(q) || q < QUOTA_MIN || q > QUOTA_MAX)
    errors.quotaPerUserGb = `Nhập số nguyên từ ${QUOTA_MIN} đến ${QUOTA_MAX} GB.`;
  return errors;
}

export function SystemScreen() {
  const settings = useApi(() => adminApi.system.get(), []);
  const audit = useApi(() => adminApi.audit(), []);

  return (
    <div>
      <PageHeader title="Cài đặt hệ thống" description="Tên nhà, dung lượng, cách khách vào nhà và nhật ký mọi thay đổi trong khu quản trị." />
      <div className="mt-8">
        <Section id="cai-dat-chung" title="Cài đặt chung">
          {settings.status === "loading" && <SettingsSkeleton />}
          {settings.status === "error" && <LoadError onRetry={settings.reload} what="cài đặt hệ thống" />}
          {settings.status === "ready" && (
            <SystemForm key={JSON.stringify(settings.data)} initial={settings.data} onSaved={audit.reload} />
          )}
        </Section>

        <Section id="nhat-ky" title="Nhật ký thay đổi" description="Ai đã đổi gì trong khu quản trị, mới nhất ở trên.">
          {audit.status === "loading" && <RowsSkeleton rows={6} cols={3} />}
          {audit.status === "error" && <LoadError onRetry={audit.reload} what="nhật ký" />}
          {audit.status === "ready" && <AuditLog entries={audit.data} />}
        </Section>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="flex max-w-2xl flex-col gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 w-36 animate-pulse rounded bg-paper-3" />
          <div className="h-11 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
        </div>
      ))}
      <div className="h-16 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-44 animate-pulse rounded bg-paper-3" />
        <div className="h-11 w-48 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      </div>
    </div>
  );
}

function SystemForm({ initial, onSaved }: { initial: SystemSettings; onSaved: () => void }) {
  const toast = useToast();
  const [base, setBase] = useState(() => toDraft(initial));
  const [draft, setDraft] = useState(base);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const quotaRef = useRef<HTMLInputElement>(null);

  const dirty = !same(base, draft);
  useUnsavedChanges(dirty);

  const errors = validate(draft);
  const patch = (p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setSaveError(null);
  };

  async function save() {
    if (errors.familyName || errors.quotaPerUserGb) {
      setShowErrors(true);
      (errors.familyName ? nameRef : quotaRef).current?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await adminApi.system.save({
        ...draft,
        familyName: draft.familyName.trim(),
        quotaPerUserGb: Number(draft.quotaPerUserGb),
      });
      const next = toDraft(saved);
      setBase(next);
      setDraft(next);
      setShowErrors(false);
      setSavedAt(Date.now());
      toast("Đã lưu cài đặt hệ thống");
      onSaved();
    } catch (e) {
      setSaveError(errorText(e, "Chưa lưu được. Thử lại sau ít phút."));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDraft(base);
    setShowErrors(false);
    setSaveError(null);
  }

  const qrOptions = QR_OPTIONS.includes(draft.qrTtlSeconds) ? QR_OPTIONS : [...QR_OPTIONS, draft.qrTtlSeconds].sort((a, b) => a - b);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-6">
        <TextField
          ref={nameRef}
          label="Tên nhà"
          value={draft.familyName}
          maxLength={NAME_MAX}
          onChange={(e) => patch({ familyName: e.target.value })}
          error={showErrors ? errors.familyName : undefined}
          hint="Hiện ở trang đăng nhập và trên thanh đầu trang."
          aside={<span className="tabular text-sm text-ink-3">{draft.familyName.length}/{NAME_MAX}</span>}
        />
        <TextField
          ref={quotaRef}
          className="max-w-xs"
          label="Dung lượng tối đa mỗi người (GB)"
          type="number"
          inputMode="numeric"
          min={QUOTA_MIN}
          max={QUOTA_MAX}
          step={1}
          value={draft.quotaPerUserGb}
          onChange={(e) => patch({ quotaPerUserGb: e.target.value })}
          error={showErrors ? errors.quotaPerUserGb : undefined}
          hint={`Từ ${QUOTA_MIN} đến ${QUOTA_MAX} GB. Ảnh, video và tệp mỗi người tải lên đều tính vào đây.`}
        />
      </div>

      <div className="mt-4 border-y border-line">
        <SwitchRow
          checked={draft.allowGuestSelfSignup}
          onChange={(allowGuestSelfSignup) => patch({ allowGuestSelfSignup })}
          label="Cho phép khách tự đăng ký"
          description={
            draft.allowGuestSelfSignup
              ? "Khách tự tạo tài khoản rồi chờ bạn duyệt ở trang Thành viên."
              : "Đang tắt: khách chỉ vào được bằng mã mời do bạn tạo."
          }
        />
      </div>

      <SelectField
        className="mt-6 max-w-xs"
        label="Thời hạn mã QR đăng nhập"
        value={draft.qrTtlSeconds}
        onChange={(e) => patch({ qrTtlSeconds: Number(e.target.value) })}
        hint="Hết hạn thì mã tự đổi. Ngắn hơn thì an toàn hơn."
      >
        {qrOptions.map((s) => (
          <option key={s} value={s}>{s} giây</option>
        ))}
      </SelectField>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} error={saveError} savedAt={savedAt} />
    </div>
  );
}

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

function AuditLog({ entries }: { entries: AuditEntry[] }) {
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState("");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => [...entries].sort((a, b) => b.at.localeCompare(a.at)), [entries]);
  const actors = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of sorted) m.set(e.actor.id, e.actor.name);
    return [...m].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  }, [sorted]);

  const q = fold(query.trim());
  const filtered = sorted.filter(
    (e) => (!actor || e.actor.id === actor) && (!q || fold(`${e.action} ${e.target} ${e.actor.name}`).includes(q)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const filtering = !!q || !!actor;

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Chưa có thay đổi nào"
        body="Mỗi lần ai đó duyệt khách, tạo mã mời, sửa nội dung hay đổi cài đặt, một dòng sẽ hiện ở đây."
      />
    );
  }

  const clear = () => {
    setQuery("");
    setActor("");
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <MagnifyingGlass size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <label htmlFor="audit-q" className="sr-only">Tìm trong nhật ký</label>
          <input
            id="audit-q"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm hành động, đối tượng..."
            autoComplete="off"
            className={`${inputClass} pl-9`}
          />
        </div>
        <label htmlFor="audit-actor" className="sr-only">Lọc theo người làm</label>
        <select
          id="audit-actor"
          value={actor}
          onChange={(e) => {
            setActor(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">Mọi người</option>
          {actors.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        {filtering && (
          <Button variant="ghost" size="sm" onClick={clear} className="h-10">Xoá bộ lọc</Button>
        )}
        <p aria-live="polite" className="tabular ml-auto text-sm text-ink-3">
          {filtering ? `${filtered.length} trong ${sorted.length} dòng` : `${sorted.length} dòng`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-[var(--radius-paper)] border border-dashed border-line px-5 py-8 text-center">
          <p className="font-semibold">Không có dòng nào khớp</p>
          <p className="mt-1 text-sm text-ink-2">Thử từ khoá khác hoặc chọn &quot;Mọi người&quot;.</p>
          <Button variant="secondary" size="sm" onClick={clear} className="mt-4 h-10">Xoá bộ lọc</Button>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-[var(--radius-paper)] border border-line md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Nhật ký thay đổi, trang {current} trên {pages}</caption>
              <thead className="bg-paper-2 text-ink-2">
                <tr>
                  <th scope="col" className="w-48 px-4 py-3 font-semibold">Thời gian</th>
                  <th scope="col" className="w-44 px-4 py-3 font-semibold">Người làm</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Hành động</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Đối tượng</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <time dateTime={e.at} className="tabular block text-ink">{formatDateTime(e.at)}</time>
                      <span className="text-xs text-ink-3">{timeAgo(e.at)}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{e.actor.name}</td>
                    <td className="px-4 py-3">{e.action}</td>
                    <td className="px-4 py-3 text-ink-2 [overflow-wrap:anywhere]">{e.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 overflow-hidden rounded-[var(--radius-paper)] border border-line md:hidden">
            {rows.map((e) => (
              <li key={e.id} className="border-b border-line px-4 py-3 last:border-b-0">
                <p>
                  <span className="font-semibold">{e.actor.name}</span> <span className="text-ink-2">{e.action.toLocaleLowerCase("vi")}</span>
                </p>
                <p className="mt-0.5 text-ink [overflow-wrap:anywhere]">{e.target}</p>
                <p className="mt-1 text-xs text-ink-3">
                  <time dateTime={e.at} className="tabular">{formatDateTime(e.at)}</time> · {timeAgo(e.at)}
                </p>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <nav aria-label="Phân trang nhật ký" className="mt-4 flex items-center justify-between gap-4">
              <p className="tabular text-sm text-ink-3">
                {start + 1}-{start + rows.length} trong {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <IconButton label="Trang trước" onClick={() => setPage(current - 1)} disabled={current === 1} className="disabled:opacity-35">
                  <CaretLeft size={18} />
                </IconButton>
                <span className="tabular min-w-20 text-center text-sm font-semibold">
                  Trang {current}/{pages}
                </span>
                <IconButton label="Trang sau" onClick={() => setPage(current + 1)} disabled={current === pages} className="disabled:opacity-35">
                  <CaretRight size={18} />
                </IconButton>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
