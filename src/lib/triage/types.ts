/**
 * Symptom-check domain types.
 *
 * Design invariant: the LLM is an *advisor*, never an authority. It may raise
 * severity, it may never lower it, and it never authors the text of any home
 * care entry. See `assessment.ts` for how the final severity is derived.
 */

export type Severity = "emergency" | "urgent" | "routine" | "self_care";

/** Ascending order of concern. Used to take `max()` across the three layers. */
export const SEVERITY_RANK: Record<Severity, number> = {
  self_care: 0,
  routine: 1,
  urgent: 2,
  emergency: 3,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  emergency: "Emergency — act now",
  urgent: "Urgent — see a doctor today",
  routine: "Routine — book an appointment",
  self_care: "Self-care — monitor at home",
};

/** Maps each tier onto the design-system token that already exists in globals.css. */
export const SEVERITY_TOKEN: Record<
  Severity,
  { text: string; bg: string; border: string; ring: string }
> = {
  emergency: {
    text: "text-error",
    bg: "bg-error/10",
    border: "border-error/30",
    ring: "ring-error/30",
  },
  urgent: {
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    ring: "ring-warning/30",
  },
  routine: {
    text: "text-info",
    bg: "bg-info/10",
    border: "border-info/30",
    ring: "ring-info/30",
  },
  self_care: {
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    ring: "ring-success/30",
  },
};

export function maxSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

// ── Duration ──────────────────────────────────────────────────────────────────

export type DurationBucket =
  | "under_6h"
  | "under_24h"
  | "days_2_3"
  | "days_4_7"
  | "weeks_1_4"
  | "weeks_5_26"
  | "over_6m"
  | "unspecified";

export const DURATION_OPTIONS: ReadonlyArray<{
  value: DurationBucket;
  label: string;
  short: string;
  /** Representative value in days, used for severity maths and display. */
  days: number | null;
}> = [
  { value: "under_6h", label: "Started within the last few hours", short: "Under 6 hours", days: 0.25 },
  { value: "under_24h", label: "Started today (under 24 hours)", short: "Under 24 hours", days: 1 },
  { value: "days_2_3", label: "2 to 3 days ago", short: "2–3 days", days: 3 },
  { value: "days_4_7", label: "4 to 7 days ago", short: "4–7 days", days: 7 },
  { value: "weeks_1_4", label: "1 to 4 weeks ago", short: "1–4 weeks", days: 21 },
  { value: "weeks_5_26", label: "1 to 6 months ago", short: "1–6 months", days: 120 },
  { value: "over_6m", label: "More than 6 months ago", short: "Over 6 months", days: 200 },
  { value: "unspecified", label: "I'm not sure", short: "Not sure", days: null },
];

export const DURATION_LABEL: Record<DurationBucket, string> = Object.fromEntries(
  DURATION_OPTIONS.map((o) => [o.value, o.short])
) as Record<DurationBucket, string>;

export function durationToDays(bucket: DurationBucket): number | null {
  return DURATION_OPTIONS.find((o) => o.value === bucket)?.days ?? null;
}

export function durationLabel(bucket: DurationBucket): string {
  return DURATION_LABEL[bucket] ?? "Not sure";
}

// ── Patient context ───────────────────────────────────────────────────────────

export type Intensity = "mild" | "moderate" | "severe";

export const INTENSITY_OPTIONS: ReadonlyArray<{
  value: Intensity;
  label: string;
  description: string;
}> = [
  { value: "mild", label: "Mild", description: "Noticeable, but I can carry on normally" },
  { value: "moderate", label: "Moderate", description: "It disturbs my daily routine" },
  { value: "severe", label: "Severe", description: "I cannot do normal activities" },
];

export type AgeGroup =
  | "under_1"
  | "age_1_5"
  | "age_6_12"
  | "age_13_17"
  | "age_18_39"
  | "age_40_64"
  | "age_65_plus";

export const AGE_OPTIONS: ReadonlyArray<{ value: AgeGroup; label: string }> = [
  { value: "under_1", label: "Under 1 year" },
  { value: "age_1_5", label: "1 to 5 years" },
  { value: "age_6_12", label: "6 to 12 years" },
  { value: "age_13_17", label: "13 to 17 years" },
  { value: "age_18_39", label: "18 to 39 years" },
  { value: "age_40_64", label: "40 to 64 years" },
  { value: "age_65_plus", label: "65 years or older" },
];

