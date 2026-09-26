import type { RedFlag } from "./types";

/**
 * Deterministic red-flag engine.
 *
 * This is the highest-authority layer in the symptom checker. A hit here forces
 * `severity = "emergency"` and the only thing downstream that can do is raise
 * severity further — nothing can lower it. It therefore must never depend on an
 * AI provider, and it must never be bypassed by a model saying "it's fine".
 *
 * Matching strategy: phrase-level substring rules over normalised text, plus a
 * small set of regex rules for patterns a substring test cannot express.
 * Deliberately biased toward over-triggering — a false positive costs the user
 * one wasted trip, a false negative can cost their life.
 */

/** Lowercase, collapse whitespace, strip punctuation noise that breaks phrases. */
export function normalizeForMatching(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

export const RED_FLAG_CATALOG: readonly RedFlag[] = [
  // ── Cardiac ────────────────────────────────────────────────────────────────
  {
    id: "cardiac_pain",
    label: "Chest pain, pressure or tightness",
    category: "Heart and circulation",
    rationale: "Chest pain can be a heart attack. Do not wait it out.",
  },
  {
    id: "cardiac_radiating",
    label: "Pain spreading to arm, jaw, neck or back",
    category: "Heart and circulation",
    rationale: "Pain that radiates from the chest is a classic heart attack sign.",
  },
  {
    id: "cardiac_autonomic",
    label: "Chest symptoms with sweating, nausea or faintness",
    category: "Heart and circulation",
    rationale: "Sweating and nausea alongside chest symptoms suggest a cardiac cause.",
  },

  // ── Respiratory ───────────────────────────────────────────────────────────
  {
    id: "breathing_critical",
    label: "Severe breathlessness or unable to breathe",
    category: "Breathing",
    rationale: "Severe difficulty breathing needs immediate oxygen and assessment.",
  },
  {
    id: "airway",
    label: "Choking, or blue/grey lips or fingertips",
    category: "Breathing",
    rationale: "A blocked airway or cyanosis is a life-threatening emergency.",
  },
  {
    id: "respiratory_distress",
    label: "Breathing so fast that talking is difficult",
    category: "Breathing",
    rationale: "Very rapid breathing suggests severe respiratory distress.",
  },

  // ── Neurological ──────────────────────────────────────────────────────────
  {
    id: "stroke_signs",
    label: "Face drooping, arm weakness, or slurred speech",
    category: "Brain and nerves",
    rationale: "These are FAST stroke signs. Every minute without treatment causes permanent damage.",
  },
  {
    id: "loss_of_consciousness",
    label: "Unconscious, fainted and not waking up, or confusion",
    category: "Brain and nerves",
    rationale: "Reduced consciousness needs emergency assessment.",
  },
  {
    id: "seizure",
    label: "Seizure or fit",
    category: "Brain and nerves",
    rationale: "A first or prolonged seizure is an emergency.",
  },
  {
    id: "thunderclap_headache",
    label: "Sudden severe headache, worst ever, with stiff neck or rash",
    category: "Brain and nerves",
    rationale: "A thunderclap headache can indicate bleeding or meningitis.",
  },
  {
    id: "vision_loss_sudden",
    label: "Sudden loss of vision in one or both eyes",
    category: "Brain and nerves",
    rationale: "Sudden vision loss can signal a stroke or retinal detachment.",
  },

  // ── Bleeding and GI ───────────────────────────────────────────────────────
  {
    id: "uncontrolled_bleeding",
    label: "Bleeding that will not stop, or blood in vomit",
    category: "Bleeding",
    rationale: "Uncontrolled bleeding or vomiting blood needs emergency care.",
  },
  {
    id: "black_stools",
    label: "Black, tarry or bloody stools",
    category: "Bleeding",
    rationale: "Black tarry stools suggest internal bleeding.",
  },
  {
    id: "severe_abdominal",
    label: "Sudden severe abdominal pain, or a hard rigid abdomen",
    category: "Abdomen",
    rationale: "Sudden severe abdominal pain can indicate perforation or obstruction.",
  },
  {
    id: "persistent_vomiting",
    label: "Repeated vomiting or unable to keep any fluid down",
    category: "Abdomen",
    rationale: "Inability to keep fluids down risks dangerous dehydration.",
  },

  // ── Trauma and burns ──────────────────────────────────────────────────────
  {
    id: "major_trauma",
    label: "Road accident, fall from height, or serious injury",
    category: "Injury",
    rationale: "Major trauma needs emergency imaging and stabilisation.",
  },
  {
    id: "major_burn",
    label: "Burn larger than the palm of your hand, or a deep/white burn",
    category: "Injury",
    rationale: "Large or deep burns need emergency burn care.",
  },
  {
    id: "neck_spine_injury",
    label: "Injury to the head, neck or back",
    category: "Injury",
    rationale: "Possible spinal injury must not be moved without imaging.",
  },

  // ── Allergic and toxic ────────────────────────────────────────────────────
  {
    id: "anaphylaxis",
    label: "Swelling of face, lips or tongue, or trouble swallowing",
    category: "Allergy",
    rationale: "Facial or tongue swelling with breathing difficulty is anaphylaxis.",
  },
  {
    id: "poisoning",
    label: "Swallowed or inhaled something poisonous",
    category: "Poisoning",
    rationale: "Poisoning needs immediate emergency advice.",
  },

  // ── Infection and sepsis ──────────────────────────────────────────────────
  {
    id: "sepsis",
    label: "High fever with confusion, very fast breathing, or a rash that does not fade",
    category: "Infection",
    rationale: "These are sepsis warning signs and can deteriorate within hours.",
  },
  {
    id: "non_blanching_rash",
    label: "Purple or red rash that does not fade when pressed",
    category: "Infection",
    rationale: "A non-blanching rash can indicate meningococcal infection.",
  },

  // ── Obstetric ─────────────────────────────────────────────────────────────
  {
    id: "pregnancy_emergency",
    label: "Pregnant with heavy bleeding, severe pain, seizures or reduced movement",
    category: "Pregnancy",
    rationale: "These are obstetric emergencies affecting both patient and pregnancy.",
  },

  // ── Paediatric ────────────────────────────────────────────────────────────
  {
    id: "infant_fever",
    label: "Fever in a baby under 3 months",
    category: "Children",
    rationale: "Fever in a very young infant is always urgent.",
  },
  {
    id: "child_dehydration",
    label: "Child with no wet nappy/urination, sunken eyes, or no tears when crying",
    category: "Children",
    rationale: "These are signs of dangerous dehydration in a child.",
  },

  // ── Metabolic ─────────────────────────────────────────────────────────────
  {
    id: "hypoglycemia",
    label: "Confusion, sweating and shakiness in a diabetic, or blood sugar very low",
    category: "Blood sugar",
    rationale: "Severe hypoglycaemia is a medical emergency.",
  },
  {
    id: "hyperglycemia_crisis",
    label: "Diabetic with vomiting, deep rapid breathing or fruity breath",
    category: "Blood sugar",
    rationale: "These suggest diabetic ketoacidosis, a life-threatening condition.",
  },

  // ── Psychiatric ───────────────────────────────────────────────────────────
  {
    id: "suicidal_ideation",
    label: "Thoughts of harming myself or of suicide",
    category: "Mental health",
    rationale: "You deserve immediate support. Please talk to someone now.",
  },
];

const RED_FLAG_BY_ID = new Map(RED_FLAG_CATALOG.map((f) => [f.id, f]));

export function getRedFlag(id: string): RedFlag | undefined {
  return RED_FLAG_BY_ID.get(id);
}

/** Phrase rules. Matched as whole phrases against normalised text. */
const PHRASE_RULES: ReadonlyArray<{ flag: string; phrases: readonly string[] }> = [
  {
    flag: "cardiac_pain",
    phrases: [
      "chest pain",
      "chest hurts",
      "chest is hurting",
      "pain in my chest",
      "pain in the chest",
      "chest tightness",
      "tightness in chest",
      "chest pressure",
      "crushing chest",
      "chest heaviness",
      "chest discomfort",
    ],
  },
  {
    flag: "cardiac_radiating",
    phrases: [
      "pain spreading to my left arm",
      "pain spreading to my right arm",
      "pain going down my arm",
      "pain radiating to my arm",
      "radiating to my left arm",
      "spreading to my left arm",
      "spreading to my arm",
      "pain in my left arm",
      "pain in my jaw",
      "pain in my neck and chest",
      "pain going to my jaw",
      "pain radiating to my jaw",
      "pain radiating to my back",
      "spreading to my back",
    ],
  },
  {
    flag: "cardiac_autonomic",
    phrases: [
      "chest pain and sweating",
      "chest pain with sweating",
      "chest pain and nausea",
      "chest pain with nausea",
      "chest pain and dizziness",
      "chest pain and faintness",
      "chest pain and sweating and nausea",
    ],
  },
  {
    flag: "breathing_critical",
    phrases: [
      "cannot breathe",
      "cant breathe",
      "can not breathe",
      "cannot get air",
      "struggling to breathe",
      "struggling for breath",
      "difficulty breathing",
      "severe breathlessness",
      "short of breath at rest",
      "gasping",
      "choking",
      "choked",
    ],
  },
  {
    flag: "stroke_signs",
    phrases: [
      "face is drooping",
      "face drooping",
      "drooping face",
      "one side of my face",
      "mouth is crooked",
      "slurred speech",
      "speech is slurred",
      "cannot speak properly",
      "one arm is weak",
      "arm weakness",
      "numb on one side",
      "weakness on one side",
      "one side of my body",
    ],
  },
  {
    flag: "loss_of_consciousness",
    phrases: [
      "unconscious",
      "unresponsive",
      "passed out",
      "fainted and",
      "not waking up",
      "wont wake up",
      "blurred confused",
      "very confused",
      "confused and disoriented",
      "not making sense",
    ],
  },
  {
    flag: "seizure",
    phrases: ["seizure", "seizures", "having a fit", "fits", "convulsion", "convulsions"],
  },
  {
    flag: "uncontrolled_bleeding",
    phrases: [
      "bleeding heavily",
      "heavy bleeding",
      "will not stop bleeding",
      "wont stop bleeding",
      "bleeding that will not stop",
      "blood in vomit",
      "vomiting blood",
      "throwing up blood",
      "coughing up blood",
    ],
  },
  {
    flag: "black_stools",
    phrases: ["black stool", "black stools", "tarry stool", "bloody stool", "blood in stool", "blood in my stool"],
  },
  {
    flag: "anaphylaxis",
    phrases: [
      "swelling of my tongue",
      "tongue is swelling",
      "swollen tongue",
      "lips are swelling",
      "swollen lips",
      "throat is closing",
      "throat closing",
      "trouble swallowing",
      "cannot swallow",
    ],
  },
  {
    flag: "major_trauma",
    phrases: [
      "road accident",
      "car accident",
      "bike accident",
      "fell from",
      "fall from height",
      "hit by",
      "run over",
      "bad accident",
      "major accident",
    ],
  },
  {
    flag: "major_burn",
    phrases: ["large burn", "big burn", "deep burn", "burned badly", "burnt badly", "chemical burn", "electrical burn"],
  },
  {
    flag: "suicidal_ideation",
    phrases: [
      "suicidal",
      "suicide",
      "want to die",
      "wanna die",
      "end my life",
      "harm myself",
      "hurt myself",
      "kill myself",
      "self harm",
    ],
  },
];

/** Regex rules for patterns a phrase test cannot express. */
const REGEX_RULES: ReadonlyArray<{ flag: string; pattern: RegExp }> = [
  { flag: "thunderclap_headache", pattern: /\b(sudden|worst|suddenly)\b[^.]{0,30}\bheadache\b|\bheadache\b[^.]{0,40}\b(worst|worst ever|thunderclap)\b/ },
  { flag: "thunderclap_headache", pattern: /\bstiff neck\b[^.]{0,30}\b(headache|fever|rash)\b|\b(headache|fever)\b[^.]{0,30}\bstiff neck\b/ },
  { flag: "persistent_vomiting", pattern: /\b(vomit|vomiting|throwing up)\b[^.]{0,25}\b(every time|constantly|repeatedly|again and again|hours)\b/ },
  { flag: "persistent_vomiting", pattern: /\b(cannot|can t|can not|unable to)\b[^.]{0,15}\bkeep (any )?(food|water|fluids|liquid)\b/ },
  { flag: "severe_abdominal", pattern: /\b(sudden|severe|excruciating|worst)\b[^.]{0,25}\b(abdominal|belly|stomach|tummy)\b/ },
  { flag: "respiratory_distress", pattern: /\b(breathing|breathes?|breathless)\b[^.]{0,30}\b(talk\w*|speak\w*|sentence\w*|words?)\b[^.]{0,15}\b(hard|difficult|tough|impossible)\b/ },
  { flag: "respiratory_distress", pattern: /\b(so|very) fast\b[^.]{0,25}\b(talk\w*|speak\w*|breath\w*|sitting|walking)\b/ },
  { flag: "respiratory_distress", pattern: /\b(talk\w*|speak\w*)\b[^.]{0,20}\b(in short (breaths|bites)|out of breath)\b/ },
  { flag: "vision_loss_sudden", pattern: /\b(suddenly|went|gone|black)\b[^.]{0,20}\b(blind|vision loss|can not see|cant see|cannot see|vision is gone)\b/ },
  { flag: "vision_loss_sudden", pattern: /\bvision\b[^.]{0,20}\b(suddenly|went|gone)\b[^.]{0,20}\b(eye|eyes|in|my)\b/ },
  { flag: "vision_loss_sudden", pattern: /\b(can not see|cant see|cannot see|have gone blind|became blind)\b[^.]{0,20}\b(suddenly|one eye|my eye|eyes)\b/ },
  { flag: "cardiac_radiating", pattern: /\b(pain|aching|ache|tightness|discomfort|pressure)\b[^.]{0,25}\b(left arm|right arm|my arm|my jaw|my back|jaw|shoulder)\b/ },
  { flag: "cardiac_radiating", pattern: /\b(arm|jaw|back|shoulder)\b[^.]{0,25}\b(pain|aching|ache) is (also )?(there|present)\b/ },
  { flag: "cardiac_autonomic", pattern: /\bchest\b[^.]{0,40}\b(sweating|cold sweat|dizzy|nausea|lightheaded)\b/ },
  { flag: "hypoglycemia", pattern: /\b(blood sugar|sugar|glucose|diabet)\b[^.]{0,40}\b(very low|low|shaky|sweating|confused|below 70)\b/ },
  { flag: "hypoglycemia", pattern: /\b(very low|low) blood sugar\b/ },
  { flag: "hyperglycemia_crisis", pattern: /\b(diabet|sugar|glucose)\b[^.]{0,40}\b(fruity|acetone|deep breathing|rapid breathing|throwing up|vomiting)\b/ },
  { flag: "sepsis", pattern: /\b(high fever|very high fever|103|104|105)\b[^.]{0,50}\b(confused|disoriented|breathing fast|breathing quickly|very fast breathing)\b/ },
  { flag: "sepsis", pattern: /\b(confused|disoriented)\b[^.]{0,50}\b(very fast breathing|breathing very fast|cold clammy|shivering)\b/ },
  { flag: "non_blanching_rash", pattern: /\b(purple|red|dark)\b[^.]{0,20}\brash\b[^.]{0,40}\b(not fade|does not fade|doesnt fade|does not disappear|non blanching)\b/ },
  { flag: "child_dehydration", pattern: /\b(no wet nappy|no wet diaper|not urinating|not passing urine|has not urinated|sunken eyes|no tears)\b/ },
  { flag: "airway", pattern: /\b(blue|bluish|grey|gray|pale white)\b[^.]{0,20}\b(lips?|fingertips?|finger tips?|face|skin|nail\w*)\b/ },
  { flag: "airway", pattern: /\b(lips?|fingertips?|finger tips?|face|skin)\b[^.]{0,20}\b(turned|gone|looking) (blue|bluish|grey|gray)\b/ },
  { flag: "airway", pattern: /\b(blue|bluish|grey|gray)\b[^.]{0,12}\b(lips?|fingertips?|face)\b/ },
  { flag: "anaphylaxis", pattern: /\b(hives|rash|swelling)\b[^.]{0,40}\b(shortness of breath|breathless|breathing|wheez)\b/ },
  { flag: "neck_spine_injury", pattern: /\b(hit|injured|hurt)\b[^.]{0,20}\b(head|neck|back)\b[^.]{0,30}\b(fell|fall|accident|crash|pain)\b/ },
  { flag: "neck_spine_injury", pattern: /\bneck pain\b[^.]{0,40}\b(after|following|since)\b[^.]{0,15}\b(accident|fall|injury|hit)\b/ },
  { flag: "pregnancy_emergency", pattern: /\bpregnan(t|cy)?\b[^.]{0,60}\b(bleeding|severe pain|seizure|reduced movement|no movement|not moving|faint|dizzy)\b/ },
  { flag: "pregnancy_emergency", pattern: /\b(bleeding|severe pain|seizure|reduced movement)\b[^.]{0,40}\bpregnan(t|cy)?\b/ },
  { flag: "poisoning", pattern: /\b(swallowed|ate|drank|inhaled|breathed)\b[^.]{0,30}\b(poison|chemical|detergent|kerosene|pesticide|insecticide|medicine|medication)\b/ },
  { flag: "thunderclap_headache", pattern: /\bworst headache of my life\b/ },
  { flag: "loss_of_consciousness", pattern: /\b(fainted|blacked out|passed out)\b[^.]{0,30}\b(did not|didnt|still|not yet|again)\b[^.]{0,15}\b(wake|recover|come to)\b/ },
];

/** Age-aware rules that only apply to specific age bands. */
const AGE_GATED_RULES: ReadonlyArray<{
  flag: string;
  pattern: RegExp;
  ages: readonly string[];
}> = [
  { flag: "infant_fever", pattern: /\b(fever|temperature|hot|warm)\b/, ages: ["under_1"] },
];

/** Negative lookarounds that suppress a phrase when a qualifier is present. */
const SUPPRESSORS: ReadonlyArray<{ flag: string; pattern: RegExp }> = [
  // Suppressors exist only for explicit negations. We deliberately do NOT
  // suppress a chest-pain hit because the patient called it "mild" or
  // "positional" — the cost of a missed cardiac presentation far outweighs a
  // few unnecessary referrals.
  { flag: "cardiac_pain", pattern: /\bno chest pain\b/ },
  { flag: "breathing_critical", pattern: /\bnot (short of breath|breathless)\b/ },
  { flag: "suicidal_ideation", pattern: /\bnot suicidal\b/ },
];

export type RedFlagMatch = RedFlag & {
  /** Which detection surface produced this hit — surfaced for explainability. */
  source: "text" | "patient_reported" | "age";
};

const PATIENT_REPORTED_PREFIX = "reported_";

/**
 * Runs the full red-flag scan.
 *
 * @param freeText       The patient's own description of their symptoms.
 * @param reportedFlags  Red-flag ids the patient explicitly ticked in the UI.
 * @param age            Age band, used for age-gated rules.
 */
export function detectRedFlags(
  freeText: string,
  reportedFlags: readonly string[] = [],
  age: string | null = null
): RedFlagMatch[] {
  const text = normalizeForMatching(freeText);
  const hits = new Map<string, RedFlagMatch>();

  const record = (flagId: string, source: RedFlagMatch["source"]) => {
    const flag = RED_FLAG_BY_ID.get(flagId);
    if (!flag || hits.has(flagId)) return;
    hits.set(flagId, { ...flag, source });
  };

  for (const rule of PHRASE_RULES) {
    if (SUPPRESSORS.some((s) => s.flag === rule.flag && s.pattern.test(text))) continue;
    if (rule.phrases.some((p) => text.includes(p))) record(rule.flag, "text");
  }

  for (const rule of REGEX_RULES) {
    if (SUPPRESSORS.some((s) => s.flag === rule.flag && s.pattern.test(text))) continue;
    if (rule.pattern.test(text)) record(rule.flag, "text");
  }

  if (age) {
    for (const rule of AGE_GATED_RULES) {
      if (rule.ages.includes(age) && rule.pattern.test(text)) record(rule.flag, "age");
    }
  }

  for (const id of reportedFlags) {
    if (id.startsWith(PATIENT_REPORTED_PREFIX)) {
      record(id.slice(PATIENT_REPORTED_PREFIX.length), "patient_reported");
    } else {
      record(id, "patient_reported");
    }
  }

  return [...hits.values()];
}

/** Ids the UI can offer as checkboxes, in display order. */
export function redFlagIds(): string[] {
  return RED_FLAG_CATALOG.map((f) => f.id);
}

/** Groups the catalogue for rendering, preserving catalogue order. */
export function redFlagsByCategory(): Array<{ category: string; flags: RedFlag[] }> {
  const groups = new Map<string, RedFlag[]>();
  for (const flag of RED_FLAG_CATALOG) {
    const list = groups.get(flag.category);
    if (list) list.push(flag);
    else groups.set(flag.category, [flag]);
  }
  return [...groups.entries()].map(([category, flags]) => ({ category, flags }));
}
