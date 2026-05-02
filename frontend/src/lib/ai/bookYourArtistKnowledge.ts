/**
 * Context-aware response engine for Book Your Artist.
 *
 * `getContextAwareBotResponse()` is the single entry point used by the
 * Next.js API route (`/api/ai-assistant`). It glues together:
 *
 *   1. `contextDetector` → role + page + welcome + suggested topics
 *   2. `intentDetector`  → role-aware intent classification
 *   3. `knowledgeBase`   → curated FAQ answers (re-used)
 *   4. `recommendArtists`→ Firestore + catalog ranking
 *   5. `bookingFlow`     → step-by-step booking wizard state machine
 *
 * The function never breaks on missing data — every branch returns a usable
 * `AssistantApiResponse`. Future OpenAI integration plugs in as a final
 * fallback inside the API route (search for `tryOpenAI`).
 */

import { detectIntent } from "./intentDetector";
import { processBookingMessage } from "./bookingFlow";
import { recommendArtists } from "./recommendArtists";
import { buildBotContext, type BotContext } from "./contextDetector";
import {
  answerFromKnowledge,
  findRoutes,
  FAQ,
  type FaqEntry,
} from "./knowledgeBase";
import {
  extractBudgetRange,
  extractCategory,
  extractEventType,
  extractLocation,
  extractOrigin,
} from "./bookingFlow";
import type {
  AISessionState,
  ArtistProfileSnapshot,
  AssistantApiResponse,
  AssistantIntent,
  ChatAction,
  ClientProfileSnapshot,
  PageType,
  ProfileChecklistPayload,
  UserRole,
} from "./types";

/* ---------------- Profile checklists ---------------- */

const CLIENT_FIELDS: Array<{ field: keyof ClientProfileSnapshot; label: string }> = [
  { field: "fullName", label: "Full name" },
  { field: "email", label: "Email" },
  { field: "phone", label: "Phone" },
  { field: "location", label: "Location" },
  { field: "preferredEventType", label: "Preferred event type" },
  { field: "preferredArtistCategory", label: "Preferred artist category" },
  { field: "budgetMin", label: "Budget range" },
];

const ARTIST_FIELDS: Array<{ field: keyof ArtistProfileSnapshot; label: string }> = [
  { field: "stageName", label: "Stage / artist name" },
  { field: "category", label: "Category (DJ / Singer / Band / Rapper)" },
  { field: "origin", label: "Local / international" },
  { field: "bio", label: "Bio" },
  { field: "profileImage", label: "Profile image" },
  { field: "coverImage", label: "Cover image" },
  { field: "hourlyRate", label: "Hourly rate" },
  { field: "genres", label: "Genres" },
  { field: "hasAvailability", label: "Availability calendar" },
];

function buildClientChecklist(p: ClientProfileSnapshot | undefined): ProfileChecklistPayload {
  const items = CLIENT_FIELDS.map(({ field, label }) => {
    const v = p?.[field];
    const done = Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "";
    return { field: String(field), label, done };
  });
  const completion = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { audience: "client", items, completion, ctaHref: "/profile/settings" };
}

function buildArtistChecklist(p: ArtistProfileSnapshot | undefined): ProfileChecklistPayload {
  const items = ARTIST_FIELDS.map(({ field, label }) => {
    const v = p?.[field];
    const done = Array.isArray(v) ? v.length > 0 : Boolean(v);
    return { field: String(field), label, done };
  });
  const completion = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { audience: "artist", items, completion, ctaHref: "/artist/profile" };
}

/* ---------------- Main entry point ---------------- */

export interface ContextAwareInput {
  userMessage: string;
  userRole: UserRole;
  currentPage: string;
  userId?: string;
  conversationState?: { session?: AISessionState | null } | null;
  clientProfile?: ClientProfileSnapshot | null;
  artistProfile?: ArtistProfileSnapshot | null;
}

