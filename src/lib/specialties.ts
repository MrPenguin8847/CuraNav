/**
 * Canonical specialty vocabulary — the single source of truth.
 *
 * Every string here MUST match a value that actually exists in the
 * `hospitals.specialties` array of the live dataset. Emitting a string that is
 * not in the dataset silently yields zero search results, because
 * `GET /api/hospitals` matches with `overlaps("specialties", specs)`.
 *
 * This list is verified against the live Supabase table (275 rows, 48 distinct
 * specialty values, 271 approved). It previously listed 117 values of which
 * roughly 70 have zero rows — including `Emergency Room Packages` and
 * `Obstetrics & Gynaecology`, which together cover 43 real hospitals. That
 * mismatch is why specialty searches were quietly returning too few results.
 *
 * Synthetic placeholder values and the junk row value `cardio` are excluded.
 *
 * Re-verify with:
 *   npm run verify:specialties
 */

export const CANONICAL_SPECIALTIES = [
  "Behavioral Health",
  "Burns Management",
  "Cardio-Thoracic & Vascular Surgery",
  "Cardiology",
  "Cosmetology",
  "Critical Care",
  "Dermatology",
  "Diabetology",
  "ENT",
  "Emergency Medicine",
  "Emergency Room Packages",
  "Endocrinology",
  "Family Medicine",
  "Gastroenterology",
  "General Medicine",
  "General Surgery",
  "Head & Neck Surgery",
  "Hepatology",
  "Internal Medicine",
  "Joint Replacement",
  "Laparoscopic Surgery",
  "Medical Oncology",
  "Neo-natal Care",
  "Neonatology",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Obstetrics & Gynaecology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmic Surgery",
  "Ophthalmology",
  "Orthopaedics",
  "Orthopedics",
  "Otorhinolaryngology (ENT)",
  "Paediatric Medical Management",
  "Pain Medicine",
  "Pediatrics",
  "Plastic & Reconstructive Surgery",
  "Psychiatry",
  "Pulmonology",
  "Radiation Oncology",
  "Rheumatology",
  "Surgical Oncology",
  "Trauma Care",
  "Urology",
  "Women’s Health",
] as const;

export type CanonicalSpecialty = (typeof CANONICAL_SPECIALTIES)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_SPECIALTIES);

/** Lowercased lookup key, so casing and spacing never decide a match. */
function key(value: string): string {
  return value.trim().toLowerCase();
}

const CANONICAL_BY_KEY = new Map<string, CanonicalSpecialty>(
  CANONICAL_SPECIALTIES.map((s) => [key(s), s])
);

/**
 * Spelling and format variants that users, the LLM, and older code all emit.
 * The dataset contains BOTH `Orthopaedics` and `Orthopedics` and BOTH
 * `Obstetrics & Gynaecology` and `Obstetrics & Gynecology`, so a variant must
 * expand to every live value it could mean rather than picking one.
 */
const SPECIALTY_VARIANTS: ReadonlyArray<{
  variant: string;
  specialties: readonly string[];
}> = [
  { variant: "orthopaedics", specialties: ["Orthopaedics", "Orthopedics", "Joint Replacement"] },
  { variant: "orthopedics", specialties: ["Orthopaedics", "Orthopedics", "Joint Replacement"] },
  { variant: "ortho", specialties: ["Orthopaedics", "Orthopedics", "Joint Replacement"] },
  { variant: "bones", specialties: ["Orthopaedics", "Orthopedics"] },
  { variant: "gynaecology", specialties: ["Obstetrics & Gynaecology", "Women’s Health"] },
  { variant: "gynecology", specialties: ["Obstetrics & Gynecology", "Women’s Health"] },
  { variant: "womens health", specialties: ["Women’s Health"] },
  { variant: "ent", specialties: ["ENT", "Otorhinolaryngology (ENT)", "Head & Neck Surgery"] },
  { variant: "oncology", specialties: ["Oncology", "Medical Oncology", "Surgical Oncology", "Radiation Oncology"] },
  { variant: "cardiac surgery", specialties: ["Cardio-Thoracic & Vascular Surgery", "Cardiology"] },
  { variant: "ctvs", specialties: ["Cardio-Thoracic & Vascular Surgery"] },
  { variant: "neonatal", specialties: ["Neo-natal Care", "Neonatology"] },
  { variant: "neonat", specialties: ["Neo-natal Care", "Neonatology"] },
  { variant: "paediatric", specialties: ["Paediatric Medical Management", "Pediatrics"] },
  { variant: "pediatric", specialties: ["Pediatrics", "Paediatric Medical Management"] },
  { variant: "dialysis", specialties: ["Nephrology"] },
  { variant: "general physician", specialties: ["General Medicine", "Family Medicine", "Internal Medicine"] },
  { variant: "gp", specialties: ["General Medicine", "Family Medicine", "Internal Medicine"] },
];

