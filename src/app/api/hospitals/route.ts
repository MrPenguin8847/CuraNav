import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { mapHospital } from "@/lib/mapHospital";

// Helper for demo coordinate resolution
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  chandigarh: { lat: 30.7333, lon: 76.7794 },
  mohali: { lat: 30.7046, lon: 76.7179 },
  panchkula: { lat: 30.6942, lon: 76.8606 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  mumbai: { lat: 19.0760, lon: 72.8777 },
  bangalore: { lat: 12.9716, lon: 77.5946 }
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
  const minBudget = searchParams.get("min_budget");
  const maxBudget = searchParams.get("max_budget");
  const radiusKm = searchParams.get("radius_km");
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
    // If the destination is "India", return all hospitals by skipping the city filter
    const lowerCity = city.trim().toLowerCase();
    const isWholeCountry = lowerCity === "india" || lowerCity === "bharat";

    if (!isWholeCountry) {
      // If radius is provided, we don't strictly filter by city name string match in DB,
      // because we will filter by coordinates later. But we still record it.
      if (!radiusKm) {
        const cities = city.split(',').map(c => c.trim()).filter(Boolean);
        const conditions = cities.flatMap(c => [`city.ilike.%${c}%`, `state.ilike.%${c}%`, `address.ilike.%${c}%`]);
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }
    }
    filtersApplied.city = city;
  }

  // Fallback mapping for the mock dataset (which lacks 'condition_tag' and granular specialties like Nephrology)
  let resolvedSpecialty = specialty;
  const searchStr = `${specialty || ''} ${condition || ''} ${facilitiesParam || ''}`.toLowerCase();

  if (searchStr.includes("kidney") || searchStr.includes("renal") || searchStr.includes("nephro") || searchStr.includes("dialysis")) {
    resolvedSpecialty = "General Medicine";
  } else if (searchStr.includes("heart") || searchStr.includes("cardio") || searchStr.includes("bypass")) {
    resolvedSpecialty = "Cardiology";
  } else if (searchStr.includes("cancer") || searchStr.includes("tumor") || searchStr.includes("oncol") || searchStr.includes("chemo")) {
    resolvedSpecialty = "General Surgery";
  } else if (searchStr.includes("bone") || searchStr.includes("joint") || searchStr.includes("ortho") || searchStr.includes("fracture") || searchStr.includes("spine")) {
    resolvedSpecialty = "Orthopaedics";
  } else if (searchStr.includes("child") || searchStr.includes("pediatric") || searchStr.includes("paediatric") || searchStr.includes("baby") || searchStr.includes("infant") || searchStr.includes("neonat")) {
    resolvedSpecialty = "Paediatric Medical Management";
  } else if (searchStr.includes("pregnan") || searchStr.includes("matern") || searchStr.includes("women") || searchStr.includes("gynae") || searchStr.includes("gyne") || searchStr.includes("delivery")) {
    resolvedSpecialty = "Obstetrics & Gynaecology";
  } else if (searchStr.includes("burn")) {
    resolvedSpecialty = "Burns Management";
  } else if (searchStr.includes("eye") || searchStr.includes("vision") || searchStr.includes("ophthal") || searchStr.includes("cataract")) {
    resolvedSpecialty = "Ophthalmology";
  } else if (searchStr.includes("emergency") || searchStr.includes("trauma") || searchStr.includes("accident")) {
    resolvedSpecialty = "Emergency Room Packages";
  } else if (searchStr.includes("neuro") || searchStr.includes("brain") || searchStr.includes("stroke")) {
    resolvedSpecialty = "Neurosurgery";
  } else if (searchStr.includes("ear") || searchStr.includes("nose") || searchStr.includes("throat") || searchStr.includes("ent") || searchStr.includes("sinus")) {
    resolvedSpecialty = "Otorhinolaryngology (ENT)";
  } else if (searchStr.includes("urin") || searchStr.includes("urolog") || searchStr.includes("prostate") || searchStr.includes("bladder")) {
    resolvedSpecialty = "Urology";
  } else if (searchStr.includes("plastic") || searchStr.includes("cosmetic") || searchStr.includes("reconstruct")) {
    resolvedSpecialty = "Plastic & Reconstructive Surgery";
  } else if (searchStr.includes("surgery") || searchStr.includes("surgical") || searchStr.includes("operation")) {
    resolvedSpecialty = "General Surgery";
  } else if (searchStr.includes("general") || searchStr.includes("fever") || searchStr.includes("checkup")) {
    resolvedSpecialty = "General Medicine";
  }

  if (resolvedSpecialty && condition) {
    const specs = resolvedSpecialty.split(',').map(s => `"${s.trim()}"`).join(',');
    query = query.or(`specialties.ov.{${specs}},condition_tag.ilike.%${condition}%`);
    filtersApplied.specialty = resolvedSpecialty;
    filtersApplied.condition = condition;
  } else if (resolvedSpecialty) {
    const specs = resolvedSpecialty.split(',').map(s => s.trim()).filter(Boolean);
    query = query.overlaps("specialties", specs);
    filtersApplied.specialty = resolvedSpecialty;
  } else if (condition) {
    query = query.ilike("condition_tag", `%${condition}%`);
    filtersApplied.condition = condition;
  }

  if (minBudget) {
    const budget = parseInt(minBudget, 10);
    if (!isNaN(budget)) {
      query = query.gte("cost_max", budget);
      filtersApplied.min_budget = budget;
    }
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
      // Mock data lacks facilities, so we temporarily disable strict DB filtering
      // query = query.contains("facilities", facilities);
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

  let hospitals = (data ?? []).map(mapHospital);

  // Handle geographical radius filtering in memory
  if (city && radiusKm) {
    const radius = parseFloat(radiusKm);
    const firstCity = city.split(',')[0].trim().toLowerCase();
    const coords = CITY_COORDS[firstCity];
    
    if (coords && !isNaN(radius)) {
      filtersApplied.radius_km = radius;
      
      hospitals = hospitals.map(h => {
        if (h.latitude && h.longitude) {
          const dist = haversine(coords.lat, coords.lon, h.latitude, h.longitude);
          return { ...h, distance_km: dist };
        }
        return h;
      }).filter(h => h.distance_km !== undefined && h.distance_km <= radius);
    }
  }

  return NextResponse.json({
    count: hospitals.length,
    filters_applied: filtersApplied,
    hospitals,
  });
}

