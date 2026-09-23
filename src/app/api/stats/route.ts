import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/stats
 *
 * Returns live, real-time platform statistics computed from Supabase.
 * Every stat on the homepage is derived from this single endpoint,
 * so adding a hospital to the DB automatically updates the website.
 */
export async function GET() {
  try {
    // Fetch all hospitals (select only the columns we need for stats)
    const { data: hospitals, error } = await supabaseAdmin
      .from("hospitals")
      .select("specialties, pmjay_empanelled, cost_min, cost_max, accreditation, verification_status, outcome_metric, city, state");

    if (error) throw error;

    const totalHospitals = hospitals?.length ?? 0;

    // Unique specialties across all hospitals
    const allSpecialties = new Set<string>();
    hospitals?.forEach((h) => {
      (h.specialties ?? []).forEach((s: string) => allSpecialties.add(s));
    });

    // Unique cities (non-null only)
    const allCities = new Set<string>();
    hospitals?.forEach((h) => {
      if (h.city) allCities.add(h.city);
    });

    // PMJAY empanelled count
    const pmjayCount = hospitals?.filter((h) => h.pmjay_empanelled).length ?? 0;

    // Hospitals with cost data
    const withCostData = hospitals?.filter((h) => h.cost_min != null).length ?? 0;

    // Hospitals with accreditation
    const withAccreditation = hospitals?.filter(
      (h) => h.accreditation && h.accreditation.length > 0
    ).length ?? 0;

    // Verified hospitals
    const verifiedCount = hospitals?.filter(
      (h) => h.verification_status === "verified"
    ).length ?? 0;

    // Hospitals with outcome metrics
    const withOutcomes = hospitals?.filter(
      (h) => h.outcome_metric != null
    ).length ?? 0;

    return NextResponse.json({
      totalHospitals,
      totalSpecialties: allSpecialties.size,
      specialties: Array.from(allSpecialties).sort(),
      totalCities: allCities.size,
      cities: Array.from(allCities).sort(),
      pmjayEmpanelled: pmjayCount,
      withCostData,
      withAccreditation,
      verifiedCount,
      withOutcomes,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/stats] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
