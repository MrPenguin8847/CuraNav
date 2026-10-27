import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CANONICAL_SPECIALTIES, normalizeExplicitSpecialty } from "@/lib/specialties";

/**
 * GET /api/stats
 *
 * Returns live platform statistics computed from Supabase, so every number on
 * the homepage is derived from the database and cannot silently go stale.
 *
 * The filter must match `/api/hospitals` exactly, and the column is easy to get
 * wrong because the table has two independent status columns:
 *
 *   review_status       — the editorial gate. approved | rejected.
 *                         `/api/hospitals` returns only `approved`, so this does
 *                         too: advertising 275 when search can only reach 271 is
 *                         the exact over-claim this endpoint exists to avoid.
 *   verification_status — data provenance. verified | pending | simulated.
 *                         This is reported separately as `verifiedCount` and
 *                         `statusCounts`. It has no `approved` value, so
 *                         filtering on it returns zero rows and blanks the
 *                         homepage.
 */
export async function GET() {
  try {
    const { data: hospitals, error } = await supabaseAdmin
      .from("hospitals")
      .select("specialties, pmjay_empanelled, cost_min, cost_max, accreditation, verification_status, outcome_metric, city, state, review_status")
      .eq("review_status", "approved");

    if (error) throw error;

    const totalHospitals = hospitals?.length ?? 0;

    // Unique specialties across all hospitals
    const allSpecialties = new Set<string>();
    // Per-hospital set of raw values, so a hospital that lists both
    // "Orthopaedics" and "Orthopedics" still counts once.
    const specialtySetsByHospital = (hospitals ?? []).map((h) => {
      const values = (h.specialties ?? []) as string[];
      values.forEach((v) => allSpecialties.add(v));
      return new Set(values.map((v) => v.trim().toLowerCase()));
    });

    // How many approved hospitals can serve each canonical specialty.
    //
    // Counting is done through `normalizeExplicitSpecialty` so spelling
    // variants collapse into one number: a card linking to both
    // "Obstetrics & Gynaecology" and "Obstetrics & Gynecology" shows the number
    // of hospitals offering that care, not the number spelling it one way.
    const specialtyCounts: Record<string, number> = {};
    for (const canonical of CANONICAL_SPECIALTIES) {
      const variants = new Set(
        (normalizeExplicitSpecialty(canonical) ?? canonical)
          .split(",")
          .map((v) => v.trim().toLowerCase())
      );
      specialtyCounts[canonical] = specialtySetsByHospital.filter((set) =>
        [...variants].some((v) => set.has(v))
      ).length;
    }

    // Only report specialties that exist in the data, so the number on the page
    // matches something a user can actually search for.
    const coveredSpecialties = CANONICAL_SPECIALTIES.filter((s) => specialtyCounts[s] > 0);

    const allCities = new Set<string>();
    hospitals?.forEach((h) => {
      if (h.city) allCities.add(h.city);
    });

    const pmjayCount = hospitals?.filter((h) => h.pmjay_empanelled).length ?? 0;
    const withCostData = hospitals?.filter((h) => h.cost_min != null).length ?? 0;
    const withAccreditation = hospitals?.filter(
      (h) => h.accreditation && h.accreditation.length > 0
    ).length ?? 0;
    const verifiedCount = hospitals?.filter((h) => h.verification_status === "verified").length ?? 0;
    const withOutcomes = hospitals?.filter((h) => h.outcome_metric != null).length ?? 0;

    const statusCounts = hospitals?.reduce<Record<string, number>>((acc, h) => {
      const key = h.verification_status ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      totalHospitals,
      totalSpecialties: coveredSpecialties.length,
      specialties: coveredSpecialties,
      specialtyCounts,
      totalCities: allCities.size,
      cities: Array.from(allCities).sort(),
      pmjayEmpanelled: pmjayCount,
      withCostData,
      withAccreditation,
      verifiedCount,
      withOutcomes,
      // Surfaced so the UI can be honest about how much of the index is
      // machine-generated rather than human-verified.
      statusCounts,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/stats] Error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
