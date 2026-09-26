import { detectRedFlags, type RedFlagMatch } from "./redFlags";
import { scoreClusters, getCluster, FALLBACK_CLUSTER_ID, type Cluster } from "./clusters";
import { resolveCare } from "./homeCare";
import {
  adjustForAge,
  adjustForDuration,
  adjustForIntensity,
  adjustForPregnancy,
  canSelfCare,
} from "./duration";
import {
  durationLabel,
  durationToDays,
  EMERGENCY_DISCLAIMER,
  isHighRiskAge,
  maxSeverity,
  SEVERITY_LABEL,
  TRIAGE_DISCLAIMER,
  type CareRecommendation,
  type Severity,
  type TriageInput,
  type TriageResult,
} from "./types";

/**
 * The advisory signal produced by the AI layer. It is passed in, never trusted
 * on its own, and is only ever able to raise the final severity.
 */
export type TriageAdvisor = {
  clusters: string[];
  associatedSymptoms: string[];
  suggestedSpecialties: string[];
  careKeys: string[];
  modelSeverity: Severity | null;
  normalizedComplaint: string | null;
  followupQuestions: string[];
  fallback: boolean;
};

/** Maximum number of associated symptoms and follow-up questions we surface. */
const MAX_ASSOCIATED = 8;
const MAX_QUESTIONS = 5;
const MAX_CARE = 4;
const MAX_CLUSTERS = 3;

/**
 * Combines the three severity layers into a single result.
 *
 *   final = max( redFlagSeverity, clusterSeverity, modelSeverity )
 *
 * Red flags are terminal. The model cannot lower anything. This function is
 * pure — no I/O, no clock, no randomness — so it is directly testable with
 * fixtures and safe to call on the server.
 */
