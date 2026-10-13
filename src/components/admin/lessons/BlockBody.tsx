"use client";

import { Plus, Trash } from "@/components/ui/icons";
import { RichText } from "@/components/learn/Math";
import { Button, IconButton } from "@/components/ui/Button";
import type { LessonBlock, QuizQuestion } from "@/lib/api/lesson-types";
import { ImageField } from "../ImageField";
import { TextField, inputClass } from "../ui";
import { RichField, TexField } from "./fields";
import { issueKeys } from "./model";

type Err = (at: string) => string | undefined;
const optional = <span className="text-xs text-ink-3">Không bắt buộc</span>;

/** The fields of one block, by type, stacked for a narrow inspector. Quiz blocks are edited question by question. */
export function BlockBody({ block, blockKey, onChange, err }: { block: LessonBlock; blockKey: string; onChange: (b: LessonBlock) => void; err: Err }) {
  const at = (field: string) => issueKeys.block(blockKey, field);
  switch (block.type) {
    case "paragraph":
      return <RichField label="Nội dung" value={block.text} rows={5} onChange={(text) => onChange({ ...block, text })} />;
    case "note":
      return <RichField label="Điều cần ghi nhớ" value={block.text} rows={3} onChange={(text) => onChange({ ...block, text })} />;
    case "math":
      return <TexField value={block.tex} issue={at("tex")} error={err(at("tex"))} onChange={(tex) => onChange({ ...block, tex })} />;
    case "definition":
      return (
        <div className="flex flex-col gap-4">
          <TextField label="Thuật ngữ" value={block.term} placeholder="Phương trình bậc nhất hai ẩn" onChange={(e) => onChange({ ...block, term: e.target.value })} />
          <RichField label="Định nghĩa" value={block.text} rows={4} onChange={(text) => onChange({ ...block, text })} />
        </div>
      );
    case "question":
      return (
        <div className="flex flex-col gap-4">
          <RichField label="Câu hỏi" value={block.prompt} rows={3} onChange={(prompt) => onChange({ ...block, prompt })} />
          <RichField label="Gợi ý" optional value={block.hint ?? ""} onChange={(hint) => onChange({ ...block, hint })} />
          <RichField label="Đáp án" value={block.answer} rows={3} onChange={(answer) => onChange({ ...block, answer })} />
        </div>
      );
    case "mistake":
      return (
        <div className="flex flex-col gap-4">
          <RichField label="Cách làm sai" value={block.wrong} onChange={(wrong) => onChange({ ...block, wrong })} />
          <RichField label="Cách làm đúng" value={block.right} onChange={(right) => onChange({ ...block, right })} />
          <RichField label="Vì sao sai" value={block.why} onChange={(why) => onChange({ ...block, why })} />
        </div>
      );
    case "example":
      return <ExampleBody block={block} onChange={onChange} />;
    case "image":
      return (
        <div className="flex flex-col gap-4" data-issue={at("url")}>
          <div>
            <ImageField label="Ảnh" value={{ url: block.url, alt: block.alt }} ratio="16/9" onChange={(v) => onChange({ ...block, url: v.url, alt: v.alt })} />
            {err(at("url")) && <p className="mt-1.5 text-sm text-danger">{err(at("url"))}</p>}
          </div>
          <TextField label="Chú thích" value={block.caption ?? ""} aside={optional} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
        </div>
      );
    case "quiz":
      return null;
  }
}

function ExampleBody({ block, onChange }: { block: Extract<LessonBlock, { type: "example" }>; onChange: (b: LessonBlock) => void }) {
  const setStep = (i: number, v: string) => onChange({ ...block, steps: block.steps.map((s, j) => (j === i ? v : s)) });
  return (
    <div className="flex flex-col gap-4">
      <TextField label="Tên ví dụ" value={block.title} placeholder="Ví dụ 1" onChange={(e) => onChange({ ...block, title: e.target.value })} />
      <RichField label="Đề bài" value={block.problem} rows={3} onChange={(problem) => onChange({ ...block, problem })} />
      <ol className="flex flex-col gap-3">
        {block.steps.map((s, i) => (
          <li key={i} className="flex items-start gap-1">
            <div className="min-w-0 flex-1">
              <RichField label={`Bước ${i + 1}`} value={s} rows={2} onChange={(v) => setStep(i, v)} />
            </div>
            <IconButton label={`Xoá bước ${i + 1}`} className="mt-6 -mr-2" onClick={() => onChange({ ...block, steps: block.steps.filter((_, j) => j !== i) })}>
              <Trash size={18} />
            </IconButton>
          </li>
        ))}
      </ol>
      <div>
        <Button variant="ghost" size="sm" className="!h-10" onClick={() => onChange({ ...block, steps: [...block.steps, ""] })}>
          <Plus size={16} /> Thêm bước
        </Button>
      </div>
    </div>
  );
}

