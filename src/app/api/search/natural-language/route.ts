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
  const max_budget = typeof f.max_budget === "number" ? f.max_budget : null;
  const facilities = f.facilities ?? null;

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
    filters: { condition, specialty, city, max_budget, facilities },
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
- condition: the medical condition (e.g. "kidney disease", "heart disease", "cancer"). Null if none.
- specialty: the corresponding medical specialty (e.g. "Nephrology", "Cardiology", "Oncology"). Null if none.
- city: the city mentioned. Null if none.
- max_budget: the maximum budget in Indian Rupees (INR) as an integer. Parse "under 2 lakh" as 200000, "under 50k" as 50000. Null if none.
- facilities: comma separated list of facilities (e.g. "Dialysis,ICU"). Null if none.
- chips: an array of UI chips summarizing what was extracted. Each chip has { "icon", "label", "value" }. Use emojis: 🩺 Condition, ⚕️ Specialty, 📍 Location, 💰 Budget, 🏥 Facilities. Always end with { "icon": "🎯", "label": "Priority", "value": "Best match" }.

EXPECTED JSON SCHEMA:
{
  "filters": {
    "condition": string | null,
    "specialty": string | null,
    "city": string | null,
    "max_budget": number | null,
    "facilities": string | null
  },
  "chips": [
    { "icon": string, "label": string, "value": string }
  ]
}`;

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
          max_budget: { type: Type.INTEGER, nullable: true },
          facilities: { type: Type.STRING, nullable: true }
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
  let condition: string | null = null, specialty: string | null = null, city: string | null = null, max_budget: number | null = null;
  let facilities: string[] = [];

  if (q.includes("kidney") || q.includes("nephro") || q.includes("dialysis")) { condition = "kidney disease"; specialty = "Nephrology"; }
  else if (q.includes("heart") || q.includes("cardiac") || q.includes("cardio")) { condition = "heart disease"; specialty = "Cardiology"; }
  else if (q.includes("cancer") || q.includes("oncol") || q.includes("tumor")) { condition = "cancer"; specialty = "Oncology"; }
  else if (q.includes("bone") || q.includes("joint") || q.includes("ortho")) { condition = "orthopaedic conditions"; specialty = "Orthopedics"; }
  else if (q.includes("pregnan") || q.includes("matern")) { condition = "maternity"; specialty = "Obstetrics"; }
  else if (q.includes("emergency") || q.includes("trauma")) { condition = "emergency care"; specialty = "Emergency Medicine"; }
  else if (q.includes("neuro") || q.includes("brain")) { condition = "neurological conditions"; specialty = "Neurology"; }

  const cities = ["chandigarh", "mohali", "delhi", "mumbai", "bangalore"];
  const foundCity = cities.find((c) => q.includes(c));
  if (foundCity) city = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);

  const lakhMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/i);
  const kMatch = q.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  const exactMatch = q.match(/(?:under|below|max(?:imum)?)\s*(?:₹|rs\.?)?\s*(\d{4,})/i);

  if (lakhMatch) max_budget = Math.round(parseFloat(lakhMatch[1]) * 100000);
  else if (kMatch) max_budget = Math.round(parseFloat(kMatch[1]) * 1000);
  else if (exactMatch) max_budget = parseInt(exactMatch[1], 10);

  if (q.includes("dialysis")) facilities.push("Dialysis");
  if (q.includes("icu") || q.includes("emergency")) facilities.push("ICU");

  const chips = [];
  if (condition) chips.push({ icon: "🩺", label: "Condition", value: condition });
  if (specialty) chips.push({ icon: "⚕️", label: "Specialty", value: specialty });
  if (city) chips.push({ icon: "📍", label: "Location", value: city });
  if (max_budget) chips.push({ icon: "💰", label: "Budget", value: `Under ₹${max_budget}` });
  if (facilities.length > 0) chips.push({ icon: "🏥", label: "Facilities", value: facilities.join(", ") });
  chips.push({ icon: "🎯", label: "Priority", value: "Best match" });

  return { filters: { condition, specialty, city, max_budget, facilities: facilities.length > 0 ? facilities.join(",") : null }, chips };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Provider 1: OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const result = await callOpenRouter(process.env.OPENROUTER_API_KEY, query);
        return NextResponse.json({ filters: result.filters, explanation: { query, chips: result.chips } });
      } catch (orError) {
        console.warn(`[Fallback] OpenRouter failed: ${orError instanceof Error ? orError.message : "Unknown error"}. Proceeding to next provider.`);
      }
    }

    // Provider 2: Gemini SDK
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const result = await callGemini(ai, query);
        return NextResponse.json({ filters: result.filters, explanation: { query, chips: result.chips } });
      } catch (geminiError) {
        console.warn(`[Fallback] Gemini SDK failed: ${geminiError instanceof Error ? geminiError.message : "Unknown error"}. Proceeding to fallback.`);
      }
    }

    // Provider 3: Local fallback
    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      console.warn("[Fallback] No AI API keys configured. Using local extraction.");
    }
    const localResult = localExtract(query);
    return NextResponse.json({ filters: localResult.filters, explanation: { query, chips: localResult.chips, fallback: true } });

  } catch (error) {
    console.error("[Main Route] Fatal Error:", error);
    // Only return 500 if the entire request pipeline crashes (including fallback)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
