"use client";

import { Check, PencilSimple } from "@/components/ui/icons";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { Photo } from "@/lib/api/types";

const isLocal = (url: string) => url.startsWith("blob:") || url.startsWith("data:");
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

/**
 * A photo in its album sleeve (same look as PhotoSleeve), clickable to open the
 * lightbox, with optional select mode and an editable handwritten memo.
 */
export function PhotoTile({
  photo,
  layoutId,
  onOpen,
  selecting = false,
  selected = false,
  onToggleSelect,
  onSaveMemo,
  showDate = true,
  footer,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw",
  priority = false,
}: {
  photo: Photo;
  layoutId?: string;
  onOpen: () => void;
  selecting?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Present when the viewer may edit the memo. Rejects to keep the old text. */
  onSaveMemo?: (memo: string) => Promise<void>;
  showDate?: boolean;
  footer?: ReactNode;
  sizes?: string;
  priority?: boolean;
}) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(photo.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const label = photo.memo ? `Ảnh: ${photo.memo}` : "Ảnh gia đình";

  function startEdit() {
    setDraft(photo.memo ?? "");
    setError(false);
    setEditing(true);
  }

  async function save() {
    if (!onSaveMemo) return;
    if (draft.trim() === (photo.memo ?? "")) return setEditing(false);
    setSaving(true);
    try {
      await onSaveMemo(draft.trim());
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setEditing(false);
    }
  }

  return (
    <figure
      className={`group relative rounded-[var(--radius-paper)] border bg-paper p-2 paper-shadow transition-[border-color,box-shadow] duration-200 ${
        selected ? "border-coral shadow-[0_0_0_2px_var(--coral)]" : "border-line"
      }`}
    >
      <motion.div
        layoutId={reduce ? undefined : layoutId}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sleeve relative overflow-hidden rounded-[3px] bg-paper-3"
        style={{ aspectRatio: photo.height > photo.width ? "3 / 4" : "4 / 3" }}
      >
        <button
          type="button"
          onClick={selecting ? onToggleSelect : onOpen}
          aria-label={selecting ? `${selected ? "Bỏ chọn" : "Chọn"} ${label.toLowerCase()}` : `Xem lớn. ${label}`}
          aria-pressed={selecting ? selected : undefined}
          className="block size-full cursor-zoom-in focus-visible:outline-offset-[-3px] data-[selecting=true]:cursor-pointer"
          data-selecting={selecting}
        >
          <Image
            src={photo.url}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={isLocal(photo.url)}
            className={`object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] ${selected ? "scale-[0.94]" : "group-hover:scale-[1.02]"}`}
          />
        </button>
      </motion.div>

      {onToggleSelect && (
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={selected ? "Bỏ chọn ảnh này" : "Chọn ảnh này"}
          onClick={onToggleSelect}
          className={`absolute left-1 top-1 flex size-11 items-center justify-center transition-opacity focus-visible:opacity-100 ${
            selecting || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:hidden"
          }`}
        >
          <span
            className={`flex size-7 items-center justify-center rounded-full border-2 shadow-[0_1px_3px_hsl(var(--shadow)/0.4)] ${
              selected ? "border-coral bg-coral text-on-coral" : "border-[oklch(1_0_0/0.9)] bg-[oklch(0_0_0/0.25)] text-transparent"
            }`}
          >
            <Check size={16} weight="bold" />
          </span>
        </button>
      )}

      <figcaption className="mt-2 px-1">
        {editing ? (
          <div>
            <label htmlFor={`memo-${photo.id}`} className="sr-only">Ghi chú cho ảnh</label>
            <input
              id={`memo-${photo.id}`}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              onBlur={() => void save()}
              maxLength={80}
              disabled={saving}
              placeholder="Viết một dòng ghi chú"
              aria-invalid={error}
              className="memo-lines h-6 w-full rounded-none border-b border-coral bg-transparent font-hand text-[1.05rem] leading-6 text-ink outline-none placeholder:text-ink-3 focus:shadow-[0_2px_0_var(--coral)]"
            />
            <p className="mt-1 text-xs text-ink-3" aria-live="polite">
              {error ? <span className="text-danger">Chưa lưu được. Thử lại nhé.</span> : saving ? "Đang lưu..." : "Enter để lưu, Esc để thôi"}
            </p>
          </div>
        ) : (
          <div className="memo-lines flex items-baseline justify-between gap-2 font-hand text-[1.05rem] leading-6 text-ink-2">
            {onSaveMemo && !selecting ? (
              <button
                type="button"
                onClick={startEdit}
                className="group/memo -mx-1 flex min-h-6 min-w-0 flex-1 items-baseline gap-1.5 rounded-sm px-1 text-left hover:text-ink"
                aria-label={photo.memo ? `Sửa ghi chú: ${photo.memo}` : "Thêm ghi chú"}
              >
                <span className={`truncate ${photo.memo ? "" : "text-ink-3"}`}>{photo.memo || "Thêm ghi chú..."}</span>
                <PencilSimple size={14} className="shrink-0 self-center text-ink-3 opacity-0 transition-opacity group-hover/memo:opacity-100 group-focus-visible/memo:opacity-100" />
              </button>
            ) : (
              <span className="min-h-6 truncate">{photo.memo}</span>
            )}
            {showDate && <span className="tabular shrink-0 text-sm text-ink-3">{shortDate(photo.takenAt)}</span>}
          </div>
        )}
      </figcaption>
      {footer}
    </figure>
  );
}
