import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { mapHospital } from "@/lib/mapHospital";
import {
  normalizeExplicitSpecialty,
  normalizeFacilities,
  resolveSpecialtyHint,
} from "@/lib/specialties";

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
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
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

  const filtersApplied: Record<string, string | number | boolean | string[]> =
    {};

  // Reusable query builder so the relaxed radius fallback can re-apply the same
  // specialty/condition/budget filters without the city-name text match.
  const buildQuery = () => {
    let q = supabaseAdmin.from("hospitals").select("*");

    // Only show approved hospitals unless accessing as admin
    if (!isAdmin) {
      q = q.eq("review_status", "approved");
    }

    if (resolvedSpecialty && condition) {
      const specs = resolvedSpecialty.split(',').map(s => `"${s.trim()}"`).join(',');
      q = q.or(`specialties.ov.{${specs}},condition_tag.ilike.%${condition}%`);
    } else if (resolvedSpecialty) {
      const specs = resolvedSpecialty.split(',').map(s => s.trim()).filter(Boolean);
      q = q.overlaps("specialties", specs);
    } else if (condition) {
      q = q.ilike("condition_tag", `%${condition}%`);
    }

    if (minBudget) {
      let budget = parseInt(minBudget, 10);
      const mStr = minBudget.toLowerCase();
      if (mStr.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/)) {
        budget = Math.round(parseFloat(mStr.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/)![1]) * 100000);
      } else if (mStr.match(/(\d+(?:\.\d+)?)\s*k\b/)) {
        budget = Math.round(parseFloat(mStr.match(/(\d+(?:\.\d+)?)\s*k\b/)![1]) * 1000);
      }

      if (!isNaN(budget)) {
        q = q.gte("cost_max", budget);
        filtersApplied.min_budget = budget;
      }
    }

    if (maxBudget) {
      let budget = parseInt(maxBudget, 10);
      const mStr = maxBudget.toLowerCase();
      if (mStr.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/)) {
        budget = Math.round(parseFloat(mStr.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/)![1]) * 100000);
      } else if (mStr.match(/(\d+(?:\.\d+)?)\s*k\b/)) {
        budget = Math.round(parseFloat(mStr.match(/(\d+(?:\.\d+)?)\s*k\b/)![1]) * 1000);
      }

      if (!isNaN(budget)) {
        // Also match PMJAY hospitals where cost is subsidized (often null cost_min)
        q = q.or(`cost_min.lte.${budget},pmjay_empanelled.eq.true`);
        filtersApplied.max_budget = budget;
      }
    }

    if (verifiedOnly) {
      q = q.eq("verification_status", "verified");
      filtersApplied.verified_only = true;
    }

    return q;
  };

  // Fallback mapping so natural-language terms resolve to real dataset
  // specialties. An explicit `specialty` param is trusted as-is when every
  // comma-separated part already exists in the dataset, so callers such as the
  // symptom checker are never clobbered by the fuzzy hints below.
  const explicitSpecialty = normalizeExplicitSpecialty(specialty);
  let resolvedSpecialty = explicitSpecialty ?? specialty;
  if (!explicitSpecialty) {
    const searchStr = `${specialty || ""} ${condition || ""} ${facilitiesParam || ""}`.toLowerCase();
    resolvedSpecialty = resolveSpecialtyHint(searchStr) ?? specialty;
  }

  let query = buildQuery();

  if (city) {
    // If the destination is "India", return all hospitals by skipping the city filter
    const lowerCity = city.trim().toLowerCase();
    const isWholeCountry = lowerCity === "india" || lowerCity === "bharat";

    if (!isWholeCountry && !radiusKm && !latParam && !lonParam) {
      // Smarter location matching: ignore stop words and match any significant word
      const stopWords = ["in", "near", "at", "of", "the", "city", "village", "town", "district"];
      const locationWords = city
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));

      if (locationWords.length > 0) {
        const conditions = locationWords.flatMap(w => [
          `city.ilike.%${w}%`,
          `state.ilike.%${w}%`,
          `address.ilike.%${w}%`
        ]);
        query = query.or(conditions.join(','));
      } else {
        // Fallback to exact match if only short words
        query = query.or(`city.ilike.%${city.trim()}%,state.ilike.%${city.trim()}%,address.ilike.%${city.trim()}%`);
      }
    }
    filtersApplied.city = city;
  }

  if (resolvedSpecialty) {
    filtersApplied.specialty = resolvedSpecialty;
  }
  if (condition) {
    filtersApplied.condition = condition;
  }

  const facilities = normalizeFacilities(facilitiesParam);
  if (facilities) {
    // Only apply the filter when every requested value exists in the dataset,
    // so we never report a filter as applied that silently did nothing.
    if (facilities.length > 0) {
      query = query.contains("facilities", facilities);
      filtersApplied.facilities = facilities;
    }
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
  let coords: { lat: number; lon: number } | null = null;
  const radius = radiusKm ? parseFloat(radiusKm) : 50; // default 50km radius for coord search

  if (latParam && lonParam) {
    coords = { lat: parseFloat(latParam), lon: parseFloat(lonParam) };
  } else if (city) {
    const firstCity = city.split(',')[0].trim().toLowerCase();
    coords = CITY_COORDS[firstCity] ?? null;
  }

  if (coords && !isNaN(coords.lat) && !isNaN(coords.lon) && !isNaN(radius)) {
    filtersApplied.radius_km = radius;
    
    hospitals = hospitals.map(h => {
      if (h.latitude && h.longitude) {
        const dist = haversine(coords!.lat, coords!.lon, h.latitude, h.longitude);
        return { ...h, distance_km: dist };
      }
      return h;
    }).filter(h => h.distance_km !== undefined && h.distance_km <= radius);
  }

  // ── Relaxed radius fallback ──────────────────────────────────────────────
  // When the strict search (city-name text match + specialty/budget filters)
  // returns 0 results for a location-based query, re-search around the city
  // coordinates WITHOUT the city-name text match but WITH the other filters.
  // This surfaces nearby regional hospitals that actually match the condition
  // (e.g. kidney hospitals in Ludhiana/Jalandhar for a Chandigarh search) and
  // also covers cities already present in CITY_COORDS.
  if (hospitals.length === 0 && city) {
    if (!coords || Number.isNaN(coords.lat) || Number.isNaN(coords.lon)) {
      try {
        const geocodeRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=in`,
          { headers: { "User-Agent": "CuraNav/1.0 (https://curanav.vercel.app)" } }
        );
        if (geocodeRes.ok) {
          const geocodeData = await geocodeRes.json();
          if (Array.isArray(geocodeData) && geocodeData.length > 0) {
            const geoLat = parseFloat(geocodeData[0].lat);
            const geoLon = parseFloat(geocodeData[0].lon);

            if (!isNaN(geoLat) && !isNaN(geoLon)) {
              coords = { lat: geoLat, lon: geoLon };
            }
          }
        }
      } catch {
        // Geocoding failed silently — return empty results
      }
    }

    if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
      // Wider regional radius so nearby district hospitals still appear
      const geoRadius = radiusKm ? parseFloat(radiusKm) : 150;
      if (!isNaN(geoRadius) && geoRadius > 0) {
        const retryQuery = buildQuery()
          .order("verification_status", { ascending: true })
          .order("cost_min", { ascending: true });

        const { data: retryData } = await retryQuery;
        if (retryData && retryData.length > 0) {
          hospitals = retryData.map(mapHospital).map(h => {
            if (h.latitude && h.longitude) {
              const dist = haversine(coords!.lat, coords!.lon, h.latitude, h.longitude);
              return { ...h, distance_km: dist };
            }
            return h;
          }).filter(h => h.distance_km !== undefined && h.distance_km <= geoRadius);

          if (hospitals.length > 0) {
            filtersApplied.geocoded = true;
            filtersApplied.radius_km = geoRadius;
          }
        }
      }
    }
  }

  // ── Sort: nearest-first when we have coordinates, else by success rate ────
  if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
    // Show the nearest hospitals at the top ("near me" / radius searches)
    hospitals.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
  } else if (resolvedSpecialty) {
    const targetSpecs = resolvedSpecialty.split(',').map(s => s.trim()).filter(Boolean);
    if (targetSpecs.length > 0) {
      hospitals.sort((a, b) => {
        const maxRateA = Math.max(0, ...targetSpecs.map(spec => a.successRates?.[spec] ?? 0));
        const maxRateB = Math.max(0, ...targetSpecs.map(spec => b.successRates?.[spec] ?? 0));
        if (maxRateB !== maxRateA) {
          return maxRateB - maxRateA; // descending
        }
        return 0;
      });
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

