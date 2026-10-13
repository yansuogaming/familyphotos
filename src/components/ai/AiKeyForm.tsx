"use client";

import { CheckCircle, Eye, EyeSlash, LockKey, Plugs, WarningCircle } from "@phosphor-icons/react";
import { useId, useState, type FormEvent } from "react";
import { formatDateTime } from "@/components/settings/shared";
import { Button, IconButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AI_PROVIDERS, type AiKeyConfig, type AiKeyInput, type AiProviderId, type AiTestResult } from "@/lib/api/ai-types";
import { ApiError } from "@/lib/api/core";

/**
 * Provider, model and API key. Used for the family's shared key (admin) and a guest's own key.
 * The saved key is never shown again: only its masked hint.
 */
export function AiKeyForm({
  initial,
  onSave,
  onTest,
  onRemove,
  saveLabel = "Lưu",
}: {
  initial: AiKeyConfig | null;
  onSave: (input: AiKeyInput) => Promise<AiKeyConfig>;
  onTest: (input: AiKeyInput) => Promise<AiTestResult>;
  onRemove?: () => Promise<void>;
  saveLabel?: string;
}) {
  const id = useId();
  const [saved, setSaved] = useState(initial);
  const [provider, setProvider] = useState<AiProviderId>(initial?.provider ?? "anthropic");
  const [model, setModel] = useState(initial?.model ?? AI_PROVIDERS[0].models[1] ?? "");
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<null | "save" | "test" | "remove">(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const meta = AI_PROVIDERS.find((p) => p.id === provider)!;
  const input = (): AiKeyInput => ({ provider, model, baseUrl: provider === "custom" ? baseUrl : undefined, apiKey: apiKey.trim() || undefined });

  function validate() {
    const next: Record<string, string> = {};
    if (!model.trim()) next.model = "Chọn hoặc nhập tên model.";
    if (provider === "custom" && !/^https:\/\/\S+$/.test(baseUrl.trim())) next.baseUrl = "Nhập địa chỉ bắt đầu bằng https://";
    if (!apiKey.trim() && !saved?.keyHint) next.apiKey = "Nhập API key.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function test() {
    if (!validate()) return;
    setBusy("test");
    setResult(null);
    try {
      const r = await onTest(input());
      setResult({ ok: r.ok, text: r.ok && r.latencyMs ? `${r.message} Phản hồi sau ${r.latencyMs} ms.` : r.message });
    } catch (e) {
      setResult({ ok: false, text: e instanceof ApiError ? e.message : "Chưa kiểm tra được. Thử lại sau." });
    } finally {
      setBusy(null);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy("save");
    setResult(null);
    try {
      const next = await onSave(input());
      setSaved(next);
      setApiKey("");
      setShow(false);
      setResult({ ok: true, text: "Đã lưu. Khoá được mã hoá trên máy chủ." });
    } catch (err) {
      setResult({ ok: false, text: err instanceof ApiError ? err.message : "Chưa lưu được. Thử lại sau." });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!onRemove) return;
    setBusy("remove");
    try {
      await onRemove();
      setSaved(null);
      setApiKey("");
      setResult({ ok: true, text: "Đã xoá khoá." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={save} noValidate className="flex max-w-2xl flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Nhà cung cấp</legend>
        <div className="overflow-hidden rounded-[var(--radius-paper)] border border-line">
          {AI_PROVIDERS.map((p) => {
            const on = p.id === provider;
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 border-b border-line px-4 py-3 last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-coral ${
                  on ? "bg-coral-wash" : "hover:bg-paper-2"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-provider`}
                  checked={on}
                  onChange={() => {
                    setProvider(p.id);
                    if (p.models.length && !p.models.includes(model)) setModel(p.models[1] ?? p.models[0]);
                    setResult(null);
                  }}
                  className="mt-1 size-4 shrink-0 accent-[var(--coral)]"
                />
                <span>
                  <span className={`block font-semibold ${on ? "text-coral-ink" : ""}`}>{p.name}</span>
                  <span className="block text-sm text-ink-2">{p.body}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Model"
          list={`${id}-models`}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          error={errors.model}
          hint={meta.models.length ? "Chọn trong danh sách hoặc gõ tên khác." : "Gõ đúng tên model của nhà cung cấp."}
          autoComplete="off"
        />
        <datalist id={`${id}-models`}>
          {meta.models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        {provider === "custom" && (
          <Field
            label="Địa chỉ máy chủ"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://ai.nha-minh.vn/v1"
            error={errors.baseUrl}
          />
        )}
      </div>

      <Field
        label="API key"
        type={show ? "text" : "password"}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        placeholder={saved?.keyHint ? `Đang dùng ${saved.keyHint}. Để trống nếu giữ nguyên.` : meta.keyHint}
        error={errors.apiKey}
        hint="Khoá được gửi thẳng lên máy chủ và mã hoá. Sau khi lưu, không ai xem lại được toàn bộ khoá."
        trailing={
          <IconButton type="button" label={show ? "Ẩn khoá" : "Hiện khoá"} onClick={() => setShow((v) => !v)}>
            {show ? <EyeSlash size={20} /> : <Eye size={20} />}
          </IconButton>
        }
      />

      {saved?.keyHint && (
        <p className="tabular flex items-center gap-2 text-sm text-ink-2">
          <LockKey size={16} className="shrink-0 text-ink-3" />
          Đã lưu khoá <span className="font-semibold text-ink">{saved.keyHint}</span>
          {saved.updatedAt && <>, cập nhật {formatDateTime(saved.updatedAt)}</>}
        </p>
      )}

      {result && (
        <p role="status" className={`flex items-start gap-2 text-sm ${result.ok ? "text-ok" : "text-danger"}`}>
          {result.ok ? <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" /> : <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />}
          {result.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy !== null}>{busy === "save" ? "Đang lưu..." : saveLabel}</Button>
        <Button type="button" variant="secondary" onClick={test} disabled={busy !== null}>
          <Plugs size={18} /> {busy === "test" ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
        </Button>
        {onRemove && saved?.keyHint && (
          <Button type="button" variant="ghost" onClick={remove} disabled={busy !== null} className="text-danger hover:text-danger">
            {busy === "remove" ? "Đang xoá..." : "Xoá khoá"}
          </Button>
        )}
      </div>
    </form>
  );
}