export async function getContextAwareBotResponse(
  input: ContextAwareInput
): Promise<AssistantApiResponse> {
  const { userMessage, clientProfile, artistProfile } = input;

  /* 1) Resolve context (role + page + welcome). */
  const ctx = buildBotContext({
    pathname: input.currentPage,
    userRole: input.userRole,
    userId: input.userId,
    isLoggedIn: input.userRole !== "guest",
  });

  /* 2) Hydrate / advance the booking session. */
  let session: AISessionState | null = input.conversationState?.session ?? null;
  const audience = audienceFromRole(ctx.userRole);

  /* 3) Detect intent (role-biased). */
  const { intent } = detectIntent(userMessage, session, ctx.userRole);
  session = session
    ? { ...session, lastUserIntent: intent, updatedAt: Date.now() }
    : {
        currentIntent: intent,
        bookingStep: "done",
        bookingData: {},
        lastUserIntent: intent,
        updatedAt: Date.now(),
      };

  /* 4) Dispatch on intent. */
  switch (intent) {
    case "book":
      return await handleBookingFlow(userMessage, session, clientProfile ?? undefined, ctx);

    case "recommend":
    case "artist_recommendation":
    case "local_artist_help":
    case "international_artist_help":
    case "budget_search":
      return await handleRecommendation(userMessage, intent, session, ctx, clientProfile ?? undefined);

    case "client_profile_help":
    case "profile":
      return handleClientProfile(session, ctx, clientProfile ?? undefined);

    case "artist_profile_help":
      return handleArtistProfile(session, ctx, artistProfile ?? undefined);

    case "artist_calendar_help":
    case "artist_booking_request_help":
    case "artist_earnings_help":
    case "artist_visibility_help":
    case "artist_dashboard_help":
      return handleArtistTopic(intent, session, ctx, artistProfile ?? undefined);

    case "payment_help":
    case "payment":
      return handlePayment(session, ctx);

    case "cancellation_help":
    case "cancel_reschedule":
      return handleCancellation(session, ctx);

    case "booking_status_help":
    case "booking_status":
      return handleBookingStatus(session, ctx);

    case "event_planning":
      return handleEventPlanning(session, ctx);

    case "register_help":
      return faqResponse("create-account", session, ctx, intent, audience);

    case "client_login_help":
    case "artist_login_help":
      return faqResponse("login", session, ctx, intent, audience);

    case "website_info":
    case "platform_advantages":
    case "website_features":
      return faqResponse("what-is-bya", session, ctx, intent, audience);

    case "famous":
      return await handleFamous(session, ctx);

    case "stats":
      return await handleStats(session, ctx);

    case "greet":
      return handleGreet(session, ctx, clientProfile ?? undefined);

    case "client_dashboard_help":
    case "help":
      return handleHelp(session, ctx);

    default:
      return handleFallback(userMessage, session, ctx, audience);
  }
}

/* ---------------- Helpers ---------------- */

function audienceFromRole(role: UserRole): "client" | "artist" | "any" {
  if (role === "artist") return "artist";
  if (role === "client") return "client";
  return "any";
}

function withSession(
  session: AISessionState,
  intent: AssistantIntent
): AISessionState {
  return { ...session, currentIntent: intent, bookingStep: "done", updatedAt: Date.now() };
}

/* ---------------- Booking flow ---------------- */

async function handleBookingFlow(
  userMessage: string,
  session: AISessionState,
  profile: ClientProfileSnapshot | undefined,
  ctx: BotContext
): Promise<AssistantApiResponse> {
  session.currentIntent = "book";
  const r = await processBookingMessage(userMessage, session, profile);
  return {
    success: true,
    reply: r.reply,
    intent: "book",
    artists: r.artists,
    actions: r.actions,
    quickReplies: r.quickReplies?.length ? r.quickReplies : ctx.suggestedTopics,
    bookingSummary: r.bookingSummary,
    cardType: r.bookingSummary
      ? "bookingSummary"
      : r.artists?.length
        ? "artistRecommendation"
        : "info",
    session: r.session,
    source: "rules",
  };
}

/* ---------------- Recommendations ---------------- */

