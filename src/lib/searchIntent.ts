import {
  CANONICAL_SPECIALTIES,
  isCanonicalSpecialty,
  normalizeFacilities,
  resolveSpecialtyFromText,
} from "@/lib/specialties";

/**
 * Typed search intent.
 *
 * The previous pipeline collapsed an entire query into one free-text blob and
 * then a single pass/fail: either the filters matched something, or the system
 * silently fell back to "hospitals near you". That is precisely the behaviour
 * that made an unmatched query look like a broken tool.
 *
 * Instead each field carries its own value, its own confidence, and the reason
 * we believe it. That makes it possible to say *which* part of the request we
 * understood and which part we did not — see `buildTransparencyNotices`.
 */

export type SortKey = "match" | "cost" | "distance" | "verified";

export type FieldConfidence = "high" | "medium" | "low" | "none";

/** Where a value came from, so the UI can be honest about who decided. */
export type FieldSource = "model" | "synonym" | "user" | "none";

export interface ParsedField<T> {
  value: T | null;
  confidence: FieldConfidence;
  source: FieldSource;
  /** Human-readable justification, shown in the explainability panel. */
  reason: string;
}

export interface BudgetRange {
  min: number | null;
  max: number | null;
}

export interface SearchIntent {
  condition: ParsedField<string>;
  /** Comma-separated `CANONICAL_SPECIALTIES` values. */
  specialty: ParsedField<string>;
  location: ParsedField<string>;
  radiusKm: ParsedField<number>;
  budget: ParsedField<BudgetRange>;
  facilities: ParsedField<string[]>;
  sortBy: ParsedField<SortKey>;
  /** Nearby cities to try if the requested city has no matching hospitals. */
  fallbackCities: string[];
  /** True when the user asked for "near me" / "nearby" rather than a place. */
  wantsNearby: boolean;
  /** An unindexed place the user asked for, kept so we can admit we dropped it. */
  unresolvedLocation: string | null;
  /** True when no model was involved and the synonym layer answered alone. */
  usedLocalFallback: boolean;
}

/** One sentence telling the user what we could not do, and what we did instead. */
export interface TransparencyNotice {
  id: string;
  severity: "info" | "warning";
  message: string;
  /** Concrete next step, e.g. "try: cardiology". */
  suggestion?: string;
}

/**
 * Cities present in the live dataset. Used to judge whether a location we
 * extracted is one we can actually serve, rather than a place the model
 * hallucinated or the user typed loosely.
 */
export const KNOWN_CITIES: readonly string[] = [
  "Ambala", "Amritsar", "Bawani Khera", "Bharatpur", "Bhilwara", "Bhiwani", "Bilaspur",
  "Chamba", "Chandigarh", "Charkhi Dadri", "Chowari", "Deorala", "Delhi", "Dharamsala",
  "Faridabad", "Fatehabad", "Ghumarwin", "Hamirpur", "Hoshiarpur", "Jaipur", "Jalandhar",
  "Jammu", "Jodhpur", "Keylong", "Kota", "Kullu", "Loharu", "Ludhiana", "Mandi", "Nahan",
  "Naraingarh", "Nurpur", "Palampur", "Rampur", "Ratia", "Reckong-Peo", "Shimla", "Siwani",
  "Solan", "Srinagar", "Sundernagar", "Tohana", "Tosham", "Udaipur", "Una",
];

export const KNOWN_CITY_KEYS = new Map(KNOWN_CITIES.map((c) => [c.toLowerCase(), c]));

/**
 * Cities that are not in the dataset but sit next to one that is. Lets a
 * query like "Mohali" resolve with reduced confidence and an honest note
 * rather than being dropped or silently returned as an exact match.
 */
const NEARBY_CITY_ALIASES: Readonly<Record<string, string>> = {
  mohali: "Chandigarh",
  panchkula: "Chandigarh",
  gurdaspur: "Jalandhar",
  pathankot: "Jalandhar",
  patiala: "Ludhiana",
  "ambala cantonment": "Ambala",
  gurgaon: "Faridabad",
  noida: "Faridabad",
  ghaziabad: "Delhi",
  "new delhi": "Delhi",
  ncr: "Delhi",
};

function empty<T>(reason: string): ParsedField<T> {
  return { value: null, confidence: "none", source: "none", reason };
}

