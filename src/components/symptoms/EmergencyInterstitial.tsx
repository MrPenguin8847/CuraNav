"use client";

import { AlertTriangle, Ambulance, Phone, Siren } from "lucide-react";
import Link from "next/link";
import type { RedFlag } from "@/lib/triage/types";

type Props = {
  flags: RedFlag[];
};

/**
 * Blocking interstitial shown when the red-flag engine fires.
 *
 * Deliberately NOT an automatic redirect. An auto-`router.replace` would yank
 * the page away before the user has read what was found, and would be hostile
 * if a parent was checking on a child. This screen is the whole viewport, the
 * two helplines are unmissable, and going to `/emergency` is one tap.
 */
export function EmergencyInterstitial({ flags }: Props) {
  return (
    <div className="rounded-3xl border border-error/40 bg-error/[0.06] overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-error/20 flex items-center justify-center flex-shrink-0 animate-pulse-soft">
            <Siren className="w-7 h-7 text-error" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              Seek emergency care now
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Your answers include signs that can become dangerous within
              minutes to hours. Please do not wait for an appointment, and do
              not try to treat this at home.
            </p>
          </div>
        </div>

        {flags.length > 0 && (
          <div className="mt-5 rounded-2xl border border-error/25 bg-background/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-error mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              What we detected
            </p>
            <ul className="space-y-2">
              {flags.map((flag) => (
                <li key={flag.id} className="text-sm">
                  <span className="text-foreground font-semibold">
                    {flag.label}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {flag.rationale}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-5">
          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 px-4 py-4 bg-error text-white font-extrabold rounded-xl hover:bg-error/90 transition-colors text-lg shadow-lg shadow-error/30"
          >
            <Ambulance className="w-5 h-5" />
            108
          </a>
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 px-4 py-4 bg-white text-error font-extrabold rounded-xl hover:bg-white/90 transition-colors text-lg"
          >
            <Phone className="w-5 h-5" />
            112
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-2.5 text-center">
          108 is the ambulance service. 112 is the national emergency helpline.
          Call whichever you can reach first.
        </p>

        <Link
          href="/emergency?from=triage"
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 btn-primary text-sm"
        >
          <Siren className="w-4 h-4" />
          Find the nearest emergency hospital
        </Link>
      </div>
    </div>
  );
}
