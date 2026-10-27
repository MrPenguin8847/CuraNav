import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Contact Us | CuraNav",
  description: "Report incorrect hospital data, request a correction, or get in touch with the CuraNav team.",
};

const UPDATED = "2026-01-15";

const TOPICS = [
  {
    title: "A hospital listing is wrong or missing",
    body: "The most useful thing you can send us. Tell us the hospital name and what is incorrect — a wrong specialty, a wrong city, a closed department — and we will correct the record.",
  },
  {
    title: "A search returned the wrong hospitals",
    body: "Tell us what you searched for and what you expected instead. That is the fastest way for us to find a gap in the matching logic.",
  },
  {
    title: "Privacy or data questions",
    body: "See the privacy policy for what we collect. If anything there does not match your expectations, tell us.",
  },
];

export default function ContactPage() {
  return (
    <LegalPageShell
      eyebrow="Get in touch"
      title="Contact Us"
      intro="We would rather correct a bad record than defend it. If something on this site is wrong, tell us."
      updated={UPDATED}
    >
      <LegalSection heading="Email">
        <a
          href="mailto:contact@curanav.in"
          className="inline-flex items-center gap-3 text-foreground hover:text-primary transition-colors"
        >
          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </span>
          <span>
            <span className="block font-semibold">contact@curanav.in</span>
            <span className="text-sm text-muted-foreground">
              Data corrections, search issues, anything at all
            </span>
          </span>
        </a>
      </LegalSection>

      <LegalSection heading="What to tell us">
        <div className="space-y-4">
          {TOPICS.map((topic) => (
            <div
              key={topic.title}
              className="glass bg-background/50 border border-white/10 rounded-xl p-4"
            >
              <p className="flex items-start gap-2 font-semibold text-foreground mb-1">
                <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                {topic.title}
              </p>
              <p className="text-sm">{topic.body}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection heading="Other ways to reach us">
        <div className="space-y-3">
          <p className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              <span className="text-foreground">+91 98765 43210</span>
              <span className="block text-sm">
                Prototype number — please prefer email
              </span>
            </span>
          </p>
          <p className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              <span className="text-foreground">Chandigarh, India</span>
              <span className="block text-sm">Remote team</span>
            </span>
          </p>
        </div>
      </LegalSection>

      <LegalSection heading="In an emergency">
        <p>
          Do not contact us. Call <strong className="text-foreground">108</strong> or{" "}
          <strong className="text-foreground">112</strong>, or go to your nearest
          emergency department. For{" "}
          <Link href="/emergency" className="text-primary hover:underline">
            emergency departments near you
          </Link>
          , use the emergency page.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
