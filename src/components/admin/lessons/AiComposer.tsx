"use client";

import { ArrowClockwise, Check, CheckSquare, Minus, PencilSimple, Plus, Sparkle, Trash, WarningCircle } from "@/components/ui/icons";
import Link from "next/link";
import { useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { RichText } from "@/components/learn/Math";
import { useToast } from "@/components/settings/shared";
import { Button, IconButton, buttonClass } from "@/components/ui/Button";
import { aiApi } from "@/lib/api/ai";
import { lessonAiApi } from "@/lib/api/lesson-ai";
import {
  DIFFICULTY_LABELS,
  LESSON_AI_KINDS,
  type ExampleBlock,
  type LessonAiContext,
  type LessonAiDifficulty,
  type LessonAiKind,
  type LessonAiRequest,
  type LessonAiResult,
  type MistakeBlock,
  type OutlineDraftTopic,
  type WarmupBlock,
} from "@/lib/api/lesson-ai-types";
import type { QuizQuestion } from "@/lib/api/lesson-types";
import { useApi } from "@/lib/hooks/useApi";
import { ErrorNote, Modal, TextArea, TextField, errorText, inputClass } from "../ui";
import { uid } from "./model";

/** What the open lesson editor offers the composer. */
export interface EditorBridge {
  /** Adds the drafts to the lesson as "Nháp AI" and returns a short confirmation. */
  insert: (result: LessonAiResult) => string;
  /** Texts already in the lesson, so the AI does not repeat them. */
  avoid: (kind: LessonAiKind) => string[];
}

type Item =
  | { kind: "quiz"; value: QuizQuestion }
  | { kind: "outcomes"; value: string }
  | { kind: "examples"; value: ExampleBlock }
  | { kind: "mistakes"; value: MistakeBlock }
  | { kind: "warmup"; value: WarmupBlock }
  | { kind: "outline"; value: OutlineDraftTopic };

interface Card {
  key: string;
  item: Item;
  on: boolean;
  busy: boolean;
  editing: boolean;
}

function itemsOf(r: LessonAiResult): Item[] {
  switch (r.kind) {
    case "quiz":
      return r.items.map((value) => ({ kind: "quiz", value }));
    case "outcomes":
      return r.items.map((value) => ({ kind: "outcomes", value }));
    case "examples":
      return r.items.map((value) => ({ kind: "examples", value }));
    case "mistakes":
      return r.items.map((value) => ({ kind: "mistakes", value }));
    case "warmup":
      return r.items.map((value) => ({ kind: "warmup", value }));
    case "outline":
      return r.topics.map((value) => ({ kind: "outline", value }));
  }
}

function resultOf(kind: LessonAiKind, items: Item[]): LessonAiResult {
  switch (kind) {
    case "quiz":
      return { kind, items: items.flatMap((i) => (i.kind === "quiz" ? [i.value] : [])) };
    case "outcomes":
      return { kind, items: items.flatMap((i) => (i.kind === "outcomes" ? [i.value] : [])) };
    case "examples":
      return { kind, items: items.flatMap((i) => (i.kind === "examples" ? [i.value] : [])) };
    case "mistakes":
      return { kind, items: items.flatMap((i) => (i.kind === "mistakes" ? [i.value] : [])) };
    case "warmup":
      return { kind, items: items.flatMap((i) => (i.kind === "warmup" ? [i.value] : [])) };
    case "outline":
      return { kind, topics: items.flatMap((i) => (i.kind === "outline" ? [i.value] : [])) };
  }
}

/** The one text that names a draft, sent back as "avoid" so a retry brings something new. */
function keyText(i: Item) {
  switch (i.kind) {
    case "quiz":
      return i.value.prompt;
    case "outcomes":
      return i.value;
    case "examples":
      return i.value.title;
    case "mistakes":
      return i.value.wrong;
    case "warmup":
      return i.value.prompt;
    case "outline":
      return i.value.title;
  }
}

const lessonKinds = LESSON_AI_KINDS.filter((k) => k.id !== "outline");
const kindInfo = (k: LessonAiKind) => LESSON_AI_KINDS.find((x) => x.id === k)!;
const defaultCount: Record<LessonAiKind, number> = { quiz: 5, outcomes: 4, examples: 2, mistakes: 3, warmup: 2, outline: 5 };

export function AiComposer({
  open,
  onClose,
  initialKind,
  context,
  lessonOpen,
  bridgeRef,
  existingTopics,
  onAddOutline,
}: {
  open: boolean;
  onClose: () => void;
  initialKind: LessonAiKind;
  context: LessonAiContext;
  lessonOpen: boolean;
  bridgeRef: RefObject<EditorBridge | null>;
  existingTopics: string[];
  onAddOutline: (topics: OutlineDraftTopic[]) => Promise<string>;
}) {
  const where = context.lessonTitle ? `Lớp ${context.grade}, ${context.subjectName}. Bài: ${context.lessonTitle}` : `Lớp ${context.grade}, ${context.subjectName}`;
  return (
    <Modal open={open} onClose={onClose} title="Soạn bằng AI" description={where} size="xl">
      {open && (
        <ComposerBody
          onClose={onClose}
          initialKind={!lessonOpen && initialKind !== "outline" ? "outline" : initialKind}
          context={context}
          lessonOpen={lessonOpen}
          bridgeRef={bridgeRef}
          existingTopics={existingTopics}
          onAddOutline={onAddOutline}
        />
      )}
    </Modal>
  );
}

type Phase = { name: "idle" } | { name: "loading"; count: number } | { name: "error"; message: string } | { name: "ready" };

function ComposerBody({
  onClose,
  initialKind,
  context,
  lessonOpen,
  bridgeRef,
  existingTopics,
  onAddOutline,
}: {
  onClose: () => void;
  initialKind: LessonAiKind;
  context: LessonAiContext;
  lessonOpen: boolean;
  bridgeRef: RefObject<EditorBridge | null>;
  existingTopics: string[];
  onAddOutline: (topics: OutlineDraftTopic[]) => Promise<string>;
}) {
  const toast = useToast();
  const access = useApi(aiApi.access);
  const [kind, setKind] = useState<LessonAiKind>(initialKind);
  const [count, setCount] = useState(defaultCount[initialKind]);
  const [difficulty, setDifficulty] = useState<LessonAiDifficulty>("medium");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [cards, setCards] = useState<Card[]>([]);
  const [resultKind, setResultKind] = useState<LessonAiKind>(initialKind);
  const [adding, setAdding] = useState(false);
  const lastReq = useRef<LessonAiRequest | null>(null);
  const run = useRef(0);
  const formId = useId();
  const results = useRef<HTMLElement>(null);

  const blocked = access.status === "ready" && access.data.mode === "none";
  const ready = access.status === "ready" && !blocked;
  const chosen = cards.filter((c) => c.on && !c.busy);
  const ctx: LessonAiContext =
    kind === "outline" ? { grade: context.grade, subjectId: context.subjectId, subjectName: context.subjectName } : context;

  const avoidFor = (k: LessonAiKind, extra: string[] = []) => [...(k === "outline" ? existingTopics : (bridgeRef.current?.avoid(k) ?? [])), ...extra];

  async function generate() {
    if (!ready || phase.name === "loading") return;
    const n = Math.min(10, Math.max(1, Math.round(count) || 1));
    const req: LessonAiRequest = { kind, count: n, difficulty, notes: notes.trim() || undefined, context: ctx, avoid: avoidFor(kind) };
    lastReq.current = req;
    const mine = ++run.current;
    setPhase({ name: "loading", count: n });
    try {
      const res = await lessonAiApi.generate(req);
      if (mine !== run.current) return;
      setResultKind(res.kind);
      setCards(itemsOf(res).map((item) => ({ key: uid("c"), item, on: true, busy: false, editing: false })));
      setPhase({ name: "ready" });
      // Phones: the drafts sit under the form, bring them into view.
      if (matchMedia("(max-width: 767.98px)").matches) requestAnimationFrame(() => results.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    } catch (e) {
      if (mine !== run.current) return;
      const message = errorText(e, "AI chưa trả lời được. Thử lại sau ít phút.");
      setPhase({ name: "error", message });
      toast.error(message);
    }
  }

  async function regenerateOne(key: string) {
    const req = lastReq.current;
    if (!req) return;
    setCards((cs) => cs.map((c) => (c.key === key ? { ...c, busy: true, editing: false } : c)));
    try {
      const res = await lessonAiApi.generate({ ...req, count: 1, avoid: avoidFor(req.kind, cards.map((c) => keyText(c.item))) });
      const [item] = itemsOf(res);
      setCards((cs) => cs.map((c) => (c.key === key ? (item ? { ...c, item, busy: false } : { ...c, busy: false }) : c)));
      if (!item) toast.info("AI không còn gợi ý nào mới cho mục này.");
    } catch (e) {
      setCards((cs) => cs.map((c) => (c.key === key ? { ...c, busy: false } : c)));
      toast.error(errorText(e, "Chưa tạo lại được. Thử lại sau ít phút."));
    }
  }

  async function add() {
    if (!chosen.length || adding) return;
    const result = tidyResult(resultOf(resultKind, chosen.map((c) => c.item)));
    if (result.kind === "outline") {
      setAdding(true);
      const p = onAddOutline(result.topics);
      toast.promise(p, { loading: "Đang thêm vào mục lục...", success: (m: string) => m, error: (e: unknown) => errorText(e, "Chưa thêm được vào mục lục.") });
      try {
        await p;
        onClose();
      } catch {
        setAdding(false);
      }
      return;
    }
    const b = bridgeRef.current;
    if (!b) {
      toast.error("Mở một bài trước khi thêm nội dung.");
      return;
    }
    toast.success(b.insert(result));
    onClose();
  }

  const unit = kindInfo(kind).unit;
  const allOn = cards.length > 0 && cards.every((c) => c.on);
  const someOn = cards.some((c) => c.on);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-[17rem_minmax(0,1fr)]">
        {/* ---------------------------------------------------- the request */}
        <form
          id={formId}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
          className="flex flex-col gap-5"
        >
          <fieldset>
            <legend className="text-sm font-semibold">Tạo gì</legend>
            <div className="mt-2 flex flex-col gap-1">
              {[...lessonKinds, kindInfo("outline")].map((k) => {
                const off = k.id !== "outline" && !lessonOpen;
                const on = kind === k.id;
                return (
                  <label
                    key={k.id}
                    className={`flex min-h-12 items-start gap-3 rounded-[var(--radius-paper)] border px-3 py-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-coral ${
                      off ? "cursor-not-allowed border-transparent opacity-50" : on ? "cursor-pointer border-coral bg-coral-wash" : "cursor-pointer border-transparent hover:bg-paper-2"
                    } ${k.id === "outline" ? "mt-2" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`${formId}-kind`}
                      checked={on}
                      disabled={off}
                      onChange={() => {
                        setKind(k.id);
                        setCount(defaultCount[k.id]);
                      }}
                      className="mt-1 size-4 shrink-0 accent-[var(--coral)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{k.label}</span>
                      <span className="block text-xs text-ink-3">{off ? "Mở một bài ở mục lục trước." : k.body}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4">
            <Stepper label={`Số ${unit}`} value={count} onChange={setCount} />
            {kind !== "outline" && <Segmented label="Độ khó" value={difficulty} onChange={setDifficulty} />}
          </div>

          <TextArea
            label="Ghi chú cho AI"
            rows={3}
            maxLength={600}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={kind === "outline" ? "Ví dụ: theo sách Kết nối tri thức, mỗi chủ đề 3 đến 4 bài." : "Ví dụ: dùng tình huống đi chợ, tiền tiêu vặt. Số nhỏ, dễ tính nhẩm."}
            aside={<span className="text-xs text-ink-3">Không bắt buộc</span>}
          />

          <div>
            <p className="text-sm font-semibold">AI sẽ biết</p>
            <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
              <dt className="text-ink-3">Lớp</dt>
              <dd>{ctx.grade}</dd>
              <dt className="text-ink-3">Môn</dt>
              <dd>{ctx.subjectName}</dd>
              {ctx.topicTitle && (
                <>
                  <dt className="text-ink-3">Chủ đề</dt>
                  <dd className="min-w-0">
                    <RichText text={ctx.topicTitle} />
                  </dd>
                </>
              )}
              {ctx.lessonTitle && (
                <>
                  <dt className="text-ink-3">Bài</dt>
                  <dd className="min-w-0">
                    <RichText text={ctx.lessonTitle} />
                  </dd>
                </>
              )}
            </dl>
          </div>

          <Button type="submit" disabled={!ready || phase.name === "loading"} className="w-full">
            <Sparkle size={18} /> {phase.name === "loading" ? "Đang tạo..." : cards.length ? "Tạo bản mới" : "Tạo"}
          </Button>
        </form>

        {/* ----------------------------------------------------- the drafts */}
        <section ref={results} aria-label="Bản nháp" aria-busy={phase.name === "loading"} className="min-w-0">
          {access.status === "loading" ? (
            <div className="h-24 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
          ) : access.status === "error" ? (
            <ErrorNote>Chưa kiểm tra được AI có dùng được không. Đóng hộp này rồi thử lại.</ErrorNote>
          ) : blocked ? (
            <div className="oli oli-margin rounded-[var(--radius-paper)] border border-line py-8 pl-20 pr-6">
              <p className="flex items-center gap-2 font-display text-lg font-semibold">
                <WarningCircle size={20} className="text-danger" /> AI chưa dùng được
              </p>
              <p className="mt-1.5 max-w-[48ch] text-ink-2">{access.data.reason ?? "Nhà chưa cấu hình API AI chung."}</p>
              <Link href="/admin/assistant#api-ai" className={buttonClass("secondary", "md", "mt-5")}>
                Mở cài đặt API AI
              </Link>
            </div>
          ) : phase.name === "loading" ? (
            <ul className="flex flex-col gap-3" aria-label="Đang tạo bản nháp">
              {Array.from({ length: phase.count }, (_, i) => (
                <CardSkeleton key={i} kind={kind} />
              ))}
            </ul>
          ) : phase.name === "error" ? (
            <div className="flex flex-col items-start gap-3">
              <ErrorNote>{phase.message}</ErrorNote>
              <Button variant="secondary" onClick={() => void generate()}>
                <ArrowClockwise size={18} /> Thử lại
              </Button>
            </div>
          ) : phase.name === "idle" ? (
            <div className="oli oli-margin rounded-[var(--radius-paper)] border border-line py-10 pl-20 pr-6">
              <p className="font-display text-lg font-semibold">Bản nháp sẽ hiện ở đây</p>
              <p className="mt-1.5 max-w-[48ch] text-ink-2">
                Chọn loại nội dung bên trái rồi bấm Tạo. Bạn đọc lại, sửa nhanh, bỏ chọn những gì không hợp, rồi mới thêm vào {kind === "outline" ? "mục lục" : "bài"}.
              </p>
            </div>
          ) : cards.length === 0 ? (
            <div className="oli oli-margin rounded-[var(--radius-paper)] border border-line py-10 pl-20 pr-6">
              <p className="font-display text-lg font-semibold">Không có gợi ý mới</p>
              <p className="mt-1.5 max-w-[48ch] text-ink-2">
                {resultKind === "outline" ? "Mục lục đã có các chủ đề AI định gợi ý. Thử thêm ghi chú, ví dụ một chuyên đề ôn tập." : "Thử đổi độ khó hoặc thêm ghi chú cho AI."}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={allOn}
                    ref={(el) => {
                      if (el) el.indeterminate = someOn && !allOn;
                    }}
                    onChange={() => setCards((cs) => cs.map((c) => ({ ...c, on: !allOn })))}
                    className="size-4 accent-[var(--coral)]"
                  />
                  Đã chọn {chosen.length}/{cards.length} {kindInfo(resultKind).unit}
                </label>
                <Button variant="ghost" size="sm" className="!h-10" onClick={() => void generate()} disabled={!ready}>
                  <ArrowClockwise size={16} /> Tạo lại tất cả
                </Button>
              </div>
              <ul className="mt-3 flex flex-col gap-3">
                {cards.map((c, i) => (
                  <DraftCard
                    key={c.key}
                    card={c}
                    n={i + 1}
                    onToggle={() => setCards((cs) => cs.map((x) => (x.key === c.key ? { ...x, on: !x.on } : x)))}
                    onEdit={(editing) => setCards((cs) => cs.map((x) => (x.key === c.key ? { ...x, editing } : x)))}
                    onChange={(item) => setCards((cs) => cs.map((x) => (x.key === c.key ? { ...x, item } : x)))}
                    onRegenerate={() => void regenerateOne(c.key)}
                  />
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="-mx-6 -mb-5 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper px-6 py-4 sticky bottom-[-1.25rem] z-10">
        <p className="mr-auto text-sm text-ink-3 max-sm:hidden">{resultKind === "outline" ? "Chủ đề và bài được thêm ngay vào mục lục." : "Mục thêm vào bài mang nhãn Nháp AI cho tới khi bạn duyệt."}</p>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        <Button onClick={() => void add()} disabled={phase.name !== "ready" || chosen.length === 0 || adding}>
          <Check size={18} />
          {adding ? "Đang thêm..." : resultKind === "outline" ? `Thêm ${chosen.length} chủ đề vào mục lục` : `Thêm ${chosen.length} mục đã chọn vào bài`}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- controls */

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const id = useId();
  const set = (n: number) => onChange(Math.min(10, Math.max(1, Math.round(n) || 1)));
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold first-letter:uppercase">
        {label}
      </label>
      <div className="flex items-center rounded-full border border-line">
        <IconButton label="Bớt một" onClick={() => set(value - 1)} disabled={value <= 1} className="disabled:opacity-40">
          <Minus size={16} />
        </IconButton>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          className="tabular h-10 w-9 bg-transparent text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <IconButton label="Thêm một" onClick={() => set(value + 1)} disabled={value >= 10} className="disabled:opacity-40">
          <Plus size={16} />
        </IconButton>
      </div>
    </div>
  );
}

function Segmented({ label, value, onChange }: { label: string; value: LessonAiDifficulty; onChange: (v: LessonAiDifficulty) => void }) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="flex rounded-full border border-line p-0.5">
        {(Object.keys(DIFFICULTY_LABELS) as LessonAiDifficulty[]).map((d) => (
          <label
            key={d}
            className={`flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full px-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-coral ${
              value === d ? "bg-coral-wash text-coral-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            <input type="radio" name={name} className="sr-only" checked={value === d} onChange={() => onChange(d)} />
            {DIFFICULTY_LABELS[d]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CardSkeleton({ kind }: { kind: LessonAiKind }) {
  const lines = kind === "quiz" ? 4 : kind === "outcomes" ? 1 : 3;
  return (
    <li className="flex gap-3 rounded-[var(--radius-paper)] border border-line p-4">
      <span className="mt-0.5 size-4 shrink-0 animate-pulse rounded bg-paper-3" />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="h-4 w-4/5 animate-pulse rounded bg-paper-3" />
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="h-3 animate-pulse rounded bg-paper-2" style={{ width: `${40 + ((i * 23) % 45)}%` }} />
        ))}
      </span>
    </li>
  );
}

/* ---------------------------------------------------------------- cards */

const letters = "ABCDEF";

function DraftCard({
  card,
  n,
  onToggle,
  onEdit,
  onChange,
  onRegenerate,
}: {
  card: Card;
  n: number;
  onToggle: () => void;
  onEdit: (on: boolean) => void;
  onChange: (i: Item) => void;
  onRegenerate: () => void;
}) {
  const { item } = card;
  if (card.busy) return <CardSkeleton kind={item.kind} />;
  return (
    <li className={`rounded-[var(--radius-paper)] border transition-colors ${card.on ? "border-line bg-paper" : "border-dashed border-line bg-paper-2/60"}`}>
      <div className="flex items-start gap-1 p-2 pr-1">
        <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-paper-2">
          <input type="checkbox" checked={card.on} onChange={onToggle} aria-label={`Chọn mục ${n}`} className="size-4 accent-[var(--coral)]" />
        </label>
        <div className={`min-w-0 flex-1 py-2 ${card.on ? "" : "opacity-60"}`}>{card.editing ? <EditItem item={item} onChange={onChange} /> : <ViewItem item={item} n={n} />}</div>
        <div className="flex shrink-0 flex-col">
          <IconButton label={card.editing ? `Xong, mục ${n}` : `Sửa nhanh mục ${n}`} onClick={() => onEdit(!card.editing)} aria-pressed={card.editing}>
            {card.editing ? <CheckSquare size={18} /> : <PencilSimple size={18} />}
          </IconButton>
          <IconButton label={`Tạo lại mục ${n}`} onClick={onRegenerate}>
            <ArrowClockwise size={18} />
          </IconButton>
        </div>
      </div>
    </li>
  );
}

function ViewItem({ item, n }: { item: Item; n: number }) {
  switch (item.kind) {
    case "quiz": {
      const q = item.value;
      return (
        <div>
          <p className="font-semibold">
            <span className="tabular mr-1.5 text-ink-3">Câu {n}.</span>
            <RichText text={q.prompt} />
          </p>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {q.choices.map((c, i) => (
              <li key={i} className={`flex items-start gap-2 ${i === q.answerIndex ? "font-semibold text-ink" : "text-ink-2"}`}>
                <span className="tabular w-4 shrink-0">{letters[i]}.</span>
                <span className="min-w-0">
                  <RichText text={c} />
                </span>
                {i === q.answerIndex && <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-coral-ink" aria-label="Đáp án đúng" />}
              </li>
            ))}
          </ul>
          {q.explanation && (
            <p className="mt-2 text-sm text-ink-2">
              <RichText text={q.explanation} />
            </p>
          )}
        </div>
      );
    }
    case "outcomes":
      return (
        <p>
          <RichText text={item.value} />
        </p>
      );
    case "examples":
      return (
        <div>
          <p className="font-semibold">
            <RichText text={item.value.title} />
          </p>
          <p className="mt-1">
            <RichText text={item.value.problem} />
          </p>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-ink-2">
            {item.value.steps.map((s, i) => (
              <li key={i}>
                <RichText text={s} />
              </li>
            ))}
          </ol>
        </div>
      );
    case "mistakes":
      return (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
          <dt className="font-hand text-lg leading-6 text-danger">Sai</dt>
          <dd className="text-ink-2">
            <RichText text={item.value.wrong} />
          </dd>
          <dt className="font-hand text-lg leading-6 text-coral-ink">Đúng</dt>
          <dd>
            <RichText text={item.value.right} />
          </dd>
          <dt className="text-sm font-semibold text-ink-3">Vì sao</dt>
          <dd className="text-sm text-ink-2">
            <RichText text={item.value.why} />
          </dd>
        </dl>
      );
    case "warmup":
      return (
        <div>
          <p className="font-semibold">
            <RichText text={item.value.prompt} />
          </p>
          {item.value.hint && (
            <p className="mt-1 text-sm text-ink-2">
              <span className="font-semibold">Gợi ý. </span>
              <RichText text={item.value.hint} />
            </p>
          )}
          <p className="mt-1 text-sm text-ink-2">
            <span className="font-semibold">Đáp án. </span>
            <RichText text={item.value.answer} />
          </p>
        </div>
      );
    case "outline":
      return (
        <div>
          <p className="font-semibold">
            <RichText text={item.value.title} />
          </p>
          <ol className="mt-1.5 flex list-decimal flex-col gap-0.5 pl-5 text-sm text-ink-2">
            {item.value.lessons.map((l, i) => (
              <li key={i}>
                <RichText text={l} />
              </li>
            ))}
          </ol>
        </div>
      );
  }
}

function Lines({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <TextArea
      label={label}
      rows={Math.min(8, Math.max(3, value.length + 1))}
      value={value.join("\n")}
      hint="Mỗi dòng là một mục."
      onChange={(e) => onChange(e.target.value.split("\n"))}
    />
  );
}

function EditItem({ item, onChange }: { item: Item; onChange: (i: Item) => void }) {
  const wrap = (children: ReactNode) => <div className="flex flex-col gap-3">{children}</div>;
  switch (item.kind) {
    case "quiz": {
      const q = item.value;
      const set = (p: Partial<QuizQuestion>) => onChange({ kind: "quiz", value: { ...q, ...p } });
      return wrap(
        <>
          <TextArea label="Đề bài" rows={2} value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
          <fieldset>
            <legend className="text-sm font-semibold">Các lựa chọn, chọn nút tròn ở đáp án đúng</legend>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {q.choices.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-paper-2">
                    <input type="radio" name={`ai-${q.id}`} checked={q.answerIndex === i} onChange={() => set({ answerIndex: i })} aria-label={`${letters[i]} là đáp án đúng`} className="size-4 accent-[var(--coral)]" />
                  </label>
                  <input
                    value={c}
                    aria-label={`Lựa chọn ${letters[i]}`}
                    onChange={(e) => set({ choices: q.choices.map((x, j) => (j === i ? e.target.value : x)) })}
                    className={`${inputClass} min-w-0 flex-1 ${q.answerIndex === i ? "!border-coral" : ""}`}
                  />
                  <IconButton
                    label={`Xoá lựa chọn ${letters[i]}`}
                    disabled={q.choices.length <= 2}
                    className="disabled:opacity-40"
                    onClick={() => set({ choices: q.choices.filter((_, j) => j !== i), answerIndex: i < q.answerIndex ? q.answerIndex - 1 : i === q.answerIndex ? 0 : q.answerIndex })}
                  >
                    <Trash size={16} />
                  </IconButton>
                </div>
              ))}
            </div>
          </fieldset>
          <TextArea label="Giải thích" rows={2} value={q.explanation ?? ""} onChange={(e) => set({ explanation: e.target.value })} />
        </>,
      );
    }
    case "outcomes":
      return <TextArea label="Mục tiêu" rows={2} value={item.value} onChange={(e) => onChange({ kind: "outcomes", value: e.target.value })} />;
    case "examples": {
      const b = item.value;
      const set = (p: Partial<ExampleBlock>) => onChange({ kind: "examples", value: { ...b, ...p } });
      return wrap(
        <>
          <TextField label="Tên ví dụ" value={b.title} onChange={(e) => set({ title: e.target.value })} />
          <TextArea label="Đề bài" rows={2} value={b.problem} onChange={(e) => set({ problem: e.target.value })} />
          <Lines label="Các bước giải" value={b.steps} onChange={(steps) => set({ steps })} />
        </>,
      );
    }
    case "mistakes": {
      const b = item.value;
      const set = (p: Partial<MistakeBlock>) => onChange({ kind: "mistakes", value: { ...b, ...p } });
      return wrap(
        <>
          <TextArea label="Cách làm sai" rows={2} value={b.wrong} onChange={(e) => set({ wrong: e.target.value })} />
          <TextArea label="Cách làm đúng" rows={2} value={b.right} onChange={(e) => set({ right: e.target.value })} />
          <TextArea label="Vì sao sai" rows={2} value={b.why} onChange={(e) => set({ why: e.target.value })} />
        </>,
      );
    }
    case "warmup": {
      const b = item.value;
      const set = (p: Partial<WarmupBlock>) => onChange({ kind: "warmup", value: { ...b, ...p } });
      return wrap(
        <>
          <TextArea label="Câu hỏi" rows={2} value={b.prompt} onChange={(e) => set({ prompt: e.target.value })} />
          <TextArea label="Gợi ý" rows={2} value={b.hint ?? ""} onChange={(e) => set({ hint: e.target.value })} />
          <TextArea label="Đáp án" rows={2} value={b.answer} onChange={(e) => set({ answer: e.target.value })} />
        </>,
      );
    }
    case "outline": {
      const t = item.value;
      const set = (p: Partial<OutlineDraftTopic>) => onChange({ kind: "outline", value: { ...t, ...p } });
      return wrap(
        <>
          <TextField label="Tên chủ đề" value={t.title} onChange={(e) => set({ title: e.target.value })} />
          <Lines label="Các bài" value={t.lessons} onChange={(lessons) => set({ lessons })} />
        </>,
      );
    }
  }
}

/** Removes blank lines left by quick edits before the drafts go into the lesson. */
export function tidyResult(r: LessonAiResult): LessonAiResult {
  const keep = (s: string) => s.trim() !== "";
  switch (r.kind) {
    case "examples":
      return { ...r, items: r.items.map((b) => ({ ...b, steps: b.steps.filter(keep) })) };
    case "outline":
      return { ...r, topics: r.topics.filter((t) => keep(t.title)).map((t) => ({ title: t.title.trim(), lessons: t.lessons.map((l) => l.trim()).filter(keep) })) };
    case "outcomes":
      return { ...r, items: r.items.filter(keep) };
    default:
      return r;
  }
}
