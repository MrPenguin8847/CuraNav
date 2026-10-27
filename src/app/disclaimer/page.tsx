import type { Metadata } from "next";
import { LegalPageShell, LegalSection, LegalList } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Medical Disclaimer | CuraNav",
  description:
    "CuraNav does not diagnose, triage or treat. What the search results do and do not tell you.",
};

const UPDATED = "2026-01-15";

export default function DisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="Please read this"
      title="Medical Disclaimer"
      intro="CuraNav is a search tool for a hospital directory. It is not a medical service, and nothing on this site is medical advice."
      updated={UPDATED}
    >
      <LegalSection heading="We do not diagnose or treat">
        <p>
          CuraNav does not diagnose conditions, does not tell you what is wrong with
          you, and does not recommend a treatment or a specific hospital. The
          symptom checker is a structured way to write down what you are feeling
          and to surface the specialties people commonly seek for it. It is not a
          clinical assessment and it has not been validated against patient outcomes.
        </p>
        <p>
          A severity label such as &ldquo;urgent&rdquo; is a prompt to seek care
          sooner, not a clinical determination about your condition.
        </p>
      </LegalSection>

      <LegalSection heading="What the search results actually mean">
        <p>
          Results are matched against a fixed hospital dataset using the filters you
          gave us: specialty, city or distance, budget, and required facilities. Where
          we had to loosen a filter to return anything, we say so on the results
          page rather than quietly widening the search.
        </p>
        <LegalList
          items={[
            "A hospital appearing in results means it lists a matching specialty in our dataset. It does not mean the hospital is good, available, or appropriate for you.",
            "Hospitals are not ranked by quality. We have no outcome, safety or patient-experience data, so we do not pretend to rank on them.",
            "Opening hours, bed availability, current facilities and prices change constantly. The dataset is a snapshot and may be out of date.",
            "Only a subset of the dataset is human-verified. Each hospital record carries a verification status, and much of the index is machine-generated.",
            "Being listed as PM-JAY empanelled reflects the dataset record only. Confirm current empanelment with the hospital or the official PM-JAY portal before you rely on it.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="In an emergency">
        <p>
          Do not use this website. Call <strong className="text-foreground">108</strong>{" "}
          (ambulance) or <strong className="text-foreground">112</strong> (emergency
          response) immediately, or go to the nearest emergency department. Time
          matters more than any list on a screen.
        </p>
      </LegalSection>

      <LegalSection heading="Costs">
        <p>
          Any cost figure shown is an estimate derived from the dataset, not a quote,
          a price list, or a promise of what you will be charged. Your actual costs
          depend on your insurance status, the treating clinician, and the hospital.
          Always confirm costs with the hospital before you proceed.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
