"use client";

import { useState } from "react";
import {
  Siren,
  Stethoscope,
  CalendarClock,
  HeartPulse,
  Check,
  Copy,
  Info,
} from "lucide-react";
import Link from "next/link";
import { SEVERITY_LABEL, SEVERITY_TOKEN, type Severity, type TriageResult } from "@/lib/triage/types";
import { getCluster } from "@/lib/triage/clusters";

type Props = {
  result: TriageResult;
  onRestart: () => void;
};

const ICON: Record<Severity, typeof Siren> = {
  emergency: Siren,
  urgent: Stethoscope,
  routine: CalendarClock,
  self_care: HeartPulse,
};

const HEADLINE: Record<Severity, string> = {
  emergency: "Act now",
  urgent: "Get seen today",
  routine: "Book an appointment",
  self_care: "Monitor at home",
};

const NEXT_STEP: Record<Severity, string> = {
  emergency:
    "Call an ambulance or go to the nearest emergency department. Do not wait for this page to load anything else.",
  urgent:
    "Contact a doctor today — a walk-in clinic, your usual physician, or a hospital outpatient department. If you cannot be seen and symptoms worsen, escalate to emergency care.",
  routine:
    "Book an appointment with a doctor in the next few days. Take the intake summary below with you.",
  self_care:
    "Try the measures below for a day or two and watch closely. If anything changes for the worse, or a stop-condition appears, get medical advice.",
};

export function TriageResultCard({ result, onRestart }: Props) {
  const token = SEVERITY_TOKEN[result.severity];
  const Icon = ICON[result.severity];
  const [copied, setCopied] = useState(false);

  const areas =
    result.clusters.length > 0
      ? result.clusters
          .map((id) => getCluster(id)?.label ?? id)
          .join(", ")
      : "Not classified";

  return (
    <section
      className={`rounded-3xl border ${token.border} ${token.bg} overflow-hidden`}
      aria-live="polite"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl ${token.bg} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-6 h-6 ${token.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold uppercase tracking-wider ${token.text}`}>
              Symptom check result
            </p>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight mt-0.5">
              {HEADLINE[result.severity]}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {SEVERITY_LABEL[result.severity]}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-background/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Your complaint, restated
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {result.normalizedComplaint}
          </p>
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Duration
              </dt>
              <dd className="text-sm font-semibold text-foreground mt-0.5">
                {result.durationLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Impact
              </dt>
              <dd className="text-sm font-semibold text-foreground mt-0.5 capitalize">
                {result.intensity}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Symptom area
              </dt>
              <dd className="text-sm font-semibold text-foreground mt-0.5">
                {areas}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Department
              </dt>
              <dd className="text-sm font-semibold text-foreground mt-0.5">
                {result.suggestedSpecialties[0] ?? "General Medicine"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-background/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
            How we reached this level
          </p>
          <ul className="space-y-1.5">
            {result.severityReasons.map((reason, i) => (
              <li
                key={i}
                className="text-sm text-foreground/90 flex items-start gap-2.5"
              >
                <Check className={`w-4 h-4 ${token.text} mt-0.5 flex-shrink-0`} />
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`mt-4 rounded-2xl border ${token.border} bg-background/40 p-4`}
        >
          <p className={`text-xs font-bold uppercase tracking-wider ${token.text} mb-1.5`}>
            What to do next
          </p>
          <p className="text-sm text-foreground leading-relaxed">{NEXT_STEP[result.severity]}</p>
        </div>

        {result.associatedSymptoms.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Also noted
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.associatedSymptoms.map((symptom) => (
                <span key={symptom} className="badge-pill text-xs">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.followupQuestions.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Be ready to answer these
            </p>
            <ol className="space-y-1.5">
              {result.followupQuestions.map((question, i) => (
                <li
                  key={question}
                  className="text-sm text-foreground/90 flex items-start gap-2.5"
                >
                  <span className="text-primary font-bold flex-shrink-0 w-4">
                    {i + 1}.
                  </span>
                  <span className="leading-relaxed">{question}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2.5">
          <Link
            href={
              result.specialtyQuery
                ? `/search?specialty=${encodeURIComponent(result.specialtyQuery)}`
                : "/search"
            }
            className="btn-primary text-sm px-5 py-2.5"
          >
            Find hospitals for this
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className="btn-secondary text-sm px-5 py-2.5"
          >
            Check different symptoms
          </button>
        </div>

        {result.fallback && (
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
            Our AI structuring service was unavailable, so this assessment was
            produced by the built-in clinical rule engine. Red-flag screening and
            severity are fully covered either way.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard
              ?.writeText(
                [result.normalizedComplaint, `Triage: ${SEVERITY_LABEL[result.severity]}`].join("\n")
              )
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })
              .catch(() => setCopied(false));
          }}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy result
            </>
          )}
        </button>
      </div>
    </section>
  );
}
