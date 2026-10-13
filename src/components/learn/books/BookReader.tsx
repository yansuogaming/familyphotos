"use client";

import { ArrowLeft, ArrowRight, BookmarkSimple, CaretDown, MagnifyingGlassMinus, MagnifyingGlassPlus, X } from "@/components/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { LearnHeader } from "@/components/learn/practice/shared";
import { Button, IconButton } from "@/components/ui/Button";
import { practiceApi } from "@/lib/api/practice";
import type { BookDetail } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";

const ease = [0.16, 1, 0.3, 1] as const;

export function BookReader({ id, page }: { id: string; page: number }) {
  const book = useApi(() => practiceApi.book(id), [id]);
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      {book.status === "loading" && (
        <div aria-busy="true">
          <div className="h-9 w-72 animate-pulse rounded bg-paper-3" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden h-96 animate-pulse rounded bg-paper-2 lg:block" />
            <div className="mx-auto aspect-[3/4] w-full max-w-xl animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
          </div>
        </div>
      )}
      {book.status === "error" && (
        <>
          <LearnHeader title="Sách" backHref="/learn/books" backLabel="Về kệ sách" />
          <div className="mt-6">
            <LoadError onRetry={book.reload} what="cuốn sách" />
          </div>
        </>
      )}
      {book.status === "ready" && <Reader book={book.data} page={Math.min(page, book.data.pageCount)} />}
    </div>
  );
}

