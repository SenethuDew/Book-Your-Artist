import { NextRequest, NextResponse } from "next/server";
import {
  ALL_CATALOG_ARTISTS,
  CatalogArtist,
  filterCatalogArtists,
} from "@/lib/artistCatalog";

/* =========================================================================
 * Types
 * ======================================================================= */
export type Intent =
  | "greet"
  | "recommend"
  | "book"
  | "profile"
  | "payment"
  | "famous"
  | "stats"
  | "help"
  | "fallback";

export interface BookingFlowState {
  active: boolean;
  step: "eventType" | "date" | "budget" | "category" | "summary" | "done";
  eventType?: string;
  date?: string;
  budget?: number;
  category?: string;
}

export interface ChatAction {
  label: string;
  type: "navigate" | "prompt";
  value: string;
  variant?: "primary" | "ghost";
}

export interface AssistantResponse {
  reply: string;
  intent: Intent;
  artists?: CatalogArtist[];
  actions?: ChatAction[];
  quickReplies?: string[];
  bookingFlow?: BookingFlowState;
  source: "openai" | "rules";
}

interface ProfileSnapshot {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  preferences?: { eventType?: string; budget?: number; genres?: string[] };
}

interface IncomingPayload {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  profile?: ProfileSnapshot;
  bookingFlow?: BookingFlowState;
}

/* =========================================================================
 * Knowledge base
 * ======================================================================= */
const KB = {
  about:
    "Book Your Artist is a curated marketplace for booking verified DJs, singers, live bands, and rappers in Sri Lanka and beyond.",
  bookingFlow: [
    "Search artists by category, location, or budget.",
    "Open a profile, review portfolio + reviews.",
    "Pick a green published slot in the booking calendar.",
    "Pay 50% advance via Stripe.",
    "Wait for artist confirmation; chat in-app.",
    "Pay remaining 50% balance 48h before event.",
    "Leave a rating after the show.",
  ],
  payment:
    "Payments run through Stripe (cards, Apple Pay, Google Pay). 50% advance on confirmation, 50% balance auto-charged 48h before the event. Refunds: 100% >14 days out, 50% if 7-14 days, none under 7 days.",
  profileTips: [
    "Add a clear profile photo.",
    "Set your city / venue location.",
    "Add a phone number for venue coordination.",
    "Keep name + email accurate for invoices.",
  ],
};

/* =========================================================================
 * Intent + entity extraction (rule-based brain)
 * ======================================================================= */
const detectIntent = (raw: string, flow?: BookingFlowState): Intent => {
  const m = raw.toLowerCase().trim();
  if (flow?.active) return "book";
  if (/^(hi|hello|hey|yo|namaste|ayubowan|good (morning|evening|afternoon))/.test(m))
    return "greet";
  if (/\b(book|booking|reserve|hire)\b/.test(m) && !/policy|payment|cancel/.test(m))
    return "book";
  if (/\b(recommend|suggest|find|show|need|looking for|who should)\b/.test(m))
    return "recommend";
  if (/\b(profile|account|settings|complete|my info)\b/.test(m)) return "profile";
  if (/\b(payment|stripe|advance|fee|charge|refund|cancel|policy|cost|price)\b/.test(m))
    return "payment";
  if (/\b(famous|popular|top|legend|iconic|best in the world)\b/.test(m)) return "famous";
  if (/\b(stats|statistics|how many|numbers)\b/.test(m)) return "stats";
  if (/\b(help|what can you|commands|guide)\b/.test(m)) return "help";
  if (/\b(dj|singer|band|rapper|wedding|party|event|birthday|corporate)\b/.test(m))
    return "recommend";
  return "fallback";
};

const CATEGORY_KEYS = [
  { keys: ["dj"], label: "DJs" },
  { keys: ["singer", "vocalist", "vocal"], label: "Singers" },
  { keys: ["band", "live music"], label: "Bands" },
  { keys: ["rapper", "rap", "hip hop", "hip-hop"], label: "Rappers" },
];

const EVENT_KEYS = [
  "wedding", "party", "birthday", "corporate", "festival",
  "concert", "club", "lounge", "private", "outdoor", "stadium",
];

const SL_CITIES = [
  "colombo", "kandy", "galle", "negombo", "jaffna", "matara",
  "nugegoda", "dehiwala", "moratuwa", "mount lavinia", "kurunegala",
];

const extractCategory = (m: string): string | undefined =>
  CATEGORY_KEYS.find((c) => c.keys.some((k) => m.includes(k)))?.label;

const extractEvent = (m: string): string | undefined =>
  EVENT_KEYS.find((e) => m.includes(e));

