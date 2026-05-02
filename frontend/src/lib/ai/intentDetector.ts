/**
 * Keyword-first intent detection.
 * TODO (future): Replace or augment with OpenAI function-calling / classification
 * by POSTing `userMessage` + `conversationState` to OpenAI and mapping the tool
 * output to `AssistantIntent`.
 *
 * The detector is now context-aware: when a logged-in artist asks
 * "how do I use this?" we resolve to `artist_dashboard_help` instead of the
 * generic `help`, and the API uses that to pick a different answer.
 */

import type { AISessionState, AssistantIntent, UserRole } from "./types";

export interface IntentDetectionResult {
  intent: AssistantIntent;
  /** Optional hint for the booking flow (e.g. user already said "DJ"). */
  hints?: { category?: string; eventType?: string };
}

/**
 * Detect intent from the latest user message and optional active booking session.
 * @param rawMessage  Latest user input.
 * @param session     Active AI session (used to keep the booking wizard going).
 * @param role        Optional caller role — biases ambiguous "how do I use this?" answers.
 */
export function detectIntent(
  rawMessage: string,
  session?: AISessionState | null,
  role: UserRole = "guest"
): IntentDetectionResult {
  const m = rawMessage.toLowerCase().trim();

  /* --- Booking wizard always wins so the flow does not break mid-question --- */
  if (session?.bookingStep && session.bookingStep !== "done") {
    return { intent: "book" };
  }

  /* --- Greetings --- */
  if (/^(hi|hello|hey|yo|namaste|ayubowan|good (morning|evening|afternoon))\b/.test(m)) {
    return { intent: "greet" };
  }

  /* --- High-precedence cancel/reschedule --- */
  if (
    /\b(cancel|reschedule|change date|move my booking|postpone)\b/.test(m) &&
    /\b(booking|reservation|appointment)\b/.test(m)
  ) {
    return { intent: "cancellation_help" };
  }
  if (/\b(cancel|reschedule)\b/.test(m) && /\b(my|the)\b/.test(m)) {
    return { intent: "cancellation_help" };
  }

  /* --- Booking status (clients) --- */
  if (
    /\b(booking status|my bookings|upcoming booking|check booking|reservation status)\b/.test(m)
  ) {
    return { intent: "booking_status_help" };
  }

  /* --- Artist-side specific intents (only fire if the user is an artist OR
   * the message uses unambiguous artist vocabulary). --- */
  const artistVocab =
    role === "artist" ||
    /\b(my (calendar|earnings|payouts|requests)|publish (a )?slot|payout|booking request)\b/.test(m);

  if (artistVocab) {
    if (/\b(calendar|publish (a )?slot|availability|available date|time slot)\b/.test(m)) {
      return { intent: "artist_calendar_help" };
    }
    if (/\b(booking request|incoming booking|accept|reject|decline|new request)\b/.test(m)) {
      return { intent: "artist_booking_request_help" };
    }
    if (/\b(earning|payout|payment received|how much.*(earn|paid)|revenue|income)\b/.test(m)) {
      return { intent: "artist_earnings_help" };
    }
    if (/\b(more bookings|increase bookings|rank higher|visibility|tips|no bookings)\b/.test(m)) {
      return { intent: "artist_visibility_help" };
    }
    if (/\b(my profile|edit profile|update profile|stage name|gallery|cover image|hourly rate)\b/.test(m)) {
      return { intent: "artist_profile_help" };
    }
    if (/\b(dashboard|home page|my page|how do i use|what can i do)\b/.test(m)) {
      return { intent: "artist_dashboard_help" };
    }
  }

  /* --- Profile (client) --- */
  if (
    /\b(profile|account settings|complete my profile|missing field|update my info|preferences)\b/.test(
      m
    )
  ) {
    return role === "artist"
      ? { intent: "artist_profile_help" }
      : { intent: "client_profile_help" };
  }

  /* --- Payment --- */
  if (
    /\b(payment|stripe|advance|deposit|refund(?! booking)|what if i cancel|invoice|how do i pay|pay balance)\b/.test(
      m
    )
  ) {
    return { intent: "payment_help" };
  }

  /* --- Local / international searches --- */
  if (
    /\b(international|global|worldwide|abroad|overseas)\b/.test(m) &&
    /\b(artist|dj|singer|band|rap)/.test(m)
  ) {
    return { intent: "international_artist_help", hints: extractHints(m) };
  }
  if (
    /\b(local|sri lanka|lankan|near me|colombo area)\b/.test(m) &&
    /\b(artist|dj|singer|band|rap)/.test(m)
  ) {
    return { intent: "local_artist_help", hints: extractHints(m) };
  }

  /* --- Budget search --- */
  if (/\b(under|below|budget|cheap|affordable|max)\b/.test(m) && /\d/.test(m)) {
    return { intent: "budget_search", hints: extractHints(m) };
  }

  /* --- Event planning --- */
  if (/\b(plan|planning|timeline|run.?of.?show|setlist|event flow)\b/.test(m)) {
    return { intent: "event_planning" };
  }

  /* --- Stats / famous --- */
  if (/\b(stats|statistics|how many artists)\b/.test(m)) return { intent: "stats" };
  if (/\b(famous|popular|legend|iconic|top in the world)\b/.test(m)) return { intent: "famous" };

  /* --- Sign-up / sign-in / "what is" — guest pages --- */
  if (
    /\b(create (an )?account|sign ?up|register|new account|join)\b/.test(m) &&
    /\b(client|customer)\b/.test(m)
  ) {
    return { intent: "register_help" };
  }
  if (
    /\b(create (an )?account|sign ?up|register|join)\b/.test(m) &&
    /\b(artist|musician|dj|band|performer)\b/.test(m)
  ) {
    return { intent: "register_help" };
  }
  if (/\b(create (an )?account|sign ?up|register|new account|join)\b/.test(m)) {
    return { intent: "register_help" };
  }
  if (/\b(log in|login|sign in|signin)\b/.test(m) && /\b(artist|musician|dj|band)\b/.test(m)) {
    return { intent: "artist_login_help" };
  }
  if (/\b(log in|login|sign in|signin)\b/.test(m)) {
    return { intent: "client_login_help" };
  }
  if (/\b(what is book your artist|what is this (site|website|platform)|tell me about (this|the) (site|platform))\b/.test(m)) {
    return { intent: "website_info" };
  }
  if (/\b(advantage|benefit|why use|why is this useful|why book your artist)\b/.test(m)) {
    return { intent: "platform_advantages" };
  }
  if (/\b(features|what can the (site|platform|website) do)\b/.test(m)) {
    return { intent: "website_features" };
  }

  /* --- Booking intent (clients) --- */
  const wantsBook =
    /\b(book|booking|reserve|hire|i want to book|help me book|start a booking)\b/.test(m) &&
    !/\b(payment|policy|cancel)\b/.test(m);
  if (wantsBook) return { intent: "book", hints: extractHints(m) };

  /* --- Recommendations (clients) --- */
  const wantsRecommend =
    /\b(recommend|suggestion|find|show|looking for|who should|best|top)\b/.test(m) ||
    /\b(dj|singer|band|rapper|vocalist)\b/.test(m);
  if (wantsRecommend) return { intent: "artist_recommendation", hints: extractHints(m) };

  /* --- Generic help --- */
  if (/\b(help|what can you|commands)\b/.test(m)) {
    if (role === "artist") return { intent: "artist_dashboard_help" };
    if (role === "client") return { intent: "client_dashboard_help" };
    return { intent: "website_info" };
  }

  return { intent: "fallback" };
}

function extractHints(m: string): IntentDetectionResult["hints"] {
  const hints: IntentDetectionResult["hints"] = {};
  const events = [
    "wedding",
    "party",
    "birthday",
    "corporate",
    "festival",
    "concert",
    "club",
    "lounge",
  ];
  hints.eventType = events.find((e) => m.includes(e));
  if (m.includes("dj")) hints.category = "DJs";
  else if (m.includes("singer") || m.includes("vocal")) hints.category = "Singers";
  else if (m.includes("band")) hints.category = "Bands";
  else if (m.includes("rap") || m.includes("hip hop") || m.includes("hip-hop")) hints.category = "Rappers";
  return Object.keys(hints).length ? hints : undefined;
}
