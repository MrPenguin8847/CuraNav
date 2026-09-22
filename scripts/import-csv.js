#!/usr/bin/env node
/**
 * import-csv.js
 *
 * Reads all 8 NHA PMJAY CSV files from "Dataset csv files/",
 * normalises the varying column order, maps specialty codes,
 * deduplicates by facility_id, and generates:
 *   - mockHospitals.ts   (root)
 *   - Supabase/curanav_seed_data.sql
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CSV_DIR = path.join(ROOT, "Dataset csv files");

// ── Specialty code → human-readable name ──────────────────────────
const SPECIALTY_MAP = {
  PM: "Palliative Medicine",
  BM: "Burns Management",
  MC: "Cardiology",
  SV: "Cardio-Thoracic & Vascular Surgery",
  ER: "Emergency Room Packages",
  MG: "General Medicine",
  SG: "General Surgery",
  IN: "Interventional Neuroradiology",
  MO: "Medical Oncology",
  MM: "Mental Disorders Packages",
  MN: "Neo-natal Care",
  SN: "Neurosurgery",
  SO: "Obstetrics & Gynaecology",
  SE: "Ophthalmology",
  SM: "Oral & Maxillofacial Surgery",
  SB: "Orthopaedics",
  SL: "Otorhinolaryngology (ENT)",
  MP: "Paediatric Medical Management",
  SS: "Paediatric Surgery",
  SP: "Plastic & Reconstructive Surgery",
  ST: "Polytrauma",
  MR: "Radiation Oncology",
  SC: "Surgical Oncology",
  SU: "Urology",
  US: "Unspecified Surgical Package",
  ID: "Infectious Diseases",
  OT: "Organ/Tissue Transplant",
  IMP: "Implants",
  AS: "Ambulance Services",
  YG: "Yoga",
  ERRT: "Emergency Room Packages",
  CN: "Consultation",
  LB: "Laboratory Medicine",
  RI: "Radiology",
  PP: "Pulmonology",
  NM: "Nuclear Medicine",
  BY: "Biopsies",
  RP: "Interventional Radiology",
  CA: "Oncology Investigations",
  CT: "Chemotherapy",
  RT: "Radiotherapy",
  IT: "Radio-isotope Therapy",
  PT: "Physiotherapy",
  BT: "Behavioural Therapy",
  DI: "Dentistry",
  OP: "Ophthalmology",
  ENT: "ENT",
  CC: "Critical Care",
  BC: "Blood Component Charges",
  GP: "General Procedure",
  HN: "Head & Neck Surgery",
  SKN: "Skin",
  CD: "Cardiology",
  CV: "Cardiovascular & Cardiac Surgery",
  GS: "General Surgery",
  GM: "Medical Gastroenterology",
  AG: "Abdomen/GI Surgery",
  PS: "Paediatric Surgery",
  OG: "Obstetrics & Gynaecology",
  NU: "Nephrology & Urology",
  NI: "Neurology",
  NS: "Neuro-surgery",
  OR: "Orthopaedics",
  BP: "Burns & Plastic Surgery",
  HC: "Annual Health Check-up",
  WC: "Ward Charges",
  TMH: "Surgical Oncology",
  AY: "Ayurveda",
  NP: "Naturopathy",
  YGN: "Yoga & Naturopathy",
  UN: "Unani",
  SID: "Siddha",
};

// ── CSV parser (handles double-quoted fields with commas inside) ──
function parseCSVRow(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++; // skip opening quote
      let field = "";
      while (i < line.length) {
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          field += line[i];
          i++;
        }
      }
      fields.push(field);
      if (i < line.length && line[i] === ",") i++; // skip comma separator
    } else if (line[i] === ",") {
      fields.push("");
      i++;
    } else {
      let field = "";
      while (i < line.length && line[i] !== ",") {
        field += line[i];
        i++;
      }
      fields.push(field);
      if (i < line.length && line[i] === ",") i++;
    }
  }
  return fields;
}

// ── Column-index discovery ────────────────────────────────────────
function findColumnIndices(headerFields) {
  const idx = {};
  headerFields.forEach((col, i) => {
    const lc = col.toLowerCase().trim();
    if (lc === "facility_id" && idx.facility_id === undefined) idx.facility_id = i;
    else if (lc === "facility_name" && idx.facility_name === undefined) idx.facility_name = i;
    else if (lc === "facility_address" && idx.facility_address === undefined) idx.facility_address = i;
    else if (lc === "phone" && idx.phone === undefined) idx.phone = i;
    else if (lc === "facility_type" && idx.facility_type === undefined) idx.facility_type = i;
    else if (lc === "date_of_establishment" && idx.date_of_establishment === undefined) idx.date_of_establishment = i;
    else if (lc === "empanelment_year" && idx.empanelment_year === undefined) idx.empanelment_year = i;
    else if (lc.startsWith("specialities") && idx.specialities === undefined) idx.specialities = i;
    else if (lc === "srno" && idx.srno === undefined) idx.srno = i;
    else if (lc === "directions" && idx.directions === undefined) idx.directions = i;
    else if (lc === "phone2" && idx.phone2 === undefined) idx.phone2 = i;
  });
  return idx;
}

// ── Parse specialty codes string → array of readable names ────────
function parseSpecialties(raw) {
  if (!raw) return [];
  // Remove "...Read More" suffix
  const cleaned = raw.replace(/,?\s*\.\.\.Read More\s*/gi, "").trim();
  if (!cleaned) return [];
  const codes = cleaned.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  const names = codes.map((code) => SPECIALTY_MAP[code] || null).filter(Boolean);
  // Deduplicate (some codes map to same name, e.g. SG/GS → General Surgery)
  return [...new Set(names)];
}

