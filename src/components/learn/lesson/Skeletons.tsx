// Loading shapes for the lesson reader. No hooks, safe as a Suspense fallback.

const bar = "animate-pulse rounded bg-paper-3";

export function ArticleSkeleton() {
  return (
    <div className="oli-margin max-sm:before:left-4! pl-9 sm:pl-20" aria-busy="true" aria-label="Đang tải bài học">
      <div className="max-w-[70ch]">
        <div className={`h-4 w-64 max-w-full ${bar}`} />
        <div className="mt-6 flex items-end gap-4">
          <div className={`h-20 w-14 ${bar}`} />
          <div className="flex flex-col gap-2 pb-1">
            <div className={`h-3.5 w-36 ${bar}`} />
            <div className={`h-2 w-16 ${bar}`} />
          </div>
        </div>
        <div className={`mt-5 h-9 w-11/12 ${bar}`} />
        <div className={`mt-2 h-9 w-2/3 ${bar}`} />
        <div className={`mt-8 h-5 w-40 ${bar}`} />
        <div className="mt-4 flex flex-col gap-3">
          {[92, 80, 86].map((w) => (
            <div key={w} className={`h-4 ${bar}`} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <div className={`aspect-video ${bar}`} />
          <div className={`aspect-video ${bar}`} />
        </div>
        <div className={`mt-12 h-7 w-48 ${bar}`} />
        <div className={`mt-5 h-36 w-full ${bar}`} />
      </div>
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className={`h-10 w-40 ${bar}`} />
        <div className={`ml-auto h-11 w-96 max-w-full rounded-full ${bar}`} />
      </div>
      <div className="mt-6 flex gap-1.5 overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`size-10 shrink-0 rounded-full ${bar}`} />
        ))}
      </div>
      <div className="mt-4 flex gap-2 border-b border-line pb-3">
        {[64, 56, 88, 120, 96].map((w, i) => (
          <div key={i} className={`h-6 shrink-0 ${bar}`} style={{ width: w }} />
        ))}
      </div>
      <div className="mt-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)_15rem] lg:gap-10">
        <div className="flex flex-col gap-3 max-lg:hidden">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`h-4 ${bar}`} style={{ width: `${55 + ((i * 37) % 40)}%` }} />
          ))}
        </div>
        <ArticleSkeleton />
      </div>
    </div>
  );
}
