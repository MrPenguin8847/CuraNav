import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapHospital } from "@/lib/mapHospital";

/**
 * POST /api/compare/ai
 *
 * Body: { ids: string[] }
 *
 * Returns a streaming AI-generated comparison summary for the selected hospitals.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = body.ids;

    if (!Array.isArray(ids) || ids.length < 2) {
      return NextResponse.json(
        { error: "Please select at least 2 hospitals to compare." },
        { status: 400 }
      );
    }

    if (ids.length > 5) {
      return NextResponse.json(
        { error: "You can compare up to 5 hospitals at a time." },
        { status: 400 }
      );
    }

    // Fetch hospital data from Supabase
    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .select("*")
      .in("hospital_id", ids);

    if (error) {
      console.error("[AI Compare] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch hospital data." },
        { status: 500 }
      );
    }

    if (!data || data.length < 2) {
      return NextResponse.json(
        { error: "Could not find enough hospitals to compare." },
        { status: 404 }
      );
    }

    const hospitals = data.map(mapHospital);

    // Build the hospital profiles for AI
    const profiles = hospitals
      .map(
        (h, i) =>
          `Hospital ${i + 1}: ${h.name}
  - Location: ${h.city ?? h.address ?? "Not specified"}
  - Specialties: ${h.specialties.length > 0 ? h.specialties.join(", ") : "General"}
  - Cost: ${h.costMin != null && h.costMax != null ? `₹${h.costMin.toLocaleString("en-IN")} – ₹${h.costMax.toLocaleString("en-IN")}` : "Standard PM-JAY Rates"}
  - PM-JAY Empanelled: ${h.pmjayEmpanelled ? "Yes" : "No"}
  - Accreditation: ${h.accreditation.length > 0 ? h.accreditation.join(", ") : "None listed"}
  - Facilities: ${h.facilities.length > 0 ? h.facilities.join(", ") : "None listed"}
  - ICU Beds: ${h.icuBeds ?? "Not reported"}
  - Annual Procedures: ${h.annualProcedureVolume != null ? h.annualProcedureVolume.toLocaleString("en-IN") : "Not reported"}
  - Verification: ${h.verificationStatus}
  - Facility Type: ${(h as any).facilityType ?? "Hospital"}
  - Phone: ${h.phone ?? "Not available"}
  - Emergency: ${h.specialties.some((s) => s.includes("Emergency")) ? "Available" : "Not confirmed"}`
      )
      .join("\n\n");

    const systemPrompt = `You are CuraNav's AI Hospital Comparison Assistant. You help patients compare hospitals to make informed healthcare decisions.

Given the following hospital profiles, provide a clear, structured comparison. Be objective, helpful, and empathetic.

FORMAT YOUR RESPONSE IN MARKDOWN using these sections:
1. **🏆 Quick Verdict** — A 2-3 sentence summary of which hospital might be best for different needs.
2. **📊 Side-by-Side Comparison** — A markdown table comparing key metrics (specialties, cost, location, accreditation, PM-JAY status, emergency services).
3. **✅ Strengths** — Bullet points for each hospital's unique strengths.
4. **⚠️ Considerations** — Things the patient should be aware of (missing data, limitations, etc.).
5. **💡 Recommendation** — A balanced recommendation based on different patient priorities (cost-conscious, specialty-focused, location-based).

IMPORTANT RULES:
- Never make definitive medical recommendations. Always suggest consulting a doctor.
- If cost data is missing, mention that PM-JAY standard rates apply for eligible beneficiaries.
- Be transparent about missing data — don't fabricate information.
- Keep the tone warm, professional, and patient-friendly.
- Use Indian context (₹, PM-JAY, Indian healthcare system).`;

    const userPrompt = `Compare these ${hospitals.length} hospitals:\n\n${profiles}`;

    // Try OpenRouter first, fall back to Gemini
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let aiResponse: string;

    if (openRouterKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://curanav.vercel.app",
          "X-Title": "CuraNav",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
      }

      const result = await res.json();
      aiResponse = result.choices?.[0]?.message?.content ?? "";
    } else if (geminiKey) {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      });

      aiResponse = result.text ?? "";
    } else {
      return NextResponse.json(
        { error: "No AI provider configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    // Clean up any thinking tags the model might have included
    aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return NextResponse.json({
      comparison: aiResponse,
      hospitalCount: hospitals.length,
      hospitalNames: hospitals.map((h) => h.name),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI Compare] Error:", message);
    return NextResponse.json(
      { error: "AI comparison failed. Please try again." },
      { status: 500 }
    );
  }
}
