"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/sessions", label: "Sessions" },
  { href: "/stats", label: "Stats" },
  { href: "/players", label: "Players" },
];

export function Nav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-xl">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active(t.href) ? "page" : undefined}
            className={`-mt-px flex-1 border-t-[3px] py-3 text-center text-sm font-medium ${
              active(t.href)
                ? "border-court text-court"
                : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