// ── Clean address ─────────────────────────────────────────────────
function cleanAddress(raw) {
  if (!raw) return "";
  return raw.replace(/,\s*$/, "").replace(/\s+/g, " ").trim();
}

// ── Determine if facility_id indicates government (G) or private (P) ─
function isGovernment(facilityId) {
  // NHA facility IDs: HOSPXXGYYYYY (government) or HOSPXXPYYYYY (private)
  return /HOSP\d+G/i.test(facilityId);
}

// ── Main ──────────────────────────────────────────────────────────
function main() {
  const csvFiles = fs
    .readdirSync(CSV_DIR)
    .filter((f) => f.endsWith(".csv"))
    .sort();

  console.log(`Found ${csvFiles.length} CSV files in "${CSV_DIR}"\n`);

  const hospitals = [];
  const seenIds = new Set();

  for (const file of csvFiles) {
    const content = fs.readFileSync(path.join(CSV_DIR, file), "utf-8");
    // Handle both \r\n and \n line endings
    const lines = content.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
      console.warn(`  ⚠ Skipping ${file}: no data rows`);
      continue;
    }

    const headerFields = parseCSVRow(lines[0]);
    const idx = findColumnIndices(headerFields);

    console.log(`  📄 ${file}: ${lines.length - 1} data rows, ${headerFields.length} columns`);

    if (idx.facility_id === undefined || idx.facility_name === undefined) {
      console.warn(`    ⚠ Cannot find facility_id or facility_name columns, skipping`);
      continue;
    }

    for (let r = 1; r < lines.length; r++) {
      const fields = parseCSVRow(lines[r]);
      if (fields.length < 5) continue;

      const facilityId = (fields[idx.facility_id] || "").trim();
      if (!facilityId || !facilityId.startsWith("HOSP")) continue;
      if (seenIds.has(facilityId)) continue;
      seenIds.add(facilityId);

      const name = (fields[idx.facility_name] || "").trim();
      const address = cleanAddress(fields[idx.facility_address]);
      const phone = (fields[idx.phone] || "").trim();
      const facilityType = (fields[idx.facility_type] || "Hospital").trim();
      const specialties = parseSpecialties(fields[idx.specialities] || "");

      let dateEst = null;
      if (idx.date_of_establishment !== undefined) {
        const raw = (fields[idx.date_of_establishment] || "").trim();
        if (raw && raw !== "NA") dateEst = raw;
      }

      const gov = isGovernment(facilityId);

      hospitals.push({
        hospitalId: facilityId,
        name: name || "Unknown Facility",
        address: address || "",
        phone: phone || null,
        facilityType: facilityType || "Hospital",
        specialties,
        dateOfEstablishment: dateEst,
        pmjayEmpanelled: true, // all from NHA portal
        sourceType: "official",
        verificationStatus: gov ? "verified" : "pending",
        reviewStatus: "approved",
      });
    }
  }

  console.log(`\n✅ Parsed ${hospitals.length} unique hospitals\n`);

  // ── Generate mockHospitals.ts ─────────────────────────────────
  generateMockHospitalsTS(hospitals);

  // ── Generate curanav_seed_data.sql ────────────────────────────
  generateSeedSQL(hospitals);

  console.log("\n🎉 Done! Generated:");
  console.log("   • mockHospitals.ts");
  console.log("   • Supabase/curanav_seed_data.sql");
}

function escapeTS(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'");
}

function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

