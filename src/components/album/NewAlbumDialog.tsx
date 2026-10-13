"use client";

/* eslint-disable @next/next/no-img-element -- cover preview is a local blob URL */
import { ImageSquare, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { mediaApi } from "@/lib/api/media";
import { checkUpload, UPLOAD_ACCEPT } from "@/lib/api/media-types";
import type { Album } from "@/lib/api/types";
import { Dialog } from "./Modal";

export function NewAlbumDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (a: Album) => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Album mới" description="Một cuốn cho một dịp: Tết, sinh nhật, chuyến đi." size="md">
      <Form onClose={onClose} onCreated={onCreated} />
    </Dialog>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function Form({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Album) => void }) {
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [errors, setErrors] = useState<{ title?: string; to?: string; cover?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const coverRef = useRef(cover);
  useEffect(() => {
    coverRef.current = cover;
  });
  useEffect(() => () => {
    if (coverRef.current) URL.revokeObjectURL(coverRef.current.url);
  }, []);

  function pick(file?: File) {
    if (!file) return;
    const err = checkUpload(file);
    if (err) return setErrors((e) => ({ ...e, cover: err }));
    if (cover) URL.revokeObjectURL(cover.url);
    setCover({ file, url: URL.createObjectURL(file) });
    setErrors((e) => ({ ...e, cover: undefined }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Đặt tên cho album.";
    if (to && from && to < from) next.to = "Ngày kết thúc phải sau ngày bắt đầu.";
    setErrors(next);
    if (next.title || next.to) return;
    setBusy(true);
    try {
      const album = await mediaApi.createAlbum({ title: title.trim(), takenFrom: from, takenTo: to || from, cover: cover?.file });
      onCreated(album);
    } catch {
      setErrors({ form: "Chưa tạo được album. Thử lại nhé." });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Tên album" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Ví dụ: Trung thu 2026" error={errors.title} data-autofocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Từ ngày" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Field label="Đến ngày" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} error={errors.to} hint="Đi một ngày thì để giống nhau." />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold" id="cover-label">Ảnh bìa</span>
        <div className="flex items-center gap-4">
          <div className="vinyl relative flex aspect-[4/5] w-24 shrink-0 rounded-[6px] p-2 paper-shadow">
            <div className="sleeve relative flex-1 overflow-hidden rounded-[3px] bg-cover-2">
              {cover ? (
                <img src={cover.url} alt="Ảnh bìa đã chọn" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-on-cover/60"><ImageSquare size={24} /></span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => input.current?.click()} aria-describedby="cover-label" className={buttonClass("secondary", "sm")}>
                <ImageSquare size={18} /> {cover ? "Đổi ảnh" : "Chọn ảnh bìa"}
              </button>
              {cover && (
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(cover.url);
                    setCover(null);
                  }}
                  className={buttonClass("ghost", "sm")}
                >
                  <X size={16} /> Bỏ
                </button>
              )}
            </div>
            <p className={`text-sm ${errors.cover ? "text-danger" : "text-ink-3"}`}>{errors.cover ?? "Không chọn cũng được, ảnh đầu tiên sẽ làm bìa."}</p>
          </div>
          <input ref={input} type="file" accept={UPLOAD_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>

      {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6">
        <button type="button" className={buttonClass("ghost")} onClick={onClose}>Huỷ</button>
        <button type="submit" className={buttonClass("primary")} disabled={busy}>{busy ? "Đang tạo..." : "Tạo album"}</button>
      </div>
    </form>
  );
}
