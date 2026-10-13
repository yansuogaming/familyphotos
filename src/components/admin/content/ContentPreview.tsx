"use client";

/* eslint-disable @next/next/no-img-element -- previews may be local data URLs */
import { ArrowRight, BookOpenText, ChatsCircle, HouseLine, Images, LockKey, QrCode, Password, Sparkle, UserCirclePlus } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import type { SiteContent } from "@/lib/api/site-types";
import { splitHighlight } from "../site/SiteSlots";

/** Photo in a plastic sleeve, like PhotoSleeve but safe for any URL. */
function Sleeve({ url, memo, date }: { url: string; memo: string; date: string }) {
  return (
    <figure className="rounded-[var(--radius-paper)] border border-line bg-paper p-2 paper-shadow">
      <div className="sleeve aspect-[4/3] overflow-hidden rounded-[3px] bg-paper-3">
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
      <figcaption className="memo-lines mt-2 flex items-baseline justify-between gap-3 px-1 font-hand text-[1.05rem] leading-6 text-ink-2">
        <span className="truncate">{memo}</span>
        <span className="tabular shrink-0 text-sm text-ink-3">{date}</span>
      </figcaption>
    </figure>
  );
}

function MiniBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="size-8" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-semibold tracking-tight">Family Photos</span>
        <span className="mt-1 text-xs opacity-70">Kho ảnh gia đình</span>
      </span>
    </div>
  );
}

function Btn({ children, ghost = false }: { children: ReactNode; ghost?: boolean }) {
  return (
    <span className={`inline-flex h-13 items-center gap-2 rounded-full px-7 font-semibold ${ghost ? "border border-line bg-paper text-ink" : "bg-coral text-on-coral"}`}>{children}</span>
  );
}

