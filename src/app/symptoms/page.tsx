"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowRight, Lock, Info } from "lucide-react";
import { StepSymptoms } from "@/components/symptoms/StepSymptoms";
import { StepContext } from "@/components/symptoms/StepContext";
import { TriageResultCard } from "@/components/symptoms/TriageResultCard";
import { HomeCareCard } from "@/components/symptoms/HomeCareCard";
import { EmergencyInterstitial } from "@/components/symptoms/EmergencyInterstitial";
import { SymptomIntakeSummary } from "@/components/symptoms/SymptomIntakeSummary";
import {
  canBePregnant,
  PREGNANCY_ONLY_CONDITIONS,
  TRIAGE_DISCLAIMER,
  type DurationBucket,
  type Intensity,
  type TriageInput,
  type TriageResult,
} from "@/lib/triage/types";

const MAX_SYMPTOMS = 2000;
const STORAGE_KEY = "curanav:triage-draft";

type Step = "symptoms" | "context" | "result";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "symptoms", label: "Symptoms" },
  { id: "context", label: "About you" },
  { id: "result", label: "Result" },
];

const EMPTY_INPUT: TriageInput = {
  symptoms: "",
  duration: "unspecified",
  intensity: "mild",
  age: null,
  sex: null,
  isPregnant: false,
  reportedFlags: [],
  existingConditions: "",
  currentMedications: "",
};

/**
 * The frosted panel the questions sit on.
 *
 * `.glass` is the project's existing frosted surface (surface-1 at 60% plus a
 * 12px backdrop blur). Without a surface like it the fields are 3% white on a
 * black starfield, so the form has no edges and reads as unstyled text floating
 * in a void.
 */
const PANEL_CLASS = "glass rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/40";

/**
 * Distinguishes the server render from the first client render.
 *
 * Reading `sessionStorage` during render would produce a hydration mismatch, so
 * the draft is restored in a render-phase adjustment that only runs once
 * hydration has completed. `useSyncExternalStore` is the primitive for this: it
 * gives a stable `false` on the server and `true` on the client, without a
 * setState-in-effect cascade.
 */
const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Reads the saved draft.
 *
 * Only the field *values* are restored, never the step. The step lives in React
 * state alone, so the wizard always opens on step 1; the draft is a convenience
 * for abandoning the form halfway, and `clearDraft` drops it as soon as a result
 * exists. Drafts written before the step-persistence fix carry a `step` key, so
 * it is stripped here rather than trusted.
 */
function readDraft(): Partial<TriageInput> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TriageInput> & { step?: unknown };
    if (typeof parsed.symptoms !== "string") return null;
    // Drafts written before the step-persistence fix carry a `step` key. Drop
    // unknown keys so they cannot ride along into the request body.
    const { step: _discarded, ...fields } = parsed;
    return fields as Partial<TriageInput>;
  } catch {
    // A corrupt or unreadable draft must never block the form.
    return null;
  }
}

/**
 * Whether the visitor has entered anything worth restoring.
 *
 * `duration` and `intensity` always hold a value because they are chip groups
 * with a default, so only the free-text fields, the age band and the flagged
 * warning signs count as real progress.
 */
function hasContent(input: TriageInput): boolean {
  return (
    input.symptoms.trim().length > 0 ||
    input.age !== null ||
    input.sex !== null ||
    input.reportedFlags.length > 0 ||
    input.existingConditions.trim().length > 0 ||
    input.currentMedications.trim().length > 0
  );
}

/**
 * Enforces the cross-field rules that no single field can express on its own.
 *
 * A patient recorded as male cannot be pregnant, so both the pregnancy flag and
 * the "Pregnancy" condition are cleared. This runs on every state change and on
 * draft restore, which means the UI never has to render a question that the API
 * would go on to discard — a silently dropped flag is worse than no flag,
 * because the escalation it drives is the whole point of asking.
 */