const VARIANT_BY_KEY = new Map(SPECIALTY_VARIANTS.map((v) => [key(v.variant), v.specialties]));

/**
 * Expands a caller-supplied `specialty` param to real dataset values.
 *
 * Returns null when the input contains nothing recognisable, so the caller can
 * fall back to ranking instead of filtering the result set down to nothing.
 * Every returned part is a verified `CANONICAL_SPECIALTIES` value.
 */
export function normalizeExplicitSpecialty(
  specialty: string | null | undefined
): string | null {
  if (!specialty) return null;

  const parts = specialty
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const resolved: string[] = [];
  for (const part of parts) {
    const direct = CANONICAL_BY_KEY.get(key(part));
    if (direct) {
      resolved.push(direct);
      continue;
    }
    const variant = VARIANT_BY_KEY.get(key(part));
    if (variant) {
      resolved.push(...variant);
      continue;
    }
    // A single unrecognised term must not poison the whole filter, but an
    // entirely unrecognised value must not be forwarded to the database.
    return null;
  }

  const unique = [...new Set(resolved)];
  return unique.length > 0 ? unique.join(",") : null;
}

export function isCanonicalSpecialty(value: string): boolean {
  return CANONICAL_BY_KEY.has(key(value));
}

/**
 * Emergency-capable specialties, verified against the live dataset.
 *
 * `Emergency Room Packages` covers 25 approved hospitals — more than any other
 * emergency value — and was previously missing from this list on the mistaken
 * belief that it did not exist. Those 25 are exactly the rows without
 * coordinates, so dropping them made the "no hospitals near you" fallback fire
 * constantly and hid over half of all emergency-capable care.
 */
export const EMERGENCY_SPECIALTIES = [
  "Emergency Room Packages",
  "Emergency Medicine",
  "Critical Care",
  "Trauma Care",
] as const;

/** Ordered keyword → specialty hints. First match wins, so more specific
 *  patterns must come before broader ones (e.g. "emergency" before "general").
 *
 *  Every entry lists only values present in CANONICAL_SPECIALTIES.
 */