export function assess(input: TriageInput, advisor: TriageAdvisor): TriageResult {
  const severityReasons: string[] = [];

  // ── Layer 1: deterministic red flags ───────────────────────────────────────
  const flags: RedFlagMatch[] = detectRedFlags(
    input.symptoms,
    input.reportedFlags,
    input.age
  );

  // ── Layer 2: cluster-derived severity ──────────────────────────────────────
  const localScored = scoreClusters(input.symptoms);
  const localIds = localScored.map((s) => s.cluster.id);

  // Prefer the model's clusters, but fall back to local matching, and always
  // union in any local match the model missed so a degraded model cannot hide
  // a cluster.
  const modelIds = advisor.clusters.filter((id) => getCluster(id) !== undefined);
  const clusterIds = [...new Set([...modelIds, ...localIds])].slice(0, MAX_CLUSTERS);

  const clusters: Cluster[] = clusterIds
    .map((id) => getCluster(id))
    .filter((c): c is Cluster => c !== undefined);

  const primary = clusters[0] ?? getCluster(FALLBACK_CLUSTER_ID)!;

  let severity: Severity = primary.baseSeverity;
  severityReasons.push(
    `Base level for "${primary.label}" is ${SEVERITY_LABEL[primary.baseSeverity].split("—")[0].trim().toLowerCase()}.`
  );

  if (clusters.some((c) => c.neverSelfCare) && severity === "self_care") {
    severity = "routine";
    severityReasons.push(
      "This type of symptom should be examined by a clinician even when mild."
    );
  }

  const durationAdj = adjustForDuration(severity, input.duration);
  severity = durationAdj.severity;
  if (durationAdj.reason) severityReasons.push(durationAdj.reason);

  const intensityAdj = adjustForIntensity(severity, input.intensity);
  severity = intensityAdj.severity;
  if (intensityAdj.reason) severityReasons.push(intensityAdj.reason);

  const ageAdj = adjustForAge(severity, input.age !== null && isHighRiskAge(input.age));
  severity = ageAdj.severity;
  if (ageAdj.reason) severityReasons.push(ageAdj.reason);

  const pregAdj = adjustForPregnancy(severity, input.isPregnant);
  severity = pregAdj.severity;
  if (pregAdj.reason) severityReasons.push(pregAdj.reason);

  // Existing conditions raise the floor for otherwise-mild complaints.
  if (input.existingConditions.trim() && severity === "self_care") {
    severity = "routine";
    severityReasons.push(
      "Because you have an existing health condition, this should be reviewed by a doctor."
    );
  }

  // ── Layer 3: model signal — advisory, raise-only ───────────────────────────
  if (advisor.modelSeverity) {
    const merged = maxSeverity(severity, advisor.modelSeverity);
    if (merged !== severity) {
      severityReasons.push(
        `Your description also suggested a more urgent pattern (${SEVERITY_LABEL[advisor.modelSeverity]}), so this was raised.`
      );
    }
    severity = merged;
  }

  // ── Red flags are terminal ────────────────────────────────────────────────
  if (flags.length > 0) {
    severity = "emergency";
    severityReasons.unshift(
      `Emergency warning signs detected: ${flags.map((f) => f.label).join("; ")}.`
    );
  }

  // ── Specialties: clusters first, then the model, deduplicated ─────────────
  const clusterSpecialties = clusters.flatMap((c) => [...c.specialties]);
  const specialtySet: string[] = [];
  for (const s of [...clusterSpecialties, ...advisor.suggestedSpecialties]) {
    if (!specialtySet.includes(s)) specialtySet.push(s);
  }
  const suggestedSpecialties = specialtySet.slice(0, 4);

  if (flags.length > 0) {
    // Emergency referrals must land on an emergency-capable department even if
    // the cluster map said otherwise.
    for (const s of ["Emergency Medicine", "Emergency Stabilization", "Critical Care"]) {
      if (!suggestedSpecialties.includes(s)) suggestedSpecialties.push(s);
    }
  }

  // ── Home care: never for emergencies, never for neverSelfCare clusters ────
  const neverSelfCare = clusters.some((c) => c.neverSelfCare) || flags.length > 0;
  const selfCareAllowed = canSelfCare(severity, neverSelfCare);

  const proposedCareKeys = [
    ...advisor.careKeys,
    ...(selfCareAllowed ? clusters.flatMap((c) => [...c.careKeys]) : []),
  ];
  const { entries, rejected } = selfCareAllowed
    ? resolveCare(proposedCareKeys)
    : { entries: [], rejected: [] };

  if (rejected.length > 0) {
    console.warn(
      `[triage] Dropped ${rejected.length} unrecognised care key(s) from the model response: ${rejected.join(", ")}`
    );
  }

  // Attribute each recommendation to the cluster that asked for it.
  const careByKey = new Map<string, string>();
  for (const c of clusters) {
    for (const key of c.careKeys) {
      if (!careByKey.has(key)) careByKey.set(key, c.label);
    }
  }
  const care: CareRecommendation[] = entries.slice(0, MAX_CARE).map((entry) => ({
    ...entry,
    because:
      careByKey.get(entry.key) ??
      (advisor.careKeys.includes(entry.key) ? "your description" : "general recovery"),
  }));

  // ── Follow-up questions: cluster questions, then model questions ──────────
  const questionSet: string[] = [];
  for (const q of [
    ...clusters.flatMap((c) => [...c.followupQuestions]),
    ...advisor.followupQuestions,
  ]) {
    const trimmed = q.trim();
    if (trimmed && !questionSet.includes(trimmed)) questionSet.push(trimmed);
  }
  const followupQuestions = questionSet.slice(0, MAX_QUESTIONS);

  const associatedSymptoms = [
    ...new Set(
      advisor.associatedSymptoms
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 1 && s.length < 60)
    ),
  ].slice(0, MAX_ASSOCIATED);

  return {
    severity,
    normalizedComplaint:
      advisor.normalizedComplaint?.trim() || input.symptoms.trim(),
    durationLabel: durationLabel(input.duration),
    durationDays: durationToDays(input.duration),
    intensity: input.intensity,
    clusters: clusters.map((c) => c.id),
    associatedSymptoms,
    specialtyQuery: suggestedSpecialties.join(","),
    suggestedSpecialties,
    care,
    redFlags: flags,
    severityReasons,
    followupQuestions,
    fallback: advisor.fallback,
    disclaimer:
      severity === "emergency" ? EMERGENCY_DISCLAIMER : TRIAGE_DISCLAIMER,
  };
}

/** An advisor that contributes nothing, used when every provider failed. */
export function nullAdvisor(fallback = true): TriageAdvisor {
  return {
    clusters: [],
    associatedSymptoms: [],
    suggestedSpecialties: [],
    careKeys: [],
    modelSeverity: null,
    normalizedComplaint: null,
    followupQuestions: [],
    fallback,
  };
}
