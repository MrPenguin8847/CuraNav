import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { mapHospital } from "@/lib/mapHospital";

/**
 * GET /api/hospitals
 *
 * Query params (all optional):
 *   city           — exact match (case-insensitive)
 *   specialty      — array contains match against specialties[]
 *   condition      — matched against condition_tag (case-insensitive substring)
 *   max_budget     — hospitals where cost_min <= max_budget
 *   facilities     — comma-separated list; each must be in facilities[]
 *   verified_only  — "true" to restrict to verification_status = 'verified'
 *
 * Returns: { count: number, filters_applied: object, hospitals: Hospital[] }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const city = searchParams.get("city");
  const specialty = searchParams.get("specialty");
  const condition = searchParams.get("condition");
  const maxBudget = searchParams.get("max_budget");
  const facilitiesParam = searchParams.get("facilities");
  const verifiedOnly = searchParams.get("verified_only") === "true";
  const isAdmin = searchParams.get("admin") === "true";

  if (isAdmin) {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
  }

  let query = supabaseAdmin.from("hospitals").select("*");

  // Only show approved hospitals unless accessing as admin
  if (!isAdmin) {
    query = query.eq("review_status", "approved");
  }

  const filtersApplied: Record<string, string | number | boolean | string[]> =
    {};

  if (city) {
    query = query.ilike("city", city);
    filtersApplied.city = city;
  }

  if (specialty) {
    query = query.contains("specialties", [specialty]);
    filtersApplied.specialty = specialty;
  }

  if (condition) {
    query = query.ilike("condition_tag", `%${condition}%`);
    filtersApplied.condition = condition;
  }

  if (maxBudget) {
    const budget = parseInt(maxBudget, 10);
    if (!isNaN(budget)) {
      query = query.lte("cost_min", budget);
      filtersApplied.max_budget = budget;
    }
  }

  if (facilitiesParam) {
    const facilities = facilitiesParam
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    if (facilities.length > 0) {
      query = query.contains("facilities", facilities);
      filtersApplied.facilities = facilities;
    }
  }

  if (verifiedOnly) {
    query = query.eq("verification_status", "verified");
    filtersApplied.verified_only = true;
  }

  // Default ordering: verification confidence first, then cost ascending
  query = query
    .order("verification_status", { ascending: true })
    .order("cost_min", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/hospitals] Supabase error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch hospitals", detail: error.message },
      { status: 500 }
    );
  }

  const hospitals = (data ?? []).map(mapHospital);

  return NextResponse.json({
    count: hospitals.length,
    filters_applied: filtersApplied,
    hospitals,
  });
}