function Reader({ book, page }: { book: BookDetail; page: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const marks = useApi(() => practiceApi.bookmarks(book.id), [book.id]);
  const [localMarks, setLocalMarks] = useState<number[] | null>(null);
  const [dir, setDir] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [pageText, setPageText] = useState<string | null>(null);

  const bookmarks = localMarks ?? (marks.status === "ready" ? marks.data : []);
  const marked = bookmarks.includes(page);
  const chapterIndex = book.chapters.reduce((acc, c, i) => (c.page <= page ? i : acc), -1);
  const src = (n: number) => book.pageUrlTemplate.replace("{page}", String(n));

  const go = (n: number) => {
    const next = Math.min(book.pageCount, Math.max(1, n));
    if (next === page) return;
    setDir(next > page ? 1 : -1);
    setPageText(null);
    router.replace(`${pathname}?book=${book.id}&page=${next}`, { scroll: false });
  };

  const toggleMark = () => {
    const optimistic = marked ? bookmarks.filter((p) => p !== page) : [...bookmarks, page].sort((a, b) => a - b);
    setLocalMarks(optimistic);
    practiceApi.toggleBookmark(book.id, page).then(setLocalMarks, () => setLocalMarks(bookmarks));
  };

  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e) => {
      const t = e.target as HTMLElement;
      if (zoom || t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toc = (
    <>
      <ol className="flex flex-col">
        {book.chapters.map((c, i) => {
          const on = i === chapterIndex;
          return (
            <li key={c.page}>
              <button
                onClick={() => go(c.page)}
                aria-current={on ? "true" : undefined}
                className={`relative flex w-full items-baseline gap-3 rounded-[var(--radius-paper)] py-2 pl-6 pr-2 text-left text-sm transition-colors ${on ? "bg-coral-wash font-semibold text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink"}`}
              >
                {on && <span aria-hidden="true" className="absolute left-1.5 top-0 h-6 w-2.5 bg-coral [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" />}
                <span className="min-w-0 flex-1">{c.title}</span>
                <span className="tabular shrink-0 text-ink-3">{c.page}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <h3 className="mb-2 mt-8 text-sm font-semibold text-ink-3">Trang đã đánh dấu</h3>
      {marks.status === "error" ? (
        <LoadError onRetry={marks.reload} what="dấu trang" />
      ) : bookmarks.length === 0 ? (
        <p className="text-sm text-ink-2">Chưa có. Bấm ruy băng ở góc trang để đánh dấu chỗ đang đọc.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {bookmarks.map((p) => (
            <li key={p}>
              <button onClick={() => go(p)} className={`tabular inline-flex h-10 items-center gap-1 rounded-full border px-3 text-sm font-semibold transition-colors ${p === page ? "border-coral bg-coral-wash" : "border-line hover:border-ink-3"}`}>
                <BookmarkSimple size={14} weight="fill" className="text-coral-ink" /> Trang {p}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <>
      <LearnHeader title={book.title} backHref="/learn/books" backLabel="Về kệ sách" />
      <p className="mt-1 text-ink-2 sm:pl-14">
        {book.publisher}
        {book.kind === "sgk" ? `, lớp ${book.grade}` : `. Hợp với lớp ${book.grade} trở lên`}. {book.pageCount} trang.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Mục lục sách" className="hidden lg:block">
          <div className="sticky top-24">
            <h2 className="mb-2 text-sm font-semibold text-ink-3">Mục lục</h2>
            {toc}
          </div>
        </nav>
        <details className="group rounded-[var(--radius-paper)] border border-line lg:hidden">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 truncate">{chapterIndex >= 0 ? book.chapters[chapterIndex].title : "Mục lục"}</span>
            <CaretDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-line px-2 py-3">{toc}</div>
        </details>

        <div className="min-w-0">
          <div className="relative mx-auto w-full max-w-xl">
            {/* bookmark ribbon over the top edge */}
            <button
              onClick={toggleMark}
              aria-pressed={marked}
              aria-label={marked ? `Bỏ đánh dấu trang ${page}` : `Đánh dấu trang ${page}`}
              title={marked ? "Bỏ đánh dấu" : "Đánh dấu trang này"}
              className="absolute -top-2 right-6 z-10 flex h-16 w-10 items-start justify-center"
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ height: marked ? 64 : 28, opacity: marked ? 1 : 0.55 }}
                transition={{ duration: reduce ? 0 : 0.35, ease }}
                className={`block w-6 [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-8px),0_100%)] ${marked ? "bg-coral" : "bg-ink-3"}`}
              />
            </button>

            <div className="relative overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper-3 paper-shadow" style={{ aspectRatio: `${book.pageWidth} / ${book.pageHeight}` }}>
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={page}
                  custom={dir}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 * dir }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 * dir }}
                  transition={{ duration: 0.3, ease }}
                  className="absolute inset-0"
                >
                  <button onClick={() => setZoom(true)} className="relative block size-full cursor-zoom-in" aria-label={`Phóng to trang ${page}`}>
                    <Image src={src(page)} alt={`Trang ${page} của ${book.title}`} fill sizes="(min-width: 1024px) 576px, 100vw" className="object-cover" priority />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Trang trước">
                <ArrowLeft size={18} /> <span className="max-sm:hidden">Trang trước</span>
              </Button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(pageText);
                  if (Number.isInteger(n) && n >= 1) go(n);
                  else setPageText(null);
                }}
                className="tabular flex items-center gap-2 text-sm text-ink-2"
              >
                <label htmlFor="so-trang" className="sr-only">
                  Đến trang
                </label>
                Trang
                <input
                  id="so-trang"
                  inputMode="numeric"
                  value={pageText ?? String(page)}
                  onChange={(e) => setPageText(e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => setPageText(null)}
                  className="h-10 w-14 rounded-[var(--radius-paper)] border border-line bg-paper text-center text-ink outline-none focus:border-coral"
                />
                / {book.pageCount}
              </form>
              <Button variant="secondary" onClick={() => go(page + 1)} disabled={page >= book.pageCount} aria-label="Trang sau">
                <span className="max-sm:hidden">Trang sau</span> <ArrowRight size={18} />
              </Button>
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setZoom(true)}>
                <MagnifyingGlassPlus size={16} /> Phóng to
              </Button>
              <Button size="sm" variant="ghost" onClick={toggleMark} aria-pressed={marked}>
                <BookmarkSimple size={16} weight={marked ? "fill" : "regular"} /> {marked ? "Đã đánh dấu" : "Đánh dấu trang"}
              </Button>
            </div>
            <p className="mt-2 hidden text-center text-sm text-ink-3 md:block">Phím mũi tên trái, phải để lật trang.</p>
            {/* warm the next page */}
            {page < book.pageCount && (
              <div className="hidden" aria-hidden="true">
                <Image src={src(page + 1)} alt="" width={book.pageWidth / 3} height={book.pageHeight / 3} sizes="(min-width: 1024px) 576px, 100vw" />
              </div>
            )}
          </div>
        </div>
      </div>

      <ZoomDialog open={zoom} onClose={() => setZoom(false)} src={src(page)} alt={`Trang ${page} của ${book.title}`} w={book.pageWidth} h={book.pageHeight} />
    </>
  );
}

function ZoomDialog({ open, onClose, src, alt, w, h }: { open: boolean; onClose: () => void; src: string; alt: string; w: number; h: number }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(3, s + 0.25));
      if (e.key === "-") setScale((s) => Math.max(1, s - 0.25));
      if (e.key === "Tab" && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>("button")];
        const i = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      back?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease }}
          className="fixed inset-0 z-50 flex flex-col bg-cover/95"
        >
          <div className="flex items-center justify-end gap-1 p-3 text-on-cover">
            <IconButton label="Thu nhỏ" onClick={() => setScale((s) => Math.max(1, s - 0.25))} className="text-on-cover hover:bg-cover-2 hover:text-on-cover">
              <MagnifyingGlassMinus size={20} />
            </IconButton>
            <span className="tabular w-14 text-center text-sm">{Math.round(scale * 100)}%</span>
            <IconButton label="Phóng to thêm" onClick={() => setScale((s) => Math.min(3, s + 0.25))} className="text-on-cover hover:bg-cover-2 hover:text-on-cover">
              <MagnifyingGlassPlus size={20} />
            </IconButton>
            <IconButton ref={closeRef} label="Đóng" onClick={onClose} className="ml-2 text-on-cover hover:bg-cover-2 hover:text-on-cover">
              <X size={20} />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-6">
            <div className="mx-auto" style={{ width: `min(${Math.round(scale * 100)}vw, ${Math.round(w * scale)}px)` }}>
              <Image src={src} alt={alt} width={w} height={h} sizes="100vw" className="h-auto w-full rounded-[var(--radius-paper)]" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
