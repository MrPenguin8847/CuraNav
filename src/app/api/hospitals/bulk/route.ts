import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

// Helper to safely parse string to array
const parseArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    // If it looks like a JSON array string "['A', 'B']" or '["A", "B"]'
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        // Papaparse might give us Python-style arrays if the CSV had them. 
        // We do a quick replace of single quotes to double quotes for JSON.parse
        const jsonStr = val.replace(/'/g, '"');
        return JSON.parse(jsonStr);
      } catch (e) {
        // Fallback to split
      }
    }
    // Fallback to comma separated
    return val.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { hospitals } = await req.json();

    if (!Array.isArray(hospitals) || hospitals.length === 0) {
      return NextResponse.json({ error: "No hospitals provided" }, { status: 400 });
    }

    // Map CSV rows to our database schema
    const rowsToInsert = hospitals.map((row: any, index: number) => {
      // Create a normalized object with lowercase keys to easily map standard vs NHA CSV formats
      const normalized: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[key.toLowerCase().trim()] = value;
      }

      // Generate a unique ID if one doesn't exist
      const hospitalId = 
        normalized.hospital_id || 
        normalized.id || 
        `HOSP_CSV_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${index}`;

      return {
        hospital_id: hospitalId,
        name: normalized.name || normalized['hospital name'] || "Unknown Hospital",
        city: normalized.city || normalized['district name'] || null,
        state: normalized.state || normalized['state name'] || null,
        pincode: normalized.pincode || null,
        address: normalized.address || normalized['hospital address'] || [normalized.city, normalized.state].filter(Boolean).join(", ") || "Address not provided",
        latitude: parseFloat(normalized.latitude) || null,
        longitude: parseFloat(normalized.longitude) || null,
        specialties: parseArray(normalized.specialties || normalized['specialities empaneled']),
        procedures: parseArray(normalized.procedures),
        cost_min: parseInt(normalized.cost_min) || null,
        cost_max: parseInt(normalized.cost_max) || null,
        currency: normalized.currency || "INR",
        facilities: parseArray(normalized.facilities),
        accreditation: parseArray(normalized.accreditation),
        pmjay_empanelled: normalized.pmjay_empanelled === "true" || normalized.pmjay_empanelled === true || !!normalized['hospital type'],
        annual_procedure_volume: parseInt(normalized.annual_procedure_volume) || null,
        outcome_metric: parseFloat(normalized.outcome_metric) || null,
        icu_beds: parseInt(normalized.icu_beds) || null,
        source_type: normalized.source_type || "csv_upload",
        verification_status: normalized.verification_status || "official",
        source_url: normalized.source_url || null,
        condition_tag: normalized.condition_tag || null,
        review_status: normalized.review_status || "approved", // auto-approve admin uploads by default
        phone: normalized.phone || normalized['contact number'] || null,
        facility_type: normalized.facility_type || normalized['hospital type'] || null,
        date_of_establishment: normalized.date_of_establishment || null,
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
  } catch (error: any) {
    console.error("[POST /api/hospitals/bulk] Catch error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