const SPECIALTY_HINTS: ReadonlyArray<{
  keywords: readonly string[];
  specialties: readonly string[];
}> = [
  {
    keywords: [
      "chest pain",
      "chest tight",
      "chest pressure",
      "heart",
      "cardiac",
      "cardio",
      "bypass",
      "palpitation",
      "angina",
      "irregular heartbeat",
    ],
    specialties: ["Cardiology", "Cardio-Thoracic & Vascular Surgery"],
  },
  {
    keywords: [
      "breathless",
      "shortness of breath",
      "wheez",
      "asthma",
      "cough",
      "sore throat",
      "respiratory",
      "lung",
      "pneumonia",
      "breathing",
    ],
    specialties: ["Pulmonology", "General Medicine"],
  },
  {
    // Urology must precede Nephrology: both claim the word "urine", and a
    // urinary complaint is urology, whereas "blood in urine" or an actual
    // kidney failure is nephrology.
    keywords: [
      "urinary",
      "urolog",
      "prostate",
      "bladder",
      "uti",
      "testicle",
      "penis",
      "hydrocele",
      // Stones are a urological problem, but patients say "kidney stone", which
      // would otherwise be caught by Nephrology's broader "kidney" keyword.
      // Listing them here wins because this hint is evaluated first.
      "kidney stone",
      "stone in kidney",
      "stones in kidney",
      "renal stone",
      "nephrolithiasis",
      "bladder stone",
      "ureteric stone",
      "ureter stone",
    ],
    specialties: ["Urology"],
  },
  {
    keywords: [
      "kidney",
      "renal",
      "nephro",
      "dialysis",
      "blood in urine",
      "urine problem",
      "swelling in feet",
      "creatinine",
    ],
    specialties: ["Nephrology", "General Medicine"],
  },
  {
    keywords: ["cancer", "tumor", "tumour", "oncol", "chemo", "lump", "mass"],
    specialties: ["Oncology", "Medical Oncology", "General Surgery"],
  },
  {
    keywords: [
      "bone",
      "joint",
      "ortho",
      "fracture",
      "spine",
      "back pain",
      "knee pain",
      "shoulder pain",
      "hip pain",
      "ankle",
      "arthritis",
      "knee",
    ],
    specialties: ["Orthopaedics", "Orthopedics", "Joint Replacement", "Rheumatology"],
  },
  {
    keywords: [
      "child",
      "pediatric",
      "paediatric",
      "baby",
      "infant",
      "neonat",
      "toddler",
      "newborn",
    ],
    specialties: ["Pediatrics", "Paediatric Medical Management", "Neo-natal Care", "Neonatology"],
  },
  {
    keywords: [
      "pregnan",
      "matern",
      "women",
      "gynae",
      "gyne",
      "delivery",
      "period",
      "menstrual",
      "pcos",
      "infertility",
    ],
    specialties: ["Obstetrics & Gynaecology", "Obstetrics & Gynecology", "Women’s Health"],
  },
  {
    keywords: ["burn", "scald", "chemical burn"],
    specialties: ["Burns Management", "General Surgery", "Plastic & Reconstructive Surgery"],
  },
  {
    keywords: [
      "eye",
      "vision",
      "ophthal",
      "cataract",
      "blurred vision",
      "red eye",
    ],
    specialties: ["Ophthalmology", "Ophthalmic Surgery"],
  },
  {
    keywords: [
      "emergency",
      "trauma",
      "accident",
      "unconscious",
      "unresponsive",
      "collapsed",
    ],
    specialties: ["Emergency Room Packages", "Emergency Medicine", "Critical Care", "Trauma Care"],
  },
  {
    keywords: [
      "neuro",
      "brain",
      "stroke",
      "seizure",
      "fits",
      "numbness",
      "tingling",
      "migraine",
      "memory loss",
      "tremor",
      "dizziness",
      "vertigo",
      "faint",
      // How patients actually describe a stroke. Without these, the commonest
      // urgent neurological presentation matched no department at all and the
      // search fell through to an unfiltered result set.
      "droop",
      "slurred speech",
      "slurring",
      "one side weakness",
      "weakness on one side",
      "paralysis",
      "unable to speak",
      "confusion sudden",
    ],
    specialties: ["Neurology", "Neurosurgery"],
  },
  {
    keywords: [
      "ear",
      "nose",
      "throat",
      "ent ",
      " ear",
      "earache",
      "sinus",
      "tonsil",
      "hearing loss",
      "deviated septum",
    ],
    specialties: ["Otorhinolaryngology (ENT)", "ENT", "Head & Neck Surgery"],
  },
  {
    keywords: ["plastic", "cosmetic", "reconstruct", "cosmetology"],
    specialties: ["Plastic & Reconstructive Surgery", "Cosmetology"],
  },
  {
    keywords: [
      "surgery",
      "surgical",
      "operation",
      "appendic",
      "laparoscopic",
      "hernia",
      "gallbladder",
      "piles",
      "hemorrhoid",
      "fissure",
    ],
    specialties: ["General Surgery", "Laparoscopic Surgery"],
  },
  {
    keywords: [
      "stomach",
      "abdomen",
      "abdominal",
      "gastro",
      "acid",
      "heartburn",
      "reflux",
      "acidity",
      "liver",
      "hepat",
      "diarrh",
      "loose motion",
      "constipat",
      "vomit",
      "nausea",
      "jaundice",
    ],
    specialties: ["Gastroenterology", "Hepatology"],
  },
  {
    keywords: ["skin", "rash", "itch", "acne", "eczema", "dermat", "psoriasis"],
    specialties: ["Dermatology"],
  },
  {
    keywords: [
      "diabet",
      "sugar",
      "glucose",
      "insulin",
      "hba1c",
      "passing urine a lot",
      "excessive thirst",
    ],
    specialties: ["Diabetology", "Endocrinology"],
  },
  {
    keywords: ["thyroid", "tsh", "weight gain", "weight loss", "hormone"],
    specialties: ["Endocrinology"],
  },
  {
    keywords: [
      "anxiety",
      "depress",
      "mental health",
      "panic attack",
      "insomnia",
      "cannot sleep",
      "mood",
      "stress",
      "therapy",
    ],
    specialties: ["Psychiatry", "Behavioral Health"],
  },
  {
    keywords: ["pain", "aches", "body ache", "cramp"],
    specialties: ["Pain Medicine", "Orthopaedics", "General Medicine"],
  },
  {
    keywords: [
      "fever",
      "cough and cold",
      "checkup",
      "check up",
      "general physician",
      "flu",
      "infection",
      "not feeling well",
    ],
    specialties: ["General Medicine", "Internal Medicine", "Family Medicine"],
  },
];

