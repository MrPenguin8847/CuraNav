/**
 * Canonical specialty vocabulary.
 *
 * Every string here MUST match a value that actually exists in the
 * `hospitals.specialties` array of the seeded dataset. Emitting a string that
 * is not in the dataset silently yields zero search results, because
 * `GET /api/hospitals` matches with `overlaps("specialties", specs)`.
 *
 * Verified against `Supabase/hospitals_195_mock_filled.sql`.
 * Synthetic placeholder values ("Not specified / demo", "ISO-style demo", …)
 * are intentionally excluded — they are not clinically meaningful.
 */
export const CANONICAL_SPECIALTIES = [
  "Ambulance",
  "Antenatal Care",
  "Appendectomy",
  "Arthritis Management",
  "Arthroscopy",
  "Autoimmune Evaluation",
  "Behavioral Health",
  "Blood Bank",
  "Bronchoscopy",
  "Cancer Screening",
  "Cardiac Diagnostics",
  "Cardiology",
  "Cataract Surgery",
  "Cath Lab",
  "Cesarean Section",
  "Chemotherapy",
  "Colonoscopy",
  "Consultation",
  "Cosmetology",
  "Counselling",
  "Craniotomy",
  "Critical Care",
  "Dermatology",
  "Diabetes Management",
  "Diabetes Screening",
  "Diabetology",
  "Diagnostic Evaluation",
  "Diagnostic Lab",
  "Dialysis Unit",
  "ECG",
  "Echocardiography",
  "EEG",
  "Emergency Medicine",
  "Emergency Stabilization",
  "Endocrinology",
  "Endoscopic Sinus Surgery",
  "Endoscopy",
  "ENT",
  "External Beam Radiotherapy",
  "Family Medicine",
  "FibroScan",
  "Fracture Fixation",
  "Fracture Management",
  "Gastroenterology",
  "General Medicine",
  "General Surgery",
  "Gynecology Consultation",
  "Hair Restoration Consultation",
  "Head & Neck Surgery",
  "Health Screening",
  "Hemodialysis",
  "Hepatology",
  "Hernia Repair",
  "ICU",
  "Insulin Management",
  "Internal Medicine",
  "Joint Replacement",
  "Kidney Biopsy",
  "Laparoscopic Cholecystectomy",
  "Laparoscopic Hernia Repair",
  "Laparoscopic Surgery",
  "Laser Procedures",
  "Laser Therapy",
  "LASIK Evaluation",
  "Liver Function Assessment",
  "MRI Brain",
  "Neck Dissection",
  "Neonatology",
  "Nephrology",
  "Nerve Blocks",
  "Neurology",
  "Neurosurgery",
  "Newborn Screening",
  "NICU",
  "NICU Care",
  "Normal Delivery",
  "Obstetrics & Gynecology",
  "Oncology",
  "Operation Theatre",
  "Ophthalmic Surgery",
  "Ophthalmology",
  "Orthopedics",
  "Outpatient Consultation",
  "Pain Clinic",
  "Pain Medicine",
  "Pediatric Consultation",
  "Pediatrics",
  "Phacoemulsification",
  "Pharmacy",
  "Primary Care",
  "Psychiatric Consultation",
  "Psychiatry",
  "Psychological Assessment",
  "Pulmonary Function Test",
  "Pulmonology",
  "Radiation Oncology",
  "Radiology",
  "Radiotherapy Planning",
  "Rheumatology",
  "Sepsis Management",
  "Skin Biopsy",
  "Spine Surgery",
  "Thyroid Evaluation",
  "Thyroid Surgery",
  "Tonsillectomy",
  "Total Hip Replacement",
  "Total Knee Replacement",
  "Trauma Care",
  "Trauma Resuscitation",
  "Trauma Stabilization",
  "TURP",
  "Ureteroscopy",
  "Urology",
  "Vaccination",
  "Ventilator Support",
  "Vitrectomy",
] as const;

export type CanonicalSpecialty = (typeof CANONICAL_SPECIALTIES)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_SPECIALTIES);

