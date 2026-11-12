"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/sessions", label: "Sessions", icon: "sessions" },
  { href: "/stats", label: "Stats", icon: "stats" },
  { href: "/players", label: "Players", icon: "players" },
];

function TabIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "sessions") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 17h3M14 13h3" />
      </svg>
    );
  }
  if (name === "stats") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M4 20V11M10 20V5M16 20v-7M22 20H2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20ZM16 4.8a3.5 3.5 0 0 1 0 6.4M18 14a5 5 0 0 1 3.5 4.8V20" />
    </svg>
  );
}

export function Nav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav-inner">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active(t.href) ? "page" : undefined}
            className={`bottom-nav-link ${active(t.href) ? "is-active" : ""}`}
          >
            <TabIcon name={t.icon} />
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