function normalize(input: TriageInput): TriageInput {
  if (canBePregnant(input.sex)) return input;

  const existingConditions = input.existingConditions
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !PREGNANCY_ONLY_CONDITIONS.has(s))
    .join(", ");

  if (!input.isPregnant && existingConditions === input.existingConditions) {
    return input;
  }
  return { ...input, isPregnant: false, existingConditions };
}

/**
 * Drops the saved draft.
 *
 * Called once a result exists: the check is finished, so the answers have served
 * their purpose. Clearing here is what guarantees that someone who leaves and
 * comes back through the header lands on a blank first step rather than a
 * half-remembered one.
 */
function clearDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // The draft is best-effort by design; failing to remove it is harmless.
  }
}

export default function SymptomsPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("symptoms");
  const [input, setInput] = useState<TriageInput>(EMPTY_INPUT);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot
  );

  // The draft lives in sessionStorage only. Nothing about a patient's symptoms
  // is sent to our database or written to disk on the server — closing the tab
  // destroys it. Restored once, after hydration, via a render-phase adjustment.
  if (hydrated && !restored) {
    const draft = readDraft();
    if (draft) {
      // Normalized on the way in: a draft saved before the pregnancy rule
      // existed can still hold a stale flag alongside a male sex.
      setInput((prev) => normalize({ ...prev, ...draft }));
    }
    setRestored(true);
  }

  useEffect(() => {
    // Never write on the result step: a finished check has no draft to keep,
    // and this stops the write-back from resurrecting what `clearDraft` just
    // removed if anything on that screen were to touch `input`.
    if (!restored || step === "result") return;
    try {
      // Only persist once there is something worth coming back to. Writing the
      // pristine form on mount would leave an empty draft behind for every
      // visitor who opened the page and thought better of it.
      if (hasContent(input)) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
      } else {
        clearDraft();
      }
    } catch {
      // Private-mode quota errors are non-fatal; the form still works.
    }
  }, [input, restored, step]);

  /**
   * Keep the wizard pinned to its own top on every step, including the first.
   *
   * The steps differ wildly in height, so a step change leaves the browser's
   * previous `scrollY` pointing into the middle of the next step — or past its
   * end, because the next step is usually shorter. That is the "it starts from
   * the bottom" report. The very first render needs the same treatment for a
   * different reason: returning through browser history restores a `scrollY`
   * from the previous visit, which drops the visitor into the middle of the
   * form. Scrolling unconditionally covers both, and is a no-op when the page
   * is already at the top.
   */
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    topRef.current?.scrollIntoView({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [step]);

  const patch = useCallback(
    (next: Partial<TriageInput>) => {
      setInput((prev) => normalize({ ...prev, ...next }));
    },
    []
  );

  const toggleFlag = useCallback((id: string) => {
    setInput((prev) => ({
      ...prev,
      reportedFlags: prev.reportedFlags.includes(id)
        ? prev.reportedFlags.filter((f) => f !== id)
        : [...prev.reportedFlags, id],
    }));
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    if (input.symptoms.trim().length < 3) {
      setError("Please describe your symptoms in a little more detail.");
      return;
    }
    if (input.age === null) {
      setError("Please choose an age group so we can weigh your symptoms correctly.");
      setStep("context");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/symptoms/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error ??
            (response.status === 429
              ? "Too many attempts in a row. Please wait a minute."
              : "We could not complete the check just now. Please try again.")
        );
      }

      const body = (await response.json()) as { result: TriageResult };
      setResult(body.result);
      setStep("result");
      clearDraft();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [input]);

  const restart = useCallback(() => {
    setInput(EMPTY_INPUT);
    setResult(null);
    setError(null);
    setStep("symptoms");
    clearDraft();
  }, []);

  // Emergency is terminal: the interstitial is the entire page state, and the
  // only way forward is to emergency care. The other tiers get the full result.
  const emergency = result?.severity === "emergency";
  const currentIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full">
        {/* `scroll-mt-16` offsets the sticky 4rem header so a step transition
            never lands with the step heading hidden underneath it. */}
        <div
          ref={topRef}
          className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 scroll-mt-16"
        >
          {/* The heading, the progress rail and the questions share one frosted
              panel so the step reads as a single surface. The result screen
              brings its own cards and opts out. */}
          <div className={step === "result" ? undefined : PANEL_CLASS}>
            {step !== "result" && (
              <header className="mb-8">
                <p className="badge-pill text-[10px]">
                  <ShieldCheck className="w-3 h-3" />
                  Free · private · no account
                </p>
                <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Symptom Check
                </h1>
                <p className="mt-2 text-base text-muted-foreground leading-relaxed max-w-2xl">
                  Answer a few questions and we will screen for warning signs, help
                  you work out how urgent this is, and prepare a summary you can
                  hand to a doctor.
                </p>
              </header>
            )}

            {step !== "result" && (
              <nav aria-label="Progress" className="mb-6">
                <ol className="flex items-center gap-2">
                  {STEPS.map((s, i) => {
                    const state =
                      i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
                    return (
                      <li key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              state === "todo"
                                ? "bg-white/5 text-muted-foreground border border-white/10"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span
                            className={`text-sm hidden sm:inline ${
                              state === "current"
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <span
                            className={`h-px flex-1 ${
                              i < currentIndex ? "bg-primary/50" : "bg-white/10"
                            }`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            {emergency ? (
              <EmergencyInterstitial flags={result?.redFlags ?? []} />
            ) : step === "result" && result ? (
              <div className="space-y-5" data-animate="fade-in-up">
                <TriageResultCard result={result} onRestart={restart} />
                {result.severity === "self_care" && <HomeCareCard care={result.care} />}
                <SymptomIntakeSummary input={input} result={result} />
                <p className="text-center">
                  <Link
                    href="/emergency"
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  >
                    Or find an emergency department near you
                  </Link>
                </p>
              </div>
            ) : step === "context" ? (
              <div className="space-y-6" data-animate="fade-in-up">
                <StepContext
                  age={input.age}
                  sex={input.sex}
                  isPregnant={input.isPregnant}
                  existingConditions={input.existingConditions}
                  currentMedications={input.currentMedications}
                  onChange={patch}
                />
                {error !== null && (
                  <p
                    role="alert"
                    className="rounded-xl border border-error/30 bg-error/[0.07] px-4 py-3 text-sm text-foreground"
                  >
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep("symptoms");
                    }}
                    className="btn-secondary text-sm px-5 py-3"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={submitting}
                    className="btn-primary text-sm px-6 py-3"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Assessing…
                      </>
                    ) : (
                      <>
                        Get my result
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div data-animate="fade-in-up">
                <StepSymptoms
                  symptoms={input.symptoms}
                  duration={input.duration}
                  intensity={input.intensity}
                  reportedFlags={input.reportedFlags}
                  onSymptomsChange={(symptoms) => patch({ symptoms })}
                  onDurationChange={(duration: DurationBucket) => patch({ duration })}
                  onIntensityChange={(intensity: Intensity) => patch({ intensity })}
                  onToggleFlag={toggleFlag}
                  onBack={() => router.back()}
                  onSubmit={() => {
                    setError(null);
                    setStep("context");
                  }}
                  submitting={submitting}
                  error={error}
                  maxLength={MAX_SYMPTOMS}
                />
              </div>
            )}
          </div>

          {step !== "result" && (
            <aside className="mt-10 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
                <Lock className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">Nothing is stored.</span>{" "}
                  Your answers stay in this browser tab only and are never written
                  to our servers. We do not ask for your name, phone number, or
                  address. Closing the tab discards everything.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {TRIAGE_DISCLAIMER} In an emergency, call{" "}
                  <span className="font-bold text-foreground">108</span> or{" "}
                  <span className="font-bold text-foreground">112</span> instead
                  of using this page.
                </p>
              </div>
            </aside>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
