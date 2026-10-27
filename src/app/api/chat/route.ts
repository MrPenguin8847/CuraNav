import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/** Maximum character length accepted for a single user message. */
const MAX_MESSAGE_LENGTH = 2_000;
/** Maximum number of messages accepted per request (prevents history inflation). */
const MAX_MESSAGES = 20;
/** Maximum character length for the page context blob. */
const MAX_CONTEXT_LENGTH = 5_000;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  // ── Rate limiting: 30 requests / minute per IP ───────────────────────────
  const ip = getClientIp(req);
  const limit = rateLimit(`chat:${ip}`, { max: 30, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before sending another message." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const body = (await req.json()) as {
      messages?: unknown;
      context?: unknown;
    };

    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // ── Input validation ─────────────────────────────────────────────────
    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: "Too many messages in the conversation history." },
        { status: 400 }
      );
    }

    const sanitizedMessages: ChatMessage[] = [];
    for (const m of messages) {
      const msg = m as Record<string, unknown>;
      if (
        typeof msg.role !== "string" ||
        !["user", "assistant"].includes(msg.role) ||
        typeof msg.content !== "string"
      ) {
        return NextResponse.json({ error: "Malformed message in array" }, { status: 400 });
      }
      // Truncate individual messages that are too long
      sanitizedMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content.slice(0, MAX_MESSAGE_LENGTH),
      });
    }

    // Sanitize context: it comes from the client's page DOM and must not
    // blow up the token budget or carry injection payload.
    const safeContext =
      typeof context === "string"
        ? context.slice(0, MAX_CONTEXT_LENGTH)
        : "";

    const apiKey = process.env.GROQ_API_KEY_2;
    if (!apiKey) {
      return NextResponse.json({ error: "Chat service is not configured" }, { status: 500 });
    }

    // Prepare system prompt with context
    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are the CuraNav AI, a helpful and knowledgeable healthcare assistant embedded directly in the CuraNav website.
Your goal is to help users find the right hospital, understand hospital details, and compare costs/facilities.

Here is what the user is currently looking at on their screen (the page text content and URL).
Use this context to answer their questions accurately.

--- CURRENT SCREEN CONTEXT ---
${safeContext}
------------------------------

Answer concisely and clearly. If the user asks about a hospital, try to refer to the data provided in the context. If the data is not in the context, gently let them know.`,
    };

    const formattedMessages = [systemMessage, ...sanitizedMessages];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[POST /api/chat] Groq Error:", errorData);
      throw new Error("Failed to get response from chat provider");
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/chat] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
