"use client";

import { useState } from "react";
import { FileText, Copy, Check, Printer } from "lucide-react";
import {
  buildIntakeSummaryRows,
  buildIntakeSummaryText,
} from "@/lib/triage/intakeSummary";
import type { TriageInput, TriageResult } from "@/lib/triage/types";

type Props = {
  input: TriageInput;
  result: TriageResult;
};

/**
 * The clinical intake summary — the thing a patient actually takes to the
 * consultation. It is assembled only from user input plus rule-engine output,
 * so it cannot contain invented clinical content.
 */
export function SymptomIntakeSummary({ input, result }: Props) {
  const [copied, setCopied] = useState(false);
  const rows = buildIntakeSummaryRows(input, result);

  const copy = () => {
    const text = buildIntakeSummaryText(input, result);
    void navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => setCopied(false));
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-card overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Your intake summary
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Copy or print this and hand it to your doctor so they do not have
              to reconstruct your history from memory.
            </p>
          </div>
        </div>

        <dl className="mt-5 rounded-2xl border border-white/10 bg-background/40 divide-y divide-white/10">
          {rows.map((row) => (
            <div
              key={row.label}
              className="px-4 py-3 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4"
            >
              <dt className="text-xs uppercase tracking-wider text-muted-foreground sm:pt-0.5">
                {row.label}
              </dt>
              <dd className="text-sm text-foreground leading-relaxed break-words">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {result.redFlags.length > 0 && (
          <div className="mt-4 rounded-2xl border border-error/25 bg-error/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-error mb-2">
              Red flags screened positive
            </p>
            <ul className="space-y-1.5">
              {result.redFlags.map((flag) => (
                <li key={flag.id} className="text-sm text-foreground">
                  <span className="font-semibold">{flag.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {flag.category} — {flag.rationale}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2.5">
              Mention these first when you reach the doctor or hospital desk.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button type="button" onClick={copy} className="btn-primary text-sm px-5 py-2.5">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied to clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy summary
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary text-sm px-5 py-2.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          {result.disclaimer}
        </p>
      </div>
    </section>
  );
}
