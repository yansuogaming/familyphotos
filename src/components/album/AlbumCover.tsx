import Image from "@/components/ui/Image";
import Link from "next/link";

/** Vinyl album cover with a photo window and a title label. */
export function AlbumCover({
  href,
  title,
  coverUrl,
  meta,
  className = "",
}: {
  href: string;
  title: string;
  coverUrl: string;
  meta: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group vinyl relative flex aspect-[4/5] flex-col rounded-[8px] p-4 text-on-cover paper-shadow transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:-rotate-1 ${className}`}
    >
      {/* spine */}
      <span className="absolute inset-y-0 left-0 w-3 rounded-l-[8px] bg-[oklch(0_0_0/0.18)]" aria-hidden="true" />
      <div className="sleeve relative ml-2 flex-1 overflow-hidden rounded-[3px] ring-1 ring-[oklch(1_0_0/0.12)]">
        <Image src={coverUrl} alt="" fill sizes="(min-width: 1024px) 240px, 45vw" className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]" />
      </div>
      <div className="ml-2 mt-3 rounded-[3px] bg-[oklch(0.97_0.008_275)] px-3 py-2 text-[oklch(0.25_0.045_265)]">
        <p className="font-display text-base font-semibold leading-tight">{title}</p>
        <p className="tabular text-xs text-[oklch(0.45_0.035_265)]">{meta}</p>
      </div>
    </Link>
  );
}
