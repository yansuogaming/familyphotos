"use client";

import { usePathname } from "next/navigation";
// Client islands that show admin-editable copy on the public pages.
// They render the defaults on the server and swap in saved content after
// hydration (useSiteContent), so the static shell never changes shape.
import { AlbumCover } from "@/components/album/AlbumCover";
import Image from "@/components/ui/Image";
import { useSiteContent } from "@/lib/api/site";
import type { SiteContent } from "@/lib/api/site-types";

const text = {
  "landing.heroLead": (c) => c.landing.heroLead,
  "landing.photos.title": (c) => c.landing.photos.title,
  "landing.photos.body": (c) => c.landing.photos.body,
  "landing.chat.title": (c) => c.landing.chat.title,
  "landing.chat.body": (c) => c.landing.chat.body,
  "landing.learn.title": (c) => c.landing.learn.title,
  "landing.learn.body": (c) => c.landing.learn.body,
  "landing.assistant.title": (c) => c.landing.assistant.title,
  "landing.assistant.body": (c) => c.landing.assistant.body,
  "landing.privacy.statement": (c) => c.landing.privacy.statement,
  "landing.closing": (c) => c.landing.closing,
  "login.coverLine": (c) => c.login.coverLine,
  "login.greetingTitle": (c) => c.login.greetingTitle,
  "login.greeting": (c) => c.login.greeting,
} satisfies Record<string, (c: SiteContent) => string>;

export type SiteTextKey = keyof typeof text;

/** A plain string from the site content. */
export function SiteText({ k }: { k: SiteTextKey }) {
  const c = useSiteContent();
  return <>{text[k](c)}</>;
}

/** Splits a headline around the part shown in coral. */
export function splitHighlight(title: string, highlight: string) {
  const at = highlight ? title.indexOf(highlight) : -1;
  return at < 0 ? { before: title, mark: "", after: "" } : { before: title.slice(0, at), mark: highlight, after: title.slice(at + highlight.length) };
}

/** Hero headline with its coral phrase. Goes inside the page's <h1>. */
export function HeroTitle() {
  const { heroTitle, heroHighlight } = useSiteContent().landing;
  const { before, mark, after } = splitHighlight(heroTitle, heroHighlight);
  return (
    <>
      {before}
      {mark && <span className="text-coral-ink">{mark}</span>}
      {after}
    </>
  );
}

/** The three short points under the privacy statement. Goes inside the page's <dl>. */
export function PrivacyPoints() {
  const { points } = useSiteContent().landing.privacy;
  return (
    <>
      {points.map((p, i) => (
        <div key={i} className="sm:px-8 sm:first:pl-0">
          <dt className="font-semibold">{p.title}</dt>
          <dd className="mt-2 text-[oklch(0.82_0.02_262)]">{p.body}</dd>
        </div>
      ))}
    </>
  );
}

const coverPositions = ["-rotate-6 left-0 top-6", "rotate-3 right-0 top-0", "-rotate-1 left-12 top-24"];

/** Three photos stacked on the closed album cover. Login and register each have their own set. */
export function LoginCoverPhotos() {
  const c = useSiteContent();
  const photos = usePathname().startsWith("/register") ? c.register.coverPhotos : c.login.coverPhotos;
  return (
    <>
      {photos.map((p, i) => (
        <div key={i} className={`absolute w-56 rounded-[4px] bg-[oklch(0.98_0.005_275)] p-2 pb-8 shadow-[0_18px_40px_-12px_oklch(0_0_0/0.5)] ${coverPositions[i] ?? coverPositions[0]}`}>
          <Image src={p.url} alt={p.alt} width={600} height={450} className="aspect-[4/3] w-full object-cover" sizes="224px" />
        </div>
      ))}
    </>
  );
}

/** The landing shelf: illustrative albums the admin picks, never the family's real ones. */
export function LandingShelf() {
  const shelf = useSiteContent().landing.shelf;
  return (
    <>
      {shelf.map((a, i) => (
        <AlbumCover
          key={i}
          href="/login"
          title={a.title}
          coverUrl={a.image.url}
          meta="Ảnh minh hoạ"
          className="w-56 shrink-0 snap-start sm:w-64 lg:w-auto"
        />
      ))}
    </>
  );
}
