import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/**
 * Shared shell for the static informational pages.
 *
 * These pages exist because the footer used to link to `#` for every one of
 * them, so the privacy policy and disclaimer the site advertised did not exist
 * anywhere. They are deliberately plain: no client state, no data fetching,
 * nothing that can fail to load.
 */
export function LegalPageShell({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** ISO date, so the "last updated" line is a fact and not a guess. */
  updated: string;
  children: ReactNode;
}) {
  const readable = new Date(`${updated}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
            {eyebrow}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-3">{intro}</p>
          <p className="text-xs text-muted-foreground/70 mb-10">
            Last updated: {readable}
          </p>

          <div className="space-y-8 text-foreground/90 leading-relaxed">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/** A titled block, so page bodies read as prose instead of a wall of text. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-3">{heading}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

/** A bulleted list with consistent spacing. */
export function LegalList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-primary/60">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
