"use client";

/* eslint-disable @next/next/no-img-element -- library images may be local data URLs */
import { Copy, Trash } from "@/components/ui/icons";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDateTime, useToast } from "@/components/settings/shared";
import { adminApi } from "@/lib/api/admin";
import type { MediaAsset } from "@/lib/api/admin-types";
import { ConfirmDialog, ErrorNote, Modal, TextArea, TextField, errorText } from "../ui";
import { useUnsavedChanges } from "../unsaved";
import { formatSize, splitName } from "./format";

/** Large preview plus name, alt text, where it is used, and delete. */
export function MediaDetail({
  asset,
  open,
  onClose,
  onSaved,
  onRemoved,
}: {
  asset: MediaAsset;
  open: boolean;
  onClose: () => void;
  onSaved: (next: MediaAsset) => void;
  onRemoved: (id: string) => void;
}) {
  const toast = useToast();
  const [base, ext] = splitName(asset.name);
  const [name, setName] = useState(base);
  const [alt, setAlt] = useState(asset.alt);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const dirty = open && (name.trim() !== base || alt.trim() !== asset.alt);
  useUnsavedChanges(dirty);
  const used = asset.usedIn.length;

  async function save() {
    const clean = name.trim();
    if (!clean) return setNameError("Ảnh cần có tên.");
    if (/[\\/:*?"<>|]/.test(clean)) return setNameError('Tên không được chứa các ký tự \\ / : * ? " < > |');
    setNameError(null);
    setError(null);
    setBusy(true);
    try {
      const next = await adminApi.media.update(asset.id, { name: clean + ext, alt: alt.trim() });
      onSaved(next);
      toast("Đã lưu thông tin ảnh.");
      onClose();
    } catch (e) {
      setError(errorText(e, "Chưa lưu được. Thử lại sau ít phút."));
    } finally {
      setBusy(false);
    }
  }

  function copyUrl() {
    if (!navigator.clipboard) return setError("Trình duyệt này không cho sao chép tự động.");
    navigator.clipboard.writeText(asset.url).then(
      () => toast("Đã sao chép đường dẫn ảnh."),
      () => setError("Trình duyệt chặn việc sao chép. Thử lại sau khi bấm vào trang."),
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={asset.name}
      description={`${asset.width} x ${asset.height} px, ${formatSize(asset.sizeBytes)}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => setConfirming(true)} disabled={busy} className="mr-auto text-danger hover:text-danger">
            <Trash size={18} /> Xoá ảnh
          </Button>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button onClick={save} disabled={busy || !dirty}>{busy ? "Đang lưu..." : "Lưu"}</Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="sleeve flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper-3">
            <img src={asset.url} alt={asset.alt} className="max-h-full max-w-full object-contain" />
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-ink-3">Tải lên</dt>
            <dd className="tabular">{formatDateTime(asset.uploadedAt)}</dd>
            <dt className="text-ink-3">Người tải</dt>
            <dd>{asset.uploadedBy.name}</dd>
          </dl>
          <Button variant="secondary" size="sm" onClick={copyUrl} className="self-start">
            <Copy size={16} /> Sao chép đường dẫn
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <TextField
            label="Tên tệp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError ?? undefined}
            hint={ext ? `Phần đuôi ${ext} được giữ nguyên.` : undefined}
            required
          />
          <TextArea
            label="Mô tả ảnh"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            hint="Một câu tả ảnh cho người dùng trình đọc màn hình."
            rows={3}
          />
          <div>
            <p className="text-sm font-semibold">Đang dùng ở</p>
            {used > 0 ? (
              <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-2">
                {asset.usedIn.map((u) => (
                  <li key={u} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-coral" />
                    {u}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-3">Chưa dùng ở đâu. Xoá ảnh này không ảnh hưởng trang nào.</p>
            )}
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Xoá ảnh này khỏi thư viện?"
        typeToConfirm={used > 0 ? asset.name : undefined}
        body={
          used > 0 ? (
            <div className="flex flex-col gap-2">
              <p>Ảnh đang được dùng ở {used} chỗ. Sau khi xoá, những chỗ này sẽ bị mất ảnh:</p>
              <ul className="list-disc pl-5 text-ink">
                {asset.usedIn.map((u) => <li key={u}>{u}</li>)}
              </ul>
              <p>Hãy chọn ảnh khác cho các chỗ đó sau khi xoá.</p>
            </div>
          ) : (
            <p>&quot;{asset.name}&quot; sẽ bị xoá vĩnh viễn. Không thể hoàn tác.</p>
          )
        }
        confirmLabel="Xoá ảnh"
        onConfirm={async () => {
          await adminApi.media.remove(asset.id);
          onRemoved(asset.id);
          toast(`Đã xoá "${asset.name}".`);
        }}
      />
    </Modal>
  );
}
