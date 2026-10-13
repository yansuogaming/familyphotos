"use client";

import { Check, Copy, LinkBreak } from "@/components/ui/icons";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { SwitchRow } from "@/components/ui/Switch";
import { mediaApi } from "@/lib/api/media";
import type { AlbumShare, ShareInput } from "@/lib/api/media-types";
import { Dialog, inputClass } from "./Modal";

const choices: { value: ShareInput["expiresInDays"]; label: string }[] = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: null, label: "Không hết hạn" },
];

export function ShareAlbumDialog({
  open,
  onClose,
  albumId,
  albumTitle,
  share,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  albumId: string;
  albumTitle: string;
  share: AlbumShare | null;
  onChange: (s: AlbumShare | null) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Chia sẻ cho khách"
      description={`Người có đường dẫn chỉ xem được album “${albumTitle}”, không thấy album khác hay tin nhắn.`}
      size="md"
    >
      <Body albumId={albumId} share={share} onChange={onChange} />
    </Dialog>
  );
}

function Body({ albumId, share, onChange }: { albumId: string; share: AlbumShare | null; onChange: (s: AlbumShare | null) => void }) {
  const initialDays: ShareInput["expiresInDays"] = share ? (share.expiresAt ? 30 : null) : 7;
  const [days, setDays] = useState<ShareInput["expiresInDays"]>(initialDays);
  const [allowDownload, setAllowDownload] = useState(share?.allowDownload ?? false);
  const [busy, setBusy] = useState<"save" | "stop" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy("save");
    setError(null);
    try {
      onChange(await mediaApi.share(albumId, { expiresInDays: days, allowDownload }));
    } catch {
      setError("Chưa tạo được đường dẫn. Thử lại nhé.");
    } finally {
      setBusy(null);
    }
  }

  async function stop() {
    setBusy("stop");
    try {
      await mediaApi.unshare(albumId);
      onChange(null);
    } catch {
      setError("Chưa tắt được. Thử lại nhé.");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Trình duyệt chưa cho chép. Hãy chọn đường dẫn rồi chép tay.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {share && (
        <div className="flex flex-col gap-2">
          <label htmlFor="share-url" className="text-sm font-semibold">Đường dẫn cho khách</label>
          <div className="flex gap-2">
            <input id="share-url" readOnly value={share.url} onFocus={(e) => e.target.select()} className={`${inputClass} tabular min-w-0 flex-1 text-sm`} />
            <button onClick={copy} className={buttonClass("secondary", "md", "shrink-0")} aria-live="polite">
              {copied ? <Check size={18} weight="bold" className="text-ok" /> : <Copy size={18} />} {copied ? "Đã chép" : "Chép"}
            </button>
          </div>
          <p className="text-sm text-ink-3">
            {share.expiresAt ? `Hết hạn ngày ${new Date(share.expiresAt).toLocaleDateString("vi-VN")}.` : "Đường dẫn không hết hạn."}{" "}
            {share.allowDownload ? "Khách được tải ảnh về." : "Khách chỉ được xem."}
          </p>
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-semibold">Thời hạn</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
          {choices.map((c) => (
            <label
              key={String(c.value)}
              className={`flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-coral ${
                days === c.value ? "border-coral bg-coral-wash text-coral-ink" : "border-line text-ink-2 hover:border-ink-3"
              }`}
            >
              <input type="radio" name="share-days" className="sr-only" checked={days === c.value} onChange={() => setDays(c.value)} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="border-y border-line">
        <SwitchRow checked={allowDownload} onChange={setAllowDownload} label="Cho khách tải ảnh về" description="Tắt thì khách chỉ xem trên trang." />
      </div>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {share && (
          <button onClick={stop} disabled={!!busy} className={buttonClass("ghost", "md", "mr-auto text-danger! hover:bg-paper-2")}>
            <LinkBreak size={18} /> {busy === "stop" ? "Đang tắt..." : "Ngừng chia sẻ"}
          </button>
        )}
        <button onClick={save} disabled={!!busy} className={buttonClass("primary")}>
          {busy === "save" ? "Đang lưu..." : share ? "Lưu thay đổi" : "Tạo đường dẫn"}
        </button>
      </div>
    </div>
  );
}
