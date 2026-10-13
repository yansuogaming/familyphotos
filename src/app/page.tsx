import { ArrowRight, BookOpenText, ChatsCircle, Images, LockKey, Sparkle } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { AiDemo } from "@/components/ai/AiDemo";
import { AreaIndex } from "@/components/learn/AreaIndex";
import { AlbumCover } from "@/components/album/AlbumCover";
import { AlbumSpread } from "@/components/album/AlbumSpread";
import { Logo } from "@/components/brand/Logo";
import { ChatPreview } from "@/components/chat/ChatPreview";
import { DailyTicks } from "@/components/learn/DailyTicks";
import { ButtonLink } from "@/components/ui/Button";
import { QrLogin } from "@/components/ui/QrLogin";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { HeroTitle, PrivacyPoints, SiteText } from "@/components/admin/site/SiteSlots";
import { learningAreas } from "@/lib/api/mock-data";

const nav = [
  { href: "#anh", label: "Ảnh", icon: Images },
  { href: "#chat", label: "Chat riêng", icon: ChatsCircle },
  { href: "#hoc", label: "Học", icon: BookOpenText },
  { href: "#tro-ly", label: "Trợ lý AI", icon: Sparkle },
];

/**
 * The landing page is public. Its shelf shows illustrative albums only, never the
 * family's real albums, so nobody outside the home can see their titles or photos.
 */
const showcase = [
  { title: "Tết ở nhà bà", coverUrl: "https://picsum.photos/seed/fp-show-tet/600/760", meta: "Ảnh minh hoạ" },
  { title: "Hè đi biển", coverUrl: "https://picsum.photos/seed/fp-show-bien/600/760", meta: "Ảnh minh hoạ" },
  { title: "Sinh nhật con", coverUrl: "https://picsum.photos/seed/fp-show-sinhnhat/600/760", meta: "Ảnh minh hoạ" },
  { title: "Ngày khai giảng", coverUrl: "https://picsum.photos/seed/fp-show-truong/600/760", meta: "Ảnh minh hoạ" },
  { title: "Về quê", coverUrl: "https://picsum.photos/seed/fp-show-que/600/760", meta: "Ảnh minh hoạ" },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Các phòng trong nhà">
            {nav.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink">
                <Icon size={18} /> {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/dang-ky" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink-2 hover:text-ink sm:block">
              Đăng ký
            </Link>
            <ButtonLink href="/dang-nhap" size="sm">Vào nhà</ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: the album already open, and the door key beside it */}
        <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="flex flex-col gap-7 lg:col-span-6 xl:col-span-5">
            <h1 className="text-[2.6rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-[3.4rem] xl:text-[3.6rem]">
              <HeroTitle />
            </h1>
            <p className="max-w-[34ch] text-lg leading-relaxed text-ink-2">
              <SiteText k="landing.heroLead" />
            </p>
            <div className="flex flex-col gap-6">
              <ButtonLink href="/dang-nhap" size="lg" className="w-fit">
                Vào nhà <ArrowRight size={18} weight="bold" />
              </ButtonLink>
              <div className="hidden lg:block">
                <QrLogin compact />
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 xl:col-span-7">
            <AlbumSpread />
          </div>
        </section>

        {/* Ảnh: a shelf of albums, one per occasion */}
        <section id="anh" className="scroll-mt-20 border-t border-line bg-paper-2 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-bold sm:text-5xl"><SiteText k="landing.photos.title" /></h2>
            <p className="mt-4 max-w-[58ch] text-lg text-ink-2">
              <SiteText k="landing.photos.body" />
            </p>
          </div>
          <div className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-6 sm:px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]">
            {showcase.map((a) => (
              <AlbumCover
                key={a.title}
                href="/dang-nhap"
                title={a.title}
                coverUrl={a.coverUrl}
                meta={a.meta}
                className="w-56 shrink-0 snap-start sm:w-64"
              />
            ))}
          </div>
        </section>

        {/* Chat riêng: the real conversation component, demo family */}
        <section id="chat" className="scroll-mt-20 py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
            <div className="lg:col-span-5 lg:pt-6">
              <h2 className="text-3xl font-bold sm:text-5xl"><SiteText k="landing.chat.title" /></h2>
              <p className="mt-4 max-w-[46ch] text-lg text-ink-2">
                <SiteText k="landing.chat.body" />
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-[var(--radius-paper)] border border-line bg-paper-2 p-5 sm:p-8 lg:col-span-6 lg:col-start-7">
              <ChatPreview />
            </div>
          </div>
        </section>

        {/* Học: the notebook's table of contents */}
        <section id="hoc" className="scroll-mt-20 border-y border-line">
          <div className="oli py-20 lg:py-28">
            <div className="oli-margin mx-auto max-w-5xl pl-20 pr-4 sm:pr-6">
              <h2 className="text-3xl font-bold sm:text-5xl"><SiteText k="landing.learn.title" /></h2>
              <p className="mt-4 max-w-[52ch] text-lg text-ink-2">
                <SiteText k="landing.learn.body" />
              </p>
              <div className="mt-6">
                <DailyTicks goal={10} done={4} size="lg" />
              </div>

              <div className="mt-14">
                <AreaIndex areas={learningAreas} linkTo="/dang-nhap" />
              </div>
            </div>
          </div>
        </section>

        {/* Trợ lý AI */}
        <section id="tro-ly" className="scroll-mt-20 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="max-w-3xl text-3xl font-bold sm:text-5xl"><SiteText k="landing.assistant.title" /></h2>
            <p className="mt-4 mb-12 max-w-[56ch] text-lg text-ink-2">
              <SiteText k="landing.assistant.body" />
            </p>
            <AiDemo />
          </div>
        </section>

        {/* Privacy, stated plainly */}
        <section className="vinyl py-20 text-on-cover lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <LockKey size={36} className="text-coral" />
            <p className="mt-6 max-w-4xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
              <SiteText k="landing.privacy.statement" />
            </p>
            <dl className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[oklch(1_0_0/0.14)]">
              <PrivacyPoints />
            </dl>
          </div>
        </section>

        {/* Close */}
        <section className="py-20 lg:py-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center">
            <h2 className="text-3xl font-bold sm:text-4xl"><SiteText k="landing.closing" /></h2>
            <div className="flex items-center gap-3">
              <ButtonLink href="/dang-ky" variant="secondary" size="lg">Đăng ký</ButtonLink>
              <ButtonLink href="/dang-nhap" size="lg">
                Vào nhà <ArrowRight size={18} weight="bold" />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 text-sm text-ink-3 sm:flex-row sm:px-6">
          <p>Family Photos. Kho ảnh riêng của gia đình.</p>
          <p>Ảnh trên trang là ảnh minh hoạ.</p>
        </div>
      </footer>
    </>
  );
}
