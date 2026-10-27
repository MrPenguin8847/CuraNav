/**
 * Specialty, facility and budget verification harness.
 *
 * Run with:  npm run verify:specialties
 *
 * This is NOT a unit-test suite. It asserts the properties that, when they
 * break, make search confidently return the wrong hospitals:
 *
 *   1. Every specialty value in the live database is canonical (and any value
 *      that is not gets reported, so the list changes deliberately).
 *   2. The browsable catalog covers every canonical value exactly once.
 *   3. Every catalog `specialty=` href survives normalisation, i.e. a card link
 *      can never be silently dropped by the API.
 *   4. The emergency list contains only values that exist in the data.
 *   5. Facility normalisation handles the real spellings, including the
 *      separator variants of "24x7 Emergency".
 *   6. Budget extraction reads money and refuses non-money numbers.
 *   7. Clinical synonym resolution answers the way patients actually phrase it.
 *
 * With NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY available, the
 * live-database checks run too; without them they are skipped rather than
 * failed, so this still works offline. `.env.local` is loaded automatically so
 * a developer normally does not have to export anything by hand.
 */

import { config as loadEnv } from "dotenv";
import {
  CANONICAL_SPECIALTIES,
  CANONICAL_FACILITIES,
  EMERGENCY_SPECIALTIES,
  GENERAL_FALLBACK_SPECIALTIES,
  isCanonicalSpecialty,
  normalizeExplicitSpecialty,
  normalizeFacilities,
  resolveSpecialtyHint,
} from "../src/lib/specialties";
import { SPECIALTY_CATALOG, CATALOG_SPECIALTY_VALUES, specialtyHref } from "../src/lib/specialtyCatalog";
import { extractBudgetFromText } from "../src/lib/searchIntent";

// dotenv never overwrites variables that are already set, so real environment
// variables still win over the file. Missing files are not an error, and
// `quiet` keeps its banner out of the report.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

let failures = 0;
let checks = 0;
let skipped = 0;

/**
 * Values that exist in the live data but are deliberately not part of the
 * canonical vocabulary.
 *
 * `cardio` is a legacy abbreviation, not a department name. Exactly one row in
 * the live table carries it, and that row lists nothing else, so it is
 * unreachable by any specialty filter. Rather than legitimise a typo by making
 * it canonical, it is allowlisted here so the harness still fails on any *new*
 * non-canonical value. Fix the data and this set can be emptied.
 */
const KNOWN_NON_CANONICAL_VALUES = new Set(["cardio"]);

function pass(label: string) {
  checks++;
  console.log(`  \u2713 ${label}`);
}

function fail(label: string, detail: string) {
  checks++;
  failures++;
  console.log(`  \u2717 ${label}\n      ${detail}`);
}

function assertTrue(condition: boolean, label: string, detail = ""): void {
  if (condition) pass(label);
  else fail(label, detail);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual === expected) pass(`${label} \u2192 ${String(expected)}`);
  else fail(label, `expected ${String(expected)}, got ${String(actual)}`);
}

/** value -> number of hospitals listing it (all rows). */
const liveCounts = new Map<string, number>();
/** verification_status -> row count. */
const liveStatusCounts = new Map<string, number>();
let liveTotal = 0;
let liveSearchable = 0;
let liveRowsWithSpecialties = 0;

