"use client";

import { CameraRotate, Microphone, MicrophoneSlash, PhoneDisconnect, VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Portal, useModal } from "@/components/album/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { chatExtApi } from "@/lib/api/chat-ext";
import { isMock } from "@/lib/api/core";

type Phase = "calling" | "connected" | "ended";

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * Full-screen video call. Your own camera sits small in a corner.
 * Mock mode: the other side "answers" after a few seconds and shows a still frame.
 */
export function VideoCall({ open, conversationId, title, isGroup, onClose }: { open: boolean; conversationId: string; title: string; isGroup: boolean; onClose: () => void }) {
  return <Portal>{open && <Call conversationId={conversationId} title={title} isGroup={isGroup} onClose={onClose} />}</Portal>;
}

function Call({ conversationId, title, isGroup, onClose }: { conversationId: string; title: string; isGroup: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const self = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const callId = useRef<string | null>(null);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("calling");
  const [seconds, setSeconds] = useState(0);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [camState, setCamState] = useState<"pending" | "live" | "blocked">("pending");
  const [front, setFront] = useState(true);

  function end() {
    setPhase("ended");
    if (callId.current) void chatExtApi.endCall(callId.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    setTimeout(onClose, 1100);
  }
  useModal(root, end);

  // Start the call and ask for the camera.
  useEffect(() => {
    let alive = true;
    chatExtApi.startCall(conversationId).then((c) => {
      callId.current = c.id;
    }, () => alive && setPhase("ended"));
    const answer = isMock ? setTimeout(() => alive && setPhase((p) => (p === "calling" ? "connected" : p)), 3200) : undefined;
    const media = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true })
      : Promise.reject(new Error("no camera"));
    media.then(
      (s) => {
        if (!alive) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        if (self.current) self.current.srcObject = s;
        setCamState("live");
      },
      () => alive && setCamState("blocked"),
    );
    return () => {
      alive = false;
      clearTimeout(answer);
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [conversationId]);

  useEffect(() => {
    if (phase !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function toggleMic() {
    stream.current?.getAudioTracks().forEach((t) => (t.enabled = !mic));
    setMic(!mic);
  }
  function toggleCam() {
    stream.current?.getVideoTracks().forEach((t) => (t.enabled = !cam));
    setCam(!cam);
  }

  const status = phase === "calling" ? "Đang gọi..." : phase === "connected" ? clock(seconds) : "Cuộc gọi đã kết thúc";
  const ctl = "flex size-14 items-center justify-center rounded-full transition-colors";

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Gọi video với ${title}`}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[75] flex flex-col bg-[oklch(0.16_0.03_262)] text-on-cover outline-none"
    >
      {/* the other side */}
      <div className="absolute inset-0 overflow-hidden">
        {phase === "connected" && (
          <Image src={`https://picsum.photos/seed/fp-call-${conversationId}/1280/800`} alt="" fill sizes="100vw" className="object-cover" />
        )}
        <div className={`absolute inset-0 ${phase === "connected" ? "bg-linear-to-b from-[oklch(0_0_0/0.45)] via-transparent to-[oklch(0_0_0/0.55)]" : ""}`} />
      </div>

      <div className="relative flex flex-1 flex-col items-center px-6 pt-16 text-center">
        {phase !== "connected" && (
          <div className="relative mt-[8vh]">
            {phase === "calling" && !reduce && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-coral"
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden="true"
              />
            )}
            <Avatar user={{ name: title }} size="lg" />
          </div>
        )}
        <p className="mt-6 font-display text-3xl font-semibold drop-shadow-sm">{title}</p>
        <p className="tabular mt-1 text-on-cover/80" aria-live="polite">{isGroup && phase === "calling" ? "Đang gọi cả nhóm..." : status}</p>
        {phase === "connected" && !mic && <p className="mt-3 rounded-full bg-[oklch(0_0_0/0.4)] px-3 py-1 text-sm">Mic của bạn đang tắt</p>}
      </div>

      {/* you, small in the corner */}
      <div className="absolute right-4 top-4 aspect-[3/4] w-28 overflow-hidden rounded-[10px] border border-[oklch(1_0_0/0.2)] bg-[oklch(0.24_0.04_262)] shadow-[0_12px_32px_-12px_oklch(0_0_0/0.7)] sm:w-40">
        <video ref={self} autoPlay playsInline muted className={`size-full object-cover ${front ? "-scale-x-100" : ""} ${cam && camState === "live" ? "" : "invisible"}`} />
        {(!cam || camState !== "live") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center text-xs text-on-cover/80">
            <VideoCameraSlash size={22} />
            {camState === "pending" ? "Đang mở camera..." : camState === "blocked" ? "Chưa có quyền camera" : "Camera đang tắt"}
          </div>
        )}
        <span className="absolute bottom-1.5 left-2 text-[0.7rem] font-semibold drop-shadow">Bạn</span>
      </div>

      <div className="relative flex items-center justify-center gap-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
        <button onClick={toggleMic} aria-pressed={!mic} aria-label={mic ? "Tắt mic" : "Bật mic"} title={mic ? "Tắt mic" : "Bật mic"} disabled={phase === "ended"} className={`${ctl} ${mic ? "bg-[oklch(1_0_0/0.14)] hover:bg-[oklch(1_0_0/0.22)]" : "bg-paper text-ink"}`}>
          {mic ? <Microphone size={24} /> : <MicrophoneSlash size={24} />}
        </button>
        <button onClick={toggleCam} aria-pressed={!cam} aria-label={cam ? "Tắt camera" : "Bật camera"} title={cam ? "Tắt camera" : "Bật camera"} disabled={phase === "ended"} className={`${ctl} ${cam ? "bg-[oklch(1_0_0/0.14)] hover:bg-[oklch(1_0_0/0.22)]" : "bg-paper text-ink"}`}>
          {cam ? <VideoCamera size={24} /> : <VideoCameraSlash size={24} />}
        </button>
        <button onClick={() => setFront((f) => !f)} aria-label="Đổi camera trước, sau" title="Đổi camera" disabled={phase === "ended"} className={`${ctl} bg-[oklch(1_0_0/0.14)] hover:bg-[oklch(1_0_0/0.22)] sm:hidden`}>
          <CameraRotate size={24} />
        </button>
        <button onClick={end} disabled={phase === "ended"} aria-label="Kết thúc cuộc gọi" title="Kết thúc" className={`${ctl} w-20 bg-danger text-paper hover:opacity-90 disabled:opacity-60`}>
          <PhoneDisconnect size={26} weight="fill" />
        </button>
      </div>
    </motion.div>
  );
}
