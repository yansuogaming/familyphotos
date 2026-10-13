/** Shown while a /learn sub-page reads its URL (Suspense fallback). */
export function PageFallback() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8" aria-busy="true" aria-label="Đang tải">
      <div className="flex items-center gap-4">
        <span className="size-10 rounded-full bg-paper-2" />
        <span className="h-8 w-48 animate-pulse rounded bg-paper-3" />
      </div>
      <div className="mt-8 h-10 w-full max-w-xl animate-pulse rounded-full bg-paper-2" />
      <div className="mt-6 h-72 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
    </div>
  );
}
