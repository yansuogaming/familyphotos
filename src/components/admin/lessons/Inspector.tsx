"use client";

import { ArrowDown, ArrowSquareOut, ArrowUp, Check, Copy, PencilSimple, Plus, Sparkle, Trash, X } from "@/components/ui/icons";
import type { ReactNode } from "react";
import { formatDateTime } from "@/components/settings/shared";
import { Button, IconButton, buttonClass } from "@/components/ui/Button";
import { RichText } from "@/components/learn/Math";
import type { Video } from "@/lib/api/lesson-types";
import { slugify } from "@/lib/api/lessons";
import { ImageField } from "../ImageField";
import { SelectField, TextField } from "../ui";
import { BlockBody, QuestionForm } from "./BlockBody";
import { blockIcons } from "./Canvas";
import { aiKey, type Ed } from "./ed";
import { RichField } from "./fields";
import { studentHref } from "./Lists";
import { allQuestions, blockLabels, findBlock, issueKeys, move, uid, type Selection } from "./model";

const optional = <span className="text-xs text-ink-3">Không bắt buộc</span>;

/** The right-hand area: a short form for whatever is selected. */
export function Inspector({ ed, onClose, floating }: { ed: Ed; onClose: () => void; floating: boolean }) {
  const view = describe(ed, ed.sel);
  return (
    <>
      <div className="flex items-start gap-2 border-b border-line py-3 pl-5 pr-2">
        <div className="min-w-0 flex-1 py-1.5">
          <h2 className="flex items-center gap-2 text-lg font-bold leading-snug">
            {view.icon}
            <span className="min-w-0 truncate">{view.title}</span>
          </h2>
          {view.where && <p className="mt-0.5 truncate text-sm text-ink-3">{view.where}</p>}
        </div>
        {floating && (
          <IconButton label="Đóng bảng sửa" onClick={onClose} className="shrink-0">
            <X size={20} />
          </IconButton>
        )}
      </div>
      <div id="lesson-inspector-body" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-5">
        {view.ai && (
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-paper)] bg-coral-wash px-3 py-2.5">
            <p className="flex min-w-0 flex-1 basis-40 items-center gap-2 text-sm text-ink">
              <Sparkle size={18} aria-hidden="true" className="shrink-0 text-coral-ink" />
              Nháp AI. Đọc lại, sửa nếu cần rồi duyệt.
            </p>
            <Button size="sm" variant="secondary" className="!h-10 shrink-0" onClick={() => ed.approve(view.ai!)}>
              <Check size={16} weight="bold" /> Duyệt
            </Button>
          </div>
        )}
        {view.body}
      </div>
      {view.footer && <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">{view.footer}</div>}
    </>
  );
}

type View = { title: string; where?: ReactNode; icon?: ReactNode; body: ReactNode; footer?: ReactNode; ai?: string };

