import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY_2;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    // Prepare system prompt with context
    const systemMessage = {
      role: "system",
      content: `You are the CuraNav AI, a helpful and knowledgeable healthcare assistant embedded directly in the CuraNav website.
Your goal is to help users find the right hospital, understand hospital details, and compare costs/facilities.

Here is what the user is currently looking at on their screen (the page text content and URL).
Use this context to answer their questions accurately.

--- CURRENT SCREEN CONTEXT ---
${context}
------------------------------

Answer concisely and clearly. If the user asks about a hospital, try to refer to the data provided in the context. If the data is not in the context, gently let them know.`,
    };

    const formattedMessages = [
      systemMessage,
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }))
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b", // available on this Groq account
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[POST /api/chat] Groq Error:", errorData);
      throw new Error("Failed to get response from Groq API");
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("[POST /api/chat] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
