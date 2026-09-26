import type { Severity } from "./types";

/**
 * Symptom clusters.
 *
 * A cluster is the unit that bridges free text to the hospital dataset: it
 * carries a base severity, the real dataset specialties that manage it, and the
 * home-care keys that are appropriate for it. This mapping is hand-authored so
 * the feature still works with no AI provider configured — it is a safety net
 * for referral quality, not a replacement for the model.
 *
 * Every value in `specialties` MUST exist in `CANONICAL_SPECIALTIES`.
 * Every value in `careKeys` MUST exist in `HOME_CARE_CATALOG`.
 */

export type Cluster = {
  id: string;
  /** Patient-facing name. */
  label: string;
  /** Matching surface for the local heuristic fallback. */
  keywords: readonly string[];
  /** Regexes for patterns a keyword list cannot express. */
  patterns?: readonly RegExp[];
  /**
   * Veto patterns. If any matches, the cluster is discarded entirely no matter
   * how well it otherwise scored. Needed because clusters legitimately overlap
   * on symptom words — "itchy eyes" matches the skin cluster on "itchy" but is
   * an ophthalmic presentation, not a dermatological one.
   */
  exclude?: readonly RegExp[];
  /** Starting severity before duration/intensity/age modifiers. */
  baseSeverity: Severity;
  /** Dataset specialty values, most relevant first. */
  specialties: readonly string[];
  /** Home-care keys appropriate to this cluster. */
  careKeys: readonly string[];
  /** Questions a clinician will almost certainly ask. */
  followupQuestions: readonly string[];
  /** True when this cluster should never be resolved at home. */
  neverSelfCare?: boolean;
};

