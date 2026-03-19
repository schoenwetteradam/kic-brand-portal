import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIC Brand Portal",
  description: "Keeping It Cute — content, recruiting, and campaign workspace.",
};

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agent", label: "Agent" },
  { href: "/content", label: "Content" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white font-sans text-slate-900">
        <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
            <Link
              href="/"
              className="shrink-0 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900"
            >
              Keeping It Cute
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <nav className="flex items-center gap-1 overflow-x-auto">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