const extractBudget = (m: string): number | undefined => {
  const match =
    m.match(/(?:under|below|less than|max|<=?)\s*\$?(\d{2,6})/i) ||
    m.match(/budget\s*(?:of|is)?\s*\$?(\d{2,6})/i) ||
    m.match(/\$\s?(\d{2,6})/);
  return match ? parseInt(match[1], 10) : undefined;
};

const extractLocation = (m: string): string | undefined =>
  SL_CITIES.find((c) => m.includes(c)) ||
  (/\binternational|global|world/.test(m) ? undefined : undefined);

const extractOrigin = (m: string): "local" | "international" | undefined => {
  if (/\binternational|global|world|abroad\b/.test(m)) return "international";
  if (/\blocal|sri lanka|sri lankan|sinhala\b/.test(m)) return "local";
  return undefined;
};

const extractDate = (m: string): string | undefined => {
  const iso = m.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const dmy = m.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (dmy) {
    const [, d, mo, y] = dmy;
    const yyyy = y.length === 2 ? `20${y}` : y;
    return `${yyyy}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/\btomorrow\b/.test(m)) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().slice(0, 10);
  }
  if (/\bnext (week|saturday|sunday|friday)\b/.test(m)) {
    const t = new Date();
    t.setDate(t.getDate() + 7);
    return t.toISOString().slice(0, 10);
  }
  return undefined;
};

/* =========================================================================
 * Booking flow state machine
 * ======================================================================= */
const stepBookingFlow = (
  flow: BookingFlowState | undefined,
  message: string
): { reply: string; flow: BookingFlowState; artists?: CatalogArtist[]; actions?: ChatAction[]; quickReplies?: string[] } => {
  const m = message.toLowerCase();

  // Initialise if not active
  const f: BookingFlowState = flow?.active
    ? { ...flow }
    : { active: true, step: "eventType" };

  // Allow user to cancel
  if (/\b(cancel|stop|exit|quit)\b/.test(m)) {
    return {
      reply: "No problem — booking flow cancelled. Ask me anything else!",
      flow: { active: false, step: "done" },
      quickReplies: ["Recommend a DJ", "How does payment work?"],
    };
  }

  // Auto-fill from message
  if (!f.eventType) f.eventType = extractEvent(m);
  if (!f.date) f.date = extractDate(m);
  if (!f.budget) f.budget = extractBudget(m);
  if (!f.category) f.category = extractCategory(m);

  // Step routing
  if (!f.eventType) {
    f.step = "eventType";
    return {
      reply: "**Step 1 of 4** — What type of event is this?",
      flow: f,
      quickReplies: ["Wedding", "Birthday party", "Corporate event", "Club night"],
    };
  }
  if (!f.category) {
    f.step = "category";
    return {
      reply: `Got it — **${f.eventType}**. **Step 2 of 4** — What kind of artist do you need?`,
      flow: f,
      quickReplies: ["DJ", "Singer", "Band", "Rapper"],
    };
  }
  if (!f.date) {
    f.step = "date";
    return {
      reply: `Nice choice! **Step 3 of 4** — What's the event date? (e.g. 2026-06-15 or "next Saturday")`,
      flow: f,
      quickReplies: ["Tomorrow", "Next Saturday", "2026-06-15"],
    };
  }
  if (!f.budget) {
    f.step = "budget";
    return {
      reply: `**Step 4 of 4** — What's your **hourly budget** (USD)? Try "under 200".`,
      flow: f,
      quickReplies: ["under 100", "under 250", "under 500", "no limit"],
    };
  }

  // All filled → recommend
  f.step = "summary";
  const artists = filterCatalogArtists({
    category: f.category,
    eventType: f.eventType,
    budgetMax: f.budget && f.budget > 0 ? f.budget : undefined,
  }).slice(0, 5);

  if (!artists.length) {
    return {
      reply: `I couldn't find a perfect match for **${f.category}** at **$${f.budget}/hr** for a **${f.eventType}**. Try raising the budget or relaxing the category.`,
      flow: { ...f, step: "done", active: false },
      quickReplies: [
        "Increase budget to 500",
        "Show all DJs",
        "Show all singers",
      ],
    };
  }

  return {
    reply: `Here are the **best matches** for your ${f.eventType} on ${f.date} (${f.category}, budget $${f.budget}/hr):`,
    flow: { ...f, step: "done", active: false },
    artists,
    actions: [
      { label: "Browse all artists", type: "navigate", value: "/search", variant: "ghost" },
    ],
    quickReplies: [
      "Show more options",
      "How do I pay the advance?",
      "Start a new search",
    ],
  };
};

/* =========================================================================
 * Recommendation engine
 * ======================================================================= */
