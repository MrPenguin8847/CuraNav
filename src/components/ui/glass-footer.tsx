import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * GlassFooter
 *
 * Token usage:
 *   - Background:  --color-bg-subtle (off-white, distinct from white page)
 *   - Spacing:     --section-padding-y-sm, --component-gap, --space-* tokens
 *   - Typography:  --font-display for brand, system scales for nav text
 *   - Border:      --color-border-default
 *   - Colors:      --color-fg-muted, --color-brand-500 on hover
 *   - Radius:      --radius-full on newsletter input pill
 *   - Mobile:      2-col grid for Platform+Resources, newsletter full-width below
 */

const footerLinks = {
  Platform: [
    { label: "Find a Hospital", href: "/find-hospital" },
    { label: "Compare Costs", href: "/compare" },
    { label: "View PM-JAY Coverage", href: "/pmjay-eligibility" },
  ],
  Resources: [
    { label: "Data Methodology", href: "#" },
    { label: "Patient Rights", href: "#" },
    { label: "Support Center", href: "#" },
  ],
};

export function GlassFooter() {
  return (
    <footer
      style={{
        background: "var(--color-bg-subtle)",
        borderTop: `1px solid var(--color-border-default)`,
      }}
    >
      <div
        className="container-base"
        style={{ paddingBlock: "var(--section-padding-y-sm)" }}
      >
        {/* Top row */}
        <div
          className="grid grid-cols-1 gap-y-10 md:grid-cols-4 md:gap-x-8"
        >
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
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
            <p
              style={{
                marginTop: "var(--space-4)",
                fontSize: "var(--text-body-sm)",
                lineHeight: "var(--leading-relaxed)",
                color: "var(--color-fg-muted)",
              }}
            >
              Empowering patients with transparent, data-driven healthcare
              decisions across India.
            </p>
          </div>

          {/* Link columns — 2-col on mobile, 1-col each on md+ */}
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h3
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-body-sm)",
                    fontWeight: "var(--weight-semibold)",
                    color: "var(--color-fg-base)",
                    marginBottom: "var(--space-4)",
                    letterSpacing: "var(--tracking-normal)",
                  }}
                >
                  {heading}
                </h3>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        style={{
                          fontSize: "var(--text-body-sm)",
                          color: "var(--color-fg-muted)",
                          textDecoration: "none",
                          transition: "var(--transition-color)",
                        }}
                        className="hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="md:col-span-1">
            <h3
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--color-fg-base)",
                marginBottom: "var(--space-4)",
              }}
            >
              Stay Updated
            </h3>
            <p
              style={{
                fontSize: "var(--text-body-xs)",
                color: "var(--color-fg-muted)",
                lineHeight: "var(--leading-relaxed)",
                marginBottom: "var(--space-4)",
              }}
            >
              Get notified about new hospitals and PM-JAY scheme updates.
            </p>
            {/* Input + Button as a unified pill unit */}
            <div
              className="flex overflow-hidden"
              style={{
                border: `1px solid var(--color-border-default)`,
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-1)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <Input
                type="email"
                placeholder="Email address"
                style={{
                  border: "none",
                  borderRadius: 0,
                  background: "transparent",
                  boxShadow: "none",
                  flex: 1,
                  fontSize: "var(--text-body-sm)",
                  height: "2.5rem",
                  padding: "0 var(--space-4)",
                }}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                size="sm"
                style={{
                  borderRadius: 0,
                  height: "2.5rem",
                  paddingInline: "var(--space-4)",
                  fontSize: "var(--text-body-xs)",
                  fontWeight: "var(--weight-semibold)",
                  letterSpacing: "var(--tracking-wide)",
                  flexShrink: 0,
                }}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 flex flex-col items-center justify-between gap-4 md:flex-row"
          style={{
            paddingTop: "var(--space-8)",
            borderTop: `1px solid var(--color-border-subtle)`,
          }}
        >
          <p
            style={{
              fontSize: "var(--text-body-xs)",
              color: "var(--color-fg-subtle)",
            }}
          >
            © 2026 CuraNav. All rights reserved.
          </p>
          <div
            className="flex"
            style={{ gap: "var(--space-6)" }}
          >
            {["Privacy Policy", "Terms of Service"].map((label) => (
              <Link
                key={label}
                href="#"
                style={{
                  fontSize: "var(--text-body-xs)",
                  color: "var(--color-fg-subtle)",
                  textDecoration: "none",
                  transition: "var(--transition-color)",
                }}
                className="hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
