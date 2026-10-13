import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginCoverPhotos, SiteText } from "@/components/admin/site/SiteSlots";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* the album's cover, closed */}
      <aside className="vinyl relative hidden overflow-hidden p-10 text-on-cover lg:flex lg:flex-col lg:justify-between">
        <span className="absolute inset-y-0 left-0 w-5 bg-[oklch(0_0_0/0.2)]" aria-hidden="true" />
        <div className="pl-6 [&_*]:text-on-cover">
          <Logo />
        </div>
        <div className="relative mx-auto h-80 w-full max-w-sm" aria-hidden="true">
          <LoginCoverPhotos />
        </div>
        <p className="max-w-sm pl-6 font-display text-2xl font-semibold leading-snug">
          <SiteText k="login.coverLine" />
        </p>
      </aside>

      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:px-8 lg:items-center lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