const buildRecommendation = (message: string, profile?: ProfileSnapshot) => {
  const m = message.toLowerCase();
  const filter = {
    category: extractCategory(m) || profile?.preferences?.genres?.[0],
    eventType: extractEvent(m) || profile?.preferences?.eventType,
    budgetMax: extractBudget(m) || profile?.preferences?.budget,
    location: extractLocation(m) || profile?.location?.toLowerCase(),
    origin: extractOrigin(m),
  };

  const artists = filterCatalogArtists(filter).slice(0, 5);

  const filterParts = [
    filter.category && `**${filter.category}**`,
    filter.eventType && `for a **${filter.eventType}**`,
    filter.location && `in **${filter.location}**`,
    filter.budgetMax && `under **$${filter.budgetMax}/hr**`,
    filter.origin === "international" && "(international)",
    filter.origin === "local" && "(local)",
  ]
    .filter(Boolean)
    .join(" ");

  if (!artists.length) {
    const altFilter = { category: filter.category };
    const alt = filterCatalogArtists(altFilter).slice(0, 3);
    return {
      reply: `I couldn't find ${filterParts}. Here are similar alternatives instead:`,
      artists: alt,
      actions: [
        { label: "Browse all artists", type: "navigate" as const, value: "/search", variant: "ghost" as const },
      ],
      quickReplies: ["Increase my budget", "Try international artists", "Show top-rated"],
    };
  }

  return {
    reply: filterParts
      ? `Top matches ${filterParts}:`
      : "Top-rated artists across the platform:",
    artists,
    actions: [
      { label: "Browse all", type: "navigate" as const, value: "/search", variant: "ghost" as const },
    ],
    quickReplies: [
      filter.category ? `Show ${filter.category} only` : "Show DJs only",
      "Find a band for a wedding",
      "How do I book?",
    ],
  };
};

/* =========================================================================
 * Profile-aware response
 * ======================================================================= */
const buildProfileResponse = (profile?: ProfileSnapshot) => {
  const fields = [
    { key: "name", label: "Name", value: profile?.name },
    { key: "email", label: "Email", value: profile?.email },
    { key: "phone", label: "Phone", value: profile?.phone },
    { key: "location", label: "Location", value: profile?.location },
    { key: "profileImage", label: "Profile photo", value: profile?.profileImage },
  ];
  const missing = fields.filter((f) => !f.value).map((f) => f.label);

  if (!profile) {
    return {
      reply: "I couldn't read your profile. Try logging in again, or open profile settings to verify everything.",
      actions: [
        { label: "Open Profile Settings", type: "navigate" as const, value: "/profile/settings", variant: "primary" as const },
      ],
    };
  }

  if (missing.length === 0) {
    return {
      reply: `Nice — your profile is **100% complete**, ${profile.name?.split(" ")[0] || "friend"}! You're booking-ready.\n\nQuick tips:\n${KB.profileTips.map((t) => `- ${t}`).join("\n")}`,
      actions: [
        { label: "View My Profile", type: "navigate" as const, value: "/profile", variant: "primary" as const },
      ],
      quickReplies: ["Recommend an artist for me", "How does payment work?"],
    };
  }

  return {
    reply: `Your profile is missing: **${missing.join(", ")}**. Completing these speeds up bookings and helps artists contact you.`,
    actions: [
      { label: "Edit Profile", type: "navigate" as const, value: "/profile/settings", variant: "primary" as const },
      { label: "View My Profile", type: "navigate" as const, value: "/profile", variant: "ghost" as const },
    ],
    quickReplies: KB.profileTips.slice(0, 3),
  };
};

/* =========================================================================
 * OpenAI integration (optional – falls back to rules)
 * ======================================================================= */
const callOpenAI = async (
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  message: string
): Promise<string | null> => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-10),
          { role: "user", content: message },
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
};

const buildSystemPrompt = (profile?: ProfileSnapshot) => `You are the AI Booking Concierge for "Book Your Artist", a marketplace for booking DJs, singers, bands, and rappers (Sri Lanka focus). 
Help clients in 4 areas: artist recommendations, booking + Stripe payments, profile completion, real-world music industry knowledge.
Style: concise (under 220 words), markdown bold + bullet lists, friendly expert tone.
${profile ? `Client profile: ${JSON.stringify({ name: profile.name, location: profile.location, prefs: profile.preferences })}` : ""}
Booking flow: ${KB.bookingFlow.join(" | ")}
Payment policy: ${KB.payment}
Top platform artists you can mention: ${ALL_CATALOG_ARTISTS.slice(0, 8).map((a) => `${a.name} (${a.category}, $${a.hourlyRate}/hr, ★${a.rating})`).join("; ")}`;

