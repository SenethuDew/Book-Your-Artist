/**
 * Step-by-step booking wizard (one question at a time).
 * Persisted in Firestore `ai_sessions/{userId}`; echoed in API responses as `session`.
 */

import type {
  AISessionState,
  BookingData,
  BookingWizardStep,
  ChatAction,
  ClientProfileSnapshot,
  RecommendedArtist,
} from "./types";
import { recommendArtists } from "./recommendArtists";

export interface BookingFlowResult {
  reply: string;
  session: AISessionState;
  artists?: RecommendedArtist[];
  actions?: ChatAction[];
  quickReplies?: string[];
  bookingSummary?: import("./types").BookingSummaryPayload;
  validationWarning?: string;
}

const EVENTS = [
  "wedding",
  "party",
  "birthday",
  "corporate",
  "festival",
  "concert",
  "club",
  "lounge",
  "private",
];

const SL_CITIES = [
  "colombo",
  "kandy",
  "galle",
  "negombo",
  "jaffna",
  "matara",
  "nugegoda",
  "dehiwala",
  "moratuwa",
  "mount lavinia",
  "kurunegala",
];

/** Merge Firestore `clients/{userId}` preferences so we skip redundant questions. */
export function mergeProfileDefaults(
  data: BookingData,
  profile?: ClientProfileSnapshot
): BookingData {
  const d = { ...data };
  if (!d.eventType && profile?.preferredEventType) d.eventType = profile.preferredEventType;
  if (!d.category && profile?.preferredArtistCategory) d.category = profile.preferredArtistCategory;
  if (!d.location && profile?.location) d.location = profile.location;
  if (d.budgetMin == null && profile?.budgetMin != null) d.budgetMin = profile.budgetMin;
  if (d.budgetMax == null && profile?.budgetMax != null) d.budgetMax = profile.budgetMax;
  return d;
}

export function extractEventType(m: string): string | undefined {
  return EVENTS.find((e) => m.toLowerCase().includes(e));
}

export function extractCategory(m: string): string | undefined {
  const x = m.toLowerCase();
  if (x.includes("dj")) return "DJs";
  if (x.includes("singer") || x.includes("vocal")) return "Singers";
  if (x.includes("band")) return "Bands";
  if (x.includes("rap") || x.includes("hip hop") || x.includes("hip-hop")) return "Rappers";
  return undefined;
}

export function extractLocation(m: string, profile?: ClientProfileSnapshot): string | undefined {
  const x = m.toLowerCase();
  if (/\b(same as profile|use my profile location)\b/.test(x)) return profile?.location;
  const city = SL_CITIES.find((c) => x.includes(c));
  if (city) return city.replace(/\b\w/g, (l) => l.toUpperCase()) + ", Sri Lanka";
  return undefined;
}

export function extractOrigin(m: string): "local" | "international" | undefined {
  const x = m.toLowerCase();
  if (/\b(either|any|both|no preference)\b/.test(x)) return undefined;
  if (/\binternational|global|world|abroad|overseas\b/.test(x)) return "international";
  if (/\blocal|sri lanka|lankan\b/.test(x)) return "local";
  return undefined;
}

export function extractEventDate(m: string): { date?: string; error?: string } {
  const x = m.toLowerCase().trim();
  const iso = x.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) {
    const d = new Date(iso[1] + "T12:00:00");
    if (Number.isNaN(d.getTime()))
      return { error: "That date doesn't look valid. Try **YYYY-MM-DD** (e.g. 2026-06-15)." };
    return { date: iso[1] };
  }
  if (/\btomorrow\b/.test(x)) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return { date: t.toISOString().slice(0, 10) };
  }
  if (/\bnext (sat|sun|fri|mon)|next week\b/.test(x)) {
    const t = new Date();
    t.setDate(t.getDate() + 7);
    return { date: t.toISOString().slice(0, 10) };
  }
  return {};
}

