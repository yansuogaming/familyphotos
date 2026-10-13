// Shown while a room of the app is being opened.
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10" aria-busy="true" aria-label="Đang mở trang">
      <span className="block h-10 w-40 animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />
      <span className="mt-3 block h-4 w-64 max-w-full animate-pulse rounded bg-paper-3" />
      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="aspect-[4/5] animate-pulse rounded-[8px] bg-paper-3" />
        ))}
      </div>
      <span className="mt-14 block h-7 w-48 animate-pulse rounded bg-paper-3" />
      <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="aspect-[4/3] animate-pulse rounded-[var(--radius-paper)] bg-paper-3" />
        ))}
      </div>
    </div>
  );
}
