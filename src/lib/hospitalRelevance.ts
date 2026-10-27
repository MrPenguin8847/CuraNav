import type { Hospital } from "./mockHospitals";
import { SPECIALTY_CATALOG } from "./specialtyCatalog";

/**
 * Relevance scoring, shared by `GET /api/hospitals` and the search page so that
 * the order the user sees and the explanation they are shown come from the same
 * function. If ranking lived only in the API, the UI could never justify it.
 *
 * The design rule: a query we could not fully resolve must still return useful
 * results. So scoring degrades in explicit stages —
 *
 *   exact specialty  →  same clinical group  →  rest of the dataset
 *
 * — and every stage reports which one produced the score. `stage` is what the
 * UI turns into "we could not match X exactly, so we ranked by related services".
 */

/** specialty dataset value → the clinical group it belongs to. */
const GROUP_BY_SPECIALTY = new Map<string, string>();
for (const group of SPECIALTY_CATALOG) {
  for (const specialty of group.specialties) {
    GROUP_BY_SPECIALTY.set(specialty.toLowerCase(), group.id);
  }
}

/**
 * Clinical groups that a patient asking for one of these would also reasonably
 * accept. Keeps ranking from being too literal — a "burns" query should surface
 * plastic surgery, and a "diabetes" query should surface endocrinology.
 *
 * Every value must be a real `SpecialtyGroup.id` from `SPECIALTY_CATALOG`; a
 * typo here silently disables the relationship.
 */
const RELATED_GROUPS: Readonly<Record<string, readonly string[]>> = {
  emergency: ["orthopaedics", "general-surgery", "pulmonology"],
  "burns-plastic": ["orthopaedics", "general-surgery"],
  cardiology: ["general-medicine", "endocrinology"],
  orthopaedics: ["rheumatology", "pain-medicine", "general-surgery"],
  maternity: ["general-surgery", "paediatrics"],
  nephrology: ["general-medicine", "urology", "endocrinology"],
  oncology: ["general-surgery", "dermatology"],
  ophthalmology: ["general-surgery"],
  neurology: ["general-medicine", "orthopaedics"],
  "general-surgery": ["emergency", "urology", "gastroenterology", "ent"],
  "general-medicine": ["paediatrics", "pulmonology", "gastroenterology", "endocrinology", "dermatology"],
  urology: ["nephrology", "general-surgery"],
  endocrinology: ["general-medicine", "nephrology"],
  "mental-health": ["general-medicine", "neurology"],
  paediatrics: ["general-medicine", "maternity", "pulmonology"],
  ent: ["general-surgery", "general-medicine"],
  pulmonology: ["general-medicine", "emergency", "paediatrics"],
  gastroenterology: ["general-surgery", "general-medicine"],
  dermatology: ["general-surgery"],
  rheumatology: ["orthopaedics", "pain-medicine"],
  "pain-medicine": ["orthopaedics", "neurology"],
};

export type MatchStage = "exact" | "related" | "unfiltered";

export interface RelevanceFactor {
  label: string;
  /** 0..1, the strength of this individual factor. */
  value: number;
  /** Points this factor contributed to the final score. */
  weight: number;
}

export interface HospitalRelevance {
  score: number;
  stage: MatchStage;
  /** Which requested specialties this hospital actually carries. */
  matchedSpecialties: string[];
  factors: RelevanceFactor[];
  /** One-line, user-facing justification. */
  explanation: string;
}

const WEIGHTS = {
  specialty: 40,
  group: 16,
  successRate: 18,
  pmjay: 8,
  verified: 6,
  budget: 12,
} as const;

export interface RelevanceQuery {
  /** Dataset specialty values the user asked for. */
  specialties: string[];
  minBudget?: number | null;
  maxBudget?: number | null;
}

function specialtyGroup(value: string): string | null {
  return GROUP_BY_SPECIALTY.get(value.trim().toLowerCase()) ?? null;
}

/**
 * Scores one hospital against the query. Pure and synchronous — no I/O — so it
 * is safe to call during render as well as inside the route handler.
 */
