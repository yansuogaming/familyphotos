"use client";

import { ArrowDown, ArrowUp, Check, Microphone, PaperPlaneRight, PencilSimple, Plus, Sparkle, Trash, X } from "@/components/ui/icons";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Section, useToast } from "@/components/settings/shared";
import { Button, IconButton } from "@/components/ui/Button";
import { SwitchRow } from "@/components/ui/Switch";
import { AiKeyForm } from "@/components/ai/AiKeyForm";
import { adminApi } from "@/lib/api/admin";
import { aiApi } from "@/lib/api/ai";
import type { AssistantConfig } from "@/lib/api/admin-types";
import { useApi } from "@/lib/hooks/useApi";
import { SaveBar } from "./SaveBar";
import { PageHeader, TextArea, TextField, errorText, inputClass } from "./ui";
import { useUnsavedChanges } from "./unsaved";

const PROMPT_MAX = 4000;
const SUGGESTION_MAX = 8;
const SUGGESTION_LEN = 80;
const LIMIT_MAX = 500;

type Draft = Omit<AssistantConfig, "kidDailyLimit"> & { kidDailyLimit: string };

const toDraft = (c: AssistantConfig): Draft => ({ ...c, suggestions: [...c.suggestions], kidDailyLimit: String(c.kidDailyLimit) });
const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

function validate(d: Draft) {
  const errors: { systemPrompt?: string; kidDailyLimit?: string } = {};
  if (!d.systemPrompt.trim()) errors.systemPrompt = "Lời nhắc không được để trống.";
  else if (d.systemPrompt.length > PROMPT_MAX) errors.systemPrompt = `Lời nhắc dài quá ${PROMPT_MAX.toLocaleString("vi-VN")} ký tự. Rút gọn bớt rồi lưu.`;
  const n = Number(d.kidDailyLimit);
  if (d.kidDailyLimit.trim() === "" || !Number.isInteger(n) || n < 0 || n > LIMIT_MAX) errors.kidDailyLimit = `Nhập số nguyên từ 0 đến ${LIMIT_MAX}.`;
  return errors;
}

export function AssistantScreen() {
  const config = useApi(() => adminApi.assistant.get(), []);

  return (
    <div>
      <PageHeader
        title="Trợ lý AI"
        description="Cách trợ lý trò chuyện với cả nhà, câu gợi ý ở khung chat và ai được dùng bao nhiêu."
      />
      <div className="mt-8">
        {config.status === "loading" && <FormSkeleton />}
        {config.status === "error" && <LoadError onRetry={config.reload} what="cài đặt trợ lý" />}
        {config.status === "ready" && <AssistantForm key={JSON.stringify(config.data)} initial={config.data} />}
        <SharedKeySection />
      </div>
    </div>
  );
}

/** The family's shared API key. Saved on its own, never part of the draft above. */
function SharedKeySection() {
  const shared = useApi(() => aiApi.shared.get(), []);
  return (
    <Section
      id="api-ai"
      title="Kết nối API AI"
      description="Người trong nhà và quản trị dùng chung khoá này. Khách chỉ dùng được khi bạn bật Khách dùng chung API AI ở trên."
    >
      {shared.status === "loading" && <div className="h-72 max-w-2xl animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />}
      {shared.status === "error" && <LoadError onRetry={shared.reload} what="cấu hình API AI" />}
      {shared.status === "ready" && (
        <AiKeyForm initial={shared.data} onSave={aiApi.shared.save} onTest={aiApi.shared.test} saveLabel="Lưu API chung" />
      )}
    </Section>
  );
}

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <div className="h-6 w-48 animate-pulse rounded bg-paper-3" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-paper-3" />
        <div className="mt-3 h-64 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
      </div>
    </div>
  );
}

