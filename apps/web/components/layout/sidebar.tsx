"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/invoice/new", label: "New Invoice", icon: "plus" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" />
      <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" />
      <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="9" y1="3" x2="9" y2="15" />
      <line x1="3" y1="9" x2="15" y2="9" />
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="2.5" />
      <path d="M14.7 11.1a1.2 1.2 0 0 0 .24 1.32l.04.04a1.44 1.44 0 1 1-2.04 2.04l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.72 1.08v.12a1.44 1.44 0 1 1-2.88 0v-.06a1.2 1.2 0 0 0-.78-1.08 1.2 1.2 0 0 0-1.32.24l-.04.04a1.44 1.44 0 1 1-2.04-2.04l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.08-.72h-.12a1.44 1.44 0 1 1 0-2.88h.06a1.2 1.2 0 0 0 1.08-.78 1.2 1.2 0 0 0-.24-1.32l-.04-.04a1.44 1.44 0 1 1 2.04-2.04l.04.04a1.2 1.2 0 0 0 1.32.24h.06a1.2 1.2 0 0 0 .72-1.08v-.12a1.44 1.44 0 1 1 2.88 0v.06a1.2 1.2 0 0 0 .72 1.08 1.2 1.2 0 0 0 1.32-.24l.04-.04a1.44 1.44 0 1 1 2.04 2.04l-.04.04a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.08.72h.12a1.44 1.44 0 0 1 0 2.88h-.06a1.2 1.2 0 0 0-1.08.72Z" />
    </svg>
  ),
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] h-screen fixed left-0 top-0 bg-vela-surface border-r border-vela-border py-6 px-4 z-40">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-vela-cyan/20 flex items-center justify-center">
            <span className="text-vela-cyan font-display font-bold text-sm">V</span>
          </div>
          <span className="font-display font-extrabold text-xl text-vela-primary">
            vela
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition ${
                  active
                    ? "bg-vela-cyan/10 text-vela-cyan"
                    : "text-vela-muted hover:text-vela-primary hover:bg-vela-panel"
                }`}
              >
                {ICONS[item.icon]}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 pt-4 border-t border-vela-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-vela-muted text-[10px] font-mono">
              vela v1.0
            </p>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-vela-surface border-t border-vela-border flex justify-around py-3 px-4 z-40">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-mono transition ${
                active ? "text-vela-cyan" : "text-vela-muted"
              }`}
            >
              {ICONS[item.icon]}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
