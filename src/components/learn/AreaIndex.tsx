import Link from "next/link";
import type { LearningArea } from "@/lib/api/types";

/** The notebook's table of contents: title, description, dot leader, count. */
export function AreaIndex({ areas, linkTo }: { areas: LearningArea[]; linkTo?: string }) {
  return (
    <ol>
      {areas.map((area) => (
        <li key={area.id}>
          <Link href={linkTo ?? area.href} className="group flex items-baseline gap-4 py-4">
            <span className="font-display text-2xl font-semibold transition-colors group-hover:text-coral-ink sm:text-4xl">{area.title}</span>
            <span className="hidden text-ink-2 md:inline">{area.description}</span>
            <span className="mx-1 flex-1 -translate-y-[0.3em] border-b-2 border-dotted border-rule" aria-hidden="true" />
            <span className="tabular font-hand text-xl text-ink-2">
              {area.itemCount.toLocaleString("vi-VN")}
              <span className="sr-only"> mục</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