export const CLUSTERS: readonly Cluster[] = [
  {
    id: "chest_pain",
    label: "Chest pain or discomfort",
    keywords: [
      "chest pain",
      "chest hurts",
      "chest tightness",
      "chest pressure",
      "heart attack",
      "angina",
      "palpitation",
      "heart racing",
      "irregular heartbeat",
      "fluttering in chest",
    ],
    patterns: [/\bchest\b[^.]{0,20}\b(pain|hurt|tight|pressure|heavy|discomfort)\b/],
    baseSeverity: "urgent",
    specialties: ["Cardiology", "Cardiac Diagnostics"],
    careKeys: ["avoid_strenuous_activity", "log_symptoms"],
    followupQuestions: [
      "Does the pain spread to your left arm, jaw, neck or back?",
      "Does it come and go, or has it been constant?",
      "Does it get worse when you exert yourself?",
      "Were you doing anything unusual when it started?",
    ],
    neverSelfCare: true,
  },
  {
    id: "breathing",
    label: "Breathing difficulty",
    keywords: [
      "breathless",
      "short of breath",
      "difficulty breathing",
      "wheezing",
      "wheeze",
      "cough",
      "sore throat",
      "blocked nose",
      "runny nose",
      "congestion",
      "phlegm",
      "sputum",
    ],
    patterns: [/\bcough(ing)?\b/, /\bbreath(less|ing)\b/],
    baseSeverity: "routine",
    specialties: ["Pulmonology", "General Medicine"],
    careKeys: ["steam_inhalation", "saline_nasal_rinse", "honey_warm_water", "elevate_head_when_sleeping"],
    followupQuestions: [
      "Is the cough dry or bringing up phlegm? If so, what colour?",
      "Is it worse at night or in the morning?",
      "Do you have fever or chills alongside it?",
      "Are you a smoker, or exposed to smoke or dust?",
    ],
  },
  {
    id: "fever_infection",
    label: "Fever or infection symptoms",
    keywords: [
      "fever",
      "temperature",
      "high temp",
      "high temperature",
      "chills",
      "shivering",
      "body ache",
      "bodyache",
      "malaise",
      "weakness",
      "fatigue",
    ],
    patterns: [/\bfever\b/, /\b\d{2,3}\s*(°|degrees?)\b/, /\btemperature\b/],
    baseSeverity: "routine",
    specialties: ["General Medicine", "Internal Medicine"],
    careKeys: ["rest_hydration", "light_diet", "log_symptoms"],
    followupQuestions: [
      "What is the highest temperature you recorded, and when?",
      "Is the rash blanching when you press on it?",
      "Do you have a stiff neck or a severe headache with the fever?",
      "Any recent travel, new food, or contact with someone unwell?",
    ],
  },
  {
    id: "abdominal",
    label: "Stomach or abdominal pain",
    keywords: [
      "stomach pain",
      "stomach ache",
      "tummy",
      "belly",
      "abdominal",
      "cramps",
      "cramping",
      "nausea",
      "vomiting",
      "diarrhoea",
      "diarrhea",
      "loose motion",
      "constipation",
      "acidity",
      "heartburn",
      "reflux",
      "gas",
      "bloating",
      "jaundice",
      "liver",
    ],
    patterns: [
      /\bstomach\b[^.]{0,15}\b(pain|ache|ache|cramp)/,
      /\b(tummy|belly|abdomen)\b[^.]{0,15}\b(pain|ache|cramp)/,
      /\bvomit(ing)?\b/,
      /\bdiarrh?ea\b/,
      /\bconstipat/,
    ],
    baseSeverity: "routine",
    specialties: ["Gastroenterology", "Hepatology"],
    careKeys: ["oral_rehydration_salt", "light_diet", "avoid_late_meals", "loose_fiber_intake", "avoid_dairy_temporarily"],
    followupQuestions: [
      "Where exactly is the pain, and does it move anywhere?",
      "Is it related to eating, and does a particular food set it off?",
      "Have you noticed blood in the stool or vomit?",
      "Are you able to keep fluids and food down?",
    ],
    neverSelfCare: false,
  },
  {
    id: "urinary",
    label: "Urinary symptoms",
    keywords: [
      "burning urine",
      "burning while urinating",
      "urine",
      "urinating",
      "uti",
      "bladder",
      "frequent urination",
      "passing water often",
      "blood in urine",
      "kidney pain",
      "flank pain",
    ],
    patterns: [
      /\burin(e|ating|ation)\b/,
      /\b(blood|pus)\b[^.]{0,15}\burine\b/,
    ],
    baseSeverity: "routine",
    specialties: ["Nephrology", "Urology"],
    careKeys: ["rest_hydration", "log_symptoms"],
    followupQuestions: [
      "Is there burning, and how often are you passing urine?",
      "Have you noticed blood in the urine?",
      "Do you have back or flank pain alongside it?",
      "Any fever with these symptoms?",
    ],
  },
  {
    id: "neurological",
    label: "Headache, dizziness or numbness",
    keywords: [
      "headache",
      "migraine",
      "dizziness",
      "dizzy",
      "vertigo",
      "numbness",
      "tingling",
      "pins and needles",
      "tremor",
      "shaking",
      "memory loss",
      "seizure",
      "blackout",
    ],
    patterns: [/\bheadache\b/, /\bdizz(y|iness)\b/, /\bnumb(ness)?\b/, /\btingl/],
    baseSeverity: "routine",
    specialties: ["Neurology", "Neurosurgery"],
    careKeys: ["cold_compress", "log_symptoms", "rest_hydration", "avoid_triggers"],
    followupQuestions: [
      "Is the headache present all the time or only sometimes?",
      "Is it worse in the morning, or does it wake you from sleep?",
      "Have you noticed any weakness, or vision or speech changes?",
      "Is there a family history of migraines or strokes?",
    ],
  },
  {
    id: "musculoskeletal",
    label: "Joint, bone or back pain",
    keywords: [
      "knee pain",
      "joint pain",
      "back pain",
      "shoulder pain",
      "hip pain",
      "ankle pain",
      "wrist pain",
      "sprain",
      "strain",
      "fracture",
      "broken bone",
      "swelling in joint",
      "stiff joint",
      "arthritis",
      "muscle pull",
      "muscle strain",
    ],
    patterns: [/\b(knee|shoulder|hip|ankle|wrist|elbow|back|neck)\b[^.]{0,15}\b(pain|ache|swelling|stiff)/],
    baseSeverity: "routine",
    specialties: ["Orthopedics", "Rheumatology"],
    careKeys: ["warm_compress", "cold_compress", "rest_affected_limb", "rest_hydration"],
    followupQuestions: [
      "Did this start after an injury, or has it built up gradually?",
      "Is it worse in the morning or after activity?",
      "Is the joint swollen, warm or red to touch?",
      "Can you move it through its full range without pain?",
    ],
  },
  {
    id: "skin",
    label: "Skin rash or irritation",
    keywords: [
      "rash",
      "itchy",
      "itching",
      "skin irritation",
      "acne",
      "eczema",
      "psoriasis",
      "hives",
      "blister",
      "red patch",
      "dry skin",
      "boil",
      "wart",
    ],
    patterns: [/\brash\b/, /\bitch(y|ing)\b/, /\bhives\b/],
    exclude: [
      // "itchy eyes", "itchy scalp-only" style complaints are not dermatological.
      /\beyes?\b/,
      /\beye\b/,
    ],
    baseSeverity: "routine",
    specialties: ["Dermatology"],
    careKeys: ["limit_sun_exposure", "keep_area_dry", "avoid_triggers", "log_symptoms"],
    followupQuestions: [
      "Does the rash fade when you press on it?",
      "Is it spreading, and how fast?",
      "Is it hot, painful or oozing rather than itchy?",
      "Have you started any new medicines, foods or products recently?",
    ],
  },
  {
    id: "womens_health",
    label: "Women's health symptoms",
    keywords: [
      "period pain",
      "periods",
      "menstrual",
      "irregular periods",
      "pcos",
      "infertility",
      "vaginal discharge",
      "pelvic pain",
      "itchy down there",
      "pregnant",
      "pregnancy",
      "missed period",
      "breast lump",
    ],
    patterns: [/\bperiods?\b/, /\bmenstrual\b/, /\bpelvic\b/, /\bpregnan(t|cy)?\b/, /\bpcos\b/],
    baseSeverity: "routine",
    specialties: ["Obstetrics & Gynecology", "Antenatal Care"],
    careKeys: ["pelvic_rest", "warm_compress", "log_symptoms"],
    followupQuestions: [
      "Is the pain tied to your menstrual cycle?",
      "Is there any bleeding between periods or after sex?",
      "Could you be pregnant, and is there any chance of it?",
      "Have you noticed any change in discharge or a lump?",
    ],
  },
  {
    id: "child_health",
    label: "Child or infant symptoms",
    keywords: [
      "my baby",
      "my child",
      "infant",
      "newborn",
      "toddler",
      "not feeding",
      "not eating",
      "poor weight gain",
      "nappy",
      "diaper",
      "child has",
      "son has",
      "daughter has",
    ],
    patterns: [/\b(baby|infant|newborn|toddler|my child|my son|my daughter)\b/],
    baseSeverity: "urgent",
    specialties: ["Pediatrics", "Neonatology"],
    careKeys: ["rest_hydration", "oral_rehydration_salt", "log_symptoms"],
    followupQuestions: [
      "What is the child's exact age and weight?",
      "Are they taking fluids in, and how much?",
      "When did they last pass urine, and was it normal?",
      "Are they alert and responsive, or floppy and drowsy?",
    ],
  },
  {
    id: "ent",
    label: "Ear, nose or throat symptoms",
    keywords: [
      "ear pain",
      "earache",
      "ear discharge",
      "hearing loss",
      "nose bleed",
      "blocked nose",
      "sinus",
      "tonsil",
      "mouth ulcer",
      "bad breath",
    ],
    patterns: [/\bear(ache|pain)?\b/, /\bsinus\b/, /\btonsil/],
    baseSeverity: "routine",
    specialties: ["ENT"],
    careKeys: ["steam_inhalation", "saline_nasal_rinse", "rest_hydration"],
    followupQuestions: [
      "Is there discharge from the ear, and what colour is it?",
      "Has your hearing changed on that side?",
      "Do you have facial pain or a headache?",
      "Any recent swimming, diving or head injury?",
    ],
  },
  {
    id: "eye",
    label: "Eye or vision symptoms",
    keywords: [
      "eye pain",
      "red eye",
      "blurred vision",
      "vision",
      "cannot see",
      "cant see",
      "eye discharge",
      "itchy eyes",
      "cataract",
      "floaters",
    ],
    patterns: [/\beye\b[^.]{0,20}\b(pain|red|itch|discharge|swollen)/, /\bvision\b/, /\bblur(red)?\b/],
    baseSeverity: "self_care",
    specialties: ["Ophthalmology"],
    careKeys: ["rest_hydration", "cold_compress", "avoid_triggers"],
    followupQuestions: [
      "Is the vision change in one eye or both?",
      "Is the eye red, and is there discharge?",
      "Is there severe pain with the vision change?",
      "Did this start suddenly or gradually?",
    ],
  },
  {
    id: "endocrine",
    label: "Diabetes, thyroid or hormone symptoms",
    keywords: [
      "blood sugar",
      "diabetes",
      "glucose",
      "insulin",
      "hba1c",
      "thyroid",
      "tsh",
      "excessive thirst",
      "always thirsty",
      "passing urine a lot",
      "unexplained weight loss",
      "unexplained weight gain",
      "palpitations and weight",
    ],
    patterns: [
      /\b(blood sugar|glucose|hba1c|tsh|thyroid|insulin)\b/,
      /\b(polyuria|polydipsia)\b/,
    ],
    baseSeverity: "routine",
    specialties: ["Diabetology", "Endocrinology"],
    careKeys: ["glycemic_monitoring", "light_diet", "log_symptoms"],
    followupQuestions: [
      "Are you on any medicines for this, and have you missed any doses?",
      "What were your recent readings, fasting or otherwise?",
      "Have you noticed unexplained weight change?",
      "Do you get shaky or faint when you skip a meal?",
    ],
  },
  {
    id: "mental_health",
    label: "Mental health or sleep symptoms",
    keywords: [
      "anxiety",
      "panic attack",
      "depression",
      "depressed",
      "low mood",
      "cannot sleep",
      "insomnia",
      "not sleeping",
      "stress",
      "overwhelmed",
      "hopeless",
      "therapy",
    ],
    patterns: [
      /\b(anxiety|anxious|panic attack|depress(ed|ion)?|insomnia|hopeless|overwhelmed)\b/,
      /\bcan'?t sleep\b/,
    ],
    baseSeverity: "routine",
    specialties: ["Psychiatry", "Psychological Assessment"],
    careKeys: ["log_symptoms", "avoid_triggers"],
    followupQuestions: [
      "How long has this been going on, and does it affect your work or studies?",
      "Are you able to sleep, and how many hours a night?",
      "Has your mood affected your appetite or weight?",
      "Is there anything else going on in your life right now?",
    ],
  },
  {
    id: "cancer_concern",
    label: "A lump or persistent unexplained symptom",
    keywords: [
      "lump",
      "mass",
      "swollen lymph node",
      "unexplained weight loss",
      "night sweats",
      "ongoing cough with blood",
      "change in bowel habits",
      "non healing wound",
      "non healing sore",
    ],
    patterns: [/\blump\b/, /\bmass\b/, /\bweight loss\b/, /\bnight sweats\b/],
    baseSeverity: "urgent",
    specialties: ["Oncology", "General Surgery"],
    careKeys: ["log_symptoms"],
    followupQuestions: [
      "When did you first notice it, and has it changed since?",
      "Is it hard or soft, and does it move?",
      "Have you had any unexplained weight loss or night sweats?",
      "Does anything make it worse or better?",
    ],
    neverSelfCare: true,
  },
  {
    id: "general_unwell",
    label: "General feeling unwell",
    keywords: [],
    baseSeverity: "self_care",
    specialties: ["General Medicine", "Primary Care"],
    careKeys: ["rest_hydration", "log_symptoms", "light_diet"],
    followupQuestions: [
      "When exactly did this start, and was it sudden or gradual?",
      "Is it constant, or does it come and go?",
      "What makes it better or worse?",
      "Any other symptoms alongside it?",
    ],
  },
];

