import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, Patrick_Hand } from "next/font/google";
import { Suspense } from "react";
import { HumanCheck } from "@/components/security/HumanCheck";
import "./globals.css";

const text = Be_Vietnam_Pro({
  variable: "--font-text",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const display = Bricolage_Grotesque({
  variable: "--font-display-face",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const hand = Patrick_Hand({
  variable: "--font-hand-face",
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Family Photos", template: "%s | Family Photos" },
  description: "Kho ảnh, trò chuyện và góc học tập riêng của nhà mình.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfe" },
    { media: "(prefers-color-scheme: dark)", color: "#141a2b" },
  ],
};

// Runs before paint so the saved theme never flashes.
const themeScript = `(function(){try{var t=localStorage.getItem('fp-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${text.variable} ${display.variable} ${hand.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <Suspense fallback={null}>
          <HumanCheck />
        </Suspense>
      </body>
    </html>
  );
}
