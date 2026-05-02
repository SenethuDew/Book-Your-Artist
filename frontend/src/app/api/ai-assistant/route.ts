/**
 * POST /api/ai-assistant
 *
 * Single endpoint for the AI Booking Assistant. The heavy lifting now lives
 * in `lib/ai/bookYourArtistKnowledge.ts` (`getContextAwareBotResponse`) so the
 * route stays thin and easy to read for the viva.
 *
 * Request body:
 * {
 *   userMessage: string,
 *   userRole?: "guest" | "client" | "artist" | "admin",
 *   currentPage?: string,                 // pathname from usePathname()
 *   userId?: string,
 *   conversationState?: { session: AISessionState | null },
 *   clientProfile?: ClientProfileSnapshot,
 *   artistProfile?: ArtistProfileSnapshot,
 *   audience?: "client" | "artist" | "any" // legacy fallback
 * }
 *
 * Future OpenAI integration:
 *   - When `OPENAI_API_KEY` is set, the route only calls OpenAI when the
 *     rule engine returned a `fallback` intent — this keeps latency + cost
 *     low while still gracefully handling free-form questions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getContextAwareBotResponse } from "@/lib/ai/bookYourArtistKnowledge";
import { buildKnowledgeContext } from "@/lib/ai/knowledgeBase";
import type {
  AISessionState,
  ArtistProfileSnapshot,
  AssistantApiResponse,
  AssistantIntent,
  ClientProfileSnapshot,
  UserRole,
} from "@/lib/ai/types";

interface ConversationStatePayload {
  session?: AISessionState | null;
}

interface IncomingPayload {
  userMessage: string;
  userId?: string;
  userRole?: UserRole;
  currentPage?: string;
  /** Legacy field used by the widget before role/page were added. */
  audience?: "client" | "artist" | "any";
  conversationState?: ConversationStatePayload | null;
  clientProfile?: ClientProfileSnapshot | null;
  artistProfile?: ArtistProfileSnapshot | null;
  message?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

function audienceToRole(a: IncomingPayload["audience"]): UserRole {
  if (a === "artist") return "artist";
  if (a === "client") return "client";
  return "guest";
}

async function tryOpenAI(
  userMessage: string,
  history: IncomingPayload["history"],
  profile: ClientProfileSnapshot | undefined
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const systemPrompt = `You are the AI Booking Concierge for "Book Your Artist", a Next.js + Firestore marketplace for booking DJs, singers, live bands, and rappers.
Reply in concise Markdown (under 180 words). Use **bold** for key terms and bullet lists for steps.
NEVER ask for or echo passwords, card numbers, CVVs, Firebase keys, or Stripe secret keys.
Always reference real platform pages by name (Search, Booking Calendar, Profile Settings, My Bookings, Notifications, AI Assistant).
Never invent prices or artist names beyond the catalog provided below.

CLIENT PROFILE (may be partial): ${JSON.stringify(profile ?? {})}

WEBSITE TRAINING CONTEXT:${buildKnowledgeContext()}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history ?? []).slice(-8),
          { role: "user", content: userMessage },
        ],
        temperature: 0.5,
        max_tokens: 480,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IncomingPayload;
    const userMessage = (body.userMessage ?? body.message ?? "").trim();
    if (!userMessage) {
      return NextResponse.json(
        { success: false, message: "userMessage is required" },
        { status: 400 }
      );
    }

    const userRole: UserRole = body.userRole ?? audienceToRole(body.audience);
    const currentPage = body.currentPage ?? "";

    /* Delegate everything to the context-aware orchestrator. */
    const response: AssistantApiResponse = await getContextAwareBotResponse({
      userMessage,
      userRole,
      currentPage,
      userId: body.userId,
      conversationState: body.conversationState,
      clientProfile: body.clientProfile ?? undefined,
      artistProfile: body.artistProfile ?? undefined,
    });

    /* Optional OpenAI augment: if the rule engine returned a fallback AND the
     * key is configured, try a free-form completion. We do NOT replace the
     * suggestions / actions — we only swap the reply text. */
    if (response.intent === "fallback") {
      const ai = await tryOpenAI(userMessage, body.history, body.clientProfile ?? undefined);
      if (ai) {
        return NextResponse.json({ ...response, reply: ai, source: "openai" });
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ai-assistant]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again — if you are offline, check your connection.",
        reply:
          "I hit a temporary issue processing that request. You can still browse artists from the search page, or retry in a moment.",
        intent: "fallback" as AssistantIntent,
        source: "rules" as const,
      },
      { status: 500 }
    );
  }
}
