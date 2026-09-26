"use client";

import Link from "next/link";
import {
  Stethoscope,
  ShieldAlert,
  FileText,
  ArrowRight,
  Lock,
} from "lucide-react";

const POINTS = [
  {
    icon: ShieldAlert,
    title: "Screens for warning signs first",
    body: "A deterministic rule engine checks for 28 emergency red flags before anything else runs. If one fires, you go straight to emergency guidance — the AI is never even consulted.",
  },
  {
    icon: Stethoscope,
    title: "Says how urgent this really is",
    body: "One of four levels — act now, see someone today, book an appointment, or monitor at home — with the reasoning shown so you can judge it for yourself.",
  },
  {
    icon: FileText,
    title: "Prepares you for the consultation",
    body: "Get a structured, copyable intake summary of your symptoms, timeline, and history to hand to a doctor, so you do not have to reconstruct it under pressure.",
  },
];

/**
 * Homepage entry point for the symptom checker.
 *
 * Placed above the scroll-driven sections on purpose: someone who opens CuraNav
 * with an active symptom is looking for help now, not for a hospital directory.
 */
export function SymptomCheckCTA() {
  return (
    <section className="relative z-10 py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-white/[0.02] to-secondary/[0.06] overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10">
            <div>
              <p className="badge-pill text-[10px]">
                <Stethoscope className="w-3 h-3" />
                New · Free · No sign-up
              </p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Not sure how urgent your symptoms are?
              </h2>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                Answer a few plain-language questions. We screen for emergency
                warning signs, help you work out the right level of care, and
                build a summary you can hand straight to a doctor.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/symptoms"
                  className="btn-primary text-base px-7 py-3.5"
                >
                  <Stethoscope className="w-4 h-4" />
                  Start symptom check
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/emergency"
                  className="btn-secondary text-base px-7 py-3.5"
                >
                  Emergency? Find a hospital
                </Link>
              </div>

              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <Lock className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-bold text-foreground">
                    Nothing is stored.
                  </span>{" "}
                  Answers stay in your browser tab, are never written to our
                  servers, and we never ask for your name or phone number.
                </span>
              </p>
            </div>

            <div className="space-y-4">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-background/40 p-4 flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                This is an intake preparation aid, not a diagnosis. In an
                emergency call{" "}
                <span className="font-bold text-foreground">108</span> or{" "}
                <span className="font-bold text-foreground">112</span> instead
                of using any web page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
