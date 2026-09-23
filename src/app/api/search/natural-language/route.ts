import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// ── Custom Errors ─────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Safely removes markdown code fences and parses JSON.
 */
function parseModelJson(content: string): any {
  let cleaned = content.trim();
  
  // Remove markdown json fences if the model erroneously included them
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Log safely truncated version of the invalid content
    const truncated = content.length > 200 ? content.substring(0, 200) + "..." : content;
    console.error(`[AI Parser] Invalid JSON returned. Content snippet: ${truncated}`);
    throw new JsonParseError("AI returned malformed JSON");
  }
}

/**
 * Validates the parsed JSON against the expected schema.
 */
function validateResponseSchema(data: any): any {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Root response must be an object");
  }

  // Validate filters
  if (!data.filters || typeof data.filters !== "object") {
    throw new ValidationError("Missing or invalid 'filters' object");
  }

  const f = data.filters;
  const condition = f.condition ?? null;
  const specialty = f.specialty ?? null;
  const city = f.city ?? null;
  const radius_km = typeof f.radius_km === "number" ? f.radius_km : null;
  const min_budget = typeof f.min_budget === "number" ? f.min_budget : null;
  const max_budget = typeof f.max_budget === "number" ? f.max_budget : null;
  const facilities = f.facilities ?? null;
  const sort_by = typeof f.sort_by === "string" ? f.sort_by : null;
  const fallback_cities = Array.isArray(f.fallback_cities) ? f.fallback_cities : null;

  // Validate chips
  const chips: Array<{ icon: string; label: string; value: string }> = [];
  if (Array.isArray(data.chips)) {
    for (const c of data.chips) {
      if (c && typeof c === "object" && typeof c.icon === "string" && typeof c.label === "string" && typeof c.value === "string") {
        chips.push({ icon: c.icon, label: c.label, value: c.value });
      }
    }
  }

  return {
    filters: { condition, specialty, city, radius_km, fallback_cities, min_budget, max_budget, facilities, sort_by },
    chips
  };
}

const RETRY_DELAYS = [500, 1500, 3000];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SYSTEM_PROMPT = `You are a JSON extraction engine for a hospital search system. Given a user query, extract the search parameters.

REQUIREMENTS:
1. Return ONLY valid JSON.
2. Do not return explanations, conversational text, or markdown code blocks (do not wrap in \`\`\`json).
3. Do not add extra fields to the JSON.
4. Use exactly \`null\` when information is not specified.

Extract:
- condition: the medical condition or disease (e.g. "kidney disease", "heart disease", "cancer"). Null if none.
- specialty: the corresponding medical specialty or procedure (e.g. "Nephrology", "Cardiology", "kidney transplant"). Null if none.
- city: the city mentioned (e.g. "Chandigarh"). Null if none.
- radius_km: the explicit distance radius in kilometers (e.g. "within 20 km" -> 20). Null if no explicit radius. Do not invent a radius for "near me".
- fallback_cities: an array of 2-3 nearby major cities or districts geographically close to 'city'. Empty array if none.
- min_budget: the minimum budget in Indian Rupees (INR) as an integer (e.g. "between 1 and 3 lakh" -> 100000). Null if none.
- max_budget: the maximum budget in INR as an integer (e.g. "under 2 lakh" -> 200000). Null if none.
- facilities: comma separated list of facilities (e.g. "Dialysis,ICU"). Null if none.
- sort_by: sorting preference based on user language. Must be one of: "match", "cost" (for cheapest/affordable), "distance" (for closest/nearest), or "verified". Default is "match".
- chips: an array of UI chips summarizing what was extracted. Each chip has { "icon", "label", "value" }. Use emojis: 🩺 Condition, 📍 Location, 📏 Distance (if radius_km), 💰 Budget, 🏥 Facilities, 🎯 Priority (for sort_by).

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
  },
  "chips": [
    { "icon": string, "label": string, "value": string }
  ]
}`;

