"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Tracker", href: "/tracker", icon: TrackerIcon },
  { label: "GDA", href: "/gda", icon: FlameIcon },
  { label: "CFA", href: "/cfa", icon: DropsIcon },
  { label: "Docs", href: "https://docs.streme.fun", icon: DocsIcon, external: true },
];

export function MobileFooterNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!href.startsWith("/")) return false;
    if (href === "/" && pathname === "/") return true;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-base-300/80 bg-base-100/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur md:hidden">
      <div className="flex items-center justify-around px-3 py-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon, external }) =>
          external ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-[11px] text-base-content/70 hover:text-primary transition-colors"
            >
              <Icon className="h-5 w-5" />
              {label}
            </a>
          ) : (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-1 text-[11px] transition-colors ${
                isActive(href)
                  ? "text-primary"
                  : "text-base-content/70 hover:text-primary"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12l9-9 9 9" />
      <path d="M9 21V9h6v12" />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c4.5-1.5 7-6.5 4-11-1 2-3 3-4 4-1-3-2-5-1-8-5 3-8 10-3 15 1 1 2.5 1.5 4 1z" />
    </svg>
  );
}

function DropsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.69 5.66 8.04a7 7 0 1 0 9.9 9.9L22 11.5 15.36 5.1" />
    </svg>
  );
}

function TrackerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6v6H9z" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

function DocsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