function isFieldUsable(field: ParsedField<unknown>): boolean {
  return field.value !== null && field.value !== "" && field.confidence !== "none";
}

/* ── Specialty ─────────────────────────────────────────────────────────────── */

export interface SpecialtyResolution {
  value: string | null;
  confidence: FieldConfidence;
  source: FieldSource;
  reason: string;
  /** The term the user typed that we could not map, for the notice copy. */
  unmatchedTerm: string | null;
}

/**
 * Maps a specialty value proposed by any source onto real dataset values.
 *
 * A value that does not reduce to known specialties is NOT silently dropped: it
 * is reported as low confidence with the offending term attached, which is what
 * drives the "we couldn't confidently match X" banner.
 */
export function resolveSpecialtyField(
  proposed: string | null | undefined,
  source: FieldSource
): SpecialtyResolution {
  if (!proposed || !proposed.trim()) {
    return { value: null, confidence: "none", source: "none", reason: "No specialty detected in your query.", unmatchedTerm: null };
  }

  // A single value that is already canonical is as certain as it gets.
  if (isCanonicalSpecialty(proposed)) {
    return {
      value: proposed.trim(),
      confidence: "high",
      source,
      reason: `"${proposed.trim()}" is an indexed specialty.`,
      unmatchedTerm: null,
    };
  }

  // A comma-separated list is trusted if every part is canonical.
  const parts = proposed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && parts.every((p) => isCanonicalSpecialty(p))) {
    return {
      value: parts.join(","),
      confidence: "high",
      source,
      reason: `Matched ${parts.length} indexed specialties.`,
      unmatchedTerm: null,
    };
  }

  // The model often answers with a phrase ("cardiology hospital", "eye surgeon")
  // rather than a bare label. Recover the indexed values inside it before
  // giving up, so a correct-but-wordy answer is not reported as unmatched.
  const embedded = CANONICAL_SPECIALTIES.filter((c) =>
    new RegExp(`\\b${c.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(proposed.toLowerCase())
  );
  if (embedded.length > 0) {
    return {
      value: embedded.join(","),
      confidence: "medium",
      source,
      reason: `Read "${proposed.trim()}" as ${embedded.join(", ")}.`,
      unmatchedTerm: null,
    };
  }

  // Otherwise try the synonym layer before giving up.
  const hint = resolveSpecialtyFromText(proposed);
  if (hint) {
    const exact = normalizeSpecialtyList(hint.specialties);
    if (exact) {
      return {
        value: exact,
        confidence: "medium",
        source: "synonym",
        reason: `Mapped "${proposed.trim()}" to ${hint.label} using our clinical synonym list (matched "${hint.matchedKeyword}").`,
        unmatchedTerm: null,
      };
    }
  }

  return {
    value: null,
    confidence: "low",
    source,
    reason: `"${proposed.trim()}" does not match any indexed specialty.`,
    unmatchedTerm: proposed.trim(),
  };
}

function normalizeSpecialtyList(value: string): string {
  const kept = value.split(",").map((p) => p.trim()).filter((p) => isCanonicalSpecialty(p));
  return [...new Set(kept)].join(",");
}

/* ── Location ──────────────────────────────────────────────────────────────── */

export interface LocationResolution {
  /**
   * Only ever an indexed city (directly or via `NEARBY_CITY_ALIASES`).
   * An unrecognised place yields null, so it can never become a hard filter
   * that silently empties the result set.
   */
  value: string | null;
  confidence: FieldConfidence;
  reason: string;
  /** The unindexed name the user typed, kept for the notice copy. */
  attempted: string | null;
  /** True when the user asked for "near me" rather than naming a place. */
  wantsNearby: boolean;
}

export function resolveLocationField(
  proposed: string | null | undefined,
  locationContext: string | null
): LocationResolution {
  const query = (proposed ?? "").trim();
  const haystack = query.toLowerCase();
  const wantsNearby =
    /\b(near me|nearby|closest|nearest|around me|in my area)\b/.test(haystack);

  if (query) {
    const known = KNOWN_CITY_KEYS.get(query.toLowerCase());
    if (known) {
      return { value: known, confidence: "high", reason: `${known} is in our dataset.`, attempted: null, wantsNearby };
    }

    const alias = NEARBY_CITY_ALIASES[query.toLowerCase()];
    if (alias) {
      return {
        value: alias,
        confidence: "medium",
        reason: `${query} is not indexed directly, so we searched the nearest covered area (${alias}) instead.`,
        attempted: query,
        wantsNearby,
      };
    }

    return {
      value: null,
      confidence: "low",
      reason: `we have no hospitals indexed in "${query}"`,
      attempted: query,
      wantsNearby,
    };
  }

  // Fall back to the consented device location, which is a strong signal.
  if (locationContext) {
    return {
      value: locationContext,
      confidence: "high",
      reason: `using your saved location (${locationContext})`,
      attempted: null,
      wantsNearby: true,
    };
  }

  if (wantsNearby) {
    return {
      value: null,
      confidence: "none",
      reason: "You asked for hospitals near you, but no location is available yet.",
      attempted: null,
      wantsNearby: true,
    };
  }

  return { value: null, confidence: "none", reason: "No location mentioned in your query.", attempted: null, wantsNearby: false };
}

/* ── Budget ────────────────────────────────────────────────────────────────── */

interface ScannedAmount {
  amount: number;
  unit: "lakh" | "k" | null;
  /** The number was written directly against a currency marker (`₹50,000`). */
  anchored: boolean;
  /** The digits were comma-grouped (`50,000`), which is money in this domain. */
  grouped: boolean;
}

const MAX_WORDS =
  /\b(under|below|less than|within|at most|max(?:imum)?|upto|up to|not more than|or less)\b/;
const MIN_WORDS =
  /\b(over|above|more than|at least|starting from|minimum|min)\b/;
const RANGE_WORDS = /\b(between|to)\b/;

/** Any comparison or range word is evidence the user is talking about money. */
const COMPARISON_WORDS = /\b(under|below|less than|within|at most|max(?:imum)?|upto|up to|not more than|or less|over|above|more than|at least|starting from|minimum|min|between)\b/;
const CURRENCY_MARKER = /(₹|\brs\.?\b|\binr\b)/;
/** Other nouns a user writes numbers next to that are never prices. */
const MONEY_WORDS =
  /\b(budget|cost|costs|costing|price|prices|priced|rupees|afford|affordable|expensive|cheap|cheaper|charges?|chargeable|billing|package|packages|payment|insurance|cover|coverage)\b/;

/**
 * Units a number can be attached to that mean the number is definitely not a
 * price. Rejecting these is what stops "200 beds" and "45 year old" from
 * becoming a ₹200 or ₹45 budget filter.
 */
const NON_MONEY_UNITS = new Set([
  "bed", "beds", "bedded", "bedside",
  "year", "years", "yr", "yrs", "y/o", "yo", "old", "month", "months", "day", "days",
  "week", "weeks", "hour", "hours", "hr", "hrs", "min", "mins", "minute", "minutes",
  "floor", "floors", "storey", "storeys", "room", "rooms", "bedside",
  "percent", "%", "km", "kms", "kilometer", "kilometers", "mile", "miles",
  "mg", "ml", "kg", "cm", "mm", "bpm", "mmhg", "degree", "degrees", "slot", "slots",
]);

const MONEY_UNIT_LAKH = /^(l|lakh|lakhs|lac|lacs)$/;
const MONEY_UNIT_THOUSAND = /^(k|thousand|thousands)$/;

function scanAmounts(text: string): ScannedAmount[] {
  const found: ScannedAmount[] = [];
  const numRe = /\d+(?:[.,]\d+)?/g;
  let m: RegExpExecArray | null;

  while ((m = numRe.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;

    // What immediately follows the digits: possibly a unit word.
    const rest = text.slice(end);
    const unitMatch = /^\s*([a-z%]{1,12})/.exec(rest);
    const unitToken = unitMatch ? unitMatch[1] : null;
    const afterUnit = unitMatch ? end + unitMatch[0].length : end;

    if (unitToken && NON_MONEY_UNITS.has(unitToken)) {
      // "200 beds", "45 year old": a real measurement, not a price.
      numRe.lastIndex = afterUnit;
      continue;
    }

    let unit: ScannedAmount["unit"] = null;
    if (unitToken && MONEY_UNIT_LAKH.test(unitToken)) {
      unit = "lakh";
      numRe.lastIndex = afterUnit;
    } else if (unitToken && MONEY_UNIT_THOUSAND.test(unitToken)) {
      unit = "k";
      numRe.lastIndex = afterUnit;
    }

    // A number glued to letters is part of a different token: the "24" in
    // "24x7 Emergency" is a claim about opening hours, not twenty-four rupees.
    if (/[a-z0-9/]/i.test(text[start - 1] ?? "") || /[a-z0-9/]/i.test(text[afterUnit] ?? "")) {
      continue;
    }

    const amount = parseFloat(m[0].replace(/,/g, ""));
    if (!Number.isFinite(amount)) continue;

    found.push({
      amount,
      unit,
      anchored: /₹\s*$/.test(text.slice(Math.max(0, start - 4), start)),
      grouped: m[0].includes(","),
    });
  }
  return found;
}

function toRupees({ amount, unit }: ScannedAmount, sharedUnit: "lakh" | "k" | null): number {
  const effective = unit ?? sharedUnit;
  if (effective === "lakh") return Math.round(amount * 100000);
  if (effective === "k") return Math.round(amount * 1000);
  return Math.round(amount);
}

/**
 * Extracts a budget range from free text.
 *
 * Handles the phrasings patients actually use — "under 3 lakh", "between 1 and
 * 3 lakh", "₹50,000", "2.5L", "above 1 lakh" — and returns an empty range
 * rather than guessing when there is no money mentioned.
 *
 * A unit written once applies to every bare number in the phrase, so
 * "between 1 and 3 lakh" is read as 1–3 lakh rather than 1–3 rupees. A bare
 * amount with no comparison word is read as an upper bound, because
 * "hospitals for 50000" in this context means "I have 50000".
 *
 * The important part is what is *rejected*. A bare number only counts as a
 * budget when there is money evidence somewhere in the query — a currency
 * marker, a money word, a comparison word, comma grouping, or a value that
 * could plausibly be a price. Without that gate, "24x7 emergency hospital near
 * me" produced a hard `max_budget` of 24 rupees and silently hid every result
 * above ₹24, which is worse than not having a budget filter at all.
 */
export function extractBudgetFromText(text: string): BudgetRange {
  // Normalise "rs"/"inr" onto the rupee sign so the currency anchor works,
  // while leaving ₹ intact.
  const q = text.toLowerCase().replace(/\brs\.?\s*/g, "₹ ").replace(/\binr\s*/g, "₹ ");

  const scanned = scanAmounts(q);

  // Money evidence in the phrase itself: a currency marker, a money word, a
  // comparison word, comma grouping, or a value large enough to be a price.
  const hasMoneyContext =
    CURRENCY_MARKER.test(q) || MONEY_WORDS.test(q) || COMPARISON_WORDS.test(q);
  // "1 to 3 lakh": the bare 1 is only money because the phrase also names a
  // money unit. Establishing that from the other numbers keeps the lower bound
  // without opening the door to every incidental number in a query.
  const hasMoneyEvidence = scanned.some((a) => a.anchored || a.unit !== null);

  const amounts = scanned.filter(
    (a) =>
      a.anchored ||
      a.unit !== null ||
      a.grouped ||
      hasMoneyEvidence ||
      hasMoneyContext ||
      a.amount >= 1000
  );
  if (amounts.length === 0) return { min: null, max: null };

  // A unit written once applies to the whole phrase: "1 to 3 lakh".
  const sharedUnit = amounts.find((a) => a.unit !== null)?.unit ?? null;

  if (RANGE_WORDS.test(q) && amounts.length >= 2) {
    return { min: toRupees(amounts[0], sharedUnit), max: toRupees(amounts[1], sharedUnit) };
  }

  if (MAX_WORDS.test(q)) {
    return { min: null, max: toRupees(amounts[0], sharedUnit) };
  }

  if (MIN_WORDS.test(q)) {
    return { min: toRupees(amounts[0], sharedUnit), max: null };
  }

  if (amounts.length >= 2) {
    return { min: toRupees(amounts[0], sharedUnit), max: toRupees(amounts[1], sharedUnit) };
  }

  return { min: null, max: toRupees(amounts[0], sharedUnit) };
}

function formatRupees(n: number | null): string {
  if (n == null) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ── Intent assembly ───────────────────────────────────────────────────────── */

export interface RawExtraction {
  condition?: string | null;
  specialty?: string | null;
  city?: string | null;
  radius_km?: number | null;
  min_budget?: number | null;
  max_budget?: number | null;
  facilities?: string | string[] | null;
  sort_by?: string | null;
  fallback_cities?: string[] | null;
  chips?: { icon: string; label: string; value: string }[];
  /** Set by the caller when no model provider answered. */
  usedLocalFallback?: boolean;
}

export interface IntentParts {
  query: string;
  locationContext: string | null;
  /** The provider that answered, or "local rule engine". */
  extractor: string;
}

/**
 * Turns a raw extraction — from the model or from the local rule engine — into
 * a fully-typed intent with per-field confidence, and derives the transparency
 * notices that must accompany the results.
 */
export function buildSearchIntent(parts: IntentParts, raw: RawExtraction): SearchIntent {
  const { query, locationContext } = parts;
  const local = raw.usedLocalFallback === true;

  const specialtySource: FieldSource = local ? "synonym" : "model";
  const specialty = resolveSpecialtyField(raw.specialty ?? null, specialtySource);
  const condition = resolveConditionField(raw.condition ?? null, specialty.value, local);

  const location = resolveLocationField(raw.city ?? null, locationContext);
  const budget = resolveBudgetField(raw, query);
  const facilities = resolveFacilitiesField(raw.facilities ?? null);
  const radiusKm = resolveRadiusField(raw.radius_km ?? null, query);
  const sortBy = resolveSortField(raw.sort_by ?? null, query);

  const fallbackCities = (raw.fallback_cities ?? []).filter(
    (c): c is string => typeof c === "string" && c.trim().length > 0
  );

  const intent: SearchIntent = {
    condition,
    specialty: {
      value: specialty.value,
      confidence: specialty.confidence,
      source: specialty.source,
      reason: specialty.reason,
    },
    location: {
      value: location.value,
      confidence: location.confidence,
      source: location.value ? (location.confidence === "high" ? "model" : "synonym") : "none",
      reason: location.reason,
    },
    radiusKm,
    budget,
    facilities,
    sortBy,
    fallbackCities,
    wantsNearby: location.wantsNearby,
    unresolvedLocation: location.attempted,
    usedLocalFallback: local,
  };

  return intent;
}

function resolveConditionField(
  proposed: string | null,
  specialtyValue: string | null,
  local: boolean
): ParsedField<string> {
  if (proposed && proposed.trim()) {
    return {
      value: proposed.trim(),
      confidence: local ? "medium" : "high",
      source: local ? "synonym" : "model",
      reason: local
        ? `Read "${proposed.trim()}" using our built-in clinical keyword rules.`
        : `Read "${proposed.trim()}" from your wording.`,
    };
  }
  if (specialtyValue) {
    const first = specialtyValue.split(",")[0];
    return {
      value: first,
      confidence: "medium",
      source: "synonym",
      reason: `Inferred from the specialty ${first}.`,
    };
  }
  return empty("No condition detected in your query.");
}

function resolveBudgetField(raw: RawExtraction, query: string): ParsedField<BudgetRange> {
  const hasModelBudget = raw.min_budget != null || raw.max_budget != null;
  const fromText = extractBudgetFromText(query);
  const min = raw.min_budget ?? fromText.min;
  const max = raw.max_budget ?? fromText.max;

  if (min == null && max == null) {
    return empty("No budget mentioned.");
  }

  const fromModel = hasModelBudget;
  return {
    value: { min, max },
    confidence: fromModel ? "high" : "medium",
    source: fromModel ? "model" : "synonym",
    reason:
      min != null && max != null
        ? `Budget between ${formatRupees(min)} and ${formatRupees(max)}.`
        : max != null
          ? `Budget up to ${formatRupees(max)}.`
          : `Budget from ${formatRupees(min)}.`,
  };
}

function resolveFacilitiesField(proposed: string | string[] | null): ParsedField<string[]> {
  if (!proposed) return empty("No facility requirements mentioned.");
  const list = Array.isArray(proposed) ? proposed : proposed.split(",");

  const normalized = normalizeFacilities(list.join(","));
  if (!normalized) {
    return {
      value: null,
      confidence: "low",
      source: "model",
      reason: "None of the requested facilities are recorded in our dataset, so that filter was skipped.",
    };
  }

  const unmapped = list.map((f) => String(f).trim()).filter((f) => f && !normalized.includes(f));
  return {
    value: normalized,
    confidence: unmapped.length > 0 ? "medium" : "high",
    source: unmapped.length > 0 ? "synonym" : "model",
    reason: unmapped.length > 0
      ? `Mapped to recorded facilities: ${normalized.join(", ")}.`
      : `Requires ${normalized.join(", ")}.`,
  };
}

function resolveRadiusField(proposed: number | null, query: string): ParsedField<number> {
  if (proposed != null && Number.isFinite(proposed) && proposed > 0) {
    return { value: proposed, confidence: "high", source: "model", reason: `Within ${proposed} km.` };
  }
  const match = query.match(/within\s*(\d+)\s*km/i);
  if (match) {
    const km = parseInt(match[1], 10);
    return { value: km, confidence: "high", source: "synonym", reason: `Within ${km} km.` };
  }
  return empty("No distance limit mentioned.");
}

function resolveSortField(proposed: string | null, query: string): ParsedField<SortKey> {
  const allowed: SortKey[] = ["match", "cost", "distance", "verified"];
  if (proposed && (allowed as string[]).includes(proposed)) {
    return { value: proposed as SortKey, confidence: "high", source: "model", reason: `Sorted by ${proposed}.` };
  }
  const q = query.toLowerCase();
  if (/\b(closest|nearest|nearby|near me|by distance)\b/.test(q)) {
    return { value: "distance", confidence: "high", source: "synonym", reason: "You asked for the nearest options." };
  }
  if (/\b(cheapest|affordable|lowest cost|least expensive|budget friendly)\b/.test(q)) {
    return { value: "cost", confidence: "high", source: "synonym", reason: "You asked for the most affordable options." };
  }
  return { value: "match", confidence: "low", source: "none", reason: "No sorting preference mentioned, so we ranked by relevance." };
}

/* ── Transparency ──────────────────────────────────────────────────────────── */

/**
 * Builds the notices that make every fallback visible.
 *
 * The rule this enforces: we may broaden a query when the user's intent is
 * ambiguous, but we may never do so silently. Each notice names the field we
 * could not resolve and states what we did instead.
 */
export function buildTransparencyNotices(
  query: string,
  intent: SearchIntent,
  opts: { resultCount?: number; broadenedLocation?: string[] | null } = {}
): TransparencyNotice[] {
  const notices: TransparencyNotice[] = [];
  const hasQuery = query.trim().length > 0;
  const spec = intent.specialty;

  // 1. Specialty we could not map — the most damaging case, so it leads.
  if (hasQuery && spec.confidence === "low") {
    notices.push({
      id: "specialty-unmatched",
      severity: "warning",
      message: `We could not confidently match this to a specialty in our index${
        spec.reason ? ` (${spec.reason})` : ""
      }, so these results are ranked by related clinical services rather than an exact match.`,
      suggestion: "Try naming a specialty directly, for example: cardiology, orthopaedics, nephrology or maternity.",
    });
  } else if (hasQuery && spec.confidence === "none" && !intent.condition.value) {
    notices.push({
      id: "no-specialty",
      severity: "warning",
      message:
        "We could not identify a medical specialty in your query, so every indexed hospital is listed by relevance. Naming a condition or specialty will narrow this down.",
      suggestion: "Try: heart surgery, knee replacement, dialysis, or eye cataract.",
    });
  } else if (spec.confidence === "medium" && spec.source === "synonym") {
    notices.push({
      id: "specialty-synonym",
      severity: "info",
      message: `We matched your wording to ${spec.reason}`,
    });
  }

  // 2. Location we dropped because we have nothing indexed there.
  if (intent.unresolvedLocation) {
    notices.push({
      id: "location-unindexed",
      severity: "info",
      message: `Showing results across all locations because we have no hospitals indexed in ${intent.unresolvedLocation}.`,
      suggestion: "Enter a city we cover, such as Chandigarh, Ludhiana, Delhi or Jaipur.",
    });
  } else if (hasQuery && intent.location.confidence === "none" && !intent.wantsNearby) {
    notices.push({
      id: "location-absent",
      severity: "info",
      message: "Showing results across all locations since your query did not mention one.",
    });
  }

  // 3. Location we actually substituted cities for.
  const broadened = opts.broadenedLocation;
  if (broadened && broadened.length > 0) {
    notices.push({
      id: "location-broadened",
      severity: "info",
      message: `No hospitals matched in the requested location, so we widened the search to ${broadened.join(", ")}.`,
    });
  }

  // 4. Facilities that do not exist in the dataset.
  if (intent.facilities.confidence === "low") {
    notices.push({
      id: "facilities-unavailable",
      severity: "info",
      message: intent.facilities.reason,
      suggestion: "Facilities we record include ICU, NICU, Dialysis Unit, Ambulance, 24x7 Emergency and Cath Lab.",
    });
  }

  // 5. Tell the user when no model was involved.
  if (intent.usedLocalFallback) {
    notices.push({
      id: "local-extraction",
      severity: "info",
      message:
        "Our AI structuring service was unavailable, so this query was parsed by the built-in clinical rule engine instead. The synonym list is deterministic, so results may be broader than usual.",
    });
  }

  // 6. Results exist but the request was only partly satisfiable.
  if (opts.resultCount === 0 && notices.length === 0) {
    notices.push({
      id: "empty-result",
      severity: "warning",
      message: "No indexed hospital satisfies every filter you set at once.",
      suggestion: "Remove a filter, or use Edit search to adjust budget, radius or facilities.",
    });
  }

  return notices;
}

/** Fields the search page must send to `GET /api/hospitals`. */
export function intentToQueryParams(intent: SearchIntent): URLSearchParams {
  const params = new URLSearchParams();
  if (isFieldUsable(intent.specialty)) params.set("specialty", String(intent.specialty.value));
  if (isFieldUsable(intent.condition) && intent.condition.confidence === "high") {
    params.set("condition", String(intent.condition.value));
  }
  // A location is only sent as a filter when we actually have it indexed:
  // `resolveLocationField` returns null for any place we cannot serve, so an
  // unindexed city broadens the search instead of emptying it.
  if (isFieldUsable(intent.location)) {
    params.set("city", String(intent.location.value));
  }
  if (intent.radiusKm.value != null) params.set("radius_km", String(intent.radiusKm.value));
  if (intent.budget.value?.min != null) params.set("min_budget", String(intent.budget.value.min));
  if (intent.budget.value?.max != null) params.set("max_budget", String(intent.budget.value.max));
  if (intent.facilities.value?.length) params.set("facilities", intent.facilities.value.join(","));
  return params;
}

/** The chips the explainability panel renders. */
export function intentToChips(intent: SearchIntent): { icon: string; label: string; value: string }[] {
  const chips: { icon: string; label: string; value: string }[] = [];
  const conf = (c: FieldConfidence) => (c === "high" ? "" : c === "none" ? " (not detected)" : " (inferred)");

  if (intent.specialty.value) {
    const first = intent.specialty.value.split(",")[0];
    const more = intent.specialty.value.includes(",") ? ` +${intent.specialty.value.split(",").length - 1}` : "";
    chips.push({ icon: "🩺", label: "Specialty", value: `${first}${more}${conf(intent.specialty.confidence)}` });
  }
  if (intent.condition.value && intent.condition.confidence === "high") {
    chips.push({ icon: "🩺", label: "Condition", value: intent.condition.value });
  }
  if (intent.location.value) {
    chips.push({ icon: "📍", label: "Location", value: `${intent.location.value}${conf(intent.location.confidence)}` });
  } else if (intent.location.confidence === "none") {
    chips.push({ icon: "📍", label: "Location", value: "Not detected — all locations" });
  }
  if (intent.radiusKm.value != null) {
    chips.push({ icon: "📏", label: "Distance", value: `Within ${intent.radiusKm.value} km` });
  }
  if (intent.budget.value && (intent.budget.value.min != null || intent.budget.value.max != null)) {
    const { min, max } = intent.budget.value;
    const value =
      min != null && max != null
        ? `${formatRupees(min)} – ${formatRupees(max)}`
        : max != null
          ? `Up to ${formatRupees(max)}`
          : `From ${formatRupees(min)}`;
    chips.push({ icon: "💰", label: "Budget", value });
  }
  if (intent.facilities.value?.length) {
    chips.push({ icon: "🏥", label: "Facilities", value: intent.facilities.value.join(", ") });
  }
  chips.push({
    icon: "🎯",
    label: "Priority",
    value: intent.sortBy.value === null || intent.sortBy.value === "match"
      ? "Best match"
      : intent.sortBy.value,
  });
  return chips;
}

/** Canonical specialty count, reported by `npm run verify:specialties`. */
export const CANONICAL_SPECIALTY_COUNT = CANONICAL_SPECIALTIES.length;