/**
 * A resolved synonym hit, with the keyword that triggered it so the UI can say
 * *why* it believes the query is about a given specialty.
 */
export interface SpecialtyHint {
  /** Comma-separated `CANONICAL_SPECIALTIES` values. */
  specialties: string;
  /** The keyword that matched, for user-facing explanation. */
  matchedKeyword: string;
  /** Human-readable label, e.g. "Cardiology". */
  label: string;
}

/**
 * Resolves free-form clinical text to a specialty string guaranteed to exist in
 * the dataset. Returns null when nothing matches, so callers can fall back to a
 * general-practice default or rank instead of filtering.
 */
export function resolveSpecialtyHint(searchText: string): SpecialtyHint | null {
  const haystack = ` ${searchText.toLowerCase()} `;
  for (const hint of SPECIALTY_HINTS) {
    const matchedKeyword = hint.keywords.find((k) => haystack.includes(k));
    if (matchedKeyword) {
      const specialties = [...new Set(hint.specialties)].filter((s) => CANONICAL_SET.has(s));
      if (specialties.length === 0) continue;
      return {
        specialties: specialties.join(","),
        matchedKeyword: matchedKeyword.trim(),
        label: specialties[0],
      };
    }
  }
  return null;
}

/**
 * Full synonym resolution: exact dataset value first, then variant, then
 * keyword hint. This runs *before* any model call so obvious queries never pay
 * a network round-trip and can never fail because a provider is down.
 */
export function resolveSpecialtyFromText(text: string): SpecialtyHint | null {
  const explicit = normalizeExplicitSpecialty(text);
  if (explicit) {
    const first = explicit.split(",")[0];
    return { specialties: explicit, matchedKeyword: first, label: first };
  }
  return resolveSpecialtyHint(text);
}

/** Broad first-line-contact departments, used when nothing more specific matches. */
export const GENERAL_FALLBACK_SPECIALTIES = [
  "General Medicine",
  "Internal Medicine",
  "Family Medicine",
] as const;

/**
 * Canonical facility vocabulary, verified against the live `hospitals.facilities`
 * array (12 values). `accreditation` holds synthetic "…-style demo" placeholders,
 * which are excluded.
 */