export function LandingPreview({ c }: { c: SiteContent["landing"] }) {
  const { before, mark, after } = splitHighlight(c.heroTitle, c.heroHighlight);
  return (
    <div className="w-[1280px] bg-paper text-ink">
      <div className="flex h-16 items-center justify-between border-b border-line px-6">
        <MiniBrand />
        <div className="flex gap-6 text-sm font-medium text-ink-2">
          <span className="flex items-center gap-2"><Images size={18} /> Ảnh</span>
          <span className="flex items-center gap-2"><ChatsCircle size={18} /> Chat riêng</span>
          <span className="flex items-center gap-2"><BookOpenText size={18} /> Học</span>
          <span className="flex items-center gap-2"><Sparkle size={18} /> Trợ lý AI</span>
        </div>
        <span className="inline-flex h-9 items-center rounded-full bg-coral px-4 text-sm font-semibold text-on-coral">Vào nhà</span>
      </div>

      <section id="pv-hero" className="grid grid-cols-12 items-center gap-10 px-6 py-16">
        <div className="col-span-5 flex flex-col gap-7">
          <h1 className="text-[3.6rem] font-bold leading-[1.05] tracking-[-0.035em]">
            {before}
            {mark && <span className="text-coral-ink">{mark}</span>}
            {after}
          </h1>
          <p className="max-w-[34ch] text-lg leading-relaxed text-ink-2">{c.heroLead}</p>
          <Btn>Vào nhà <ArrowRight size={18} weight="bold" /></Btn>
        </div>
        <div className="col-span-7">
          <div className="relative mx-auto w-full max-w-[720px]">
            <div className="vinyl absolute -inset-4 rounded-[10px]" />
            <div className="relative grid grid-cols-2">
              <div className="flex flex-col gap-4 rounded-l-[var(--radius-paper)] bg-paper-2 p-5">
                {c.album.slice(0, 2).map((p, i) => <Sleeve key={i} url={p.url} memo={p.memo} date={p.date} />)}
              </div>
              <div className="flex flex-col gap-4 rounded-r-[var(--radius-paper)] bg-paper-2 p-5">
                {c.album.slice(2, 4).map((p, i) => <Sleeve key={i} url={p.url} memo={p.memo} date={p.date} />)}
              </div>
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
              <div className="absolute -top-4 left-[calc(50%-0.5rem)] h-[calc(100%+2.5rem)] w-4 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-10px),0_100%)]" />
            </div>
          </div>
        </div>
      </section>

      <section id="pv-photos" className="border-t border-line bg-paper-2 px-6 py-20">
        <h2 className="max-w-2xl text-5xl font-bold">{c.photos.title}</h2>
        <p className="mt-4 max-w-[58ch] text-lg text-ink-2">{c.photos.body}</p>
        <div className="mt-10 flex gap-6">
          {[0, 1, 2, 3].map((i) => <div key={i} className="vinyl aspect-[4/5] w-56 rounded-[8px]" />)}
        </div>
      </section>

      <section id="pv-chat" className="grid grid-cols-12 gap-12 px-6 py-20">
        <div className="col-span-5">
          <h2 className="text-5xl font-bold">{c.chat.title}</h2>
          <p className="mt-4 max-w-[46ch] text-lg text-ink-2">{c.chat.body}</p>
        </div>
        <div className="col-span-6 col-start-7 flex flex-col gap-4 rounded-[var(--radius-paper)] border border-line bg-paper-2 p-8">
          {[70, 50, 60].map((w, i) => <div key={i} className={`h-12 rounded-2xl ${i === 1 ? "self-end bg-coral-wash" : "bg-paper"}`} style={{ width: `${w}%` }} />)}
        </div>
      </section>

      <section id="pv-learn" className="oli border-y border-line py-20">
        <div className="oli-margin mx-auto max-w-5xl pl-20 pr-6">
          <h2 className="text-5xl font-bold">{c.learn.title}</h2>
          <p className="mt-4 max-w-[52ch] text-lg text-ink-2">{c.learn.body}</p>
        </div>
      </section>

      <section id="pv-assistant" className="px-6 py-20">
        <h2 className="max-w-3xl text-5xl font-bold">{c.assistant.title}</h2>
        <p className="mt-4 max-w-[56ch] text-lg text-ink-2">{c.assistant.body}</p>
      </section>

      <section id="pv-privacy" className="vinyl px-6 py-20 text-on-cover">
        <LockKey size={36} className="text-coral" />
        <p className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-tight">{c.privacy.statement}</p>
        <dl className="mt-14 grid grid-cols-3 divide-x divide-[oklch(1_0_0/0.14)]">
          {c.privacy.points.map((p, i) => (
            <div key={i} className="px-8 first:pl-0">
              <dt className="font-semibold">{p.title}</dt>
              <dd className="mt-2 text-[oklch(0.82_0.02_262)]">{p.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="pv-closing" className="flex items-center justify-between px-6 py-20">
        <h2 className="text-4xl font-bold">{c.closing}</h2>
        <div className="flex gap-3">
          <Btn ghost>Đăng ký</Btn>
          <Btn>Vào nhà <ArrowRight size={18} weight="bold" /></Btn>
        </div>
      </section>
    </div>
  );
}

const coverPositions = ["-rotate-6 left-0 top-6", "rotate-3 right-0 top-0", "-rotate-1 left-12 top-24"];

function AuthFrame({ c, children }: { c: SiteContent["login"]; children: ReactNode }) {
  return (
    <div className="grid h-[760px] w-[1280px] grid-cols-[5fr_7fr] bg-paper text-ink">
      <aside className="vinyl relative flex flex-col justify-between overflow-hidden p-10 text-on-cover">
        <span className="absolute inset-y-0 left-0 w-5 bg-[oklch(0_0_0/0.2)]" />
        <div className="pl-6"><MiniBrand /></div>
        <div className="relative mx-auto h-80 w-full max-w-sm">
          {c.coverPhotos.map((p, i) => (
            <div key={i} className={`absolute w-56 rounded-[4px] bg-[oklch(0.98_0.005_275)] p-2 pb-8 shadow-[0_18px_40px_-12px_oklch(0_0_0/0.5)] ${coverPositions[i]}`}>
              <img src={p.url} alt="" className="aspect-[4/3] w-full object-cover" />
            </div>
          ))}
        </div>
        <p className="max-w-sm pl-6 font-display text-2xl font-semibold leading-snug">{c.coverLine}</p>
      </aside>
      <div className="flex items-center justify-center px-8">{children}</div>
    </div>
  );
}

export function LoginPreview({ c }: { c: SiteContent["login"] }) {
  return (
    <AuthFrame c={c}>
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold">{c.greetingTitle}</h1>
        <p className="mt-2 text-ink-2">{c.greeting}</p>
        <div className="mt-8 grid grid-cols-2 rounded-full border border-line bg-paper-2 p-1">
          <span className="flex h-10 items-center justify-center gap-2 rounded-full bg-paper text-sm font-semibold"><QrCode size={18} /> Mã QR</span>
          <span className="flex h-10 items-center justify-center gap-2 text-sm font-semibold text-ink-2"><Password size={18} /> Mật khẩu</span>
        </div>
        <div className="mt-8 flex h-72 items-center justify-center rounded-[var(--radius-paper)] border border-line bg-paper-2">
          <div className="size-[220px] rounded-[var(--radius-paper)] border border-line bg-white" />
        </div>
      </div>
    </AuthFrame>
  );
}

export function RegisterPreview({ c, cover, sent = false }: { c: SiteContent["register"]; cover: SiteContent["login"]; sent?: boolean }) {
  return (
    <AuthFrame c={cover}>
      {sent ? (
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold">{c.sentTitle}</h1>
          <p className="mt-3 text-ink-2">{c.sentBody}</p>
          <p className="mt-8 font-semibold text-coral-ink underline">Quay lại đăng nhập</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold">{c.title}</h1>
          <p className="mt-2 text-ink-2">{c.lead}</p>
          <div className="mt-8 flex flex-col gap-3">
            {([
              [c.member, HouseLine],
              [c.guest, UserCirclePlus],
            ] as const).map(([o, Icon], i) => (
              <div key={i} className="flex items-start gap-4 rounded-[var(--radius-paper)] border border-line bg-paper p-5">
                <Icon size={28} className="mt-0.5 shrink-0 text-coral-ink" />
                <span>
                  <span className="block font-display text-xl font-semibold">{o.title}</span>
                  <span className="mt-1 block text-sm text-ink-2">{o.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AuthFrame>
  );
}