export function extractBudgetRange(
  m: string
): { min?: number; max?: number; error?: string } {
  const x = m.toLowerCase();
  const range = x.match(/(\d[\d,]*)\s*[-–to]+\s*(\d[\d,]*)/);
  if (range) {
    const min = parseInt(range[1].replace(/,/g, ""), 10);
    const max = parseInt(range[2].replace(/,/g, ""), 10);
    if (min > max) return { error: "Budget range looks reversed (min is larger than max). Try again." };
    return { min, max };
  }
  const under = x.match(/(?:under|below|less than|max|<=?)\s*(?:\$|lkr\s*)?\s*(\d[\d,]*)/i);
  if (under) return { max: parseInt(under[1].replace(/,/g, ""), 10) };
  const over = x.match(/(?:above|over|at least|min)\s*(?:\$|lkr\s*)?\s*(\d[\d,]*)/i);
  if (over) return { min: parseInt(over[1].replace(/,/g, ""), 10) };
  const plain = x.match(/\$\s*(\d[\d,]*)/);
  if (plain) return { max: parseInt(plain[1].replace(/,/g, ""), 10) };
  return {};
}

function initialSession(): AISessionState {
  return {
    currentIntent: "book",
    bookingStep: "eventType",
    bookingData: {},
    updatedAt: Date.now(),
  };
}

/**
 * Try to fill any missing booking fields from free-form user text (any step).
 */
function absorbFreeForm(message: string, data: BookingData, profile?: ClientProfileSnapshot): BookingData {
  const d = { ...data };
  const m = message.toLowerCase();
  if (!d.eventType) {
    const ev = extractEventType(m);
    if (ev) d.eventType = ev;
  }
  if (!d.eventDate) {
    const { date, error } = extractEventDate(message);
    if (error) throw new Error(error);
    if (date) d.eventDate = date;
  }
  if (!d.location) {
    const loc = extractLocation(message, profile);
    if (loc) d.location = loc;
  }
  if (!d.category) {
    const cat = extractCategory(m);
    if (cat) d.category = cat;
  }
  if (d.budgetMax == null && d.budgetMin == null) {
    const { min, max, error } = extractBudgetRange(message);
    if (error) throw new Error(error);
    if (min != null) d.budgetMin = min;
    if (max != null) d.budgetMax = max;
  }
  if (!d.origin && !d.originFlexible) {
    if (/\b(either|any|both|no preference)\b/.test(m)) d.originFlexible = true;
    else {
      const o = extractOrigin(m);
      if (o) d.origin = o;
    }
  }
  return d;
}

function nextAskStep(d: BookingData): BookingWizardStep {
  if (!d.eventType) return "eventType";
  if (!d.eventDate) return "date";
  if (!d.location) return "location";
  if (!d.category) return "category";
  if (d.budgetMax == null && d.budgetMin == null) return "budget";
  if (!d.origin && !d.originFlexible) return "origin";
  return "recommend";
}

