/**
 * src/lib/mockHospitals.ts
 *
 * This file now re-exports the canonical Hospital type and constants from
 * the root mockHospitals.ts. It is kept as an import shim so that any
 * remaining references to "@/lib/mockHospitals" continue to resolve.
 *
 * The `mockHospitals` array (raw data) is intentionally NOT re-exported here
 * because all pages now fetch from /api/hospitals instead.
 *
 * Only the TypeScript types and the `FACILITY_ICONS`-adjacent helpers are
 * exported so child components (HospitalCard, VerificationBadge, etc.) stay
 * typed correctly without touching the data array.
 */

// Re-export the real types from the root file so every import of
// "@/lib/mockHospitals" picks up the new camelCase field names.
export type { Hospital, SourceType, VerificationStatus, ReviewStatus } from "../../mockHospitals";
