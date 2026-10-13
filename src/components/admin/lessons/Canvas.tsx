"use client";

/* eslint-disable @next/next/no-img-element -- video covers may be data URLs or any pasted address */
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChatCircleText,
  Check,
  CheckSquare,
  Copy,
  Function as FunctionIcon,
  Image as ImageIcon,
  ListNumbers,
  PencilSimple,
  Plus,
  PushPin,
  Sparkle,
  TextAlignLeft,
  Trash,
  VideoCamera,
  XCircle,
  type Icon,
} from "@/components/ui/icons";
import { type MouseEvent, type ReactNode } from "react";
import { Block } from "@/components/learn/lesson/Blocks";
import { RichText } from "@/components/learn/Math";
import { Button, buttonClass } from "@/components/ui/Button";
import { RibbonMark } from "../ui";
import { ActionMenu } from "./ActionMenu";
import { aiKey, type Ed } from "./ed";
import { blockLabels, blockOrder, hasContent, issuesFor, sameSelection, type BlockType, type Selection } from "./model";

export const blockIcons: Record<BlockType, Icon> = {
  paragraph: TextAlignLeft,
  math: FunctionIcon,
  definition: BookOpen,
  question: ChatCircleText,
  example: ListNumbers,
  mistake: XCircle,
  note: PushPin,
  image: ImageIcon,
  quiz: CheckSquare,
};

/** Common part names, offered when adding a part. */
export const sectionPresets = ["Khởi động", "Khám phá", "Các dạng bài", "Vận dụng", "Lỗi hay mắc", "Ghi nhớ", "Tự kiểm"];

export const selKey = (s: Selection) => (s.kind === "info" ? "info" : s.kind === "section" ? `s:${s.key}` : s.kind === "block" ? `b:${s.key}` : s.kind === "video" ? `v:${s.id}` : `q:${s.id}`);