function promptForStep(
  step: BookingWizardStep,
  session: AISessionState,
  profile?: ClientProfileSnapshot
): Omit<BookingFlowResult, "session" | "artists"> & { session: AISessionState } {
  switch (step) {
    case "eventType":
      return {
        reply: profile?.preferredEventType
          ? `I'll use your saved preferred event type (**${profile.preferredEventType}**). Say a different type if you want to change it.`
          : "**Step 1 of 7** — What type of event is this?",
        session: { ...session, bookingStep: "eventType", updatedAt: Date.now() },
        quickReplies: ["Wedding", "Corporate event", "Birthday party", "Club night"],
      };
    case "date":
      return {
        reply: "**Step 2 of 7** — What is the **event date**? (Use **YYYY-MM-DD** or say **tomorrow**.)",
        session: { ...session, bookingStep: "date", updatedAt: Date.now() },
        quickReplies: ["Tomorrow", "2026-06-20", "Next Saturday"],
      };
    case "location":
      return {
        reply: profile?.location
          ? `Your profile location is **${profile.location}**. Say **"same as profile"** to use it, or type a different city/venue.`
          : "**Step 3 of 7** — Where will the event take place?",
        session: { ...session, bookingStep: "location", updatedAt: Date.now() },
        quickReplies: ["Colombo", "Kandy", "Same as profile"],
      };
    case "category":
      return {
        reply: profile?.preferredArtistCategory
          ? `I'll use your saved preferred artist category (**${profile.preferredArtistCategory}**). Pick another if you prefer.`
          : "**Step 4 of 7** — What type of artist do you need?",
        session: { ...session, bookingStep: "category", updatedAt: Date.now() },
        quickReplies: ["DJ", "Singer", "Band", "Rapper"],
      };
    case "budget": {
      const cur = profile?.budgetCurrency === "LKR" ? "LKR" : "USD";
      if (profile?.budgetMin != null && profile?.budgetMax != null) {
        return {
          reply: `I'll use your saved budget range of **${cur} ${profile.budgetMin.toLocaleString()}–${profile.budgetMax.toLocaleString()}** per hour. Say **"change budget"** to enter a new range.`,
          session: { ...session, bookingStep: "budget", updatedAt: Date.now() },
          quickReplies: ["Change budget", "Continue"],
        };
      }
      return {
        reply: `**Step 5 of 7** — What is your **hourly budget range**? (e.g. \`100-300\` or \`under 200\` in ${cur})`,
        session: { ...session, bookingStep: "budget", updatedAt: Date.now() },
        quickReplies: ["under 150", "100-300", "500-1000", "no limit"],
      };
    }
    case "origin":
      return {
        reply: "**Step 6 of 7** — Prefer **local** (Sri Lanka) or **international** artists?",
        session: { ...session, bookingStep: "origin", updatedAt: Date.now() },
        quickReplies: ["Local", "International", "Either"],
      };
    default:
      return {
        reply: "Let's continue your booking.",
        session: { ...session, bookingStep: "eventType", updatedAt: Date.now() },
      };
  }
}

function buildSummary(session: AISessionState, profile?: ClientProfileSnapshot): BookingFlowResult {
  const d = session.bookingData;
  const est = d.budgetMax ?? d.budgetMin ?? profile?.budgetMax ?? profile?.budgetMin;
  return {
    reply: "Here is your **booking summary**. Tap **Confirm and Continue** to open the artist profile and pick a published slot.",
    session: { ...session, bookingStep: "summary", currentIntent: "book", updatedAt: Date.now() },
    bookingSummary: {
      eventType: d.eventType,
      category: d.category,
      selectedArtistId: d.selectedArtistId,
      selectedArtistName: d.selectedArtistName,
      eventDate: d.eventDate,
      location: d.location,
      budgetMin: d.budgetMin,
      budgetMax: d.budgetMax,
      origin: d.origin,
      estimatedHourly: typeof est === "number" ? est : undefined,
      currency: profile?.budgetCurrency ?? "USD",
    },
    actions: [
      {
        label: "Confirm and Continue",
        type: "navigate",
        value: `/artist/${d.selectedArtistId}?from=ai-assistant`,
        variant: "primary",
      },
      { label: "Edit Details", type: "prompt", value: "Edit booking details", variant: "ghost" },
      { label: "Cancel", type: "prompt", value: "cancel booking", variant: "ghost" },
    ],
  };
}

/**
 * Main wizard entry. Loads Firestore-backed recommendations when all required fields are set.
 */