const CLUSTER_BY_ID = new Map(CLUSTERS.map((c) => [c.id, c]));

export const CLUSTER_IDS: readonly string[] = CLUSTERS.map((c) => c.id);

export function getCluster(id: string): Cluster | undefined {
  return CLUSTER_BY_ID.get(id);
}

export function isClusterId(id: string): boolean {
  return CLUSTER_BY_ID.has(id);
}

/** Fallback cluster when nothing matches. Never `neverSelfCare`. */
export const FALLBACK_CLUSTER_ID = "general_unwell";

/**
 * Scores a free-text description against every cluster, used by the local
 * heuristic fallback when no AI provider is available.
 */
export function scoreClusters(text: string): Array<{ cluster: Cluster; score: number }> {
  const haystack = ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")} `;
  const scored: Array<{ cluster: Cluster; score: number }> = [];

  for (const cluster of CLUSTERS) {
    // A vetoed cluster is discarded regardless of score.
    if (cluster.exclude?.some((p) => p.test(haystack))) continue;

    let score = 0;
    for (const kw of cluster.keywords) {
      if (haystack.includes(kw)) score += kw.includes(" ") ? 3 : 2;
    }
    for (const pattern of cluster.patterns ?? []) {
      if (pattern.test(haystack)) score += 2;
    }
    if (score > 0) scored.push({ cluster, score });
  }

  return scored.sort((a, b) => b.score - a.score);
}
