import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import {
  KNOWN_CITIES,
  KNOWN_CITY_KEYS,
  buildSearchIntent,
  buildTransparencyNotices,
  extractBudgetFromText,
  intentToChips,
  resolveSpecialtyField,
  type RawExtraction,
} from "@/lib/searchIntent";
import { CANONICAL_SPECIALTIES, resolveSpecialtyFromText } from "@/lib/specialties";

/**
 * Natural-language search structuring.
 *
 * Two things this route used to do badly, and both showed up as "the search
 * spinner never stops":
 *
 * 1. No deadline anywhere. Up to four providers, each with four attempts, each
 *    with an unbounded `fetch` and backoff sleeps between them. A provider that
 *    accepted the connection and stalled could hold the request open for
 *    minutes, and the browser waited the whole time. There is now one total
 *    budget for the whole waterfall, plus a per-request timeout, so the route
 *    always answers.
 *
 * 2. The local fallback was wrong about clinical specialties. It mapped kidney
 *    disease to "General Medicine" and cancer to "General Surgery", and knew
 *    only 5 of the 45 cities in the dataset. Those wrong values were then used
 *    as hard database filters, which is why some searches returned nothing.
 *    The local layer is now built on the shared synonym list, and it always
 *    runs — as a floor the model output has to beat, not just a last resort.
 */

/** Total budget for the entire provider waterfall. */
const TOTAL_BUDGET_MS = 6_000;
/** Per-request timeout inside the waterfall. */
const PROVIDER_TIMEOUT_MS = 4_000;
/** One retry, not three: a slow provider should not consume the whole budget. */
const RETRY_DELAYS = [400];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class JsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JsonParseError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** True once we learn the log table is absent, so we stop retrying every query. */
let searchLogUnavailable = false;

/* ── Model helpers ──────────────────────────────────────────────────────────── */

function parseModelJson(content: string): unknown {
  let cleaned = content.trim();

  if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const truncated = content.length > 200 ? `${content.slice(0, 200)}…` : content;
    console.error(`[AI Parser] Invalid JSON. Snippet: ${truncated}`);
    throw new JsonParseError("Model returned malformed JSON");
  }
}

/**
 * Coerces whatever the model produced into a `RawExtraction`. Anything missing
 * or the wrong type becomes null rather than failing the whole request — a
 * partially-valid extraction is far more useful to the user than an error.
 */
function coerceExtraction(data: unknown): RawExtraction {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Root response must be an object");
  }
  const root = data as Record<string, unknown>;
  const f = (root.filters ?? root) as Record<string, unknown>;
  if (typeof f !== "object" || f === null) {
    throw new ValidationError("Missing or invalid 'filters' object");
  }

  const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

  return {
    condition: str(f.condition),
    specialty: str(f.specialty),
    city: str(f.city),
    radius_km: num(f.radius_km),
    min_budget: num(f.min_budget),
    max_budget: num(f.max_budget),
    facilities: str(f.facilities) ?? (Array.isArray(f.facilities) ? f.facilities.filter((x): x is string => typeof x === "string") : null),
    sort_by: str(f.sort_by),
    fallback_cities: Array.isArray(f.fallback_cities)
      ? f.fallback_cities.filter((x): x is string => typeof x === "string")
      : [],
  };
}

/** The indexed specialty vocabulary, injected into the prompt. */
const CANONICAL_PROMPT = CANONICAL_SPECIALTIES.join(" | ");

const SYSTEM_PROMPT = `You are a JSON extraction engine for a hospital search system. Given a user query, extract the search parameters.

REQUIREMENTS:
1. Return ONLY valid JSON.
2. Do not return explanations, conversational text, or markdown code blocks.
3. Do not add extra fields to the JSON.
4. Use exactly \`null\` when information is not specified.
5. Never invent information the user did not state. If they did not name a city, city must be null.

Extract:
- condition: the medical condition or disease (e.g. "kidney disease"). Null if none.
- specialty: the medical specialty. Prefer one of these indexed values when the query clearly indicates one: ${CANONICAL_PROMPT}. If none fits, use the closest clinical term. Null only if the query is not about a medical condition.
- city: the city mentioned (e.g. "Chandigarh"). Null if none.
- radius_km: the explicit distance radius in kilometers (e.g. "within 20 km" -> 20). Null if no explicit radius. Do not invent a radius for "near me".
- fallback_cities: an array of 2-3 nearby major cities or districts geographically close to 'city'. Empty array if none.
- min_budget: the minimum budget in Indian Rupees (INR) as an integer (e.g. "between 1 and 3 lakh" -> 100000). Null if none.
- max_budget: the maximum budget in INR as an integer (e.g. "under 2 lakh" -> 200000). Null if none.
- facilities: comma separated list (e.g. "Dialysis Unit,ICU"). Null if none.
- sort_by: one of "match", "cost", "distance", "verified". Default "match".

EXPECTED JSON SCHEMA:
{
  "filters": {
    "condition": string | null,
    "specialty": string | null,
    "city": string | null,
    "radius_km": number | null,
    "fallback_cities": string[],
    "min_budget": number | null,
    "max_budget": number | null,
    "facilities": string | null,
    "sort_by": string | null
  }
}`;