function describe(ed: Ed, sel: Selection | null): View {
  const { draft } = ed;
  if (!sel) return { title: "Bảng sửa", body: <Hint /> };

  if (sel.kind === "info") return { title: "Thông tin bài", where: `Lớp ${ed.base.grade}, ${ed.base.subject.name}`, body: <InfoForm ed={ed} /> };

  if (sel.kind === "section") {
    const i = draft.sections.findIndex((s) => s.key === sel.key);
    const s = draft.sections[i];
    if (!s) return { title: "Bảng sửa", body: <Hint gone /> };
    return {
      title: `Phần ${i + 1}`,
      where: s.title || "Chưa có tên",
      body: (
        <div className="flex flex-col gap-5">
          <div data-issue={issueKeys.section(s.key)}>
            <TextField
              label="Tiêu đề phần"
              value={s.title}
              placeholder="Khởi động"
              error={ed.err(issueKeys.section(s.key))}
              hint={s.title.trim() ? `Neo liên kết: #${s.id || slugify(s.title)}` : "Ví dụ: Khởi động, Khám phá, Ghi nhớ."}
              onChange={(e) => {
                const title = e.target.value;
                ed.setSection(s.key, (x) => ({ ...x, title, id: slugify(title) }));
              }}
            />
          </div>
          <p className="text-sm text-ink-2">
            Phần này có {s.blocks.length} khối. Bấm vào một khối trong bài để sửa, hoặc di chuột vào khoảng giữa hai khối để chèn khối mới.
          </p>
        </div>
      ),
      footer: (
        <>
          <IconButton label="Đưa phần lên" onClick={() => ed.moveSection(s.key, -1)} disabled={i === 0} className="disabled:opacity-35">
            <ArrowUp size={18} />
          </IconButton>
          <IconButton label="Đưa phần xuống" onClick={() => ed.moveSection(s.key, 1)} disabled={i === draft.sections.length - 1} className="disabled:opacity-35">
            <ArrowDown size={18} />
          </IconButton>
          <IconButton label="Nhân bản phần" onClick={() => ed.duplicateSection(s.key)}>
            <Copy size={18} />
          </IconButton>
          <DeleteButton onClick={() => ed.removeSection(s.key)}>Xoá phần</DeleteButton>
        </>
      ),
    };
  }

  if (sel.kind === "block") {
    const found = findBlock(draft, sel.key);
    if (!found) return { title: "Bảng sửa", body: <Hint gone /> };
    const { entry, section, si, bi } = found;
    const type = entry.block.type;
    const I = blockIcons[type];
    const qs = type === "quiz" ? allQuestions(draft).filter((x) => x.blockKey === entry.key) : [];
    return {
      title: `Khối ${blockLabels[type]}`,
      icon: <I size={18} aria-hidden="true" className="shrink-0 text-ink-3" />,
      where: `Phần ${si + 1}. ${section.title || "Chưa có tên"}, khối ${bi + 1}`,
      ai: ed.isAi(aiKey.block(entry.key)) ? aiKey.block(entry.key) : undefined,
      body:
        entry.block.type === "quiz" ? (
          <div className="flex flex-col gap-4" data-issue={issueKeys.block(entry.key, "questions")}>
            <p className="text-ink-2">Khối Tự kiểm có {qs.length} câu hỏi. Sửa từng câu ở tab Câu hỏi.</p>
            {ed.err(issueKeys.block(entry.key, "questions")) && <p className="text-sm text-danger">{ed.err(issueKeys.block(entry.key, "questions"))}</p>}
            <ol className="flex flex-col gap-1">
              {qs.map(({ q }, i) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => ed.select({ kind: "question", blockKey: entry.key, id: q.id }, { focus: true })}
                    className="flex min-h-10 w-full items-start gap-2 rounded-[var(--radius-paper)] px-2 py-2 text-left text-sm hover:bg-paper-2"
                  >
                    <span className="tabular shrink-0 font-semibold text-coral-ink">Câu {i + 1}.</span>
                    <span className="line-clamp-2 min-w-0">{q.prompt.trim() ? <RichText text={q.prompt} /> : <span className="text-ink-3">Chưa có đề</span>}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div>
              <Button variant="secondary" size="sm" className="!h-10" onClick={() => ed.addQuestion(entry.key)}>
                <Plus size={16} /> Thêm câu hỏi
              </Button>
            </div>
          </div>
        ) : (
          <BlockBody block={entry.block} blockKey={entry.key} err={ed.err} onChange={(b) => ed.setBlock(entry.key, b)} />
        ),
      footer: (
        <>
          <IconButton label="Đưa khối lên" onClick={() => ed.moveBlock(entry.key, -1)} disabled={!ed.canMoveBlock(entry.key, -1)} className="disabled:opacity-35">
            <ArrowUp size={18} />
          </IconButton>
          <IconButton label="Đưa khối xuống" onClick={() => ed.moveBlock(entry.key, 1)} disabled={!ed.canMoveBlock(entry.key, 1)} className="disabled:opacity-35">
            <ArrowDown size={18} />
          </IconButton>
          <IconButton label="Nhân bản khối" onClick={() => ed.duplicateBlock(entry.key)}>
            <Copy size={18} />
          </IconButton>
          <DeleteButton onClick={() => ed.removeBlock(entry.key)}>Xoá khối</DeleteButton>
        </>
      ),
    };
  }

  if (sel.kind === "video") {
    const i = draft.videos.findIndex((v) => v.id === sel.id);
    const v = draft.videos[i];
    if (!v) return { title: "Bảng sửa", body: <Hint gone /> };
    return {
      title: `Video ${i + 1}`,
      where: v.title || "Chưa có tên",
      body: <VideoForm ed={ed} v={v} />,
      footer: <DeleteButton onClick={() => ed.removeVideo(v.id)}>Xoá video</DeleteButton>,
    };
  }

  const list = allQuestions(draft);
  const at = list.findIndex((x) => x.q.id === sel.id && x.blockKey === sel.blockKey);
  const hit = list[at];
  if (!hit) return { title: "Bảng sửa", body: <Hint gone /> };
  return {
    title: `Câu ${at + 1}`,
    where: `Tự kiểm, phần ${draft.sections.indexOf(hit.section) + 1}. ${hit.section.title || "Chưa có tên"}`,
    ai: ed.isAi(aiKey.question(hit.q.id)) ? aiKey.question(hit.q.id) : undefined,
    body: <QuestionForm q={hit.q} blockKey={hit.blockKey} err={ed.err} onChange={(q) => ed.setQuestion(hit.blockKey, q)} />,
    footer: <DeleteButton onClick={() => ed.removeQuestion(hit.blockKey, hit.q.id)}>Xoá câu hỏi</DeleteButton>,
  };
}

function DeleteButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="ghost" size="sm" className="ml-auto !h-10 !text-danger hover:!bg-danger/10" onClick={onClick}>
      <Trash size={16} /> {children}
    </Button>
  );
}