export async function processBookingMessage(
  message: string,
  prev: AISessionState | null | undefined,
  profile: ClientProfileSnapshot | undefined
): Promise<BookingFlowResult> {
  const m = message.toLowerCase().trim();

  const session: AISessionState =
    prev?.currentIntent === "book" && prev.bookingStep !== "done"
      ? { ...prev, bookingData: { ...prev.bookingData }, updatedAt: Date.now() }
      : initialSession();

  if (/\b(cancel booking|stop|exit)\b/.test(m)) {
    return {
      reply:
        "Booking flow cancelled. I can help with **recommendations**, **payments**, **profile**, or **upcoming bookings** — what would you like next?",
      session: {
        currentIntent: "help",
        bookingStep: "done",
        bookingData: {},
        lastUserIntent: "book",
        updatedAt: Date.now(),
      },
      quickReplies: [
        "Recommend a DJ for a wedding",
        "Check my upcoming bookings",
        "Payment help",
      ],
    };
  }

  if (/\bedit booking details\b/.test(m)) {
    session.bookingData = mergeProfileDefaults({}, profile);
    session.bookingStep = "eventType";
    return { ...promptForStep("eventType", session, profile), session: session };
  }

  // UI: artist picked from card
  if (message.startsWith("__select_artist__:")) {
    const rest = message.replace("__select_artist__:", "");
    const [id, ...nameParts] = rest.split("::");
    session.bookingData.selectedArtistId = id;
    session.bookingData.selectedArtistName = nameParts.join("::").trim();
    session.selectedArtistId = id;
    return buildSummary(session, profile);
  }

  // Confirm from summary
  if (session.bookingStep === "summary" && /\b(confirm|continue|yes|looks good)\b/.test(m)) {
    const id = session.bookingData.selectedArtistId;
    if (!id) {
      return {
        reply: "Please pick an artist with **Book Now** first.",
        session,
        quickReplies: ["Show recommendations again"],
      };
    }
    return {
      reply: "Opening the artist profile — choose a **green slot** on their calendar to continue.",
      session: { ...session, bookingStep: "done", currentIntent: "help", updatedAt: Date.now() },
      actions: [
        {
          label: "Confirm and Continue",
          type: "navigate",
          value: `/artist/${id}?from=ai-assistant`,
          variant: "primary",
        },
        { label: "View My Bookings", type: "navigate", value: "/bookings", variant: "ghost" },
      ],
    };
  }

  try {
    session.bookingData = mergeProfileDefaults(session.bookingData, profile);
    session.bookingData = absorbFreeForm(message, session.bookingData, profile);
    session.bookingData = mergeProfileDefaults(session.bookingData, profile);
  } catch (e) {
    const err = e instanceof Error ? e.message : "Invalid input.";
    return { reply: err, session, validationWarning: err };
  }

  // Budget step: "Continue" accepts profile range already merged
  if (session.bookingStep === "budget" && /\b(continue|looks good|ok|yes)\b/.test(m)) {
    session.bookingData = mergeProfileDefaults(session.bookingData, profile);
  }
  if (session.bookingStep === "budget" && /\bchange budget\b/.test(m)) {
    session.bookingData.budgetMin = undefined;
    session.bookingData.budgetMax = undefined;
    return promptForStep("budget", session, profile);
  }

  const d = session.bookingData;
  const step = nextAskStep(d);

  if (step !== "recommend") {
    const p = promptForStep(step, { ...session, bookingData: d }, profile);
    return { ...p, session: { ...p.session, bookingData: d } };
  }

  const recommendedArtists = await recommendArtists({
    ...d,
    genreHint: d.category,
  });

  session.bookingStep = "recommend";
  const originLabel = d.origin ?? (d.originFlexible ? "local or international" : "local or international");
  const intro =
    recommendedArtists.length > 0
      ? `**Step 7** — Top matches for **${d.eventType}** on **${d.eventDate}** in **${d.location}** (${d.category}, **${originLabel}**). Use **Book Now** on a card when you're ready.`
      : `I couldn't find strong matches for every filter. Try **Edit Details**, raise the budget, or browse all artists.`;

  return {
    reply: intro,
    session: { ...session, bookingData: d, bookingStep: "recommend", updatedAt: Date.now() },
    artists: recommendedArtists,
    actions: [
      { label: "View Artists", type: "navigate", value: "/search", variant: "ghost" },
      { label: "Edit Details", type: "prompt", value: "Edit booking details", variant: "ghost" },
    ],
    quickReplies: ["Show international only", "Increase budget", "Payment help"],
  };
}