async function handleRecommendation(
  userMessage: string,
  intent: AssistantIntent,
  session: AISessionState,
  ctx: BotContext,
  profile: ClientProfileSnapshot | undefined
): Promise<AssistantApiResponse> {
  const m = userMessage.toLowerCase();
  const artists = await recommendArtists({
    eventType: extractEventType(m) ?? profile?.preferredEventType,
    category: extractCategory(m) ?? profile?.preferredArtistCategory,
    location: extractLocation(m, profile) ?? profile?.location,
    budgetMax: extractBudgetRange(m).max ?? profile?.budgetMax,
    budgetMin: extractBudgetRange(m).min ?? profile?.budgetMin,
    origin:
      intent === "international_artist_help"
        ? "international"
        : intent === "local_artist_help"
          ? "local"
          : extractOrigin(m),
    originFlexible:
      (intent === "recommend" || intent === "artist_recommendation") && !extractOrigin(m)
        ? true
        : undefined,
    genreHint: profile?.preferredGenres?.[0],
  });

  const checklist = buildClientChecklist(profile ?? undefined);
  const tipLine =
    checklist.completion < 70
      ? `\n\n_(Tip: your client profile is **${checklist.completion}% complete** — finishing it improves matches.)_`
      : "";

  return {
    success: true,
    reply:
      (artists.length
        ? "Here are strong matches based on what you said:"
        : "No exact matches yet — here are close alternatives:") + tipLine,
    intent,
    artists: artists.length ? artists : await recommendArtists({}),
    cardType: "artistRecommendation",
    actions: [
      { label: "View Artists", type: "navigate", value: "/search", variant: "ghost" },
      { label: "Start Booking", type: "prompt", value: "I want to book an artist", variant: "primary" },
      { label: "Go to Client Profile", type: "navigate", value: "/profile/settings", variant: "ghost" },
    ],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, intent),
    source: "rules",
  };
}

/* ---------------- Profiles ---------------- */

function handleClientProfile(
  session: AISessionState,
  ctx: BotContext,
  profile: ClientProfileSnapshot | undefined
): AssistantApiResponse {
  const checklist = buildClientChecklist(profile);
  const missing = checklist.items.filter((i) => !i.done).map((i) => i.label);
  const reply = missing.length
    ? `Your profile is **${checklist.completion}% complete**. To improve booking matches, please add: **${missing.join(", ")}**.`
    : "Your client profile looks **complete**. You are in great shape for faster bookings.";
  return {
    success: true,
    reply,
    intent: "client_profile_help",
    profileChecklist: checklist,
    cardType: "profileChecklist",
    actions: [
      { label: "Open Profile Settings", type: "navigate", value: "/profile/settings", variant: "primary" },
      { label: "View My Profile", type: "navigate", value: "/profile", variant: "ghost" },
    ],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "client_profile_help"),
    source: "rules",
  };
}

function handleArtistProfile(
  session: AISessionState,
  ctx: BotContext,
  profile: ArtistProfileSnapshot | undefined
): AssistantApiResponse {
  const checklist = buildArtistChecklist(profile);
  const missing = checklist.items.filter((i) => !i.done).map((i) => i.label);
  const reply = missing.length
    ? `Your artist profile is **${checklist.completion}% complete**. To rank higher in search and earn more, add: **${missing.join(", ")}**.`
    : "Your artist profile is **complete**. Keep your **calendar** filled to stay visible.";
  return {
    success: true,
    reply,
    intent: "artist_profile_help",
    profileChecklist: checklist,
    cardType: "profileChecklist",
    actions: [
      { label: "Open Profile", type: "navigate", value: "/artist/profile", variant: "primary" },
      { label: "Edit Profile", type: "navigate", value: "/artist/edit-profile", variant: "ghost" },
    ],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "artist_profile_help"),
    source: "rules",
  };
}

/* ---------------- Artist topics (calendar / earnings / requests / visibility / dashboard) ---------------- */

