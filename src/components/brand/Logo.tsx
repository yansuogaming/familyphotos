import Link from "next/link";

/** Brand mark: the orange house holding a photo. Authored brand asset, not an icon. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 3 37 16v19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V16Z" fill="var(--coral)" />
      <g transform="rotate(-6 20 25)">
        <rect x="9.5" y="15" width="21" height="17" rx="1.5" fill="var(--paper)" />
        <rect x="11.5" y="17" width="17" height="11" rx="0.5" fill="var(--cover)" />
        <circle cx="24.5" cy="20.5" r="2" fill="var(--coral)" />
        <path d="m11.5 28 5-5.5 3.5 3.5 2.5-2 6 4Z" fill="var(--coral-strong)" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", tagline = true }: { href?: string; tagline?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 rounded-md" aria-label="Family Photos, về trang chủ">
      <LogoMark className="size-8 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-semibold tracking-tight">Family Photos</span>
        {tagline && <span className="mt-1 text-xs text-ink-3">Kho ảnh gia đình</span>}
      </span>
    </Link>
  );
}