/* ── Providers ──────────────────────────────────────────────────────────────── */

interface Provider {
  name: string;
  type: "openai-compatible" | "gemini";
  key: string;
  baseUrl: string;
  model: string;
  headers: Record<string, string>;
}

async function callOpenAiCompatible(
  provider: Provider,
  query: string,
  remainingMs: () => number
): Promise<RawExtraction> {
  const lastError: unknown[] = [];

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    // Never start an attempt we cannot finish inside the total budget.
    const budget = Math.min(PROVIDER_TIMEOUT_MS, remainingMs());
    if (budget <= 500) break;

    try {
      const res = await fetchWithTimeout(
        `${provider.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.key}`,
            "Content-Type": "application/json",
            ...provider.headers,
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: query },
            ],
            response_format: { type: "json_object" },
            temperature: 0,
            max_tokens: 300,
          }),
        },
        budget
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${provider.name} HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`${provider.name} returned an empty response`);

      return coerceExtraction(parseModelJson(content));
    } catch (err) {
      // A malformed answer is a bug in that provider, not a transient fault.
      if (err instanceof JsonParseError || err instanceof ValidationError) throw err;
      lastError.push(err);
      if (attempt < RETRY_DELAYS.length) await sleep(RETRY_DELAYS[attempt]);
    }
  }

  throw new Error(
    `${provider.name} failed: ${lastError[lastError.length - 1] instanceof Error ? (lastError[lastError.length - 1] as Error).message : "unknown error"}`
  );
}

