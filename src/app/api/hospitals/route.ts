import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { mapHospital } from "@/lib/mapHospital";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  hasExactMatches,
  scoreAll,
  sortHospitalsByRelevance,
  type MatchStage,
} from "@/lib/hospitalRelevance";
import { normalizeExplicitSpecialty, normalizeFacilities } from "@/lib/specialties";

// Approximate centroids for every city in KNOWN_CITIES. Used for in-memory
// radius filtering before falling back to Nominatim geocoding.
// shortcut: coordinates are city centroids (~1-2 km accuracy), sufficient for
// haversine distance filtering; upgrade to PostGIS if sub-km precision matters.
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  ambala:          { lat: 30.3782, lon: 76.7767 },
  amritsar:        { lat: 31.6340, lon: 74.8723 },
  "bawani khera":  { lat: 29.5900, lon: 75.8500 },
  bharatpur:       { lat: 27.2152, lon: 77.4900 },
  bhilwara:        { lat: 25.3500, lon: 74.6300 },
  bhiwani:         { lat: 28.7975, lon: 76.1322 },
  bilaspur:        { lat: 31.3390, lon: 76.7540 },
  chamba:          { lat: 32.5534, lon: 76.1258 },
  chandigarh:      { lat: 30.7333, lon: 76.7794 },
  "charkhi dadri": { lat: 28.5921, lon: 76.2699 },
  chowari:         { lat: 32.4500, lon: 76.1000 },
  deorala:         { lat: 27.9300, lon: 75.2000 },
  delhi:           { lat: 28.7041, lon: 77.1025 },
  dharamsala:      { lat: 32.2190, lon: 76.3234 },
  faridabad:       { lat: 28.4089, lon: 77.3178 },
  fatehabad:       { lat: 29.5163, lon: 75.4536 },
  ghumarwin:       { lat: 31.4500, lon: 76.7100 },
  hamirpur:        { lat: 31.6858, lon: 76.5215 },
  hoshiarpur:      { lat: 31.5143, lon: 75.9115 },
  jaipur:          { lat: 26.9124, lon: 75.7873 },
  jalandhar:       { lat: 31.3260, lon: 75.5762 },
  jammu:           { lat: 32.7266, lon: 74.8570 },
  jodhpur:         { lat: 26.2389, lon: 73.0243 },
  keylong:         { lat: 32.5800, lon: 77.0350 },
  kota:            { lat: 25.2138, lon: 75.8648 },
  kullu:           { lat: 31.9574, lon: 77.1096 },
  loharu:          { lat: 28.4400, lon: 75.8100 },
  ludhiana:        { lat: 30.9010, lon: 75.8573 },
  mandi:           { lat: 31.7080, lon: 76.9320 },
  nahan:           { lat: 30.5600, lon: 77.2970 },
  naraingarh:      { lat: 30.4500, lon: 77.1000 },
  nurpur:          { lat: 32.2942, lon: 75.8896 },
  palampur:        { lat: 32.1100, lon: 76.5400 },
  rampur:          { lat: 31.4500, lon: 77.6300 },
  ratia:           { lat: 29.6900, lon: 75.5800 },
  "reckong-peo":   { lat: 31.9200, lon: 78.2000 },
  shimla:          { lat: 31.1048, lon: 77.1734 },
  siwani:          { lat: 29.0900, lon: 76.0300 },
  solan:           { lat: 30.9100, lon: 77.0950 },
  srinagar:        { lat: 34.0837, lon: 74.7973 },
  sundernagar:     { lat: 31.5300, lon: 76.8900 },
  tohana:          { lat: 29.7000, lon: 75.9000 },
  tosham:          { lat: 28.8800, lon: 75.9200 },
  udaipur:         { lat: 24.5854, lon: 73.7125 },
  una:             { lat: 31.4700, lon: 76.2700 },
  // legacy aliases kept for backwards compat
  mohali:          { lat: 30.7046, lon: 76.7179 },
  panchkula:       { lat: 30.6942, lon: 76.8606 },
  mumbai:          { lat: 19.0760, lon: 72.8777 },
  bangalore:       { lat: 12.9716, lon: 77.5946 },
};

/** Nominatim is a free public service; never let it hold the response open. */
const GEOCODE_TIMEOUT_MS = 3_000;

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
 * Parses a budget param that may be a plain number ("50000") or a human amount
 * ("3 lakh", "50k"). Returns null when it is not a number at all, so an
 * unparseable value never becomes a filter that quietly empties the results.
 */
function parseBudgetParam(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.trim().toLowerCase().match(/(\d+(?:\.\d+)?)\s*(lakh|lac|l|k)?/);
  if (!m) return null;
  const amount = parseFloat(m[1]);
  if (!Number.isFinite(amount)) return null;
  if (m[2] === "k") return Math.round(amount * 1000);
  if (m[2]) return Math.round(amount * 100000);
  return Math.round(amount);
}

