import { Hospital } from "./mockHospitals";

/**
 * Maps a raw Supabase DB row (snake_case columns matching curanav_schema.sql)
 * to the Hospital TypeScript shape used throughout the app.
 *
 * This is the single point of translation between the DB and UI layers.
 * If the DB schema changes, update this file only.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHospital(row: Record<string, any>): Hospital {
  return {
    hospitalId: row.hospital_id,
    name: row.name,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    specialties: row.specialties ?? [],
    procedures: row.procedures ?? [],
    costMin: row.cost_min,
    costMax: row.cost_max,
    currency: row.currency ?? "INR",
    facilities: row.facilities ?? [],
    accreditation: row.accreditation ?? [],
    pmjayEmpanelled: row.pmjay_empanelled,
    annualProcedureVolume: row.annual_procedure_volume ?? 0,
    outcomeMetric: row.outcome_metric ?? "",
    icuBeds: row.icu_beds ?? 0,
    sourceType: row.source_type,
    verificationStatus: row.verification_status,
    sourceUrl: row.source_url ?? null,
    lastVerified: row.last_verified ?? null,
    lastUpdated: row.last_updated,
    dataStatus: row.data_status,
    conditionTag: row.condition_tag ?? "",
    reviewStatus: row.review_status ?? "approved", // fallback to approved if not present in DB
  };
}
