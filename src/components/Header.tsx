"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LogIn, Menu, X, Siren } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Find Hospital", href: "/find-hospital" },
  { label: "All Hospitals", href: "/search" },
  { label: "About Us", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
] as const;

const navLinkClasses =
  "inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-all duration-200";

const isActivePath = (pathname: string, href: string) => {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};

const getNavLinkClass = (isActive: boolean) =>
  `${navLinkClasses} ${
    isActive
      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
      : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm"
  }`;

const emergencyLinkClasses =
  "group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-error transition-all duration-300 hover:-translate-y-0.5 hover:bg-error/10 hover:shadow-lg hover:shadow-error/20 motion-reduce:transform-none";

const adminLinkClasses =
  "btn-primary group relative isolate inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg hover:shadow-primary/30 after:pointer-events-none after:absolute after:inset-0 after:z-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:content-[''] after:transition-transform after:duration-700 hover:after:translate-x-full motion-reduce:transform-none motion-reduce:after:hidden";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/25 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Cura<span className="text-primary">Nav</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/50 bg-background/50 p-1">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={getNavLinkClass(isActive)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/emergency" className={emergencyLinkClasses}>
            <Siren className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse motion-reduce:group-hover:scale-100 motion-reduce:group-hover:animate-none" />
            Emergency
          </Link>
          <Link href="/admin" className={`${adminLinkClasses} text-sm py-2`}>
            <LogIn className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0" />
            <span className="relative z-10">Admin Log In</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 glass animate-fade-in">
          <div className="px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`${getNavLinkClass(isActive)} w-full justify-center`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <hr className="border-white/10 my-2" />
            <Link
              href="/emergency"
              className={`${emergencyLinkClasses} w-full justify-center`}
              onClick={() => setMobileOpen(false)}
            >
              <Siren className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse motion-reduce:group-hover:scale-100 motion-reduce:group-hover:animate-none" />
              Emergency
            </Link>
            <Link
              href="/admin"
              className={`${adminLinkClasses} w-full text-sm`}
              onClick={() => setMobileOpen(false)}
            >
              <LogIn className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0" />
              <span className="relative z-10">Admin Log In</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