/** One self-check question: prompt, choices with the right one as a radio, explanation. */
export function QuestionForm({ q, blockKey, onChange, err }: { q: QuizQuestion; blockKey: string; onChange: (q: QuizQuestion) => void; err: Err }) {
  const qk = (f: "prompt" | "choices" | "answer") => issueKeys.question(blockKey, q.id, f);
  const choiceErr = err(qk("choices")) ?? err(qk("answer"));
  const set = (patch: Partial<QuizQuestion>) => onChange({ ...q, ...patch });
  const errId = `${blockKey}-${q.id}-cerr`;
  return (
    <div className="flex flex-col gap-5">
      <RichField label="Đề bài" value={q.prompt} rows={3} issue={qk("prompt")} error={err(qk("prompt"))} onChange={(prompt) => set({ prompt })} />
      <fieldset data-issue={qk("choices")} aria-describedby={choiceErr ? errId : undefined}>
        <legend className="text-sm font-semibold">Các lựa chọn</legend>
        <p className="mt-0.5 text-sm text-ink-3">Chọn nút tròn ở đáp án đúng.</p>
        <div className="mt-2 flex flex-col gap-2">
          {q.choices.map((c, i) => (
            <div key={i}>
              <div className="flex items-center gap-1">
                <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-paper-2">
                  <input
                    type="radio"
                    name={`${blockKey}-${q.id}`}
                    checked={q.answerIndex === i}
                    onChange={() => set({ answerIndex: i })}
                    aria-label={`Lựa chọn ${"ABCDEF"[i]} là đáp án đúng`}
                    className="size-4 accent-[var(--coral)]"
                  />
                </label>
                <input
                  value={c}
                  aria-label={`Lựa chọn ${"ABCDEF"[i]}`}
                  placeholder={`Lựa chọn ${"ABCDEF"[i]}`}
                  onChange={(e) => set({ choices: q.choices.map((x, j) => (j === i ? e.target.value : x)) })}
                  className={`${inputClass} min-w-0 flex-1 ${q.answerIndex === i ? "!border-coral" : ""}`}
                />
                <IconButton
                  label={`Xoá lựa chọn ${"ABCDEF"[i]}`}
                  aria-disabled={q.choices.length <= 2 || undefined}
                  className="shrink-0 aria-disabled:opacity-40"
                  onClick={() => {
                    if (q.choices.length <= 2) return;
                    const answerIndex = i < q.answerIndex ? q.answerIndex - 1 : i === q.answerIndex ? 0 : q.answerIndex;
                    set({ choices: q.choices.filter((_, j) => j !== i), answerIndex });
                  }}
                >
                  <Trash size={18} />
                </IconButton>
              </div>
              {c.includes("$") && (
                <p className="ml-11 mt-1 text-sm text-ink-2">
                  <RichText text={c} />
                </p>
              )}
            </div>
          ))}
        </div>
        {choiceErr && (
          <p id={errId} className="mt-1.5 text-sm text-danger">
            {choiceErr}
          </p>
        )}
        {q.choices.length < 6 && (
          <Button variant="ghost" size="sm" className="mt-1 !h-10" onClick={() => set({ choices: [...q.choices, ""] })}>
            <Plus size={16} /> Thêm lựa chọn
          </Button>
        )}
      </fieldset>
      <RichField label="Giải thích" optional rows={3} value={q.explanation ?? ""} onChange={(explanation) => set({ explanation })} />
    </div>
  );
}
