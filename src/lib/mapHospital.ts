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
    city: row.city ?? null,
    state: row.state ?? null,
    pincode: row.pincode ?? null,
    address: row.address,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    specialties: row.specialties ?? [],
    procedures: row.procedures ?? [],
    costMin: row.cost_min ?? null,
    costMax: row.cost_max ?? null,
    currency: row.currency ?? "INR",
    facilities: row.facilities ?? [],
    accreditation: row.accreditation ?? [],
    pmjayEmpanelled: row.pmjay_empanelled,
    annualProcedureVolume: row.annual_procedure_volume ?? null,
    outcomeMetric: row.outcome_metric ?? null,
    icuBeds: row.icu_beds ?? null,
    sourceType: row.source_type,
    verificationStatus: row.verification_status,
    sourceUrl: row.source_url ?? null,
    lastVerified: row.last_verified ?? null,
    lastUpdated: row.last_updated,
    dataStatus: row.data_status,
    conditionTag: row.condition_tag ?? null,
    reviewStatus: row.review_status ?? "approved",
    phone: row.phone ?? null,
    facilityType: row.facility_type ?? null,
    dateOfEstablishment: row.date_of_establishment ?? null,
    successRates: row.success_rates ?? {},
  };
}
