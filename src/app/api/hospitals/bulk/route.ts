import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/** Maximum number of hospitals accepted in a single bulk upload. */
const MAX_BULK_SIZE = 200;

// Helper to safely parse a value to a string array.
const parseArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return (val as unknown[]).map(String);
  if (typeof val === "string") {
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        const jsonStr = val.replace(/'/g, '"');
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // Fallback to split
      }
    }
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

export async function POST(req: NextRequest) {
  // ── Rate limiting: 10 bulk uploads per hour per IP ──────────────────────
  const ip = getClientIp(req);
  const limit = rateLimit(`hospitals-bulk:${ip}`, { max: 10, windowMs: 60 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many bulk upload requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = (await req.json()) as { hospitals?: unknown };
    const hospitals = body.hospitals;

    if (!Array.isArray(hospitals) || hospitals.length === 0) {
      return NextResponse.json({ error: "No hospitals provided" }, { status: 400 });
    }

    if (hospitals.length > MAX_BULK_SIZE) {
      return NextResponse.json(
        { error: `Bulk upload is limited to ${MAX_BULK_SIZE} hospitals per request.` },
        { status: 400 }
      );
    }

    // Map CSV rows to our database schema
    const rowsToInsert = hospitals.map((row: unknown, index: number) => {
      const rawRow = row as Record<string, unknown>;
      // Create a normalized object with lowercase keys
      const normalized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        normalized[key.toLowerCase().trim()] = value;
      }

      const str = (v: unknown): string | null =>
        typeof v === "string" && v.trim() ? v.trim() : null;
      const num = (v: unknown): number | null => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      // Generate a unique ID if one doesn't exist
      const hospitalId =
        str(normalized.hospital_id) ||
        str(normalized.id) ||
        `HOSP_CSV_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${index}`;

      return {
        hospital_id: hospitalId,
        name: str(normalized.name) || str(normalized["hospital name"]) || "Unknown Hospital",
        city: str(normalized.city) || str(normalized["district name"]),
        state: str(normalized.state) || str(normalized["state name"]),
        pincode: str(normalized.pincode),
        address:
          str(normalized.address) ||
          str(normalized["hospital address"]) ||
          [str(normalized.city), str(normalized.state)].filter(Boolean).join(", ") ||
          "Address not provided",
        latitude: num(normalized.latitude),
        longitude: num(normalized.longitude),
        specialties: parseArray(normalized.specialties || normalized["specialities empaneled"]),
        procedures: parseArray(normalized.procedures),
        cost_min: num(normalized.cost_min),
        cost_max: num(normalized.cost_max),
        currency: str(normalized.currency) || "INR",
        facilities: parseArray(normalized.facilities),
        accreditation: parseArray(normalized.accreditation),
        pmjay_empanelled:
          normalized.pmjay_empanelled === "true" ||
          normalized.pmjay_empanelled === true ||
          !!normalized["hospital type"],
        annual_procedure_volume: num(normalized.annual_procedure_volume),
        outcome_metric: num(normalized.outcome_metric),
        icu_beds: num(normalized.icu_beds),
        source_type: str(normalized.source_type) || "csv_upload",
        // CSV uploads come from admins but treat as pending so a second admin can approve.
        verification_status: str(normalized.verification_status) || "official",
        source_url: str(normalized.source_url),
        condition_tag: str(normalized.condition_tag),
        review_status: "pending", // require explicit approval even for admin CSV uploads
        phone: str(normalized.phone) || str(normalized["contact number"]),
        facility_type: str(normalized.facility_type) || str(normalized["hospital type"]),
        date_of_establishment: str(normalized.date_of_establishment),
      };
    });

    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .insert(rowsToInsert)
      .select("hospital_id");

    if (error) {
      console.error("[POST /api/hospitals/bulk] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/hospitals/bulk] Catch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
