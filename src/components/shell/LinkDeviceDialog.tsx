"use client";

import { Check, CheckCircle, Copy, Desktop, DeviceMobile } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { Dialog } from "@/components/album/Modal";
import { buttonClass } from "@/components/ui/Button";
import { isMock } from "@/lib/api/core";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/**
 * "Đăng nhập trên máy khác": on a phone, scan the QR shown by the other browser;
 * on a computer, explains how to do it from the phone.
 */
export function LinkDeviceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Đăng nhập trên máy khác" description="Không cần gõ mật khẩu. Máy kia hiện mã QR, điện thoại của bạn quét mã là xong." size="md">
      <Body onClose={onClose} />
    </Dialog>
  );
}

function Body({ onClose }: { onClose: () => void }) {
  const phone = useMediaQuery("(max-width: 767px), (pointer: coarse)");
  const [picked, setPicked] = useState<"phone" | "desktop" | null>(null);
  const view = picked ?? (phone ? "phone" : "desktop");
  const tabs = [
    { id: "phone" as const, label: "Quét bằng máy này", icon: DeviceMobile },
    { id: "desktop" as const, label: "Hướng dẫn", icon: Desktop },
  ];

  function onKey(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = view === "phone" ? "desktop" : "phone";
    setPicked(next);
    requestAnimationFrame(() => document.getElementById(`link-tab-${next}`)?.focus());
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Cách đăng nhập" onKeyDown={onKey} className="grid grid-cols-2 gap-1 rounded-full border border-line bg-paper-2 p-1">
        {tabs.map(({ id, label, icon: I }) => (
          <button
            key={id}
            id={`link-tab-${id}`}
            role="tab"
            aria-selected={view === id}
            aria-controls="link-panel"
            tabIndex={view === id ? 0 : -1}
            onClick={() => setPicked(id)}
            className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors ${view === id ? "bg-paper text-ink shadow-[0_1px_2px_hsl(var(--shadow)/0.15)]" : "text-ink-2 hover:text-ink"}`}
          >
            <I size={18} /> {label}
          </button>
        ))}
      </div>
      <div id="link-panel" role="tabpanel" aria-labelledby={`link-tab-${view}`}>
        {view === "phone" ? <Scanner onClose={onClose} /> : <Steps />}
      </div>
    </div>
  );
}

function Scanner({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"scanning" | "found" | "done">("scanning");

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" aria-live="polite">
        <CheckCircle size={56} weight="fill" className="text-ok" />
        <p className="font-display text-xl font-semibold">Đã mở cửa cho máy kia</p>
        <p className="max-w-[36ch] text-sm text-ink-2">Chrome trên Windows đã đăng nhập bằng tài khoản của bạn. Xem hoặc đăng xuất máy đó trong Cài đặt.</p>
        <div className="mt-2 flex gap-2">
          <Link href="/cai-dat#may-tinh" onClick={onClose} className={buttonClass("secondary")}>Quản lý thiết bị</Link>
          <button onClick={onClose} className={buttonClass("primary")}>Xong</button>
        </div>
      </div>
    );
  }

  if (phase === "found") {
    return (
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="rounded-[var(--radius-paper)] border border-line bg-paper-2 p-4">
          <p className="text-sm text-ink-3">Có máy muốn vào nhà:</p>
          <p className="mt-1 flex items-center gap-2 font-semibold"><Desktop size={20} className="text-coral-ink" /> Chrome trên Windows</p>
          <p className="text-sm text-ink-2">Hà Nội, Việt Nam. Vừa xong.</p>
        </div>
        <p className="text-sm text-ink-2">Chỉ xác nhận nếu chính bạn đang ngồi trước máy đó.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setPhase("scanning")} className={buttonClass("ghost")}>Không phải tôi</button>
          <button onClick={() => setPhase("done")} className={buttonClass("primary")} data-autofocus>Cho máy này vào</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* simulated camera view */}
      <div className="relative aspect-square w-full max-w-72 overflow-hidden rounded-[14px] bg-[oklch(0.16_0.03_262)]" role="img" aria-label="Khung quét mã QR">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,oklch(0.3_0.04_262),transparent_70%)]" />
        <div className="absolute inset-[18%]">
          {["left-0 top-0 border-l-4 border-t-4 rounded-tl-lg", "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg"].map((c) => (
            <span key={c} className={`absolute size-8 border-coral ${c}`} />
          ))}
          <motion.span
            className="absolute inset-x-2 h-0.5 rounded-full bg-coral shadow-[0_0_12px_2px_var(--coral)]"
            initial={{ top: "10%" }}
            animate={reduce ? { top: "50%" } : { top: ["10%", "90%", "10%"] }}
            transition={reduce ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <p className="absolute inset-x-0 bottom-3 text-center text-xs font-semibold text-[oklch(0.95_0.01_262/0.85)]">Đưa mã QR vào trong khung</p>
      </div>
      <p className="max-w-[40ch] text-center text-sm text-ink-2">
        Trên máy kia, mở trang đăng nhập Family Photos và chọn <span className="font-semibold text-ink">Quét mã QR</span>. Rồi hướng camera điện thoại vào mã.
      </p>
      {isMock && (
        <button onClick={() => setPhase("found")} className="text-sm font-semibold text-coral-ink underline decoration-dotted">
          Demo: giả lập quét được mã
        </button>
      )}
    </div>
  );
}

function Steps() {
  const url = `${location.origin}/dang-nhap`;
  const [copied, setCopied] = useState(false);
  const steps = [
    <>Trên máy muốn đăng nhập, mở <span className="tabular font-semibold text-ink">{url.replace(/^https?:\/\//, "")}</span>.</>,
    <>Chọn <span className="font-semibold text-ink">Quét mã QR</span>. Máy đó sẽ hiện một mã vuông, dùng được 60 giây.</>,
    <>Trên điện thoại đã đăng nhập, bấm ảnh đại diện, chọn <span className="font-semibold text-ink">Đăng nhập trên máy khác</span> rồi quét mã.</>,
    <>Bấm <span className="font-semibold text-ink">Cho máy này vào</span> trên điện thoại. Máy kia tự mở nhà.</>,
  ];

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col gap-4">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-full bg-coral-wash font-display text-sm font-bold text-coral-ink">{i + 1}</span>
            <p className="pt-1 text-ink-2">{s}</p>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-paper)] border border-line bg-paper-2 p-3">
        <p className="min-w-0 flex-1 text-sm text-ink-2">Gửi đường dẫn trang đăng nhập sang máy kia cho nhanh.</p>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
          className={buttonClass("secondary", "sm")}
          aria-live="polite"
        >
          {copied ? <Check size={16} weight="bold" className="text-ok" /> : <Copy size={16} />} {copied ? "Đã chép" : "Chép đường dẫn"}
        </button>
      </div>
      <p className="text-sm text-ink-3">
        Máy nào đang đăng nhập thì xem ở{" "}
        <Link href="/cai-dat#may-tinh" className="font-semibold text-coral-ink underline">Cài đặt, Thiết bị</Link>.
      </p>
    </div>
  );
}