function handleArtistTopic(
  intent: AssistantIntent,
  session: AISessionState,
  ctx: BotContext,
  profile: ArtistProfileSnapshot | undefined
): AssistantApiResponse {
  const map: Record<string, { faqId: string; actions: ChatAction[] }> = {
    artist_calendar_help: {
      faqId: "artist-calendar",
      actions: [{ label: "Open Calendar", type: "navigate", value: "/artist/calendar", variant: "primary" }],
    },
    artist_booking_request_help: {
      faqId: "artist-booking-requests",
      actions: [
        { label: "Booking Requests", type: "navigate", value: "/artist/bookings", variant: "primary" },
      ],
    },
    artist_earnings_help: {
      faqId: "artist-earnings",
      actions: [{ label: "Open Earnings", type: "navigate", value: "/artist/earnings", variant: "primary" }],
    },
    artist_visibility_help: {
      faqId: "artist-tips",
      actions: [
        { label: "Edit Profile", type: "navigate", value: "/artist/edit-profile", variant: "primary" },
        { label: "Open Calendar", type: "navigate", value: "/artist/calendar", variant: "ghost" },
      ],
    },
    artist_dashboard_help: {
      faqId: "artist-dashboard",
      actions: [{ label: "Open Dashboard", type: "navigate", value: "/home/artist", variant: "primary" }],
    },
  };
  const entry = FAQ.find((f) => f.id === map[intent]?.faqId);
  const reply = entry?.answer ?? "Let me know which artist tool you would like help with.";
  // For visibility tips, attach a checklist if the artist profile is incomplete.
  const checklist =
    intent === "artist_visibility_help" || intent === "artist_dashboard_help"
      ? buildArtistChecklist(profile)
      : undefined;
  return {
    success: true,
    reply,
    intent,
    profileChecklist: checklist && checklist.completion < 100 ? checklist : undefined,
    cardType: checklist && checklist.completion < 100 ? "profileChecklist" : "info",
    actions: map[intent]?.actions ?? [],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, intent),
    source: "rules",
  };
}

/* ---------------- Payment / cancellation / status / planning / greet / help / fallback ---------------- */

function handlePayment(session: AISessionState, ctx: BotContext): AssistantApiResponse {
  return {
    success: true,
    reply:
      "**Payment help**\n\nPayments run through **Stripe** (cards, Apple Pay, Google Pay). **50% advance** on artist confirmation; remaining balance **48 hours** before the event. Refunds: **100%** if cancelled more than 14 days out, **50%** if 7–14 days, **none** under 7 days.",
    intent: "payment_help",
    actions: [
      { label: "Pay Advance", type: "navigate", value: "/checkout/advance", variant: "primary" },
      { label: "View My Bookings", type: "navigate", value: "/bookings", variant: "ghost" },
    ],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "payment_help"),
    source: "rules",
  };
}

function handleCancellation(session: AISessionState, ctx: BotContext): AssistantApiResponse {
  return {
    success: true,
    reply:
      "For **cancellations** or **reschedules**, open the booking and follow the on-page actions. Refund depends on how close you are to the event (see **Payment help**).",
    intent: "cancellation_help",
    actions: [
      { label: "View My Bookings", type: "navigate", value: "/bookings", variant: "primary" },
      { label: "Payment Help", type: "prompt", value: "What is the cancellation policy?", variant: "ghost" },
    ],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "cancellation_help"),
    source: "rules",
  };
}

function handleBookingStatus(session: AISessionState, ctx: BotContext): AssistantApiResponse {
  return {
    success: true,
    reply: "You can review **status**, dates, and payment steps anytime from **My Bookings**.",
    intent: "booking_status_help",
    actions: [{ label: "View My Bookings", type: "navigate", value: "/bookings", variant: "primary" }],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "booking_status_help"),
    source: "rules",
  };
}

function handleEventPlanning(session: AISessionState, ctx: BotContext): AssistantApiResponse {
  return {
    success: true,
    reply:
      "Here is a simple **event run-of-show** template:\n- **T-30d**: shortlist artists + confirm budget\n- **T-14d**: confirm booking + deposit\n- **T-7d**: finalize setlist / playlist + stage needs\n- **T-48h**: balance payment + final headcount\n- **Day-of**: soundcheck, hospitality, timeline buffer",
    intent: "event_planning",
    actions: [{ label: "Find Artists", type: "navigate", value: "/search", variant: "primary" }],
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "event_planning"),
    source: "rules",
  };
}

function handleGreet(
  session: AISessionState,
  ctx: BotContext,
  profile: ClientProfileSnapshot | undefined
): AssistantApiResponse {
  const name = profile?.fullName ? `, **${profile.fullName.split(" ")[0]}**` : "";
  return {
    success: true,
    reply: `Hello${name}! ${ctx.welcomeMessage}`,
    intent: "greet",
    welcome: ctx.welcomeMessage,
    quickReplies: ctx.suggestedTopics,
    actions:
      ctx.userRole === "artist"
        ? [{ label: "Open Dashboard", type: "navigate", value: "/home/artist", variant: "primary" }]
        : ctx.userRole === "client"
          ? [{ label: "View Artists", type: "navigate", value: "/search", variant: "primary" }]
          : [{ label: "Sign Up", type: "navigate", value: "/sign-up", variant: "primary" }],
    session: withSession(session, "greet"),
    source: "rules",
  };
}

