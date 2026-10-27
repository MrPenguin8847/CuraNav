import type { Metadata } from "next";
import { LegalPageShell, LegalSection, LegalList } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | CuraNav",
  description:
    "What CuraNav collects, why, and what we do not do with it. No advertising trackers, no selling of health data.",
};

const UPDATED = "2026-01-15";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This is a prototype built for a competition. We collect as little as possible, and we do not sell or share personal data for advertising."
      updated={UPDATED}
    >
      <LegalSection heading="What we collect">
        <LegalList
          items={[
            "Search text you type, so we can structure the query and return results.",
            "Filters you set: city, specialty, budget range, required facilities, radius.",
            "Your approximate location, and only if you explicitly grant permission. If you decline, you can still search by typing a city name.",
            "Your city label, stored in your own browser (local storage) between visits. It never leaves your device unless you search with it.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="What we do not do">
        <LegalList
          items={[
            "We do not sell, rent or trade your data. There is no advertising network on this site and no third-party ad tracking.",
            "We do not ask for your name, age, address, phone number, or any government identifier.",
            "We do not create a health profile of you. We have no accounts and no patient records.",
            "We do not use third-party cookies for advertising.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Where your data goes">
        <p>
          Search text is sent to our server to be turned into structured filters, and
          results are read from our hospital database. Some searches are sent to a
          third-party language model to help interpret natural-language queries. Only
          the search text and your city label are sent for that purpose, never
          anything from this page identifying you.
        </p>
        <p>
          If you use the emergency page, your coordinates are used to find nearby
          hospitals. They are not stored on our servers.
        </p>
      </LegalSection>

      <LegalSection heading="Search logging">
        <p>
          We may log the queries people run, so we can tell which searches return
          nothing and fix them. Logged queries are not linked to an individual, and
          logging never blocks or delays a search: if logging fails, the search
          still completes.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <LegalList
          items={[
            "Decline location permission and search by city name instead — nothing is lost.",
            "Clear your saved city at any time by clearing this site's data in your browser.",
            "Close the browser tab and nothing about you is retained on your device.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about privacy can go to{" "}
          <a href="mailto:contact@curanav.in" className="text-primary hover:underline">
            contact@curanav.in
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