// ── AIML API call (Primary) ───────────────────────────────────────────────────
async function callAimlApi(apiKey: string, query: string) {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query }
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          max_tokens: 400,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const isTransient = [408, 429, 500, 502, 503, 504].includes(res.status);
        
        if (isTransient && attempt < RETRY_DELAYS.length) {
          console.warn(`[AIML API] Attempt ${attempt + 1} - Transient error ${res.status}. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
        throw new Error(`AIML API HTTP ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from AIML API");

      const parsed = parseModelJson(content);
      return validateResponseSchema(parsed);

    } catch (err: unknown) {
      if (err instanceof JsonParseError || err instanceof ValidationError) {
        throw err;
      }
      
      const errMsg = err instanceof Error ? err.message : String(err);
      
      if (attempt < RETRY_DELAYS.length && (errMsg.includes("fetch") || errMsg.includes("network"))) {
        console.warn(`[AIML API] Attempt ${attempt + 1} - Network error. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      
      if (attempt >= RETRY_DELAYS.length) {
        throw new Error(`AIML API failed after ${attempt} retries: ${errMsg}`);
      }
      
      throw err;
    }
  }
}

// ── OpenRouter API call ───────────────────────────────────────────────────────
async function callOpenRouter(apiKey: string, query: string) {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://curanav.vercel.app",
          "X-Title": "CuraNav",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query }
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          max_tokens: 300,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const isTransient = [408, 429, 500, 502, 503, 504].includes(res.status);
        
        if (isTransient && attempt < RETRY_DELAYS.length) {
          console.warn(`[OpenRouter] Attempt ${attempt + 1} - Transient error ${res.status}. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
        throw new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from OpenRouter");

      const parsed = parseModelJson(content);
      return validateResponseSchema(parsed);

    } catch (err: unknown) {
      // Do not retry deterministic errors (JSON parse, Validation, 400/403)
      if (err instanceof JsonParseError || err instanceof ValidationError) {
        throw err; // Fail fast to move to next provider
      }
      
      const errMsg = err instanceof Error ? err.message : String(err);
      
      // Handle fetch network failures as transient
      if (attempt < RETRY_DELAYS.length && (errMsg.includes("fetch") || errMsg.includes("network"))) {
        console.warn(`[OpenRouter] Attempt ${attempt + 1} - Network error. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      
      if (attempt >= RETRY_DELAYS.length) {
        throw new Error(`OpenRouter failed after ${attempt} retries: ${errMsg}`);
      }
      
      throw err;
    }
  }
}

// ── Groq API call ───────────────────────────────────────────────────────
async function callGroq(apiKey: string, query: string) {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query }
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const isTransient = [408, 429, 500, 502, 503, 504].includes(res.status);
        
        if (isTransient && attempt < RETRY_DELAYS.length) {
          console.warn(`[Groq] Attempt ${attempt + 1} - Transient error ${res.status}. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
        throw new Error(`Groq HTTP ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from Groq");

      const parsed = parseModelJson(content);
      return validateResponseSchema(parsed);

    } catch (err: unknown) {
      if (err instanceof JsonParseError || err instanceof ValidationError) {
        throw err;
      }
      
      const errMsg = err instanceof Error ? err.message : String(err);
      
      if (attempt < RETRY_DELAYS.length && (errMsg.includes("fetch") || errMsg.includes("network"))) {
        console.warn(`[Groq] Attempt ${attempt + 1} - Network error. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      
      if (attempt >= RETRY_DELAYS.length) {
        throw new Error(`Groq failed after ${attempt} retries: ${errMsg}`);
      }
      
      throw err;
    }
  }
}

// ── Gemini SDK call ───────────────────────────────────────────────────────────
async function callGemini(ai: GoogleGenAI, query: string) {
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
          sort_by: { type: Type.STRING, nullable: true }
        }
      },
      chips: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            icon: { type: Type.STRING },
            label: { type: Type.STRING },
            value: { type: Type.STRING }
          }
        }
      }
    }
  };

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `${SYSTEM_PROMPT}\n\nUser Query: "${query}"`,
        config: { responseMimeType: "application/json", responseSchema: schema }
      });
      
      const parsed = parseModelJson(response.text || "{}");
      return validateResponseSchema(parsed);

    } catch (err: unknown) {
      if (err instanceof JsonParseError || err instanceof ValidationError) {
        throw err; // Fail fast
      }
      
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTransient = errMsg.includes("overloaded") || errMsg.includes("429") || errMsg.includes("503");
      
      if (isTransient && attempt < RETRY_DELAYS.length) {
        console.warn(`[Gemini SDK] Attempt ${attempt + 1} - Transient error. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      
      throw err;
    }
  }
}

// ── Local fallback extraction (Regex) ─────────────────────────────────────────
function localExtract(query: string) {
  const q = query.toLowerCase();
  let condition: string | null = null, specialty: string | null = null, city: string | null = null;
  let min_budget: number | null = null, max_budget: number | null = null, radius_km: number | null = null;
  let sort_by: string | null = null;
  let facilities: string[] = [];

  if (q.includes("kidney") || q.includes("nephro") || q.includes("dialysis") || q.includes("renal")) { condition = "kidney disease"; specialty = "General Medicine"; }
  else if (q.includes("heart") || q.includes("cardiac") || q.includes("cardio") || q.includes("bypass")) { condition = "heart disease"; specialty = "Cardiology"; }
  else if (q.includes("cancer") || q.includes("oncol") || q.includes("tumor") || q.includes("chemo")) { condition = "cancer"; specialty = "General Surgery"; }
  else if (q.includes("bone") || q.includes("joint") || q.includes("ortho") || q.includes("fracture") || q.includes("spine")) { condition = "orthopaedic conditions"; specialty = "Orthopaedics"; }
  else if (q.includes("pregnan") || q.includes("matern") || q.includes("delivery") || q.includes("women") || q.includes("gynae") || q.includes("gyne")) { condition = "maternity"; specialty = "Obstetrics & Gynaecology"; }
  else if (q.includes("emergency") || q.includes("trauma") || q.includes("accident")) { condition = "emergency care"; specialty = "Emergency Room Packages"; }
  else if (q.includes("neuro") || q.includes("brain") || q.includes("stroke")) { condition = "neurological conditions"; specialty = "Neurosurgery"; }
  else if (q.includes("burn")) { condition = "burns"; specialty = "Burns Management"; }
  else if (q.includes("eye") || q.includes("cataract") || q.includes("vision") || q.includes("ophthal")) { condition = "eye care"; specialty = "Ophthalmology"; }
  else if (q.includes("ear") || q.includes("nose") || q.includes("throat") || q.includes("ent") || q.includes("sinus")) { condition = "ENT conditions"; specialty = "Otorhinolaryngology (ENT)"; }
  else if (q.includes("urin") || q.includes("urolog") || q.includes("prostate") || q.includes("bladder")) { condition = "urological conditions"; specialty = "Urology"; }
  else if (q.includes("child") || q.includes("pediatr") || q.includes("paediatr") || q.includes("baby") || q.includes("infant") || q.includes("neonat")) { condition = "pediatric care"; specialty = "Paediatric Medical Management"; }
  else if (q.includes("plastic") || q.includes("cosmetic") || q.includes("reconstruct")) { condition = "reconstructive surgery"; specialty = "Plastic & Reconstructive Surgery"; }
  else if (q.includes("surgery") || q.includes("surgical") || q.includes("operation")) { condition = "surgical needs"; specialty = "General Surgery"; }
  else if (q.includes("general") || q.includes("fever") || q.includes("check up") || q.includes("checkup")) { condition = "general care"; specialty = "General Medicine"; }

  const cities = ["chandigarh", "mohali", "delhi", "mumbai", "bangalore"];
  const foundCity = cities.find((c) => q.includes(c));
  if (foundCity) city = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);

  // Extract Radius
  const radiusMatch = q.match(/within\s*(\d+)\s*km/i);
  if (radiusMatch) radius_km = parseInt(radiusMatch[1], 10);

  // Extract Budgets
  const betweenMatch = q.match(/between\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)?\s*and\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/i);
  if (betweenMatch) {
    min_budget = Math.round(parseFloat(betweenMatch[1]) * 100000);
    max_budget = Math.round(parseFloat(betweenMatch[2]) * 100000);
  } else {
    const lakhMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/i);
    const kMatch = q.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    const exactMatch = q.match(/(?:under|below|max(?:imum)?)\s*(?:₹|rs\.?)?\s*(\d{4,})/i);

    if (lakhMatch) max_budget = Math.round(parseFloat(lakhMatch[1]) * 100000);
    else if (kMatch) max_budget = Math.round(parseFloat(kMatch[1]) * 1000);
    else if (exactMatch) max_budget = parseInt(exactMatch[1], 10);
  }

  if (q.includes("dialysis")) facilities.push("Dialysis");
  if (q.includes("icu") || q.includes("emergency")) facilities.push("ICU");

  // Extract Sort By
  if (q.includes("closest") || q.includes("nearest") || q.includes("prioritize distance")) sort_by = "distance";
  else if (q.includes("cheapest") || q.includes("affordable") || q.includes("prioritize cost")) sort_by = "cost";

  const chips = [];
  if (condition) chips.push({ icon: "🩺", label: "Condition", value: condition });
  if (specialty) chips.push({ icon: "⚕️", label: "Specialty", value: specialty });
  if (city) chips.push({ icon: "📍", label: "Location", value: city });
  if (radius_km) chips.push({ icon: "📏", label: "Distance", value: `Within ${radius_km} km` });
  
  if (min_budget && max_budget) chips.push({ icon: "💰", label: "Budget", value: `₹${min_budget} - ₹${max_budget}` });
  else if (max_budget) chips.push({ icon: "💰", label: "Budget", value: `Under ₹${max_budget}` });
  
  if (facilities.length > 0) chips.push({ icon: "🏥", label: "Facilities", value: facilities.join(", ") });
  
  if (sort_by === "distance") chips.push({ icon: "🎯", label: "Priority", value: "Distance" });
  else if (sort_by === "cost") chips.push({ icon: "🎯", label: "Priority", value: "Cost" });
  else chips.push({ icon: "🎯", label: "Priority", value: "Best match" });

  return { filters: { condition, specialty, city, radius_km, fallback_cities: [], min_budget, max_budget, facilities: facilities.length > 0 ? facilities.join(",") : null, sort_by }, chips };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { query, locationContext } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    let fullQuery = query;
    if (locationContext) {
      fullQuery += ` (User's detected location context: ${locationContext}. Use this to resolve "near me" or "nearby" queries to this specific city).`;
    }

    // Collect all configured providers
    const providers: { name: string; type: "aiml" | "openrouter" | "gemini" | "groq"; key: string }[] = [];
    
    // OpenRouter first (primary provider)
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("OPENROUTER_API_KEY") && value) {
        providers.push({ name: key, type: "openrouter", key: value });
      }
    }

    // Then AIML API and Groq as fallbacks
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("AIML_API_KEY") && value) {
        providers.push({ name: key, type: "aiml", key: value });
      } else if (key.startsWith("GROQ_API_KEY") && value) {
        providers.push({ name: key, type: "groq", key: value });
      }
    }
    
    // Add Gemini last
    if (process.env.GEMINI_API_KEY) {
      providers.push({ name: "GEMINI_API_KEY", type: "gemini", key: process.env.GEMINI_API_KEY });
    }

    let result = null;

    for (const provider of providers) {
      try {
        if (provider.type === "aiml") {
          result = await callAimlApi(provider.key, fullQuery);
        } else if (provider.type === "openrouter") {
          result = await callOpenRouter(provider.key, fullQuery);
        } else if (provider.type === "groq") {
          result = await callGroq(provider.key, fullQuery);
        } else if (provider.type === "gemini") {
          const ai = new GoogleGenAI({ apiKey: provider.key });
          result = await callGemini(ai, fullQuery);
        }
        
        if (result) break; // Success! Exit the waterfall loop.
      } catch (error) {
        console.warn(`[Fallback] ${provider.name} failed: ${error instanceof Error ? error.message : String(error)}. Proceeding to next provider...`);
      }
    }

    if (result) {
      return NextResponse.json({ filters: result.filters, explanation: { query, chips: result.chips } });
    }

    // Provider 3: Local fallback
    if (providers.length === 0) {
      console.warn("[Fallback] No AI API keys configured. Using local extraction.");
    } else {
      console.warn("[Fallback] All AI providers failed. Using local extraction.");
    }
    
    const localResult = localExtract(fullQuery);
    return NextResponse.json({ filters: localResult.filters, explanation: { query, chips: localResult.chips, fallback: true } });

  } catch (error) {
    console.error("[Main Route] Fatal Error:", error);
    // Only return 500 if the entire request pipeline crashes (including fallback)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
