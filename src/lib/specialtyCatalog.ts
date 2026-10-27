import {
  Activity,
  Baby,
  Bone,
  Brain,
  Droplet,
  Eye,
  Heart,
  HeartPulse,
  Microscope,
  Moon,
  Siren,
  Sparkles,
  Stethoscope,
  Syringe,
  Thermometer,
  Venus,
  Waves,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Browsable specialty catalog — the ONE place a specialty is defined.
 *
 * The footer link column, the homepage browse cards and the search filter
 * suggestions all read from this array. Previously each of those three places
 * hardcoded its own list, so they had already drifted apart (the footer listed
 * five specialties, the homepage eight, and they overlapped on only four).
 *
 * Every `specialties` entry is a value verified to exist in the live
 * `hospitals.specialties` array. Together these groups cover all 47 clinical
 * values in the dataset — see `CANONICAL_SPECIALTIES` in `@/lib/specialties`
 * for the flat list and `npm run verify:specialties` to re-check.
 */
export interface SpecialtyGroup {
  /** Stable identifier, used in URLs and as a React key. */
  id: string;
  /** Display name. */
  label: string;
  /**
   * Dataset values to match, sent to `GET /api/hospitals?specialty=`. Multiple
   * values are OR-matched, so a group returns everything a patient needs.
   */
  specialties: string[];
  /** What this group covers, in plain language. Counts are rendered live. */
  description: string;
  /** Natural-language seed used by the browse cards. */
  query: string;
  /** Extra terms that should resolve to this group during search. */
  keywords: string[];
  icon: LucideIcon;
  /** Tailwind classes for the icon tile, matched to the existing design. */
  color: string;
}

export const SPECIALTY_CATALOG: readonly SpecialtyGroup[] = [
  {
    id: "cardiology",
    label: "Cardiology",
    specialties: ["Cardiology", "Cardio-Thoracic & Vascular Surgery"],
    description: "Heart surgery, bypass, and cardiac care",
    query: "Best hospital for heart surgery under PM-JAY",
    keywords: ["heart", "cardiac", "chest pain", "bypass", "angina", "palpitation"],
    icon: Heart,
    color: "text-rose-400 bg-rose-500/10 group-hover:bg-rose-500/20",
  },
  {
    id: "emergency",
    label: "Emergency Care",
    specialties: ["Emergency Room Packages", "Emergency Medicine", "Critical Care", "Trauma Care"],
    description: "24/7 emergency rooms, trauma and critical care",
    query: "Hospitals with emergency room and trauma care",
    keywords: ["emergency", "trauma", "accident", "unconscious", "collapsed", "ambulance"],
    icon: Siren,
    color: "text-red-400 bg-red-500/10 group-hover:bg-red-500/20",
  },
  {
    id: "orthopaedics",
    label: "Orthopaedics",
    specialties: ["Orthopaedics", "Orthopedics", "Joint Replacement"],
    description: "Joint replacement, fractures & spine care",
    query: "Orthopaedic hospitals for joint replacement surgery",
    keywords: ["bone", "joint", "fracture", "knee", "hip", "arthritis", "back pain"],
    icon: Bone,
    color: "text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20",
  },
  {
    id: "maternity",
    label: "Maternity & Gynae",
    specialties: ["Obstetrics & Gynaecology", "Obstetrics & Gynecology", "Women’s Health"],
    description: "Pregnancy, delivery & women's health",
    query: "Maternity hospital for pregnancy and delivery care",
    keywords: ["pregnancy", "delivery", "maternity", "women", "period", "infertility"],
    icon: Venus,
    color: "text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/20",
  },
  {
    id: "nephrology",
    label: "Kidney & Dialysis",
    specialties: ["Nephrology"],
    description: "Renal care and dialysis",
    query: "Kidney treatment hospital with dialysis facility",
    keywords: ["kidney", "renal", "dialysis", "nephro", "urine"],
    icon: Droplet,
    color: "text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20",
  },
  {
    id: "general-surgery",
    label: "General Surgery",
    specialties: ["General Surgery", "Laparoscopic Surgery"],
    description: "General and laparoscopic surgical procedures",
    query: "General surgery hospital for a surgical procedure",
    keywords: ["surgery", "operation", "appendicitis", "hernia", "laparoscopic"],
    icon: Stethoscope,
    color: "text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20",
  },
  {
    id: "oncology",
    label: "Oncology",
    specialties: ["Oncology", "Medical Oncology", "Surgical Oncology", "Radiation Oncology"],
    description: "Cancer screening, chemotherapy and radiotherapy",
    query: "Cancer treatment hospital with chemotherapy",
    keywords: ["cancer", "tumor", "tumour", "onco", "chemo", "mass"],
    icon: Sparkles,
    color: "text-violet-400 bg-violet-500/10 group-hover:bg-violet-500/20",
  },
  {
    id: "ophthalmology",
    label: "Ophthalmology",
    specialties: ["Ophthalmology", "Ophthalmic Surgery"],
    description: "Cataract surgery & eye care",
    query: "Eye hospital for cataract and vision care",
    keywords: ["eye", "vision", "cataract", "ophthalmic", "blurred vision"],
    icon: Eye,
    color: "text-teal-400 bg-teal-500/10 group-hover:bg-teal-500/20",
  },
  {
    id: "neurology",
    label: "Neurology",
    specialties: ["Neurology", "Neurosurgery"],
    description: "Brain, nerve and stroke care",
    query: "Neurology hospital for stroke and nerve problems",
    keywords: ["brain", "neuro", "stroke", "seizure", "migraine", "numbness", "vertigo"],
    icon: Brain,
    color: "text-indigo-400 bg-indigo-500/10 group-hover:bg-indigo-500/20",
  },
  {
    id: "burns-plastic",
    label: "Burns & Plastic Surgery",
    specialties: ["Burns Management", "Plastic & Reconstructive Surgery"],
    description: "Burns management & reconstructive care",
    query: "Hospital for burn treatment and reconstructive care",
    keywords: ["burn", "scald", "plastic", "reconstructive", "cosmetic"],
    icon: Activity,
    color: "text-orange-400 bg-orange-500/10 group-hover:bg-orange-500/20",
  },
  {
    id: "general-medicine",
    label: "General Medicine",
    specialties: ["General Medicine", "Internal Medicine", "Family Medicine"],
    description: "First-contact care, fever and health checks",
    query: "General physician for fever and a health check-up",
    keywords: ["fever", "general", "checkup", "check up", "family physician", "gp"],
    icon: HeartPulse,
    color: "text-cyan-400 bg-cyan-500/10 group-hover:bg-cyan-500/20",
  },
  {
    id: "gastroenterology",
    label: "Gastroenterology",
    specialties: ["Gastroenterology", "Hepatology"],
    description: "Digestive, liver and gut care",
    query: "Hospital for stomach, liver or digestive problems",
    keywords: ["stomach", "liver", "gut", "gastro", "acidity", "jaundice", "constipation"],
    icon: Droplet,
    color: "text-lime-400 bg-lime-500/10 group-hover:bg-lime-500/20",
  },
  {
    id: "ent",
    label: "ENT",
    specialties: ["Otorhinolaryngology (ENT)", "ENT", "Head & Neck Surgery"],
    description: "Ear, nose, throat & head and neck surgery",
    query: "ENT hospital for sinus, tonsil or hearing problems",
    keywords: ["ear", "nose", "throat", "sinus", "tonsil", "hearing loss", "ent"],
    icon: Waves,
    color: "text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20",
  },
  {
    id: "pulmonology",
    label: "Pulmonology",
    specialties: ["Pulmonology"],
    description: "Chest, lung and breathing care",
    query: "Pulmonology hospital for asthma and breathing problems",
    keywords: ["lung", "breathless", "asthma", "wheeze", "cough", "pneumonia"],
    icon: Wind,
    color: "text-slate-300 bg-slate-500/10 group-hover:bg-slate-500/20",
  },
  {
    id: "dermatology",
    label: "Dermatology",
    specialties: ["Dermatology", "Cosmetology"],
    description: "Skin conditions and cosmetic care",
    query: "Dermatology hospital for a skin condition",
    keywords: ["skin", "rash", "itch", "acne", "eczema", "psoriasis", "cosmetic"],
    icon: Sparkles,
    color: "text-fuchsia-400 bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20",
  },
  {
    id: "endocrinology",
    label: "Diabetes & Hormones",
    specialties: ["Endocrinology", "Diabetology"],
    description: "Diabetes, thyroid and hormone care",
    query: "Hospital for diabetes or thyroid treatment",
    keywords: ["diabetes", "sugar", "insulin", "thyroid", "hba1c", "hormone"],
    icon: Syringe,
    color: "text-yellow-400 bg-yellow-500/10 group-hover:bg-yellow-500/20",
  },
  {
    id: "mental-health",
    label: "Mental Health",
    specialties: ["Psychiatry", "Behavioral Health"],
    description: "Psychiatry and counselling support",
    query: "Hospital for anxiety, depression or mental health support",
    keywords: ["anxiety", "depression", "mental health", "panic", "insomnia", "therapy"],
    icon: Moon,
    color: "text-purple-400 bg-purple-500/10 group-hover:bg-purple-500/20",
  },
  {
    id: "urology",
    label: "Urology",
    specialties: ["Urology"],
    description: "Kidney stones, prostate and urinary care",
    query: "Urology hospital for prostate or urinary problems",
    keywords: ["urine", "prostate", "bladder", "stone", "uti", "urology"],
    icon: Microscope,
    color: "text-cyan-300 bg-cyan-500/10 group-hover:bg-cyan-500/20",
  },
  {
    id: "paediatrics",
    label: "Paediatrics",
    specialties: ["Pediatrics", "Paediatric Medical Management", "Neo-natal Care", "Neonatology"],
    description: "Child and newborn care",
    query: "Children's hospital for a child or a newborn",
    keywords: ["child", "children", "baby", "infant", "newborn", "neonatal", "toddler"],
    icon: Baby,
    color: "text-pink-300 bg-pink-500/10 group-hover:bg-pink-500/20",
  },
  {
    id: "pain-medicine",
    label: "Pain Medicine",
    specialties: ["Pain Medicine"],
    description: "Chronic and acute pain management",
    query: "Pain management hospital for chronic pain",
    keywords: ["pain", "aches", "cramp", "chronic pain"],
    icon: Thermometer,
    color: "text-amber-300 bg-amber-500/10 group-hover:bg-amber-500/20",
  },
  {
    id: "rheumatology",
    label: "Rheumatology",
    specialties: ["Rheumatology"],
    description: "Arthritis, lupus and autoimmune conditions",
    query: "Hospital for arthritis or autoimmune treatment",
    keywords: ["arthritis", "lupus", "autoimmune", "rheumat", "joint swelling"],
    icon: Activity,
    color: "text-red-300 bg-red-500/10 group-hover:bg-red-500/20",
  },
] as const;

const CATALOG_BY_ID = new Map(SPECIALTY_CATALOG.map((g) => [g.id, g]));

/** Look up a browse group by its stable id. */
export function getSpecialtyGroup(id: string): SpecialtyGroup | null {
  return CATALOG_BY_ID.get(id) ?? null;
}

/**
 * Flat, de-duplicated list of every dataset specialty value the catalog covers.
 * `scripts/verify-specialties.mjs` asserts this equals the live DB vocabulary.
 */
export const CATALOG_SPECIALTY_VALUES: readonly string[] = [
  ...new Set(SPECIALTY_CATALOG.flatMap((g) => g.specialties)),
];

/**
 * The subset shown in the footer's "Services" column. Kept here rather than in
 * the footer so it stays in lockstep with the cards.
 */
export const FOOTER_SPECIALTY_GROUPS: readonly SpecialtyGroup[] = [
  "cardiology",
  "emergency",
  "orthopaedics",
  "oncology",
  "nephrology",
  "neurology",
  "maternity",
  "ophthalmology",
].map((id) => CATALOG_BY_ID.get(id))
  .filter((g): g is SpecialtyGroup => Boolean(g));

/**
 * The groups shown on the homepage browse grid. A curated slice, not the whole
 * catalog: 22 cards is a wall, 8 is a menu. The selection lives here so the
 * homepage cannot reintroduce a hand-written list.
 */
export const HOMEPAGE_SPECIALTY_GROUPS: readonly SpecialtyGroup[] = [
  "cardiology",
  "emergency",
  "orthopaedics",
  "maternity",
  "nephrology",
  "general-surgery",
  "oncology",
  "ophthalmology",
].map((id) => CATALOG_BY_ID.get(id))
  .filter((g): g is SpecialtyGroup => Boolean(g));

/** Search href for a group, used by cards and footer links alike. */
export function specialtyHref(group: SpecialtyGroup): string {
  return `/search?specialty=${encodeURIComponent(group.specialties.join(","))}`;
}
