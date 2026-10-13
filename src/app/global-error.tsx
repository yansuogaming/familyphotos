"use client";

import "./globals.css";

// Replaces the root layout when it fails, so it brings its own document and theme.
const themeScript = `(function(){try{var t=localStorage.getItem('fp-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-[100dvh] items-center justify-center bg-paper-2 px-4 text-ink">
        <title>Có lỗi | Family Photos</title>
        <main role="alert" className="oli oli-margin w-full max-w-xl rounded-[6px] border border-line py-12 pl-20 pr-6 paper-shadow">
          <h1 className="text-3xl font-bold">Nhà đang có chút trục trặc.</h1>
          <p className="mt-3 text-ink-2">Trang không mở được. Thử lại sau một lát nhé.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => retry()} className="inline-flex h-11 items-center rounded-full bg-coral px-5 font-semibold text-on-coral hover:bg-coral-strong">
              Thử lại
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload is wanted after a root failure */}
            <a href="/" className="inline-flex h-11 items-center rounded-full border border-line bg-paper px-5 font-semibold text-ink hover:bg-paper-2">
              Về trang chủ
            </a>
          </div>
          {error.digest && <p className="mt-6 text-xs text-ink-3">Mã lỗi: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