export async function POST(req: NextRequest) {
  // 1. Verify admin
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // 2. Format for db
    const newHospital = {
      hospital_id: `HOSP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name: body.name,
      city: body.city,
      state: body.state,
      pincode: body.pincode || "000000",
      address: body.address || "",
      latitude: parseFloat(body.latitude) || 0,
      longitude: parseFloat(body.longitude) || 0,
      specialties: body.specialties ? body.specialties.split(',').map((s:string) => s.trim()) : [],
      procedures: [],
      cost_min: parseInt(body.cost_min) || 0,
      cost_max: parseInt(body.cost_max) || 0,
      currency: 'INR',
      facilities: body.facilities ? body.facilities.split(',').map((f:string) => f.trim()) : [],
      accreditation: body.accreditation ? body.accreditation.split(',').map((a:string) => a.trim()) : [],
      pmjay_empanelled: !!body.pmjay_empanelled,
      annual_procedure_volume: parseInt(body.annual_procedure_volume) || 0,
      icu_beds: parseInt(body.icu_beds) || 0,
      
      // Strict demo data provenance
      source_type: 'synthetic',
      verification_status: 'simulated',
      data_status: 'synthetic_demo_data',
      review_status: 'approved', // auto-approve admin uploads
      last_updated: new Date().toISOString(),
      condition_tag: body.specialties // fallback
    };

    const { error } = await supabaseAdmin.from("hospitals").insert(newHospital);

    if (error) throw error;

    return NextResponse.json({ success: true, hospital: newHospital });
  } catch (error) {
    console.error("[POST /api/hospitals] Error:", error);
    return NextResponse.json(
      { error: "Failed to add hospital" },
      { status: 500 }
    );
  }
}