/**
 * Splits a caller-supplied `specialty` param and returns it only when every
 * comma-separated part is a real dataset value. Used to stop a valid explicit
 * specialty from being clobbered by the fuzzy keyword hints below.
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
  return parts.every((p) => CANONICAL_SET.has(p)) ? parts.join(",") : null;
}

export function isCanonicalSpecialty(value: string): boolean {
  return CANONICAL_SET.has(value.trim());
}

/**
 * Ordered keyword → specialty hints. First match wins, so more specific
 * patterns must come before broader ones (e.g. "emergency" before "general").
 *
 * Each entry lists only values present in CANONICAL_SPECIALTIES.
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
    specialties: ["Cardiology", "Cardiac Diagnostics"],
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
    keywords: [
      "kidney",
      "renal",
      "nephro",
      "dialysis",
      "urine",
      "urinat",
      "blood in urine",
      "swelling in feet",
      "piles",
    ],
    specialties: ["Nephrology", "General Medicine"],
  },
  {
    keywords: ["cancer", "tumor", "tumour", "oncol", "chemo", "lump", "mass"],
    specialties: ["Oncology", "General Surgery"],
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
    specialties: ["Orthopedics", "Rheumatology"],
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
    specialties: ["Pediatrics", "Neonatology"],
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
    specialties: ["Obstetrics & Gynecology", "Antenatal Care"],
  },
  {
    keywords: ["burn", "scald", "chemical burn"],
    specialties: ["General Surgery", "Emergency Medicine"],
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
    specialties: ["Ophthalmology"],
  },
  {
    keywords: [
      "emergency",
      "trauma",
      "accident",
      "unconscious",
      "unresponsive",
      "collapsed",
      "seizure",
    ],
    specialties: [
      "Emergency Medicine",
      "Emergency Stabilization",
      "Critical Care",
      "Trauma Care",
    ],
  },
  {
    keywords: [
      "neuro",
      "brain",
      "stroke",
      "seizure",
      "fit",
      "numbness",
      "tingling",
      "migraine",
      "memory loss",
      "tremor",
      "dizziness",
      "vertigo",
      "faint",
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
    specialties: ["ENT"],
  },
  {
    keywords: [
      "urin",
      "urolog",
      "prostate",
      "bladder",
      "testicle",
      "penis",
      "uti",
    ],
    specialties: ["Urology"],
  },
  {
    keywords: [
      "plastic",
      "cosmetic",
      "reconstruct",
      "burns management",
    ],
    specialties: ["General Surgery"],
  },
  {
    keywords: ["surgery", "surgical", "operation", "appendic"],
    specialties: ["General Surgery"],
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
    specialties: ["Endocrinology", "Thyroid Evaluation"],
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
    specialties: ["Psychiatry", "Psychological Assessment"],
  },
  {
    keywords: ["pain", "aches", "body ache", "cramp", "migraine"],
    specialties: ["Pain Medicine", "General Medicine"],
  },
  {
    keywords: [
      "fever",
      "cough and cold",
      "checkup",
      "check up",
      "general",
      "flu",
      "cold",
      "infection",
      "not feeling well",
    ],
    specialties: ["General Medicine", "Internal Medicine"],
  },
];

/**
 * Resolves free-form clinical text to a comma-separated specialty string that
 * is guaranteed to exist in the dataset. Returns null when nothing matches, so
 * callers can fall back to a general-practice default.
 */
export function resolveSpecialtyHint(searchText: string): string | null {
  const haystack = ` ${searchText.toLowerCase()} `;
  for (const hint of SPECIALTY_HINTS) {
    if (hint.keywords.some((k) => haystack.includes(k))) {
      return hint.specialties.join(",");
    }
  }
  return null;
}

/** Broad first-line-contact departments, used when nothing more specific matches. */
export const GENERAL_FALLBACK_SPECIALTIES = [
  "General Medicine",
  "Internal Medicine",
  "Primary Care",
] as const;

/**
 * Canonical facility vocabulary, verified against the `hospitals.facilities`
 * array of the seeded dataset. `accreditation` holds the synthetic
 * "…-style demo" placeholders, which are excluded here.
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
 * Filters a caller-supplied facility list down to real dataset values.
 * Returns null when nothing valid remains, so the caller can skip the filter
 * rather than over-filtering the result set into emptiness.
 */
export function normalizeFacilities(
  facilitiesParam: string | null | undefined
): string[] | null {
  if (!facilitiesParam) return null;
  const valid = facilitiesParam
    .split(",")
    .map((f) => f.trim())
    .filter((f) => CANONICAL_FACILITY_SET.has(f));
  return valid.length > 0 ? valid : null;
}