/** Age bands that carry extra clinical caution regardless of the complaint. */
export function isHighRiskAge(age: AgeGroup): boolean {
  return age === "under_1" || age === "age_1_5" || age === "age_65_plus";
}

/**
 * Whether a pregnancy question is meaningful for the given sex.
 *
 * Only "male" rules it out. `null` (not answered yet) and "other / prefer not to
 * say" both keep the question, because we do not know the patient's anatomy and
 * a missed pregnancy is far more dangerous than an inapplicable question.
 */
export function canBePregnant(
  sex: "female" | "male" | "other" | null
): boolean {
  return sex !== "male";
}

/**
 * Pre-existing conditions that only apply to a patient who can be pregnant.
 *
 * Kept next to `canBePregnant` so the rule that hides the pregnancy question
 * also stops "Pregnancy" being offered as a condition, and so a draft written
 * before the rule existed gets cleaned up rather than passed to the model.
 */
export const PREGNANCY_ONLY_CONDITIONS: ReadonlySet<string> = new Set([
  "Pregnancy",
]);

// ── Input / output ────────────────────────────────────────────────────────────

export type TriageInput = {
  symptoms: string;
  duration: DurationBucket;
  intensity: Intensity;
  age: AgeGroup | null;
  sex: "female" | "male" | "other" | null;
  isPregnant: boolean;
  /** Red-flag ids the patient explicitly ticked. Never de-escalates severity. */
  reportedFlags: string[];
  existingConditions: string;
  currentMedications: string;
};

export type RedFlag = {
  id: string;
  /** Short patient-facing label, e.g. "Crushing chest pain". */
  label: string;
  category: string;
  /** One-line explanation of why this is time-critical. */
  rationale: string;
};

export type HomeCareEntry = {
  key: string;
  title: string;
  /** Why this is safe and how it helps. Plain language, no pharmacology. */
  why: string;
  /** Concrete actions. */
  do: string[];
  /** Things to avoid while trying this. */
  avoid: string[];
  /** Mandatory — the safety net that keeps the `self_care` tier honest. */
  stopIf: string;
};

export type CareRecommendation = HomeCareEntry & {
  /** Which cluster suggested this, for explainability. */
  because: string;
};

export type TriageResult = {
  severity: Severity;
  /** Plain-language restatement of the complaint, model-generated when available. */
  normalizedComplaint: string;
  durationLabel: string;
  durationDays: number | null;
  intensity: Intensity;
  clusters: string[];
  associatedSymptoms: string[];
  /** Comma-separated string of real dataset specialty values. */
  specialtyQuery: string;
  suggestedSpecialties: string[];
  care: CareRecommendation[];
  redFlags: RedFlag[];
  /** Human-readable audit trail of how severity was reached. */
  severityReasons: string[];
  followupQuestions: string[];
  /** True when the AI provider was unavailable and heuristics ran alone. */
  fallback: boolean;
  disclaimer: string;
};

export const TRIAGE_DISCLAIMER =
  "This is an intake preparation aid, not a diagnosis. It does not replace a doctor's assessment. If symptoms worsen, spread, or anything here feels wrong, seek medical care immediately.";

export const EMERGENCY_DISCLAIMER =
  "Do not use home care or wait for an appointment. Call 108 for an ambulance or 112 for the national emergency helpline, or go to the nearest emergency department now.";

export function emptyResult(input: TriageInput): TriageResult {
  return {
    severity: "self_care",
    normalizedComplaint: input.symptoms.trim(),
    durationLabel: durationLabel(input.duration),
    durationDays: durationToDays(input.duration),
    intensity: input.intensity,
    clusters: [],
    associatedSymptoms: [],
    specialtyQuery: "",
    suggestedSpecialties: [],
    care: [],
    redFlags: [],
    severityReasons: [],
    followupQuestions: [],
    fallback: true,
    disclaimer: TRIAGE_DISCLAIMER,
  };
}