function handleHelp(session: AISessionState, ctx: BotContext): AssistantApiResponse {
  const topics = ctx.suggestedTopics.map((t) => `- ${t}`).join("\n");
  return {
    success: true,
    reply: `Here is what I can help you with on this page:\n${topics}\n\nAsk in your own words — I will pull the right page for you.`,
    intent: "help",
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "help"),
    source: "rules",
  };
}

async function handleFamous(session: AISessionState, ctx: BotContext): Promise<AssistantApiResponse> {
  const top = (await recommendArtists({})).slice(0, 5);
  return {
    success: true,
    reply: "Here are some **highly rated** picks on the platform right now:",
    intent: "famous",
    artists: top,
    cardType: "artistRecommendation",
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "famous"),
    source: "rules",
  };
}

async function handleStats(session: AISessionState, ctx: BotContext): Promise<AssistantApiResponse> {
  const pool = await recommendArtists({});
  const avg = pool.length ? Math.round(pool.reduce((s, a) => s + a.hourlyRate, 0) / pool.length) : 0;
  return {
    success: true,
    reply: `**Live roster snapshot**\n- Artists in catalog: **${pool.length}**\n- Typical hourly rate: **$${avg}/hr**\n- Ratings shown on cards are real client reviews`,
    intent: "stats",
    quickReplies: ctx.suggestedTopics,
    session: withSession(session, "stats"),
    source: "rules",
  };
}

function faqResponse(
  faqId: string,
  session: AISessionState,
  ctx: BotContext,
  intent: AssistantIntent,
  audience: "client" | "artist" | "any"
): AssistantApiResponse {
  const entry: FaqEntry | undefined = FAQ.find((f) => f.id === faqId);
  const fallback = answerFromKnowledge(faqId, audience);
  const final = entry ?? fallback;
  return {
    success: true,
    reply:
      final?.answer ??
      "I can help with website info, registration, login, booking, payment, and more. What would you like to know?",
    intent,
    actions: final?.actions,
    quickReplies: final?.followUps?.length ? final.followUps : ctx.suggestedTopics,
    session: withSession(session, intent),
    source: "rules",
  };
}

function handleFallback(
  userMessage: string,
  session: AISessionState,
  ctx: BotContext,
  audience: "client" | "artist" | "any"
): AssistantApiResponse {
  // Last-chance: try the curated KB before giving up so the bot rarely returns
  // a truly generic answer.
  const kb = answerFromKnowledge(userMessage, audience);
  if (kb) {
    const routes = findRoutes(userMessage, 3);
    return {
      success: true,
      reply: kb.answer,
      intent: "fallback",
      actions: [
        ...(kb.actions ?? []),
        ...routes
          .filter((r) => !(kb.actions ?? []).some((a) => a.value === r.path))
          .map<ChatAction>((r) => ({
            label: r.label,
            type: "navigate",
            value: r.path,
            variant: "ghost",
          })),
      ],
      quickReplies: kb.followUps?.length ? kb.followUps : ctx.suggestedTopics,
      session: withSession(session, "fallback"),
      source: "rules",
    };
  }

  return {
    success: true,
    reply: `I did not quite catch that. ${ctx.welcomeMessage}\n\nTry one of the suggestions below.`,
    intent: "fallback",
    quickReplies: ctx.suggestedTopics,
    actions:
      ctx.userRole === "artist"
        ? [{ label: "Open Dashboard", type: "navigate", value: "/home/artist", variant: "ghost" }]
        : ctx.userRole === "client"
          ? [{ label: "View Artists", type: "navigate", value: "/search", variant: "ghost" }]
          : [{ label: "Sign Up", type: "navigate", value: "/sign-up", variant: "ghost" }],
    session: withSession(session, "fallback"),
    source: "rules",
  };
}

/** Re-export so the API route only needs one import line. */
export type { BotContext, PageType, UserRole };
