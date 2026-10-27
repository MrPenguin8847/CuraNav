import type { Metadata } from "next";
import { LegalPageShell, LegalSection, LegalList } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service | CuraNav",
  description: "The terms under which the CuraNav hospital search prototype is provided.",
};

const UPDATED = "2026-01-15";

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      intro="CuraNav is a prototype. These terms describe what you can expect from it and what we ask of you."
      updated={UPDATED}
    >
      <LegalSection heading="What we provide">
        <p>
          CuraNav is a search interface over a fixed hospital dataset, plus a
          structured symptom checklist. It is provided for general information about
          which hospitals in our dataset list a given specialty, and where they are.
        </p>
        <p>
          It is not a medical service, an appointment system, or an emergency
          service. See the{" "}
          <a href="/disclaimer" className="text-primary hover:underline">
            medical disclaimer
          </a>
          , which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <LegalList
          items={[
            "Use the site to look up hospitals. Do not use it to seek emergency help — call 108 or 112 instead.",
            "Do not attempt to disrupt the service, probe it for vulnerabilities without permission, or automate bulk scraping.",
            "Do not misrepresent our results as a clinical recommendation when sharing them.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="No guarantee of accuracy">
        <p>
          We work to keep the dataset and the matching logic honest, and we disclose
          where the search had to relax a filter. Even so, the dataset is a snapshot,
          much of it is machine-generated, and we make no warranty that a hospital
          appears, that a listing is current, or that any result is suitable for your
          needs. Verify anything that matters with the hospital directly.
        </p>
      </LegalSection>

      <LegalSection heading="Availability and changes">
        <p>
          This is a competition prototype. Features, data and availability may change
          or be withdrawn at any time without notice.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the extent permitted by law, CuraNav and its contributors are not liable
          for any decision you make in reliance on this site, including any delay in
          seeking care. Nothing in these terms limits liability that cannot lawfully be
          limited.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms can go to{" "}
          <a href="mailto:contact@curanav.in" className="text-primary hover:underline">
            contact@curanav.in
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