async function callGemini(
  provider: Provider,
  query: string,
  remainingMs: () => number
): Promise<RawExtraction> {
  const schema = {
    type: Type.OBJECT,
    properties: {
      filters: {
        type: Type.OBJECT,
        properties: {
          condition: { type: Type.STRING, nullable: true },
          specialty: { type: Type.STRING, nullable: true },
          city: { type: Type.STRING, nullable: true },
          radius_km: { type: Type.INTEGER, nullable: true },
          fallback_cities: { type: Type.ARRAY, items: { type: Type.STRING } },
          min_budget: { type: Type.INTEGER, nullable: true },
          max_budget: { type: Type.INTEGER, nullable: true },
          facilities: { type: Type.STRING, nullable: true },
          sort_by: { type: Type.STRING, nullable: true },
        },
      },
    },
  };

  // The SDK has no signal option, so bound it with a race. The timer is always
  // cleared, otherwise every call would keep the process alive for 4s.
  const ai = new GoogleGenAI({ apiKey: provider.key });
  // shortcut: timer must stay in the outer scope; if it moves into the try block
  // the finally clause can no longer clear it on a network error.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const work = ai.models.generateContent({
      model: provider.model,
      contents: `${SYSTEM_PROMPT}\n\nUser Query: "${query}"`,
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    const guard = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${provider.name} exceeded ${PROVIDER_TIMEOUT_MS}ms`)),
        Math.max(500, Math.min(PROVIDER_TIMEOUT_MS, remainingMs()))
      );
    });
    const response = await Promise.race([work, guard]);
    return coerceExtraction(parseModelJson(response.text || "{}"));
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ── Local extraction (always runs) ─────────────────────────────────────────── */

// KNOWN_CITY_KEYS is imported from searchIntent — don't rebuild it here.
// Pre-compile the per-city word-boundary regexes once so localExtract doesn't
// recompile 45 patterns on every request.
const CITY_PATTERNS: readonly [RegExp, string][] = KNOWN_CITIES.map((c) => [
  new RegExp(`\\b${c.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`),
  c,
]);

const RADIUS_RE = /within\s*(\d+)\s*(km|kilometre|kilometer)/i;
const NEARBY_RE = /\b(near me|nearby|closest|nearest|around me|in my area)\b/i;
const CHEAP_RE = /\b(cheapest|affordable|lowest cost|least expensive|budget friendly)\b/i;
const CLOSE_RE = /\b(closest|nearest|nearby|near me|by distance)\b/i;
const VERIFIED_RE = /\b(verified|trustworthy|reliable hospital|nabh)\b/i;

/**
 * Deterministic extraction from the shared synonym list.
 *
 * Always executed, never only on failure. The result is the floor: any field the
 * model fails to produce — or produces unusably — falls back to this.
 */
function localExtract(query: string): RawExtraction {
  const q = query.toLowerCase();

  const hint = resolveSpecialtyFromText(query);
  const specialty = hint ? hint.specialties : null;

  let condition: string | null = null;
  if (specialty) {
    condition = hint ? hint.label : null;
  }

  // City: only cities we actually have hospitals in are worth filtering on.
  let city: string | null = null;
  for (const [re, canonical] of CITY_PATTERNS) {
    if (re.test(q)) { city = canonical; break; }
  }

  const radiusMatch = q.match(RADIUS_RE);

  const budget = extractBudgetFromText(query);

  const facilities: string[] = [];
  const facilityWords: Array<[RegExp, string]> = [
    [/\b(icu|intensive care)\b/, "ICU"],
    [/\b(nicu|neonatal intensive care|newborn intensive)\b/, "NICU"],
    [/\b(dialysis|renal machine)\b/, "Dialysis Unit"],
    [/\b(ambulance)\b/, "Ambulance"],
    [/\b(blood bank)\b/, "Blood Bank"],
    [/\b(cath lab|catheterisation lab|catheterization lab)\b/, "Cath Lab"],
    [/\b(pharmacy|medicine store)\b/, "Pharmacy"],
    [/\b(mri|ct scan|x-?ray|radiolog|imaging)\b/, "Radiology"],
    [/\b(24x7 emergency|24\/7 emergency|emergency room)\b/, "24x7 Emergency"],
    [/\b(operation theatre|operating theatre|ot facility|theatre)\b/, "Operation Theatre"],
  ];
  for (const [re, facility] of facilityWords) {
    if (re.test(q)) facilities.push(facility);
  }

  let sort_by: string | null = null;
  if (CLOSE_RE.test(q)) sort_by = "distance";
  else if (CHEAP_RE.test(q)) sort_by = "cost";
  else if (VERIFIED_RE.test(q)) sort_by = "verified";

  return {
    condition,
    specialty,
    city,
    radius_km: radiusMatch ? parseInt(radiusMatch[1], 10) : null,
    min_budget: budget.min,
    max_budget: budget.max,
    facilities: facilities.length > 0 ? facilities.join(",") : null,
    sort_by,
    fallback_cities: [],
  };
}

/**
 * Merges model output over the local floor.
 *
 * A model field only wins when it is usable: a specialty that reduces to a real
 * dataset value, a non-empty string, a real number. A model that answers
 * "kidney transplant" for a specialty must not be able to override a synonym
 * list that already knows where to look.
 */
function mergeExtraction(local: RawExtraction, model: RawExtraction | null): RawExtraction {
  if (!model) return { ...local, usedLocalFallback: true };

  const specialty = (() => {
    const fromModel = resolveSpecialtyField(model.specialty, "model");
    if (fromModel.value && fromModel.confidence !== "low") {
      return { specialty: fromModel.value };
    }
    const fromLocal = resolveSpecialtyField(local.specialty, "synonym");
    return fromLocal.value
      ? { specialty: fromLocal.value }
      : model.specialty
        ? { specialty: model.specialty }
        : {};
  })();

  return {
    condition: model.condition ?? local.condition,
    specialty: specialty.specialty ?? local.specialty ?? null,
    city: model.city ?? local.city,
    radius_km: model.radius_km ?? local.radius_km,
    min_budget: model.min_budget ?? local.min_budget,
    max_budget: model.max_budget ?? local.max_budget,
    facilities: model.facilities ?? local.facilities,
    sort_by: model.sort_by ?? local.sort_by,
    fallback_cities: model.fallback_cities?.length ? model.fallback_cities : local.fallback_cities,
    usedLocalFallback: false,
  };
}

/* ── Query logging (best effort) ────────────────────────────────────────────── */

/**
 * Records the queries we could not confidently structure, so the synonym list
 * can be extended from real usage rather than guesswork.
 *
 * Best effort by design: a missing table must never fail a patient search, and
 * once we know the table is absent we stop attempting it for the lifetime of the
 * instance rather than paying a failed round-trip per query.
 */
async function logUnresolvedQuery(payload: {
  query: string;
  specialty: string | null;
  specialtyConfidence: string;
  specialtyReason: string;
  location: string | null;
  extractor: string;
  notices: string[];
}): Promise<void> {
  if (searchLogUnavailable) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const { error } = await supabaseAdmin.from("search_queries_log").insert({
      query: payload.query.slice(0, 500),
      specialty: payload.specialty,
      specialty_confidence: payload.specialtyConfidence,
      specialty_reason: payload.specialtyReason.slice(0, 500),
      location: payload.location,
      extractor: payload.extractor,
      notices: payload.notices,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // 42P01 = undefined_table, PGRST205 = table not exposed via PostgREST.
      const missing =
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        /does not exist|not found/i.test(error.message);
      if (missing) {
        searchLogUnavailable = true;
        console.warn(
          "[search-log] `search_queries_log` table not found; query logging disabled for this instance."
        );
      } else {
        console.warn(`[search-log] insert failed: ${error.message}`);
      }
    }
  } catch (err) {
    console.warn(`[search-log] insert threw: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/* ── Main handler ───────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  const startedAt = Date.now();

  // ── Rate limiting: 20 requests / minute per IP ───────────────────────────
  const ip = getClientIp(req);
  const limit = rateLimit(`nl-search:${ip}`, { max: 20, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before searching again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = (await req.json()) as { query?: unknown; locationContext?: unknown };
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const locationContext =
      typeof body.locationContext === "string" && body.locationContext.trim()
        ? body.locationContext.trim()
        : null;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    if (query.length > 500) {
      return NextResponse.json({ error: "Query is too long" }, { status: 400 });
    }

    const deadline = startedAt + TOTAL_BUDGET_MS;
    const remainingMs = () => deadline - Date.now();

    // The model sees the consented location so it can resolve "near me".
    const fullQuery = locationContext
      ? `${query} (The user's detected location is ${locationContext}. Resolve "near me"/"nearby" to that city.)`
      : query;

    const providers = collectProviders();

    let modelExtraction: RawExtraction | null = null;
    let extractor = "local rule engine";

    for (const provider of providers) {
      if (remainingMs() <= 800) {
        console.warn(`[NL] Budget exhausted before trying ${provider.name}; using local extraction.`);
        break;
      }
      try {
        modelExtraction =
          provider.type === "gemini"
            ? await callGemini(provider, fullQuery, remainingMs)
            : await callOpenAiCompatible(provider, fullQuery, remainingMs);
        extractor = provider.name;
        break;
      } catch (err) {
        if (err instanceof JsonParseError || err instanceof ValidationError) {
          console.warn(`[NL] ${provider.name} returned unusable JSON; trying next provider.`);
          continue;
        }
        console.warn(
          `[NL] ${provider.name} failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const local = localExtract(query);
    const raw = mergeExtraction(local, modelExtraction);

    const intent = buildSearchIntent(
      { query, locationContext, extractor },
      raw
    );
    const notices = buildTransparencyNotices(query, intent);

    // Only bother logging the queries worth learning from.
    if (intent.specialty.confidence === "low" || intent.specialty.confidence === "none") {
      void logUnresolvedQuery({
        query,
        specialty: intent.specialty.value,
        specialtyConfidence: intent.specialty.confidence,
        specialtyReason: intent.specialty.reason,
        location: intent.location.value,
        extractor,
        notices: notices.map((n) => n.id),
      });
    }

    return NextResponse.json({
      intent,
      chips: intentToChips(intent),
      notices,
      explanation: {
        query,
        extractor,
        usedLocalFallback: !modelExtraction,
        wantsNearby: intent.wantsNearby || NEARBY_RE.test(query),
        elapsed_ms: Date.now() - startedAt,
      },
    });
  } catch (error) {
    console.error("[NL] Fatal error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}

function collectProviders(): Provider[] {
  const providers: Provider[] = [];

  // Single pass over process.env — three separate loops did the same work 3×.
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (key.startsWith("GROQ_API_KEY")) {
      providers.push({ name: key, type: "openai-compatible", key: value,
        baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b", headers: {} });
    } else if (key.startsWith("OPENROUTER_API_KEY")) {
      providers.push({ name: key, type: "openai-compatible", key: value,
        baseUrl: "https://openrouter.ai/api/v1", model: "qwen/qwen3.8-27b:free",
        headers: { "HTTP-Referer": "https://curanav.vercel.app", "X-Title": "CuraNav" } });
    } else if (key.startsWith("AIML_API_KEY")) {
      providers.push({ name: key, type: "openai-compatible", key: value,
        baseUrl: "https://api.aimlapi.com/v1", model: "gpt-4o", headers: {} });
    }
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "GEMINI_API_KEY",
      type: "gemini",
      key: process.env.GEMINI_API_KEY,
      baseUrl: "",
      model: "gemini-3.6-flash",
      headers: {},
    });
  }

  return providers;
}