function Hint({ gone = false }: { gone?: boolean }) {
  return (
    <div className="text-ink-2">
      <p className="font-display text-lg font-semibold text-ink">{gone ? "Mục này vừa bị xoá" : "Chọn một mục để sửa"}</p>
      <p className="mt-1.5">Bấm vào tiêu đề, một phần hay một khối trong bài. Ô sửa của nó hiện ở đây.</p>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        <li className="flex gap-2">
          <PencilSimple size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" /> Di chuột lên một khối để đổi chỗ, nhân bản hoặc xoá.
        </li>
        <li className="flex gap-2">
          <Plus size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" /> Di chuột vào khoảng giữa hai khối để chèn khối mới.
        </li>
        <li className="flex gap-2">
          <Sparkle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" /> Soạn bằng AI viết nháp, bạn duyệt rồi mới dùng.
        </li>
      </ul>
      <p className="mt-4 text-sm text-ink-3">Bấm Ctrl + S để lưu nhanh.</p>
    </div>
  );
}

function InfoForm({ ed }: { ed: Ed }) {
  const { draft } = ed;
  const outcomes = draft.outcomes;
  const setOutcomes = (o: typeof outcomes) => ed.patch({ outcomes: o });
  return (
    <div className="flex flex-col gap-6">
      <div data-issue={issueKeys.title}>
        <RichField label="Tiêu đề bài" single value={draft.title} error={ed.err(issueKeys.title)} onChange={(title) => ed.patch({ title })} />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Mục tiêu</legend>
        <p className="mt-0.5 text-sm text-ink-3">Mỗi dòng là một điều em làm được, hiện sau câu &quot;Sau bài này em&quot;.</p>
        {outcomes.length === 0 ? (
          <p className="mt-3 text-sm text-ink-2">Chưa có mục tiêu nào.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-3">
            {outcomes.map((o, i) => {
              const ai = ed.isAi(aiKey.outcome(o.key));
              return (
                <li key={o.key} className={ai ? "rounded-[var(--radius-paper)] bg-coral-wash/50 p-2" : ""}>
                  <RichField label={`Mục tiêu ${i + 1}`} rows={2} value={o.text} onChange={(text) => setOutcomes(outcomes.map((x) => (x.key === o.key ? { ...x, text } : x)))} />
                  <div className="mt-1 flex items-center">
                    {ai && (
                      <Button size="sm" variant="ghost" className="!h-10 !px-2.5 text-coral-ink" onClick={() => ed.approve(aiKey.outcome(o.key))}>
                        <Check size={16} weight="bold" /> Duyệt nháp AI
                      </Button>
                    )}
                    <span className="ml-auto flex">
                      <IconButton label={`Đưa mục tiêu ${i + 1} lên`} disabled={i === 0} className="disabled:opacity-35" onClick={() => setOutcomes(move(outcomes, i, i - 1))}>
                        <ArrowUp size={18} />
                      </IconButton>
                      <IconButton label={`Đưa mục tiêu ${i + 1} xuống`} disabled={i === outcomes.length - 1} className="disabled:opacity-35" onClick={() => setOutcomes(move(outcomes, i, i + 1))}>
                        <ArrowDown size={18} />
                      </IconButton>
                      <IconButton label={`Xoá mục tiêu ${i + 1}`} onClick={() => setOutcomes(outcomes.filter((x) => x.key !== o.key))}>
                        <Trash size={18} />
                      </IconButton>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" className="!h-10" onClick={() => setOutcomes([...outcomes, { key: uid("o"), text: "" }])}>
            <Plus size={16} /> Thêm mục tiêu
          </Button>
          <Button variant="ghost" size="sm" className="!h-10" onClick={() => ed.openAi("outcomes")}>
            <Sparkle size={16} className="text-coral-ink" /> Gợi ý bằng AI
          </Button>
        </div>
      </fieldset>

      <TextField
        label="Số bài luyện tập"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={String(draft.exerciseCount)}
        onChange={(e) => ed.patch({ exerciseCount: Math.max(0, Number(e.target.value) || 0) })}
        hint="Số bài có chấm điểm của bài này trong mục Luyện tập."
      />

      <div className="border-t border-line pt-4 text-sm text-ink-2">
        <p>
          Chủ đề {ed.base.topic.index}: <RichText text={ed.base.topic.title} />. Bài {ed.base.index}/{ed.base.lessonCount}.
        </p>
        <p className="mt-1 text-ink-3">Lưu lần cuối {formatDateTime(ed.base.updatedAt)}.</p>
        <a href={studentHref(ed.base)} target="_blank" rel="noopener" className={buttonClass("secondary", "sm", "mt-3 !h-10")}>
          <ArrowSquareOut size={16} /> Xem như học sinh
        </a>
      </div>
    </div>
  );
}

function VideoForm({ ed, v }: { ed: Ed; v: Video }) {
  const set = (p: Partial<Video>) => ed.setVideo(v.id, p);
  return (
    <div className="flex flex-col gap-5">
      <div data-issue={issueKeys.video(v.id, "title")}>
        <TextField label="Tiêu đề video" value={v.title} error={ed.err(issueKeys.video(v.id, "title"))} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
        <SelectField label="Loại" value={v.kind} onChange={(e) => set({ kind: e.target.value as Video["kind"] })}>
          <option value="lecture">Bài giảng</option>
          <option value="solution">Giải bài tập</option>
        </SelectField>
        <TextField
          label="Số phút"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={v.durationSec ? String(Math.round(v.durationSec / 60)) : ""}
          onChange={(e) => set({ durationSec: Math.max(0, Math.round(Number(e.target.value) || 0)) * 60 || undefined })}
        />
      </div>
      <div data-issue={issueKeys.video(v.id, "url")}>
        <TextField
          label="Đường dẫn nhúng"
          type="url"
          inputMode="url"
          spellCheck={false}
          placeholder="https://www.youtube.com/embed/..."
          value={v.url}
          error={ed.err(issueKeys.video(v.id, "url"))}
          hint="Với YouTube, dùng link dạng youtube.com/embed/mã-video."
          onChange={(e) => set({ url: e.target.value })}
        />
      </div>
      <TextField label="Giáo viên" value={v.teacher ?? ""} aside={optional} onChange={(e) => set({ teacher: e.target.value })} />
      <ImageField label="Ảnh bìa" value={{ url: v.thumbnailUrl, alt: "" }} showAlt={false} ratio="16/9" onChange={(img) => set({ thumbnailUrl: img.url })} />
    </div>
  );
}
