"use client";

import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/**
 * GlassHeader
 *
 * Token usage:
 *   - Height:   h-16 (--space-16 = 4rem) — fixed nav height token
 *   - Glass:    .glass utility (backdrop-blur + semi-transparent bg)
 *   - Border:   --color-border-default at 40% opacity
 *   - Radius:   --radius-full on Get Started button
 *   - Shadow:   --shadow-brand on primary nav button
 *   - Font:     --weight-semibold on nav links, --weight-extrabold on logo
 *   - Motion:   --duration-fast + --ease-out on link hovers
 */
export function GlassHeader() {
  return (
    <header
      className="glass sticky top-0 z-50 w-full"
      style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-border-default) 40%, transparent)" }}
    >
      <div
        className="container-base flex items-center"
        style={{ height: "4rem" }}  /* --space-16 */
      >
        {/* Logo + Nav */}
        <div className="mr-6 flex items-center">
          <Link
            href="/"
            className="mr-8 flex items-center"
            style={{ textDecoration: "none" }}
          >
            <span
              className="text-gradient-brand"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-h2)",
                fontWeight: "var(--weight-extrabold)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              CuraNav
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center"
            style={{ gap: "var(--space-6)" }}
          >
            {[
              { href: "/find-hospital", label: "Hospitals" },
              { href: "/compare", label: "Compare" },
              { href: "/pmjay-eligibility", label: "PM-JAY Scheme" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "var(--text-body-sm)",
                  fontWeight: "var(--weight-medium)",
                  color: "var(--color-fg-muted)",
                  transition: "var(--transition-color)",
                  textDecoration: "none",
                }}
                className="hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div
          className="flex flex-1 items-center justify-end"
          style={{ gap: "var(--space-3)" }}
        >
          {/* Search pill — desktop only */}
          <div className="hidden md:block">
            <Button
              variant="outline"
              className="justify-start"
              style={{
                width: "18rem",
                color: "var(--color-fg-subtle)",
                background: "var(--color-surface-3)",
                borderRadius: "var(--radius-lg)",
                fontSize: "var(--text-body-sm)",
                height: "2.25rem",
                boxShadow: "var(--shadow-none)",
              }}
            >
              <Search
                className="mr-2 shrink-0"
                style={{ width: "1rem", height: "1rem" }}
              />
              <span>Search hospitals...</span>
            </Button>
          </div>

          {/* Sign In — desktop */}
          <Button
            variant="ghost"
            className="hidden md:flex"
            style={{
              fontSize: "var(--text-body-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-fg-muted)",
              height: "2.25rem",
            }}
          >
            Sign In
          </Button>

          {/* Get Started — desktop */}
          <Button
            className="hidden md:flex"
            style={{
              borderRadius: "var(--radius-full)",
              paddingInline: "var(--space-6)",
              height: "2.25rem",
              fontSize: "var(--text-body-sm)",
              fontWeight: "var(--weight-semibold)",
              boxShadow: "var(--shadow-brand)",
            }}
          >
            Get Started
          </Button>

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  style={{
                    borderRadius: "var(--radius-md)",
                    height: "2.25rem",
                    width: "2.25rem",
                  }}
                />
              }
            >
              <Menu style={{ width: "1.25rem", height: "1.25rem" }} />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right">
              <nav
                className="flex flex-col"
                style={{ gap: "var(--space-6)", marginTop: "var(--space-8)" }}
              >
                {[
                  { href: "/find-hospital", label: "Find a Hospital" },
                  { href: "/compare", label: "Compare Hospitals" },
                  { href: "/pmjay-eligibility", label: "PM-JAY Scheme" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontSize: "var(--text-h3)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--color-fg-base)",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  style={{
                    marginTop: "var(--space-4)",
                    borderRadius: "var(--radius-full)",
                    boxShadow: "var(--shadow-brand)",
                  }}
                >
                  Get Started
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