function AssistantForm({ initial }: { initial: AssistantConfig }) {
  const toast = useToast();
  const [base, setBase] = useState(() => toDraft(initial));
  const [draft, setDraft] = useState(base);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const limitRef = useRef<HTMLInputElement>(null);

  const dirty = !same(base, draft);
  useUnsavedChanges(dirty);

  const errors = validate(draft);
  const promptError = errors.systemPrompt && (showErrors || draft.systemPrompt.length > PROMPT_MAX) ? errors.systemPrompt : undefined;
  const limitError = showErrors ? errors.kidDailyLimit : undefined;

  const patch = (p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setSaveError(null);
  };

  async function save() {
    if (errors.systemPrompt || errors.kidDailyLimit) {
      setShowErrors(true);
      (errors.systemPrompt ? promptRef : limitRef).current?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await adminApi.assistant.save({
        ...draft,
        systemPrompt: draft.systemPrompt.trim(),
        kidDailyLimit: Number(draft.kidDailyLimit),
      });
      const next = toDraft(saved);
      setBase(next);
      setDraft(next);
      setShowErrors(false);
      setSavedAt(Date.now());
      toast("Đã lưu cài đặt trợ lý");
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

  const count = draft.systemPrompt.length;

  return (
    <div>
      <Section
        id="loi-nhac"
        title="Lời nhắc hệ thống"
        description="Trợ lý đọc đoạn này trước mỗi cuộc trò chuyện. Viết như dặn một người trong nhà: xưng hô thế nào, nói ngắn hay dài, việc gì không làm."
      >
        <TextArea
          ref={promptRef}
          label="Lời nhắc"
          rows={12}
          value={draft.systemPrompt}
          onChange={(e) => patch({ systemPrompt: e.target.value })}
          error={promptError}
          hint="Trẻ em và người lớn dùng chung lời nhắc này. Trợ lý tự biết người đang hỏi là ai."
          aside={
            <span className={`tabular text-sm ${count > PROMPT_MAX ? "font-semibold text-danger" : "text-ink-3"}`}>
              {count.toLocaleString("vi-VN")}/{PROMPT_MAX.toLocaleString("vi-VN")}
            </span>
          }
        />
      </Section>

      <Section
        id="cau-goi-y"
        title="Câu gợi ý"
        description={`Hiện thành nút bấm nhanh khi ai đó mở khung trợ lý. Tối đa ${SUGGESTION_MAX} câu, theo đúng thứ tự dưới đây.`}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <SuggestionEditor items={draft.suggestions} onChange={(suggestions) => patch({ suggestions })} />
          <ChatPreview items={draft.suggestions} />
        </div>
      </Section>

      <Section id="gioi-han" title="Ai được dùng" description="Thành viên người lớn luôn dùng được trợ lý, không giới hạn.">
        <div className="max-w-2xl">
          <div className="border-b border-line">
            <SwitchRow
              checked={draft.guestsAllowed}
              onChange={(guestsAllowed) => patch({ guestsAllowed })}
              label="Khách được dùng trợ lý"
              description="Tắt thì khách không dùng được trợ lý, kể cả khi có API riêng."
            />
            <SwitchRow
              checked={draft.guestsUseSharedKey}
              disabled={!draft.guestsAllowed}
              onChange={(guestsUseSharedKey) => patch({ guestsUseSharedKey })}
              label="Khách dùng chung API AI của nhà"
              description={
                draft.guestsUseSharedKey
                  ? "Khách chưa có API riêng sẽ dùng API chung. Chi phí tính vào tài khoản của nhà."
                  : "Đang tắt: mỗi khách tự thêm API AI của mình trong Cài đặt mới dùng được trợ lý."
              }
            />
          </div>
          <TextField
            ref={limitRef}
            className="mt-5 max-w-xs"
            label="Số câu mỗi ngày cho trẻ em"
            type="number"
            inputMode="numeric"
            min={0}
            max={LIMIT_MAX}
            step={1}
            value={draft.kidDailyLimit}
            onChange={(e) => patch({ kidDailyLimit: e.target.value })}
            error={limitError}
            hint={
              draft.kidDailyLimit.trim() === "0"
                ? "0 là không giới hạn. Các con hỏi bao nhiêu cũng được."
                : `Áp dụng cho thành viên có lớp học. Nhập 0 để không giới hạn, tối đa ${LIMIT_MAX}.`
            }
          />
        </div>
      </Section>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} error={saveError} savedAt={savedAt} />
    </div>
  );
}

function SuggestionEditor({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }) {
  const [text, setText] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ index: number; text: string; error?: string } | null>(null);
  const [announce, setAnnounce] = useState("");
  const addRef = useRef<HTMLInputElement>(null);
  const full = items.length >= SUGGESTION_MAX;

  const problem = (value: string, skip?: number) => {
    const v = value.trim();
    if (!v) return "Nhập câu gợi ý trước đã.";
    if (v.length > SUGGESTION_LEN) return `Tối đa ${SUGGESTION_LEN} ký tự.`;
    if (items.some((s, i) => i !== skip && norm(s) === norm(v))) return "Câu này đã có trong danh sách.";
    return null;
  };

  function add(e: FormEvent) {
    e.preventDefault();
    if (full) return;
    const err = problem(text);
    if (err) {
      setAddError(err);
      addRef.current?.focus();
      return;
    }
    onChange([...items, text.trim().replace(/\s+/g, " ")]);
    setText("");
    setAddError(null);
    setAnnounce(`Đã thêm câu thứ ${items.length + 1}.`);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setEditing(null);
    setAnnounce(`Đã chuyển "${items[i]}" tới vị trí ${j + 1}.`);
  }

  function remove(i: number) {
    onChange(items.filter((_, k) => k !== i));
    setEditing(null);
    setAnnounce(`Đã xoá "${items[i]}".`);
    addRef.current?.focus();
  }

  function commitEdit() {
    if (!editing) return;
    const err = problem(editing.text, editing.index);
    if (err) {
      setEditing({ ...editing, error: err });
      return;
    }
    onChange(items.map((s, k) => (k === editing.index ? editing.text.trim().replace(/\s+/g, " ") : s)));
    setEditing(null);
  }

  function onEditKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(null);
    }
  }

  const edge = "aria-disabled:pointer-events-none aria-disabled:opacity-35";

  return (
    <div className="min-w-0">
      <p className="sr-only" aria-live="polite">{announce}</p>
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-paper)] border border-dashed border-line px-4 py-5 text-ink-2">
          Chưa có câu gợi ý nào. Khung trợ lý sẽ chỉ hiện ô nhập. Thêm một câu ở dưới, ví dụ &quot;Giảng lại bài phân số cho con&quot;.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-[var(--radius-paper)] border border-line">
          {items.map((s, i) =>
            editing?.index === i ? (
              <li key={`edit-${s}`} className="border-b border-line bg-paper-2 px-3 py-2.5 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="tabular w-6 shrink-0 text-center text-sm text-ink-3">{i + 1}</span>
                  <label htmlFor={`sg-edit-${i}`} className="sr-only">Sửa câu gợi ý thứ {i + 1}</label>
                  <input
                    id={`sg-edit-${i}`}
                    autoFocus
                    value={editing.text}
                    maxLength={SUGGESTION_LEN}
                    onChange={(e) => setEditing({ index: i, text: e.target.value })}
                    onKeyDown={onEditKey}
                    aria-invalid={!!editing.error}
                    aria-describedby={editing.error ? `sg-edit-${i}-err` : undefined}
                    className={`${inputClass} min-w-0 flex-1`}
                  />
                  <IconButton label="Lưu câu này" onClick={commitEdit} className="shrink-0 text-ok">
                    <Check size={18} weight="bold" />
                  </IconButton>
                  <IconButton label="Thôi, không sửa" onClick={() => setEditing(null)} className="shrink-0">
                    <X size={18} />
                  </IconButton>
                </div>
                {editing.error && <p id={`sg-edit-${i}-err`} className="mt-1.5 pl-8 text-sm text-danger">{editing.error}</p>}
              </li>
            ) : (
              <li key={s} className="flex items-center gap-2 border-b border-line px-3 py-1.5 last:border-b-0">
                <span className="tabular w-6 shrink-0 text-center text-sm text-ink-3">{i + 1}</span>
                <span className="min-w-0 flex-1 py-1.5 [overflow-wrap:anywhere]">{s}</span>
                <div className="flex shrink-0 items-center">
                  <IconButton label={`Chuyển "${s}" lên`} aria-disabled={i === 0} onClick={() => move(i, -1)} className={edge}>
                    <ArrowUp size={18} />
                  </IconButton>
                  <IconButton label={`Chuyển "${s}" xuống`} aria-disabled={i === items.length - 1} onClick={() => move(i, 1)} className={edge}>
                    <ArrowDown size={18} />
                  </IconButton>
                  <IconButton label={`Sửa "${s}"`} onClick={() => setEditing({ index: i, text: s })}>
                    <PencilSimple size={18} />
                  </IconButton>
                  <IconButton label={`Xoá "${s}"`} onClick={() => remove(i)} className="hover:text-danger">
                    <Trash size={18} />
                  </IconButton>
                </div>
              </li>
            ),
          )}
        </ol>
      )}

      <form onSubmit={add} className="mt-4" noValidate>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="sg-new" className="text-sm font-semibold">Thêm câu gợi ý</label>
          <span className="tabular text-sm text-ink-3">{text.length}/{SUGGESTION_LEN}</span>
        </div>
        <div className="mt-1.5 flex gap-2">
          <input
            id="sg-new"
            ref={addRef}
            value={text}
            maxLength={SUGGESTION_LEN}
            disabled={full}
            onChange={(e) => {
              setText(e.target.value);
              setAddError(null);
            }}
            placeholder={full ? "Đã đủ câu gợi ý" : "Ví dụ: Lên thực đơn bữa tối tuần này"}
            aria-invalid={!!addError}
            aria-describedby="sg-new-note"
            className={`${inputClass} h-11 min-w-0 flex-1 ${addError ? "border-danger" : ""} disabled:opacity-60`}
          />
          <Button type="submit" variant="secondary" disabled={full} className="shrink-0">
            <Plus size={18} /> Thêm
          </Button>
        </div>
        <p id="sg-new-note" className={`mt-1.5 text-sm ${addError ? "text-danger" : "text-ink-3"}`}>
          {addError ??
            (full
              ? `Đã đủ ${SUGGESTION_MAX} câu. Xoá bớt một câu để thêm câu mới.`
              : `Nhấn Enter để thêm. Còn thêm được ${SUGGESTION_MAX - items.length} câu.`)}
        </p>
      </form>
    </div>
  );
}