export interface Tool {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/** Small toolbar shown on hover, focus or selection. */
export function Toolbar({ tools, className = "" }: { tools: Tool[]; className?: string }) {
  return (
    <div role="toolbar" className={`flex items-center rounded-full border border-line bg-paper p-0.5 shadow-[0_6px_16px_-8px_hsl(var(--shadow)/0.35)] ${className}`}>
      {tools.map((t) => (
        <button
          key={t.label}
          type="button"
          aria-label={t.label}
          title={t.label}
          aria-disabled={t.disabled || undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (!t.disabled) t.onClick();
          }}
          className={`inline-flex size-10 items-center justify-center rounded-full transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-35 ${
            t.danger ? "text-ink-2 hover:bg-danger/10 hover:text-danger" : "text-ink-2 hover:bg-paper-3 hover:text-ink"
          }`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

export function AiTag({ onApprove, label = "Nháp AI" }: { onApprove?: () => void; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex h-6 items-center gap-1 rounded-full bg-coral-wash px-2 text-xs font-semibold text-coral-ink">
        <Sparkle size={12} aria-hidden="true" /> {label}
      </span>
      {onApprove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApprove();
          }}
          className="inline-flex h-10 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-2 hover:bg-paper-3 hover:text-ink"
        >
          <Check size={14} weight="bold" /> Duyệt
        </button>
      )}
    </span>
  );
}

/** A piece of the lesson preview that can be selected and edited in the inspector. */
function Frame({ ed, sel, tools, ai, children, className = "" }: { ed: Ed; sel: Selection; tools: Tool[]; ai?: string; children: ReactNode; className?: string }) {
  const on = sameSelection(ed.sel, sel);
  const problems = issuesFor(ed.issues, sel);
  const draft = ai ? ed.isAi(ai) : false;
  return (
    <div
      data-sel={selKey(sel)}
      onClick={(e: MouseEvent) => {
        if ((e.target as HTMLElement).closest("a")) return;
        ed.select(sel);
      }}
      className={`group/frame relative -mx-3 cursor-pointer scroll-mt-24 rounded-[var(--radius-paper)] px-3 py-0.5 transition-colors ${
        on ? "bg-paper-2 shadow-[inset_0_0_0_1px_var(--coral)]" : problems.length ? "shadow-[inset_0_0_0_1px_var(--danger)]" : "hover:bg-paper-2/70"
      } ${className}`}
    >
      {on && <RibbonMark className="absolute -left-[17px] -top-1 h-8 w-2.5" />}
      <Toolbar
        tools={tools}
        className={`absolute -top-5 right-1 z-10 transition-opacity ${on ? "opacity-100" : "opacity-0 group-hover/frame:opacity-100 group-focus-within/frame:opacity-100"}`}
      />
      {(draft || problems.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2">
          {draft && <AiTag onApprove={() => ed.approve(ai!)} />}
          {problems.length > 0 && <span className="text-sm font-semibold text-danger">{problems[0].message}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

function EmptyBlock({ type }: { type: BlockType }) {
  const I = blockIcons[type];
  return (
    <p className="my-4 flex items-center gap-2.5 rounded-[var(--radius-paper)] border border-dashed border-rule px-4 py-3 text-ink-3">
      <I size={18} aria-hidden="true" /> {blockLabels[type]} còn trống. Bấm để viết.
    </p>
  );
}

const typeItems = (onPick: (t: BlockType) => void) =>
  blockOrder.map((t) => {
    const I = blockIcons[t];
    return { label: blockLabels[t], icon: <I size={18} />, onSelect: () => onPick(t) };
  });

/** "+" between blocks: inserts a block of the chosen type right there. */
function Inserter({ ed, sectionKey, at, label }: { ed: Ed; sectionKey: string; at: number; label: string }) {
  return (
    <div className="group/ins relative z-[5] flex h-5 items-center justify-center">
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-coral opacity-0 transition-opacity group-hover/ins:opacity-60 group-focus-within/ins:opacity-60" />
      <ActionMenu
        label={label}
        align="left"
        trigger={<Plus size={18} />}
        triggerClassName="relative inline-flex size-10 items-center justify-center rounded-full border border-line bg-paper text-ink-2 opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover/ins:opacity-100 aria-expanded:opacity-100"
        items={typeItems((t) => ed.insertBlock(sectionKey, at, t))}
      />
    </div>
  );
}

/** The "Nội dung" tab: the lesson as students read it, every piece selectable. */
export function ContentCanvas({ ed, onAddFirst }: { ed: Ed; onAddFirst: () => void }) {
  const { draft, base } = ed;
  const info: Selection = { kind: "info" };
  return (
    <article className="oli-margin pb-10 pl-16 sm:pl-20" aria-label="Xem trước bài như học sinh thấy">
      <div className="max-w-[70ch] text-[1.0625rem] leading-[1.8]">
        <Frame ed={ed} sel={info} tools={[{ label: "Sửa thông tin bài", icon: <PencilSimple size={18} />, onClick: () => ed.select(info, { focus: true }) }]}>
          <p className="pt-2 text-sm leading-normal text-ink-2">
            Chủ đề {base.topic.index}/{base.topic.count}, <RichText text={base.topic.title} />
          </p>
          <div className="mt-4 flex items-end gap-4">
            <span aria-hidden="true" className="tabular font-display text-[4.5rem] font-bold leading-[0.8] text-coral-ink">
              {base.index}
            </span>
            <p className="tabular pb-1 text-sm leading-normal text-ink-2">
              Bài {base.index}/{base.lessonCount} của chủ đề
            </p>
          </div>
          <h2 className="mt-4 text-3xl font-bold">{draft.title.trim() ? <RichText text={draft.title} /> : <span className="text-ink-3">Bài chưa có tiêu đề</span>}</h2>
          {draft.outcomes.length > 0 ? (
            <div className="mt-6 pb-3">
              <h3 className="text-lg font-semibold">Sau bài này em</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {draft.outcomes.map((o) => (
                  <li key={o.key} className="flex gap-3">
                    <Check size={20} weight="bold" aria-hidden="true" className="mt-1.5 shrink-0 text-coral-ink" />
                    <span className="min-w-0">
                      {o.text.trim() ? <RichText text={o.text} /> : <span className="text-ink-3">Mục tiêu còn trống</span>}
                      {ed.isAi(aiKey.outcome(o.key)) && (
                        <span className="ml-2 align-middle">
                          <AiTag onApprove={() => ed.approve(aiKey.outcome(o.key))} />
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 pb-3 text-sm text-ink-3">Chưa có mục tiêu. Bấm để thêm câu &quot;Sau bài này em...&quot;.</p>
          )}
        </Frame>

        {draft.videos.length > 0 && (
          <button type="button" onClick={() => ed.openTab("videos")} className="-mx-3 mt-8 block w-[calc(100%+1.5rem)] rounded-[var(--radius-paper)] px-3 py-2 text-left hover:bg-paper-2/70">
            <span className="block text-2xl font-bold">Video bài giảng</span>
            <span className="mt-2 flex gap-2 overflow-hidden">
              {draft.videos.slice(0, 4).map((v) => (
                <span key={v.id} className="relative block h-[54px] w-24 shrink-0 overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper-3">
                  {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <VideoCamera size={18} className="absolute inset-0 m-auto text-ink-3" />}
                </span>
              ))}
            </span>
            <span className="mt-1.5 block text-sm text-ink-3">{draft.videos.length} video. Sửa ở tab Video.</span>
          </button>
        )}

        {draft.sections.length === 0 ? (
          <div className="mt-10 rounded-[var(--radius-paper)] border border-dashed border-rule px-5 py-6">
            <p className="font-display text-xl font-semibold">Bài chưa có phần nào</p>
            <p className="mt-1 text-ink-2">Thêm phần đầu tiên, ví dụ Khởi động. Hoặc để AI viết câu hỏi khởi động, ví dụ, lỗi hay mắc rồi chọn cái hợp.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={onAddFirst}>
                <Plus size={18} /> Thêm phần Khởi động
              </Button>
              <Button variant="secondary" onClick={() => ed.openAi("warmup")}>
                <Sparkle size={18} className="text-coral-ink" /> Soạn bằng AI
              </Button>
            </div>
          </div>
        ) : (
          draft.sections.map((s, si) => {
            const sel: Selection = { kind: "section", key: s.key };
            return (
              <section key={s.key} className="mt-12" aria-label={`Phần ${si + 1}`}>
                <Frame
                  ed={ed}
                  sel={sel}
                  tools={[
                    { label: `Sửa tên phần ${si + 1}`, icon: <PencilSimple size={18} />, onClick: () => ed.select(sel, { focus: true }) },
                    { label: `Đưa phần ${si + 1} lên`, icon: <ArrowUp size={18} />, onClick: () => ed.moveSection(s.key, -1), disabled: si === 0 },
                    { label: `Đưa phần ${si + 1} xuống`, icon: <ArrowDown size={18} />, onClick: () => ed.moveSection(s.key, 1), disabled: si === draft.sections.length - 1 },
                    { label: `Nhân bản phần ${si + 1}`, icon: <Copy size={18} />, onClick: () => ed.duplicateSection(s.key) },
                    { label: `Xoá phần ${si + 1}`, icon: <Trash size={18} />, onClick: () => ed.removeSection(s.key), danger: true },
                  ]}
                >
                  <h3 className="flex items-baseline gap-2.5 py-1 text-2xl font-bold">
                    <span className="tabular text-coral-ink">{si + 1}.</span>
                    {s.title.trim() ? s.title : <span className="text-ink-3">Phần chưa có tên</span>}
                  </h3>
                </Frame>
                <div className="mt-1">
                  {s.blocks.length > 0 && <Inserter ed={ed} sectionKey={s.key} at={0} label={`Chèn khối vào đầu phần ${si + 1}`} />}
                  {s.blocks.map((b, bi) => {
                    const bsel: Selection = { kind: "block", key: b.key };
                    const name = blockLabels[b.block.type].toLowerCase();
                    return (
                      <div key={b.key}>
                        <Frame
                          ed={ed}
                          sel={bsel}
                          ai={aiKey.block(b.key)}
                          tools={[
                            { label: `Sửa khối ${name}`, icon: <PencilSimple size={18} />, onClick: () => ed.select(bsel, { focus: true }) },
                            { label: `Đưa khối ${name} lên`, icon: <ArrowUp size={18} />, onClick: () => ed.moveBlock(b.key, -1), disabled: !ed.canMoveBlock(b.key, -1) },
                            { label: `Đưa khối ${name} xuống`, icon: <ArrowDown size={18} />, onClick: () => ed.moveBlock(b.key, 1), disabled: !ed.canMoveBlock(b.key, 1) },
                            { label: `Nhân bản khối ${name}`, icon: <Copy size={18} />, onClick: () => ed.duplicateBlock(b.key) },
                            { label: `Xoá khối ${name}`, icon: <Trash size={18} />, onClick: () => ed.removeBlock(b.key), danger: true },
                          ]}
                        >
                          {hasContent(b.block) ? <Block block={b.block} /> : <EmptyBlock type={b.block.type} />}
                        </Frame>
                        {bi < s.blocks.length - 1 && <Inserter ed={ed} sectionKey={s.key} at={bi + 1} label={`Chèn khối sau khối ${bi + 1} của phần ${si + 1}`} />}
                      </div>
                    );
                  })}
                  {s.blocks.length === 0 && <p className="mt-2 text-sm text-ink-3">Phần này chưa có khối nào. Thêm đoạn văn, công thức, ví dụ hoặc câu hỏi.</p>}
                  <div className="mt-3">
                    <ActionMenu
                      label={`Thêm khối vào cuối phần ${si + 1}`}
                      showLabel
                      align="left"
                      triggerClassName={buttonClass("ghost", "sm", "!h-10 -ml-3 aria-expanded:bg-paper-2")}
                      trigger={
                        <>
                          <Plus size={16} /> Thêm khối
                        </>
                      }
                      items={typeItems((t) => ed.insertBlock(s.key, s.blocks.length, t))}
                    />
                  </div>
                </div>
              </section>
            );
          })
        )}

        {draft.sections.length > 0 && (
          <div className="mt-12 border-t border-dashed border-rule pt-5">
            <ActionMenu
              label="Thêm phần mới"
              showLabel
              align="left"
              triggerClassName={buttonClass("secondary", "md", "aria-expanded:border-ink-3")}
              trigger={
                <>
                  <Plus size={18} /> Thêm phần
                </>
              }
              items={[
                ...sectionPresets.filter((p) => !draft.sections.some((s) => s.title.trim() === p)).map((p) => ({ label: p, onSelect: () => ed.addSection(p) })),
                { label: "Phần khác, tự đặt tên", icon: <PencilSimple size={18} />, onSelect: () => ed.addSection("") },
              ]}
            />
          </div>
        )}
      </div>
    </article>
  );
}