/* =========================================================================
 * Main handler
 * ======================================================================= */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IncomingPayload;
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ success: false, message: "Message required" }, { status: 400 });
    }

    const intent = detectIntent(message, body.bookingFlow);
    let response: AssistantResponse;

    switch (intent) {
      case "greet": {
        response = {
          reply: `Hello${body.profile?.name ? `, **${body.profile.name.split(" ")[0]}**` : ""}! I'm your AI Booking Concierge. I can recommend artists, walk you through booking + payment, or help complete your profile. What do you need?`,
          intent,
          quickReplies: [
            "Recommend a DJ for a wedding",
            "Start a booking",
            "How do I pay?",
            "Help me complete my profile",
          ],
          source: "rules",
        };
        break;
      }

      case "book": {
        const stepRes = stepBookingFlow(body.bookingFlow, message);
        response = {
          reply: stepRes.reply,
          intent,
          artists: stepRes.artists,
          actions: stepRes.actions,
          quickReplies: stepRes.quickReplies,
          bookingFlow: stepRes.flow,
          source: "rules",
        };
        break;
      }

      case "recommend": {
        const r = buildRecommendation(message, body.profile);
        response = {
          reply: r.reply,
          intent,
          artists: r.artists,
          actions: r.actions,
          quickReplies: r.quickReplies,
          source: "rules",
        };
        break;
      }

      case "profile": {
        const r = buildProfileResponse(body.profile);
        response = {
          reply: r.reply,
          intent,
          actions: r.actions,
          quickReplies: r.quickReplies,
          source: "rules",
        };
        break;
      }

      case "payment": {
        response = {
          reply: `**Payment & cancellation**\n\n${KB.payment}\n\nThe **50% advance** is charged when the artist confirms your booking. The remaining balance auto-charges 48h before the event.`,
          intent,
          actions: [
            { label: "View My Bookings", type: "navigate", value: "/bookings", variant: "primary" },
          ],
          quickReplies: ["What if I cancel?", "Recommend an artist", "Start a booking"],
          source: "rules",
        };
        break;
      }

      case "famous": {
        const top = ALL_CATALOG_ARTISTS
          .slice()
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5);
        response = {
          reply: "Globally and locally celebrated picks:",
          intent,
          artists: top,
          quickReplies: ["Best Sri Lankan DJs", "Top international singers", "Top live bands"],
          source: "rules",
        };
        break;
      }

      case "stats": {
        const total = ALL_CATALOG_ARTISTS.length;
        const verified = total;
        const avg = Math.round(
          ALL_CATALOG_ARTISTS.reduce((s, a) => s + a.hourlyRate, 0) / total
        );
        response = {
          reply: `**Platform snapshot**\n- 🎤 ${verified} verified artists\n- 💰 Avg rate **$${avg}/hr**\n- 🌍 Local + international roster\n- ⭐ Average rating **${(
            ALL_CATALOG_ARTISTS.reduce((s, a) => s + a.rating, 0) / total
          ).toFixed(2)}**`,
          intent,
          quickReplies: ["Top-rated artists", "Cheapest DJs", "Premium bands"],
          source: "rules",
        };
        break;
      }

      case "help": {
        response = {
          reply: `I can help with:\n- **Artist recommendations** ("DJ in Colombo under $200")\n- **Booking flow** ("Book a singer for a wedding")\n- **Profile completion** ("Help me complete my profile")\n- **Payments + refunds** ("How does Stripe payment work?")\n- **Real-world music facts** ("Who are the most famous DJs?")\n\nTry a quick prompt on the right!`,
          intent,
          quickReplies: ["Recommend an artist", "Start a booking", "Show platform stats"],
          source: "rules",
        };
        break;
      }

      default: {
        const aiReply = await callOpenAI(
          buildSystemPrompt(body.profile),
          body.history || [],
          message
        );
        response = {
          reply:
            aiReply ||
            `I'm not sure I caught that. Try one of the quick prompts, or ask me to **recommend an artist**, **start a booking**, or **explain payments**.`,
          intent: "fallback",
          quickReplies: ["Recommend a DJ", "Start a booking", "Help me complete my profile"],
          source: aiReply ? "openai" : "rules",
        };
      }
    }

    // Try OpenAI for richer phrasing on greet/help/recommend if available
    if (!response.bookingFlow?.active && process.env.OPENAI_API_KEY && intent !== "fallback") {
      // Keep rules-based reply as authoritative; only enhance fallback case above.
    }

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    console.error("[ai-assistant] error:", error);
    return NextResponse.json(
      { success: false, message: "AI assistant error", error: String(error) },
      { status: 500 }
    );
  }
}
