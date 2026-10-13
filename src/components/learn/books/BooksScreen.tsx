"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Chips, EmptyNote, LearnHeader } from "@/components/learn/practice/shared";
import { Button } from "@/components/ui/Button";
import { practiceApi } from "@/lib/api/practice";
import type { BookSummary } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { BookReader } from "./BookReader";

/** /hoc/sach. `?cuon=<bookId>&trang=<n>` opens the reader. */
export function BooksScreen() {
  const params = useSearchParams();
  const id = params.get("cuon");
  if (id) return <BookReader key={id} id={id} page={Math.max(1, Number(params.get("trang")) || 1)} />;
  return <Shelves />;
}

function Shelves() {
  const user = useSession()?.user;
  const books = useApi(practiceApi.books);
  const [picked, setPicked] = useState<number | null>(null);

  const all = books.status === "ready" ? books.data : [];
  const gradesHere = [...new Set(all.map((b) => b.grade))].sort((a, b) => a - b);
  const grade = picked ?? (user?.grade && gradesHere.includes(user.grade) ? user.grade : 0);
  const shown = all.filter((b) => !grade || b.grade === grade);
  const sgk = shown.filter((b) => b.kind === "sgk");
  const extra = shown.filter((b) => b.kind === "doc-them");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <LearnHeader title="Sách" />
      <p className="mt-2 max-w-2xl text-ink-2 sm:pl-14">Sách giáo khoa và sách đọc thêm của nhà mình. Bấm vào một cuốn để đọc, có thể đánh dấu trang.</p>

      {books.status === "ready" && (
        <Chips className="mt-6 sm:pl-14" label="Lớp" value={grade} onChange={setPicked} options={[{ value: 0, label: "Cả nhà" }, ...gradesHere.map((g) => ({ value: g, label: `Lớp ${g}` }))]} />
      )}

      <div className="mt-8 flex flex-col gap-12 sm:pl-14">
        {books.status === "loading" && <ShelfSkeleton />}
        {books.status === "error" && <LoadError onRetry={books.reload} what="kệ sách" />}
        {books.status === "ready" && shown.length === 0 && (
          <EmptyNote title="Kệ này còn trống" action={<Button variant="secondary" onClick={() => setPicked(0)}>Xem cả nhà</Button>}>
            Chưa có sách cho lớp này. Bố mẹ có thể thêm sách trong phần quản trị học liệu.
          </EmptyNote>
        )}
        {sgk.length > 0 && <Shelf title="Sách giáo khoa" books={sgk} />}
        {extra.length > 0 && <Shelf title="Sách đọc thêm" books={extra} />}
      </div>
    </div>
  );
}

function Shelf({ title, books }: { title: string; books: BookSummary[] }) {
  return (
    <section aria-labelledby={`ke-${title}`}>
      <h2 id={`ke-${title}`} className="text-xl font-bold">
        {title} <span className="tabular text-base font-normal text-ink-3">{books.length} cuốn</span>
      </h2>
      <ul className="mt-4 flex overflow-x-auto px-3 pb-2 pt-3">
        {books.map((b) => (
          <li key={b.id} className="w-32 shrink-0 sm:w-36">
            <Link href={`/hoc/sach?cuon=${b.id}`} className="group block px-2 sm:px-3" aria-label={`${b.title}, ${b.publisher}`}>
              <span
                className="relative block aspect-[5/7] overflow-hidden rounded-l-[2px] rounded-r-[4px] bg-paper-3 shadow-[inset_7px_0_8px_-5px_oklch(0_0_0/0.4),0_10px_16px_-10px_hsl(var(--shadow)/0.6)] transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-2"
              >
                <Image src={b.coverUrl} alt="" fill sizes="144px" className="object-cover" />
                <span className="absolute inset-x-2 bottom-2 rounded-[3px] bg-paper/90 px-1.5 py-1 text-[0.7rem] font-semibold leading-tight text-ink">{b.title}</span>
              </span>
            </Link>
            {/* one segment of the shelf plank, so the plank scrolls with the books */}
            <span aria-hidden="true" className="block h-3 bg-paper-3 shadow-[0_6px_10px_-6px_hsl(var(--shadow)/0.5)]" />
            <span className="mt-2 block truncate px-2 text-xs text-ink-3 sm:px-3">{b.kind === "sgk" ? `${b.publisher}, lớp ${b.grade}` : b.publisher}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShelfSkeleton() {
  return (
    <div aria-busy="true">
      <div className="h-7 w-48 animate-pulse rounded bg-paper-3" />
      <div className="mt-4 flex gap-6 px-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-28 shrink-0 animate-pulse rounded bg-paper-2 sm:w-32" style={{ aspectRatio: "5 / 7" }} />
        ))}
      </div>
      <div className="h-3 bg-paper-3" />
    </div>
  );
}
