import { Suspense } from "react";
import { AssistantFab } from "@/components/ai/AssistantFab";
import { RequireSession } from "@/components/shell/RequireSession";
import { TopBar } from "@/components/shell/TopBar";

/** Same footprint as the top bar, shown while route data streams in. */
function TopBarShell() {
  return <div className="sticky top-0 z-30 h-16 border-b border-line bg-paper/90" aria-hidden="true" />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* TopBar and AssistantFab read the pathname, which dynamic routes only know at request time. */}
      <Suspense fallback={<TopBarShell />}>
        <TopBar />
      </Suspense>
      <main className="flex-1 pb-20 md:pb-0">
        <RequireSession>{children}</RequireSession>
      </main>
      <Suspense fallback={null}>
        <AssistantFab />
      </Suspense>
    </div>
  );
}