/** Looks like the empty state of the real assistant panel (components/ai/AssistantChat). View only. */
function ChatPreview({ items }: { items: string[] }) {
  return (
    <figure className="lg:sticky lg:top-6">
      <figcaption className="mb-2 text-sm font-semibold text-ink-2">Xem trước khung trợ lý</figcaption>
      <div aria-hidden="true" className="overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper paper-shadow">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Sparkle size={16} weight="fill" className="text-coral-ink" />
          <span className="font-display font-semibold">Trợ lý</span>
        </div>
        <div className="px-4 pb-5 pt-6">
          <Sparkle size={22} weight="fill" className="text-coral-ink" />
          <p className="mt-2 font-display text-lg font-semibold leading-snug">Hỏi mình bất cứ điều gì.</p>
          <p className="mt-1 text-sm text-ink-2">Giảng bài, dịch câu, lên kế hoạch hay tìm lại ảnh cũ.</p>
        </div>
        <div className="border-t border-line px-3 pb-3 pt-3">
          {items.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {items.map((s) => (
                <span key={s} className="rounded-full border border-line px-3 py-1 text-xs text-ink-2">{s}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 rounded-full border border-line py-1 pl-3 pr-1">
            <span className="min-w-0 flex-1 truncate text-sm text-ink-3">Hỏi bất cứ điều gì...</span>
            <Microphone size={16} className="mx-1.5 text-ink-2" />
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-coral text-on-coral opacity-40">
              <PaperPlaneRight size={14} weight="fill" />
            </span>
          </div>
        </div>
      </div>
      {items.length === 0 && <p className="mt-2 text-sm text-ink-3">Chưa có câu gợi ý nên khung chỉ có ô nhập.</p>}
    </figure>
  );
}

