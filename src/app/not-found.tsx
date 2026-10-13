import { House, Images } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

// Uneven torn edge along the bottom of the page.
const teeth = [6, 2, 9, 4, 11, 3, 7, 1, 10, 5, 8, 2, 12, 4, 6, 1, 9, 3, 11, 5, 7, 2, 10, 4, 8];
const torn = `polygon(0 0, 100% 0, ${teeth
  .map((t, i) => `${100 - (i * 100) / (teeth.length - 1)}% calc(100% - ${t}px)`)
  .join(", ")})`;

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col bg-paper-2">
      <header className="mx-auto flex h-16 w-full max-w-[1400px] items-center px-4 sm:px-6">
        <Logo href="/" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-6">
        <div className="w-full max-w-2xl -rotate-1 drop-shadow-[0_14px_22px_hsl(var(--shadow)/0.16)]">
          <div className="oli oli-margin pb-16 pl-20 pr-6 pt-10 sm:pr-10" style={{ clipPath: torn }}>
            <p className="absolute right-6 top-4 font-hand text-lg text-ink-3 sm:right-10">Trang 404</p>
            <h1 className="font-hand text-4xl font-normal leading-tight tracking-normal text-ink sm:text-5xl">
              Trang này không có trong sổ.
            </h1>
            <p className="mt-4 max-w-[44ch] text-ink-2">
              Có thể trang đã bị xé đi, hoặc đường dẫn bị gõ nhầm một chữ. Về nhà rồi tìm lại nhé.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/">
                <House size={18} weight="bold" /> Về trang chủ
              </ButtonLink>
              <ButtonLink href="/anh" variant="secondary">
                <Images size={18} /> Mở album ảnh
              </ButtonLink>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