export const CANONICAL_FACILITIES = [
  "24x7 Emergency",
  "Ambulance",
  "Blood Bank",
  "Cardiac Diagnostics",
  "Cath Lab",
  "Diagnostic Lab",
  "Dialysis Unit",
  "ICU",
  "NICU",
  "Operation Theatre",
  "Pharmacy",
  "Radiology",
] as const;

const CANONICAL_FACILITY_SET = new Set<string>(CANONICAL_FACILITIES);

/**
 * Lay terms for facilities, mapped to the dataset value they mean. Without this
 * a user ticking "Dialysis" produced a filter that silently did nothing, because
 * the column value is `Dialysis Unit`.
 */
const FACILITY_VARIANTS: ReadonlyArray<{ variant: string; facility: string }> = [
  { variant: "emergency", facility: "24x7 Emergency" },
  { variant: "24x7", facility: "24x7 Emergency" },
  { variant: "24/7", facility: "24x7 Emergency" },
  { variant: "dialysis", facility: "Dialysis Unit" },
  { variant: "icu", facility: "ICU" },
  { variant: "intensive care", facility: "ICU" },
  { variant: "nicu", facility: "NICU" },
  { variant: "neonatal intensive care", facility: "NICU" },
  { variant: "pharmacy", facility: "Pharmacy" },
  { variant: "ambulance", facility: "Ambulance" },
  { variant: "blood bank", facility: "Blood Bank" },
  { variant: "lab", facility: "Diagnostic Lab" },
  { variant: "diagnostic lab", facility: "Diagnostic Lab" },
  { variant: "radiology", facility: "Radiology" },
  { variant: "x-ray", facility: "Radiology" },
  { variant: "operation theatre", facility: "Operation Theatre" },
  { variant: "ot", facility: "Operation Theatre" },
  { variant: "cath lab", facility: "Cath Lab" },
  { variant: "cardiac diagnostics", facility: "Cardiac Diagnostics" },
];

const FACILITY_BY_KEY = new Map(FACILITY_VARIANTS.map((v) => [key(v.variant), v.facility]));

/**
 * Filters a caller-supplied facility list down to real dataset values, mapping
 * lay terms on the way. Returns null when nothing valid remains, so the caller
 * can skip the filter rather than over-filtering the result set into emptiness.
 */
export function normalizeFacilities(
  facilitiesParam: string | null | undefined
): string[] | null {
  if (!facilitiesParam) return null;
  const valid: string[] = [];
  for (const raw of facilitiesParam.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    if (CANONICAL_FACILITY_SET.has(part)) {
      valid.push(part);
      continue;
    }
    const lower = key(part);
    const recased = canonicalizeFacilityCasing(part);
    if (recased) {
      valid.push(recased);
      continue;
    }
    const mapped = FACILITY_BY_KEY.get(lower);
    if (mapped) valid.push(mapped);
  }
  const unique = [...new Set(valid)];
  return unique.length > 0 ? unique : null;
}

/**
 * Recases a free-text facility against the canonical list, ignoring case and
 * spacing: `"icu"` and `"24x7 emergency"` both resolve. Returns null when no
 * canonical value matches, so `FACILITY_BY_KEY` gets the next attempt.
 */
function canonicalizeFacilityCasing(value: string): string | null {
  if (CANONICAL_FACILITY_SET.has(value)) return value;

  const lower = key(value);
  for (const canonical of CANONICAL_FACILITIES) {
    if (key(canonical) === lower) return canonical;
  }

  // Tolerate the many ways people write the same facility: dropped separators
  // ("24x7emergency", "cathlab") and a different separator inside "24x7"
  // ("24/7", "24*7", "24-7"). No other canonical value contains x, * or /, so
  // treating them as separators cannot create a false match.
  const squashed = squashFacilitySeparators(lower);
  if (squashed.length > 2) {
    for (const canonical of CANONICAL_FACILITIES) {
      if (squashFacilitySeparators(key(canonical)) === squashed) return canonical;
    }
  }
  return null;
}

function squashFacilitySeparators(value: string): string {
  return value.replace(/[\s/x*·-]/g, "");
}
