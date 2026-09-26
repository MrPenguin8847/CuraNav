"use client";

import { Info, ThumbsUp, Ban, TriangleAlert, Sparkles } from "lucide-react";
import type { CareRecommendation } from "@/lib/triage/types";

type Props = {
  care: CareRecommendation[];
};

/**
 * Renders vetted home-care entries.
 *
 * Every `stopIf` is rendered unconditionally and in the warning colour. It is
 * the safety net that makes the `self_care` tier defensible, so it must never be
 * de-emphasised or collapsed behind a disclosure.
 */
export function HomeCareCard({ care }: Props) {
  if (care.length === 0) return null;

  return (
    <section className="rounded-3xl border border-success/25 bg-success/[0.05] overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
            <ThumbsUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              What you can safely do at home
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Low-risk measures that may help while you arrange to see a doctor.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {care.map((entry) => (
            <article
              key={entry.key}
              className="rounded-2xl border border-white/10 bg-background/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-bold text-foreground">
                  {entry.title}
                </h4>
                <span className="badge-pill text-[10px] text-muted-foreground flex-shrink-0">
                  <Sparkles className="w-3 h-3" />
                  {entry.because}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {entry.why}
              </p>

              <div className="mt-3 space-y-2.5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-success mb-1.5">
                    Do
                  </p>
                  <ul className="space-y-1">
                    {entry.do.map((item) => (
                      <li
                        key={item}
                        className="text-xs text-foreground/90 flex items-start gap-2"
                      >
                        <span className="text-success mt-0.5 flex-shrink-0">
                          &#8226;
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-warning mb-1.5">
                    Avoid
                  </p>
                  <ul className="space-y-1">
                    {entry.avoid.map((item) => (
                      <li
                        key={item}
                        className="text-xs text-foreground/90 flex items-start gap-2"
                      >
                        <Ban className="w-3 h-3 text-warning mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-error/25 bg-error/[0.07] p-3 flex items-start gap-2.5">
                <TriangleAlert className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground/90 leading-relaxed">
                  <span className="font-bold text-error">Stop and seek care if: </span>
                  {entry.stopIf}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
          These measures are supportive only. They do not treat a cause, they
          have not been checked against your other conditions or medicines, and
          a pharmacist or doctor should confirm anything you take alongside them.
        </p>
      </div>
    </section>
  );
}
