import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BottomNav, SiteFooter, SiteHeader, ThemeToggle } from "@/components/chrome";
import { LoginSheet } from "@/components/login-sheet";
import { getSessionUser } from "@/lib/auth";
import { publicUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WareHub — Commercial land & ready warehouses",
    template: "%s · WareHub",
  },
  description:
    "Direct listings for industrial land, open plots and ready-built warehouses across Nashik, Pune, Bhiwandi and Chakan. Posted by owners, reviewed by our desk.",
};

const themeInit = `
(function(){try{
  var s=localStorage.getItem('wh_theme');
  var dark=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(dark)document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[80] focus:border-[1.5px] focus:border-ink focus:bg-card focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader user={user ? publicUser(user) : null} />
        <main id="main">{children}</main>
        <SiteFooter />
        <BottomNav />
        <LoginSheet />
        <div className="pointer-events-none fixed bottom-3 right-3 z-[62] hidden md:block">
          <ThemeToggle />
        </div>
        <div
          id="wh-toast"
          className="pointer-events-none fixed left-1/2 top-[76px] z-[75] hidden -translate-x-1/2 border-[1.5px] border-ink bg-ink px-4 py-2.5 text-paper"
        />
      </body>
    </html>
  );
}
