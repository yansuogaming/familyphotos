import Image from "@/components/ui/Image";

/** A photo tucked into an album sleeve, with a ruled memo strip below. */
export function PhotoSleeve({
  src,
  alt,
  memo,
  date,
  ratio = "4/3",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  memo?: string;
  date?: string;
  ratio?: "4/3" | "3/4" | "1/1";
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`rounded-[var(--radius-paper)] border border-line bg-paper p-2 paper-shadow ${className}`}>
      <div className="sleeve overflow-hidden rounded-[3px] bg-paper-3" style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} width={800} height={600} sizes={sizes} priority={priority} className="h-full w-full object-cover" />
      </div>
      {(memo || date) && (
        <figcaption className="memo-lines mt-2 flex items-baseline justify-between gap-3 px-1 font-hand text-[1.05rem] leading-6 text-ink-2">
          <span className="truncate">{memo}</span>
          {date && <span className="tabular shrink-0 text-sm text-ink-3">{date}</span>}
        </figcaption>
      )}
    </figure>
  );
}