export function scoreHospital(hospital: Hospital, query: RelevanceQuery): HospitalRelevance {
  const requested = query.specialties.map((s) => s.trim()).filter(Boolean);
  const requestedLower = new Set(requested.map((s) => s.toLowerCase()));
  const hospitalSpecialties = (hospital.specialties ?? []).map((s) => s.trim()).filter(Boolean);
  const hospitalLower = new Set(hospitalSpecialties.map((s) => s.toLowerCase()));

  const matchedSpecialties = hospitalSpecialties.filter((s) => requestedLower.has(s.toLowerCase()));

  const factors: RelevanceFactor[] = [];
  let stage: MatchStage = "unfiltered";

  if (requested.length > 0) {
    if (matchedSpecialties.length > 0) {
      stage = "exact";
      factors.push({
        label: `Offers ${matchedSpecialties.slice(0, 2).join(", ")}`,
        value: 1,
        weight: WEIGHTS.specialty,
      });
    } else {
      // Same clinical group, or a group we treat as related.
      const requestedGroups = new Set(
        requested.map(specialtyGroup).filter((g): g is string => g !== null)
      );
      const related = new Set<string>();
      for (const group of requestedGroups) {
        for (const other of RELATED_GROUPS[group] ?? []) related.add(other);
      }
      for (const group of requestedGroups) related.delete(group);

      const hospitalGroups = new Set(
        hospitalSpecialties.map(specialtyGroup).filter((g): g is string => g !== null)
      );
      const groupHits = [...hospitalGroups].filter((g) => requestedGroups.has(g) || related.has(g));

      if (groupHits.length > 0) {
        stage = "related";
        factors.push({
          label: `Related field: ${groupHits[0]}`,
          value: Math.min(1, 0.6 + 0.1 * (groupHits.length - 1)),
          weight: WEIGHTS.group,
        });
      } else {
        factors.push({ label: "No matching specialty", value: 0, weight: 0 });
      }
    }

    // Outcome data for the exact specialty the user asked about.
    const rates = hospital.successRates ?? {};
    const bestRate = Math.max(
      0,
      ...matchedSpecialties.map((s) => (typeof rates[s] === "number" ? rates[s] : 0))
    );
    if (bestRate > 0) {
      factors.push({
        label: `${Math.round(bestRate * 100)}% success rate`,
        value: bestRate,
        weight: WEIGHTS.successRate,
      });
    }
  }

  if (hospital.pmjayEmpanelled) {
    factors.push({ label: "PM-JAY empanelled", value: 1, weight: WEIGHTS.pmjay });
  }
  if (hospital.verificationStatus === "verified") {
    factors.push({ label: "Data verified", value: 1, weight: WEIGHTS.verified });
  }

  // Budget fit: does the hospital's range overlap what the user can pay?
  const { minBudget, maxBudget } = query;
  if (minBudget != null || maxBudget != null) {
    const low = typeof hospital.costMin === "number" ? hospital.costMin : null;
    const high = typeof hospital.costMax === "number" ? hospital.costMax : null;
    const affordableFromScheme = hospital.pmjayEmpanelled === true;
    let value = 0;
    if (low == null && high == null) {
      value = 0.4; // no cost data: neutral, neither rewarded nor punished
    } else if (maxBudget != null && low != null && low <= maxBudget) {
      value = 1;
    } else if (minBudget != null && high != null && high >= minBudget) {
      value = 0.8;
    } else if (affordableFromScheme) {
      value = 0.7; // above the ceiling, but subsidised
    }
    factors.push({ label: "Within budget", value, weight: WEIGHTS.budget });
  }

  const score = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
  const top = factors.filter((f) => f.weight > 0).slice(0, 2).map((f) => f.label);

  return {
    score: Math.round(score * 10) / 10,
    stage,
    matchedSpecialties,
    factors,
    explanation: top.length > 0 ? top.join(" · ") : "No matching details recorded",
  };
}

/** Scores a whole result set, keyed by hospital id. */
export function scoreAll(
  hospitals: Hospital[],
  query: RelevanceQuery
): Map<string, HospitalRelevance> {
  const out = new Map<string, HospitalRelevance>();
  for (const hospital of hospitals) {
    out.set(hospital.hospitalId, scoreHospital(hospital, query));
  }
  return out;
}

/**
 * Sorts by relevance, then by distance, then by name so the order is stable
 * across reloads. Takes the score map it is given rather than recomputing, so a
 * caller can render the same scores it sorted by.
 */
export function sortHospitalsByRelevance(
  hospitals: Hospital[],
  relevance: Map<string, HospitalRelevance>
): Hospital[] {
  return [...hospitals].sort((a, b) => {
    const byScore = (relevance.get(b.hospitalId)?.score ?? 0) - (relevance.get(a.hospitalId)?.score ?? 0);
    if (byScore !== 0) return byScore;
    const byDistance = (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity);
    if (byDistance !== 0) return byDistance;
    return a.name.localeCompare(b.name);
  });
}

/** True when at least one hospital matched the requested specialty exactly. */
export function hasExactMatches(relevance: Map<string, HospitalRelevance>): boolean {
  for (const rel of relevance.values()) {
    if (rel.stage === "exact") return true;
  }
  return false;
}
