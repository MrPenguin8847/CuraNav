import { durationToDays, type DurationBucket, type Severity } from "./types";

/**
 * Duration and intensity modifiers.
 *
 * Duration cuts both ways: a symptom that has lasted months is less likely to
 * be an acute emergency but more likely to need a proper appointment, while a
 * brand-new symptom with a high-concern cluster is more urgent than the same
 * cluster at six weeks. These tables encode that, and they can only ever raise
 * severity, never lower it below the cluster's base.
 */

/**
 * Days above which an acute cluster should be downgraded one tier.
 * Only clusters that start at `urgent` or above are subject to this; a `routine`
 * complaint is never *raised* purely because it started recently, since that
 * would push almost every "it started this morning" report into same-day review.
 * Recent onset is already accounted for by the intensity modifier.
 */
const CHRONIC_THRESHOLD_DAYS = 21;

const SEVERITY_ORDER: Severity[] = ["self_care", "routine", "urgent", "emergency"];

function raise(severity: Severity, steps: number): Severity {
  const index = SEVERITY_ORDER.indexOf(severity);
  return SEVERITY_ORDER[Math.min(SEVERITY_ORDER.length - 1, index + steps)];
}

function lower(severity: Severity, steps: number): Severity {
  const index = SEVERITY_ORDER.indexOf(severity);
  return SEVERITY_ORDER[Math.max(0, index - steps)];
}

export type DurationAdjustment = {
  severity: Severity;
  reason: string | null;
};

/**
 * Adjusts a cluster's base severity for how long the symptom has been present.
 * Returns the base severity unchanged when the duration is unknown.
 */
export function adjustForDuration(
  baseSeverity: Severity,
  bucket: DurationBucket
): DurationAdjustment {
  const days = durationToDays(bucket);
  if (days === null) return { severity: baseSeverity, reason: null };

  if (baseSeverity === "self_care") {
    // Self-care only holds while the symptom is short. A month-long version of
    // the same complaint needs a doctor, not home management.
    if (days > CHRONIC_THRESHOLD_DAYS) {
      return {
        severity: "routine",
        reason: "This has lasted more than about three weeks, so it should be examined rather than managed at home.",
      };
    }
    return { severity: baseSeverity, reason: null };
  }

  if (baseSeverity === "routine") {
    if (days > CHRONIC_THRESHOLD_DAYS) {
      // Still needs review, just not urgently — and the chronic duration is
      // itself clinically relevant, which the reason string calls out.
      return {
        severity: "routine",
        reason: "Because this has persisted for weeks, bring a symptom diary to the appointment.",
      };
    }
    return { severity: baseSeverity, reason: null };
  }

  if (baseSeverity === "urgent") {
    if (days > CHRONIC_THRESHOLD_DAYS) {
      return {
        severity: "routine",
        reason: "This has been going on for weeks, which makes an appointment in the next few days appropriate rather than today.",
      };
    }
    return { severity: baseSeverity, reason: null };
  }

  return { severity: baseSeverity, reason: null };
}

/** Intensity adjustment. `severe` intensity always escalates one tier. */
export function adjustForIntensity(
  severity: Severity,
  intensity: "mild" | "moderate" | "severe"
): DurationAdjustment {
  if (intensity === "severe" && severity === "self_care") {
    return {
      severity: "routine",
      reason: "You described this as severe, so it should be assessed rather than managed at home.",
    };
  }
  if (intensity === "severe" && severity === "routine") {
    return {
      severity: "urgent",
      reason: "You described this as severe, which warrants being seen today.",
    };
  }
  return { severity, reason: null };
}

/** Age adjustment. Extreme age bands always escalate a self-care assessment. */
export function adjustForAge(
  severity: Severity,
  isHighRiskAge: boolean
): DurationAdjustment {
  if (isHighRiskAge && severity === "self_care") {
    return {
      severity: "routine",
      reason: "The age group makes it safer to have this checked by a doctor.",
    };
  }
  return { severity, reason: null };
}

/** Pregnancy adjustment. */
export function adjustForPregnancy(
  severity: Severity,
  isPregnant: boolean
): DurationAdjustment {
  if (isPregnant && severity === "self_care") {
    return {
      severity: "routine",
      reason: "Because of the pregnancy, this should be reviewed by a doctor rather than managed at home.",
    };
  }
  if (isPregnant && severity === "routine") {
    return {
      severity: "urgent",
      reason: "Because of the pregnancy, it is safer to be reviewed today.",
    };
  }
  return { severity, reason: null };
}

/** Suppresses home care entirely for clusters that must always be examined. */
export function canSelfCare(severity: Severity, neverSelfCare: boolean): boolean {
  return severity === "self_care" && !neverSelfCare;
}

export { raise, lower };