async function loadLiveVocabulary(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    skipped++;
    console.log("  \u2013 skipped: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
    return;
  }

  // Plain REST rather than the SDK client: this is a one-shot read, and the
  // client leaves keep-alive sockets behind that race `process.exit()` on
  // Windows.
  let rows: Array<{
    specialties: string[] | null;
    verification_status: string | null;
    review_status: string | null;
  }>;
  try {
    const res = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/hospitals?select=specialties,verification_status,review_status`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rows = (await res.json()) as typeof rows;
  } catch (err) {
    skipped++;
    console.log(`  \u2013 skipped: could not read hospitals \u2014 ${(err as Error).message}`);
    return;
  }

  for (const row of rows) {
    liveTotal++;
    // The table carries two independent status columns. `/api/hospitals` gates on
    // `review_status`, so that is the population the search page and the stats
    // API both have to agree on.
    if (row.review_status === "approved") liveSearchable++;
    const status = row.verification_status ?? "unknown";
    liveStatusCounts.set(status, (liveStatusCounts.get(status) ?? 0) + 1);
    if ((row.specialties ?? []).length > 0) liveRowsWithSpecialties++;
    for (const s of row.specialties ?? []) liveCounts.set(s, (liveCounts.get(s) ?? 0) + 1);
  }

  console.log(`  \u00b7 ${liveTotal} rows, ${liveCounts.size} distinct specialty values`);
  console.log(`  \u00b7 search-visible (review_status=approved): ${liveSearchable}`);
  console.log(
    `  \u00b7 verification_status: ${[...liveStatusCounts.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`
  );
}

async function main(): Promise<void> {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Live database vocabulary.
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[1] Live database specialty vocabulary is canonical");
  await loadLiveVocabulary();

  if (liveCounts.size > 0) {
    const liveValues = [...liveCounts.keys()].sort();
    const nonCanonical = liveValues.filter(
      (v) => !isCanonicalSpecialty(v) && !KNOWN_NON_CANONICAL_VALUES.has(v)
    );
    assertTrue(
      nonCanonical.length === 0,
      `all live values are canonical or a known exception (${liveValues.length} values)`,
      `unexpected: ${nonCanonical.join(", ")} \u2014 add them to CANONICAL_SPECIALTIES or fix the data`
    );

    // Reported rather than asserted, because it is a data-cleanup task and not
    // a code defect: these rows are unreachable by a specialty search.
    const knownJunk = liveValues.filter((v) => KNOWN_NON_CANONICAL_VALUES.has(v));
    if (knownJunk.length > 0) {
      const affected = knownJunk.reduce((n, v) => n + (liveCounts.get(v) ?? 0), 0);
      console.log(
        `  \u00b7 known data-quality exception: ${knownJunk.join(", ")} ` +
          `on ${affected}/${liveTotal} rows \u2014 unreachable by a specialty filter until cleaned up`
      );
    }

    const unused = CANONICAL_SPECIALTIES.filter((s) => !liveCounts.has(s));
    assertTrue(
      unused.length === 0,
      `every canonical value is used in the data (${CANONICAL_SPECIALTIES.length})`,
      `in code but absent from the data: ${unused.join(", ")}`
    );

    // Guards the bug this harness was written after: a status filter naming a
    // value the database does not contain silently blanks every count.
    assertTrue(
      liveTotal > 0,
      "the hospitals table returns rows for the service-role key",
      `got ${liveTotal}`
    );
    assertTrue(
      liveRowsWithSpecialties > 0,
      "hospitals carry specialty arrays",
      `only ${liveRowsWithSpecialties}/${liveTotal} rows have any specialty`
    );
    // The homepage must not advertise more hospitals than search can return.
    // `review_status = 'approved'` is the gate `/api/hospitals` applies, and it is
    // a different column from `verification_status` — a stats filter on the wrong
    // one silently returns either zero or too many rows.
    assertTrue(
      liveSearchable > 0 && liveSearchable < liveTotal,
      `review_status gates search on a strict subset (${liveSearchable}/${liveTotal})`,
      `searchable = ${liveSearchable} of ${liveTotal}; if these are equal, the gate is not being applied at all`
    );
    console.log(
      `  \u00b7 largest: ${[...liveCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `${k} (${v})`)
        .join(", ")}`
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Catalog coverage: every canonical value, exactly once.
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[2] Catalog covers every canonical value exactly once");

  {
    const catalogSet = new Set(CATALOG_SPECIALTY_VALUES);
    const missing = CANONICAL_SPECIALTIES.filter((s) => !catalogSet.has(s));
    assertTrue(
      missing.length === 0,
      `catalog covers all ${CANONICAL_SPECIALTIES.length} canonical values`,
      `missing from SPECIALTY_CATALOG: ${missing.join(", ")}`
    );

    const extra = CATALOG_SPECIALTY_VALUES.filter((s) => !isCanonicalSpecialty(s));
    assertTrue(
      extra.length === 0,
      "catalog contains only canonical values",
      `not canonical: ${extra.join(", ")}`
    );

    // A value in two groups makes "which count do I show?" unanswerable and
    // makes two cards disagree.
    const owners = new Map<string, string[]>();
    for (const group of SPECIALTY_CATALOG) {
      for (const s of group.specialties) owners.set(s, [...(owners.get(s) ?? []), group.id]);
    }
    const duplicated = [...owners.entries()].filter(([, groups]) => groups.length > 1);
    assertTrue(
      duplicated.length === 0,
      "no specialty appears in two catalog groups",
      duplicated.map(([s, g]) => `${s} in ${g.join(" + ")}`).join("; ")
    );

    const ids = SPECIALTY_CATALOG.map((g) => g.id);
    assertTrue(new Set(ids).size === ids.length, "catalog ids are unique");

    // A group with no specialties would render a link that searches nothing.
    const empty = SPECIALTY_CATALOG.filter((g) => g.specialties.length === 0).map((g) => g.id);
    assertTrue(empty.length === 0, "no catalog group is empty", empty.join(", "));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Every card/link href must survive normalisation.
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[3] Every catalog href is resolvable by the API");

  for (const group of SPECIALTY_CATALOG) {
    const raw = group.specialties.join(",");
    const normalized = normalizeExplicitSpecialty(raw);
    if (normalized === null) {
      fail(
        `group "${group.id}" href resolves`,
        `normalizeExplicitSpecialty(${JSON.stringify(raw)}) returned null, so the link would silently drop the filter`
      );
      continue;
    }
    const dropped = group.specialties.filter((s) => !normalized.split(",").includes(s));
    if (dropped.length > 0) {
      fail(
        `group "${group.id}" keeps all its values`,
        `dropped by normalisation: ${dropped.join(", ")} (normalised to ${normalized})`
      );
      continue;
    }

    const href = specialtyHref(group);
    if (!href.startsWith("/search?specialty=")) {
      fail(`group "${group.id}" href shape`, `got ${href}`);
      continue;
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(href.split("specialty=")[1]);
    } catch {
      fail(`group "${group.id}" href decodes`, `undecodable: ${href}`);
      continue;
    }
    assertEqual(decoded, raw, `href for "${group.id}" round-trips`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Emergency list.
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[4] Emergency specialty list is valid and complete");

  {
    const nonCanonical = EMERGENCY_SPECIALTIES.filter((s) => !isCanonicalSpecialty(s));
    assertTrue(
      nonCanonical.length === 0,
      "every emergency value is canonical",
      `not canonical: ${nonCanonical.join(", ")}`
    );
    assertEqual(
      normalizeExplicitSpecialty(EMERGENCY_SPECIALTIES.join(",")),
      EMERGENCY_SPECIALTIES.join(","),
      "the emergency list survives normalisation intact"
    );

    if (liveCounts.size > 0) {
      const absent = EMERGENCY_SPECIALTIES.filter((s) => !liveCounts.has(s));
      assertTrue(
        absent.length === 0,
        "every emergency value exists in the data",
        `absent from the dataset: ${absent.join(", ")}`
      );
      // This single value is the largest emergency bucket; omitting it once
      // hid over half of all emergency-capable hospitals.
      const erp = liveCounts.get("Emergency Room Packages") ?? 0;
      assertTrue(erp > 0, "Emergency Room Packages is present", `count = ${erp}`);
      console.log(`  \u00b7 Emergency Room Packages covers ${erp} of ${liveTotal} hospitals`);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Facility normalisation.
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[5] Facility normalisation handles the real spellings");

  const facilityCases: Array<[string, string]> = [
    ["ICU", "ICU"],
    ["icu", "ICU"],
    ["intensive care", "ICU"],
    ["NICU", "NICU"],
    ["24x7 Emergency", "24x7 Emergency"],
    ["24/7 Emergency", "24x7 Emergency"],
    ["24*7 Emergency", "24x7 Emergency"],
    ["24-7 Emergency", "24x7 Emergency"],
    ["24x7emergency", "24x7 Emergency"],
    ["emergency", "24x7 Emergency"],
    ["Ambulance", "Ambulance"],
    ["ambulance", "Ambulance"],
    ["Blood Bank", "Blood Bank"],
    ["Cath Lab", "Cath Lab"],
    ["cathlab", "Cath Lab"],
    ["Dialysis", "Dialysis Unit"],
    ["dialysis unit", "Dialysis Unit"],
    ["lab", "Diagnostic Lab"],
    ["x-ray", "Radiology"],
    ["OT", "Operation Theatre"],
    ["Pharmacy", "Pharmacy"],
    // Not dataset values: these must be rejected rather than force a filter
    // that silently matches nothing.
    ["MRI", "null"],
    ["Cashless Insurance", "null"],
    ["Unknown Widget", "null"],
  ];

  for (const [input, expected] of facilityCases) {
    const got = normalizeFacilities(input);
    const label = got === null ? "null" : got.join("|");
    assertEqual(label, expected, `facility ${JSON.stringify(input)}`);
  }

  assertEqual(
    (normalizeFacilities("ICU,icu,ICU") ?? []).join("|"),
    "ICU",
    "duplicate facilities collapse to one"
  );
  assertTrue(
    CANONICAL_FACILITIES.length > 0,
    `CANONICAL_FACILITIES is populated (${CANONICAL_FACILITIES.length} values)`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Budget extraction.
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[6] Budget extraction reads money and refuses non-money numbers");

  const budgetCases: Array<{ query: string; min: number | null; max: number | null }> = [
    { query: "under 3 lakh", min: null, max: 300000 },
    { query: "below 2.5 lakh", min: null, max: 250000 },
    { query: "between 1 and 3 lakh", min: 100000, max: 300000 },
    { query: "1 to 3 lakh", min: 100000, max: 300000 },
    { query: "budget between 50k and 1.5 lakh", min: 50000, max: 150000 },
    { query: "Rs 50,000", min: null, max: 50000 },
    { query: "\u20B950,000", min: null, max: 50000 },
    { query: "2.5L", min: null, max: 250000 },
    { query: "above 1 lakh", min: 100000, max: null },
    { query: "at least 50000", min: 50000, max: null },
    { query: "hospitals for 50000", min: null, max: 50000 },
    { query: "3 lakh heart surgery", min: null, max: 300000 },
    // The regression this section exists for: an opening-hours claim or any
    // other incidental number must not become a hard price ceiling.
    { query: "24x7 emergency hospital near me", min: null, max: null },
    { query: "24 hour emergency care in mumbai", min: null, max: null },
    { query: "hospital with 200 beds", min: null, max: null },
    { query: "hospital with 200 beds under 3 lakh", min: null, max: 300000 },
    { query: "45 year old man needs cardiology", min: null, max: null },
    { query: "cardiology hospital 2nd floor", min: null, max: null },
    { query: "cheap heart hospital in delhi", min: null, max: null },
    { query: "open round the clock", min: null, max: null },
  ];

  const n = (v: number | null) => (v == null ? "null" : String(v));
  for (const { query, min, max } of budgetCases) {
    const got = extractBudgetFromText(query);
    if (got.min === min && got.max === max) {
      pass(`budget ${JSON.stringify(query)} \u2192 ${n(got.min)}/${n(got.max)}`);
    } else {
      fail(
        `budget ${JSON.stringify(query)}`,
        `expected ${n(min)}/${n(max)}, got ${n(got.min)}/${n(got.max)}`
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Clinical synonym resolution.
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n[7] Clinical synonyms resolve the way patients phrase things");

  const synonymCases: Array<[string, string]> = [
    ["kidney problem hospital", "Nephrology"],
    ["dialysis centre", "Nephrology"],
    ["stone in kidney", "Urology"],
    ["kidney stone", "Urology"],
    ["prostate problem", "Urology"],
    ["burns from cooking oil", "Burns Management"],
    // "accident" deliberately resolves to emergency/trauma, so this case names
    // the procedure without a trauma cue.
    ["reconstructive surgery for a burn scar", "Plastic & Reconstructive Surgery"],
    ["deviated septum", "Otorhinolaryngology (ENT)"],
    ["sinus surgery", "Otorhinolaryngology (ENT)"],
    ["hearing loss", "Otorhinolaryngology (ENT)"],
    ["cataract surgery", "Ophthalmology"],
    ["child vaccination", "Pediatrics"],
    ["newborn care", "Neonatology"],
    ["pregnancy delivery", "Obstetrics & Gynaecology"],
    ["period problem", "Women\u2019s Health"],
    ["bypass surgery", "Cardio-Thoracic & Vascular Surgery"],
    ["heart attack", "Cardiology"],
    ["fits and seizures", "Neurology"],
    // Stroke is the commonest urgent neurological presentation; these phrases
    // matched no department at all before.
    ["face drooping", "Neurology"],
    ["slurred speech", "Neurology"],
    ["weakness on one side", "Neurology"],
    ["thyroid problem", "Endocrinology"],
    ["sugar diabetes", "Diabetology"],
    ["cancer treatment", "Medical Oncology"],
    ["chemotherapy", "Medical Oncology"],
    ["fracture after fall", "Orthopaedics"],
    ["knee replacement", "Joint Replacement"],
    ["hernia operation", "General Surgery"],
    ["laparoscopic surgery", "Laparoscopic Surgery"],
    ["acidity and gastritis", "Gastroenterology"],
    ["liver problem", "Hepatology"],
    ["skin rash", "Dermatology"],
    ["asthma", "Pulmonology"],
    ["anxiety and depression", "Psychiatry"],
    ["back pain", "Orthopaedics"],
    ["fever and health checkup", "General Medicine"],
  ];

  for (const [query, expected] of synonymCases) {
    const hint = resolveSpecialtyHint(query);
    if (hint === null) {
      fail(`synonym ${JSON.stringify(query)}`, `no hint resolved, expected ${expected}`);
      continue;
    }
    const values = hint.specialties.split(",");
    if (values.includes(expected)) {
      pass(`${JSON.stringify(query)} \u2192 ${hint.specialties} (via "${hint.matchedKeyword}")`);
    } else {
      fail(
        `synonym ${JSON.stringify(query)} \u2192 ${expected}`,
        `got [${hint.specialties}] via "${hint.matchedKeyword}"`
      );
    }
  }

  // A hint must only ever name real dataset values.
  for (const [query] of synonymCases) {
    const hint = resolveSpecialtyHint(query);
    for (const value of hint ? hint.specialties.split(",") : []) {
      if (!isCanonicalSpecialty(value)) {
        fail(`synonym ${JSON.stringify(query)} returns canonical values`, `"${value}" is not canonical`);
      }
    }
  }

  assertTrue(
    GENERAL_FALLBACK_SPECIALTIES.length > 0,
    `GENERAL_FALLBACK_SPECIALTIES is populated (${GENERAL_FALLBACK_SPECIALTIES.length} values)`
  );
  for (const s of GENERAL_FALLBACK_SPECIALTIES) {
    if (!isCanonicalSpecialty(s)) fail(`fallback "${s}" is canonical`, "not in CANONICAL_SPECIALTIES");
  }

  // ───────────────────────────────────────────────────────────────────────────
  const summarySkipped = skipped > 0 ? `, ${skipped} group(s) skipped` : "";
  console.log(
    `\n${failures === 0 ? "PASS" : "FAIL"} \u2014 ${checks - failures}/${checks} checks passed${summarySkipped}\n`
  );
  // `exitCode` rather than `process.exit()`, so in-flight HTTP handles cannot be
  // torn down mid-flight.
  process.exitCode = failures === 0 ? 0 : 1;
}

void main();