/**
 * GET /api/hospitals
 *
 * Query params (all optional):
 *   city           — matched against city/state/address (case-insensitive)
 *   specialty      — comma-separated; normalised to real dataset values
 *   condition      — matched against condition_tag (case-insensitive substring)
 *   min_budget     — hospitals where cost_max >= min_budget
 *   max_budget     — hospitals where cost_min <= max_budget, or PM-JAY empanelled
 *   facilities     — comma-separated list; each must be in facilities[]
 *   verified_only  — "true" to restrict to verification_status = 'verified'
 *   sort           — "match" (default) | "cost" | "distance"
 *
 * Returns: { count, filters_applied, relaxed, stage, hospitals, match_reasons }
 *
 * `relaxed` is true when a filter could not be satisfied and the results were
 * broadened rather than emptied. The client surfaces that as a visible notice
 * instead of showing a bare zero-result page.
 */
export async function GET(req: NextRequest) {
  // ── Rate limiting: 60 requests / minute per IP ───────────────────────────
  const ip = getClientIp(req);
  const limit = rateLimit(`hospitals-get:${ip}`, { max: 60, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before searching again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { searchParams } = req.nextUrl;

  const city = searchParams.get("city");
  const specialty = searchParams.get("specialty");
  const condition = searchParams.get("condition");
  const minBudgetRaw = searchParams.get("min_budget");
  const maxBudgetRaw = searchParams.get("max_budget");
  const radiusKm = searchParams.get("radius_km");
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const facilitiesParam = searchParams.get("facilities");
  const verifiedOnly = searchParams.get("verified_only") === "true";
  const sortParam = searchParams.get("sort") ?? "match";

  // ── Admin access: ALWAYS verify session server-side; never trust a query param ──
  // The ?admin=true param is only a *request* for admin mode — the actual
  // decision is made by inspecting the Supabase session here.
  let isAdmin = false;
  if (searchParams.get("admin") === "true") {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    isAdmin = true;
  }

  const filtersApplied: Record<string, string | number | boolean | string[]> = {};
  const notes: string[] = [];

  // ── Specialty resolution ─────────────────────────────────────────────────
  // An unrecognised specialty used to be forwarded to `overlaps()` verbatim,
  // which matched nothing and returned an empty list with no explanation. Now an
  // unresolved value simply stops being a filter, and the result is ranked.
  const explicitSpecialty = normalizeExplicitSpecialty(specialty);
  const resolvedSpecialty = explicitSpecialty;
  if (specialty && !resolvedSpecialty) {
    notes.push(
      `"${specialty}" is not an indexed specialty, so it was not used as a filter; results are ranked by related clinical services.`
    );
  }

  const specialtyList = resolvedSpecialty
    ? resolvedSpecialty.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  if (resolvedSpecialty) {
    filtersApplied.specialty = specialtyList;
  }

  const minBudget = parseBudgetParam(minBudgetRaw);
  const maxBudget = parseBudgetParam(maxBudgetRaw);

  // `normalizeFacilities` returns null when nothing the user asked for exists in
  // the dataset. In that case the filter is skipped and the omission is
  // reported, rather than applied as a no-op that empties the results.
  const facilities = normalizeFacilities(facilitiesParam);
  if (facilities && facilities.length > 0) {
    filtersApplied.facilities = facilities;
  } else if (facilitiesParam) {
    notes.push(
      `None of the requested facilities (${facilitiesParam}) are recorded in our dataset, so that filter was skipped.`
    );
  }

  // Reusable query builder so the relaxed radius fallback can re-apply the same
  // specialty/condition/budget filters without the city-name text match.
  const buildQuery = (options: { includeCity: boolean; cityText: string | null }) => {
    let q = supabaseAdmin.from("hospitals").select("*");

    // Only show approved hospitals unless accessing as admin
    if (!isAdmin) {
      q = q.eq("review_status", "approved");
    }

    if (specialtyList.length > 0 && condition) {
      const specs = specialtyList.map((s) => `"${s}"`).join(",");
      q = q.or(`specialties.ov.{${specs}},condition_tag.ilike.%${condition}%`);
    } else if (specialtyList.length > 0) {
      q = q.overlaps("specialties", specialtyList);
    } else if (condition) {
      q = q.ilike("condition_tag", `%${condition}%`);
    }

    if (facilities && facilities.length > 0) {
      // `contains` with an array on a text[] column means "contains all", which
      // is the semantics a user ticking three boxes expects.
      q = q.contains("facilities", facilities);
    }

    if (minBudget != null) {
      q = q.gte("cost_max", minBudget);
      filtersApplied.min_budget = minBudget;
    }

    if (maxBudget != null) {
      // Also match PMJAY hospitals where cost is subsidized (often null cost_min)
      q = q.or(`cost_min.lte.${maxBudget},pmjay_empanelled.eq.true`);
      filtersApplied.max_budget = maxBudget;
    }

    if (verifiedOnly) {
      q = q.eq("verification_status", "verified");
      filtersApplied.verified_only = true;
    }

    if (options.includeCity && options.cityText) {
      // Smarter location matching: ignore stop words and match any significant word
      const stopWords = ["in", "near", "at", "of", "the", "city", "village", "town", "district"];
      const locationWords = options.cityText
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((w) => w.length > 2 && !stopWords.includes(w));

      if (locationWords.length > 0) {
        const conditions = locationWords.flatMap((w) => [
          `city.ilike.%${w}%`,
          `state.ilike.%${w}%`,
          `address.ilike.%${w}%`
        ]);
        q = q.or(conditions.join(","));
      } else {
        // Fallback to exact match if only short words
        const t = options.cityText.trim();
        q = q.or(`city.ilike.%${t}%,state.ilike.%${t}%,address.ilike.%${t}%`);
      }
    }

    return q;
  };

  const useCityFilter = Boolean(
    city && !radiusKm && !latParam && !lonParam && !isWholeCountry(city)
  );

  const orderAndRun = async (includeCity: boolean) => {
    const q = buildQuery({ includeCity, cityText: city })
      .order("verification_status", { ascending: true })
      .order("cost_min", { ascending: true });
    return await q;
  };

  let { data, error } = await orderAndRun(useCityFilter);

  if (error) {
    console.error("[GET /api/hospitals] Supabase error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch hospitals", detail: error.message },
      { status: 500 }
    );
  }

  let hospitals = (data ?? []).map(mapHospital);

  if (city && !isWholeCountry(city)) {
    filtersApplied.city = city;
  }
  if (condition) {
    filtersApplied.condition = condition;
  }

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
  let relaxed = false;
  if (hospitals.length === 0 && city && !isWholeCountry(city)) {
    if (!coords || Number.isNaN(coords.lat) || Number.isNaN(coords.lon)) {
      // Geocode with a hard deadline: a stalled Nominatim used to hang the whole
      // request until the platform killed the function.
      try {
        const geocodeRes = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=in`,
          { headers: { "User-Agent": "CuraNav/1.0 (https://curanav.vercel.app)" } },
          GEOCODE_TIMEOUT_MS
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
        // Geocoding unavailable — keep the empty result and say so.
        notes.push(`We could not look up the coordinates for ${city} right now.`);
      }
    }

    if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
      // Wider regional radius so nearby district hospitals still appear
      const geoRadius = radiusKm ? parseFloat(radiusKm) : 150;
      if (!isNaN(geoRadius) && geoRadius > 0) {
        const { data: retryData, error: retryError } = await orderAndRun(false);
        if (retryError) {
          console.error("[GET /api/hospitals] relaxed query error:", retryError.message);
        }
        if (retryData && retryData.length > 0) {
          hospitals = retryData.map(mapHospital).map(h => {
            if (h.latitude && h.longitude) {
              const dist = haversine(coords!.lat, coords!.lon, h.latitude, h.longitude);
              return { ...h, distance_km: dist };
            }
            return h;
          }).filter(h => h.distance_km !== undefined && h.distance_km <= geoRadius);

          if (hospitals.length > 0) {
            relaxed = true;
            filtersApplied.radius_km = geoRadius;
            notes.push(
              `No hospital matched in ${city} itself, so we widened the search to within ${geoRadius} km.`
            );
          }
        }
      }
    }
  }

  // ── Ranking ──────────────────────────────────────────────────────────────
  // Ranking always runs, even when the database already filtered, because the
  // score doubles as the "why am I seeing this" explanation.
  const relevance = scoreAll(hospitals, {
    specialties: specialtyList,
    minBudget,
    maxBudget,
  });

  let stage: MatchStage = specialtyList.length === 0 ? "unfiltered" : "exact";
  if (specialtyList.length > 0 && !hasExactMatches(relevance)) {
    const anyRelated = [...relevance.values()].some((r) => r.stage === "related");
    stage = anyRelated ? "related" : "unfiltered";
  }

  if (sortParam === "cost") {
    hospitals = [...hospitals].sort((a, b) => {
      const av = typeof a.costMin === "number" ? a.costMin : Infinity;
      const bv = typeof b.costMin === "number" ? b.costMin : Infinity;
      return av - bv;
    });
  } else if (sortParam === "distance" && coords) {
    // Show the nearest hospitals at the top ("near me" / radius searches)
    hospitals = [...hospitals].sort(
      (a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)
    );
  } else {
    hospitals = sortHospitalsByRelevance(hospitals, relevance);
  }

  const matchReasons: Record<string, { score: number; stage: MatchStage; explanation: string }> = {};
  for (const hospital of hospitals) {
    const rel = relevance.get(hospital.hospitalId);
    if (rel) {
      matchReasons[hospital.hospitalId] = {
        score: rel.score,
        stage: rel.stage,
        explanation: rel.explanation,
      };
    }
  }

  return NextResponse.json({
    count: hospitals.length,
    filters_applied: filtersApplied,
    relaxed,
    stage,
    notes,
    match_reasons: matchReasons,
    hospitals,
  });
}

function isWholeCountry(city: string): boolean {
  const lower = city.trim().toLowerCase();
  return lower === "india" || lower === "bharat";
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