function generateMockHospitalsTS(hospitals) {
  let ts = `// CuraNav: Real hospital data from NHA PMJAY (hem.nha.gov.in)
// ${hospitals.length} records imported from CSV files on ${new Date().toISOString().slice(0, 10)}
// Source: National Health Authority – Health Empanelment Module
// All hospitals are PMJAY-empanelled facilities.

export type SourceType = 'official' | 'public' | 'synthetic';
export type VerificationStatus = 'verified' | 'pending' | 'simulated';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Hospital {
  hospitalId: string;
  name: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  specialties: string[];
  procedures: string[];
  costMin: number | null;
  costMax: number | null;
  currency: string;
  facilities: string[];
  accreditation: string[];
  pmjayEmpanelled: boolean;
  annualProcedureVolume: number | null;
  outcomeMetric: string | null;
  icuBeds: number | null;
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
  sourceUrl: string | null;
  lastVerified: string | null;
  lastUpdated: string;
  dataStatus: string;
  conditionTag: string | null;
  reviewStatus: ReviewStatus;
  phone: string | null;
  facilityType: string | null;
  dateOfEstablishment: string | null;
}

export const mockHospitals: Hospital[] = [\n`;

  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    const specsStr = h.specialties.map((s) => `"${escapeTS(s)}"`).join(", ");
    ts += `  {
    hospitalId: "${escapeTS(h.hospitalId)}",
    name: "${escapeTS(h.name)}",
    city: null,
    state: null,
    pincode: null,
    address: "${escapeTS(h.address)}",
    latitude: null,
    longitude: null,
    specialties: [${specsStr}],
    procedures: [],
    costMin: null,
    costMax: null,
    currency: "INR",
    facilities: [],
    accreditation: [],
    pmjayEmpanelled: ${h.pmjayEmpanelled},
    annualProcedureVolume: null,
    outcomeMetric: null,
    icuBeds: null,
    sourceType: "${h.sourceType}",
    verificationStatus: "${h.verificationStatus}",
    sourceUrl: "https://hem.nha.gov.in/search",
    lastVerified: null,
    lastUpdated: "${new Date().toISOString().slice(0, 10)}",
    dataStatus: "nha_pmjay_data",
    conditionTag: null,
    reviewStatus: "${h.reviewStatus}",
    phone: ${h.phone ? `"${escapeTS(h.phone)}"` : "null"},
    facilityType: ${h.facilityType ? `"${escapeTS(h.facilityType)}"` : "null"},
    dateOfEstablishment: ${h.dateOfEstablishment ? `"${escapeTS(h.dateOfEstablishment)}"` : "null"},
  }${i < hospitals.length - 1 ? "," : ""}\n`;
  }

  ts += `];\n`;

  fs.writeFileSync(path.join(ROOT, "mockHospitals.ts"), ts, "utf-8");
  console.log(`  ✅ mockHospitals.ts — ${hospitals.length} hospitals`);
}

function generateSeedSQL(hospitals) {
  const today = new Date().toISOString().slice(0, 10);

  let sql = `-- CuraNav: Real hospital data from NHA PMJAY (hem.nha.gov.in)
-- ${hospitals.length} records imported from CSV on ${today}
-- Run curanav_migration_real_data.sql BEFORE this file.

-- Clear previous data
DELETE FROM hospitals;

INSERT INTO hospitals (
  hospital_id, name, city, state, pincode, address, latitude, longitude,
  specialties, procedures, cost_min, cost_max, currency, facilities, accreditation,
  pmjay_empanelled, annual_procedure_volume, outcome_metric, icu_beds,
  source_type, verification_status, source_url, last_verified, last_updated,
  data_status, condition_tag, review_status, phone, facility_type, date_of_establishment
) VALUES\n`;

  for (let i = 0; i < hospitals.length; i++) {
    const h = hospitals[i];
    const specsArr = h.specialties.length > 0
      ? `ARRAY[${h.specialties.map((s) => `'${escapeSQL(s)}'`).join(",")}]`
      : "'{}'";

    sql += `  ('${escapeSQL(h.hospitalId)}', '${escapeSQL(h.name)}', NULL, NULL, NULL, '${escapeSQL(h.address)}', NULL, NULL, ${specsArr}, '{}', NULL, NULL, 'INR', '{}', '{}', TRUE, NULL, NULL, NULL, '${h.sourceType}', '${h.verificationStatus}', 'https://hem.nha.gov.in/search', NULL, '${today}', 'nha_pmjay_data', NULL, '${h.reviewStatus}', ${h.phone ? `'${escapeSQL(h.phone)}'` : "NULL"}, ${h.facilityType ? `'${escapeSQL(h.facilityType)}'` : "NULL"}, ${h.dateOfEstablishment ? `'${escapeSQL(h.dateOfEstablishment)}'` : "NULL"})${i < hospitals.length - 1 ? "," : ";"}\n`;
  }

  fs.writeFileSync(path.join(ROOT, "Supabase", "curanav_seed_data.sql"), sql, "utf-8");
  console.log(`  ✅ Supabase/curanav_seed_data.sql — ${hospitals.length} rows`);
}

main();
