"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon, Mark } from "@/components/icons";

const NAV = [
  { href: "/", label: "Lot index", icon: "home" as const },
  { href: "/favorites", label: "Saved", icon: "heart" as const },
  { href: "/account", label: "Account", icon: "user" as const },
];

const HIDDEN = [/^\/listing\//, /^\/post/, /^\/login/, /^\/admin/];

export function BottomNav() {
  const path = usePathname();
  if (HIDDEN.some((re) => re.test(path))) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="flex items-stretch gap-1 border-[1.5px] border-ink bg-card px-1.5 py-1.5 shadow-[6px_6px_0_rgba(22,19,14,0.18)]">
        {NAV.map((n) => {
          const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <a
              key={n.href}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={`flex min-w-[74px] flex-col items-center gap-1 px-3 py-1.5 transition-colors ${
                on ? "bg-ink text-paper" : "text-ink2"
              }`}
            >
              <Icon name={n.icon} filled={on} className="h-5 w-5" />
              <span className="cap text-[9px]">{n.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem("wh_theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-9 w-9 place-items-center border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-paper ${className}`}
    >
      <Icon name={dark ? "sun" : "moon"} className="h-4 w-4" />
    </button>
  );
}

export function SiteHeader({ user }: { user: { name: string; role: string } | null }) {
  return (
    <header className="sticky top-0 z-40 border-b-[1.5px] border-ink bg-paper">
      <div className="mx-auto flex h-[62px] max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <a href="/" className="group flex shrink-0 items-center gap-2.5">
          <Mark className="h-9 w-9 text-ink transition-transform group-hover:-rotate-6" />
          <span className="leading-none">
            <span className="block font-display text-[20px] font-extrabold tracking-[-0.05em]">
              WAREHUB
            </span>
            <span className="cap mt-[3px] hidden text-[8px] text-mute sm:block">
              Commercial land &amp; warehouses
            </span>
          </span>
        </a>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {[
            { href: "/", label: "Lot index" },
            { href: "/post", label: "Post property" },
            { href: "/favorites", label: "Saved" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="cap border-[1.5px] border-transparent px-3 py-2.5 text-ink2 transition-colors hover:border-ink hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          {user?.role === "admin" && (
            <a
              href="/admin"
              className="cap border-[1.5px] border-oxide px-3 py-2.5 text-oxide transition-colors hover:bg-oxide hover:text-white"
            >
              Admin console
            </a>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a href="/post" className="btn oxide h-9 px-3 text-[12px] sm:h-10 sm:px-4 sm:text-[13px]">
            <Icon name="plus" className="h-4 w-4" />
            <span className="hidden sm:inline">Post property</span>
            <span className="sm:hidden">Post</span>
          </a>
          <ThemeToggle className="hidden sm:grid" />
          <a
            href={user ? "/account" : "/login"}
            aria-label={user ? "Your account" : "Log in"}
            className="hidden h-9 items-center gap-2 border-[1.5px] border-ink px-3 transition-colors hover:bg-ink hover:text-paper md:flex"
          >
            <Icon name="user" className="h-4 w-4" />
            <span className="cap max-w-[92px] truncate">
              {user ? user.name.split(" ")[0] : "Log in"}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-[1.5px] border-ink bg-panel pb-[86px] md:pb-0">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Mark className="h-9 w-9 text-ink" />
            <span className="font-display text-[20px] font-extrabold tracking-[-0.05em]">
              WAREHUB
            </span>
          </div>
          <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-ink2">
            A direct marketplace for industrial land, open plots and ready-built warehouses across
            Maharashtra&apos;s logistics corridors. Listings are posted by owners and brokers, then
            reviewed by our desk before they go live.
          </p>
          <p className="mono mt-4 text-[11px] uppercase tracking-[0.12em] text-mute">
            Nashik · Pune · Bhiwandi · Chakan · Sinnar
          </p>
        </div>
        <div>
          <p className="cap border-t border-line pt-3 text-mute">Browse</p>
          <ul className="mt-3 space-y-2 text-[14px]">
            {[
              { href: "/", label: "All lots" },
              { href: "/post", label: "Post a property" },
              { href: "/favorites", label: "Saved lots" },
              { href: "/account", label: "Your account" },
            ].map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-ink2 underline-offset-4 hover:text-oxide hover:underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="cap border-t border-line pt-3 text-mute">Desk</p>
          <ul className="mt-3 space-y-2 text-[14px] text-ink2">
            <li className="mono">+91 253 660 0199</li>
            <li className="mono">desk@warehub.in</li>
            <li>Mon – Sat, 9:30 – 18:30 IST</li>
          </ul>
          <p className="stamp mt-4">Verified listings only</p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="mono text-[11px] text-mute">
            © 2026 WareHub Realty Desk — all lots subject to title verification.
          </p>
          <p className="mono text-[11px] text-mute">Sheet 01 / 01</p>
        </div>
      </div>
    </footer>
  );
}
