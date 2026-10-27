import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection, LegalList } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Our Mission | CuraNav",
  description:
    "Why CuraNav exists: hospital search in India fails quietly, and silent failure is the thing worth fixing.",
};

const UPDATED = "2026-01-15";

export default function MissionPage() {
  return (
    <LegalPageShell
      eyebrow="Why we built this"
      title="Our Mission"
      intro="Finding a hospital in India is not hard because the information is secret. It is hard because the information is scattered, inconsistently named, and — when a search fails — usually fails silently."
      updated={UPDATED}
    >
      <LegalSection heading="The problem we kept running into">
        <p>
          Ask for &ldquo;a hospital for a kidney problem under ₹2 lakh&rdquo; and most
          search tools will happily return a confident list. What they will not tell you
          is that they never found &ldquo;kidney problem&rdquo; in your query, that they
          ignored the budget, or that they quietly dropped a facility filter because
          nothing matched it. A wrong answer that looks right is worse than no answer,
          because you have no reason to check it.
        </p>
        <p>
          On the other side of that, the underlying data is a mess. &ldquo;Orthopaedics&rdquo;
          and &ldquo;Orthopedics&rdquo; are separate values. &ldquo;Dialysis&rdquo; in a
          search box is not the same string as &ldquo;Dialysis Unit&rdquo; in a database
          column. A filter that looks applied and matches nothing is the most common
          failure mode in hospital search, and almost nobody surfaces it.
        </p>
      </LegalSection>

      <LegalSection heading="What we do differently">
        <LegalList
          items={[
            "We say what we could not do. Every result page states which filters were dropped, relaxed, or never applied, instead of presenting a widened search as if it were the one you asked for.",
            "We never let an unrecognised term become a silent filter. If we cannot map your words to a specialty in the dataset, we drop the filter and tell you — we do not send a guess to the database.",
            "One source of truth for vocabulary. Specialties and facilities live in a single verified list, and an automated check compares it against the live database so it cannot silently drift.",
            "We do not rank hospitals by quality. We have no outcome or safety data, so we do not imply a ranking we cannot support. Specialties, location, budget and facilities are what we match on, and we show our reasoning.",
            "Loading always ends. Every request is bounded by a timeout, and a request that fails says so with a way to retry, rather than spinning forever.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="What we will not build">
        <LegalList
          items={[
            "Symptom-to-diagnosis features. We help you find care; we do not tell you what is wrong with you.",
            "A quality ranking built on proxies. Star ratings, &ldquo;best hospital&rdquo; labels, and outcome scores we cannot substantiate are exactly the kind of confident-sounding fiction this project exists to remove.",
            "A lead-generation funnel. No sponsored placement, no paid boost in the ranking order.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Where this is heading">
        <p>
          The immediate goal is narrow: make the search honest about its own limits.
          Beyond that, we want verified facility and cost data, real outcome data so
          that ranking becomes defensible rather than decorative, and offline access for
          people on weak networks.
        </p>
        <p>
          CuraNav is a prototype built for TECHNOVA 2026 on the Responsible AI theme.
          If a listing is wrong,{" "}
          <Link href="/contact" className="text-primary hover:underline">
            tell us
          </Link>{" "}
          — corrections are the point.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
