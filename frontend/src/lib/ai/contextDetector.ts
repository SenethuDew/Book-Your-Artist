/**
 * Context detector — turns the raw `(role, pathname)` pair into a structured
 * `BotContext`. The orchestrator uses this on both the client AND the server
 * (the API route) so welcome messages, suggested topics, and routing stay
 * perfectly in sync no matter where the question came from.
 *
 * Why a single source of truth?
 *   The user can ask the same sentence ("how do I use this site?") from the
 *   public landing page, the artist calendar, or the client search page. The
 *   answer must differ. By computing the context once and threading it through
 *   intent detection + knowledge lookup we avoid scattered if/else branches.
 */

import type { PageType, UserRole } from "./types";

export interface BotContext {
  userRole: UserRole;
  isLoggedIn: boolean;
  userId?: string;
  currentPage: string; // raw pathname for analytics/debug
  pageType: PageType;
  /** Friendly first-time greeting tailored to (role + page). */
  welcomeMessage: string;
  /** Page-aware quick-prompt chips. */
  suggestedTopics: string[];
  /** Optional metadata exposed in the UI badge ("On Calendar", etc.). */
  pageBadge?: string;
}

/* ------------------------------------------------------------------ */
/* Pathname → PageType                                                */
/* ------------------------------------------------------------------ */

/**
 * Map a Next.js pathname to a logical bucket. Order matters because some
 * artist URLs are nested under `/artist/...` (which collides with the public
 * artist profile route `/artist/[id]`).
 */
export function detectPageType(pathname: string | null | undefined): PageType {
  if (!pathname) return "other";
  const p = pathname.toLowerCase();

  if (p === "/" || p === "/about") return "public_home";
  if (p.startsWith("/sign-in") || p.startsWith("/sign-up") || p.startsWith("/login") || p.startsWith("/auth")) {
    return "auth";
  }

  /* ----- Artist side (check BEFORE the public `/artist/[id]` route) ----- */
  if (p.startsWith("/home/artist") || p.startsWith("/dashboard/artist")) return "artist_home";
  if (p.startsWith("/artist/calendar") || p.startsWith("/artist/availability")) return "artist_calendar";
  if (p.startsWith("/artist/bookings") || p.startsWith("/artist/requests")) return "artist_bookings";
  if (p.startsWith("/artist/earnings") || p.startsWith("/artist/payouts")) return "artist_earnings";
  if (p.startsWith("/artist/messages") || p.startsWith("/artist/notifications")) return "artist_messages";
  if (p.startsWith("/artist/ai-assistant")) return "artist_ai_assistant";
  if (
    p.startsWith("/artist/profile") ||
    p.startsWith("/artist/edit-profile") ||
    p.startsWith("/artist/settings")
  ) {
    return "artist_profile";
  }

  /* ----- Client side ----- */
  if (p.startsWith("/home/client") || p === "/home") return "client_home";
  if (p.startsWith("/profile/settings")) return "client_settings";
  if (p.startsWith("/profile")) return "client_profile";
  if (p.startsWith("/search") || p.startsWith("/browse")) return "client_search";
  if (p.startsWith("/bookings")) return "client_bookings_list";
  if (p.startsWith("/booking") || p.startsWith("/checkout")) return "client_booking";
  if (p.startsWith("/messages") || p.startsWith("/notifications")) return "client_messages";
  if (p.startsWith("/client/ai-assistant")) return "client_ai_assistant";
  if (/^\/artist\/[^/]+/.test(p)) return "client_artist_profile";

  /* ----- Admin ----- */
  if (p.startsWith("/home/admin") || p.startsWith("/dashboard/admin") || p.startsWith("/admin")) return "admin";

  return "other";
}

/* ------------------------------------------------------------------ */
/* Welcome messages per (role, page)                                  */
/* ------------------------------------------------------------------ */

const WELCOME_MAP: Partial<Record<PageType, Partial<Record<UserRole, string>>>> = {
  public_home: {
    guest:
      "Hi, I’m the **Book Your Artist** assistant. I can explain how the platform works, how to join as a **client** or **artist**, and how local + international artist booking works.",
    client:
      "Welcome back. From here you can jump into **Browse Artists**, **My Bookings**, or ask me to **recommend an artist** for an event.",
    artist:
      "Welcome back, artist! I can show you how to manage your **calendar**, respond to **booking requests**, and track **earnings**.",
  },
  auth: {
    guest:
      "Sign in or create an account to get started. I can explain the difference between a **client** account (for booking artists) and an **artist** account (for getting booked).",
  },
  client_home: {
    client:
      "Welcome back. I can help you **find artists**, **complete your profile**, manage **bookings**, or understand **payments**.",
  },
  client_profile: {
    client:
      "I can help you complete your profile so artist recommendations and booking details are more accurate.",
  },
  client_settings: {
    client:
      "I can guide you through every field in **Profile Settings** — what to fill in and why it matters for matchmaking.",
  },
  client_search: {
    client:
      "Looking for the perfect artist? Tell me your **event**, **city**, and **budget** and I will narrow it down to a few strong matches.",
  },
  client_artist_profile: {
    client:
      "I can summarise this artist, explain their **published green slots** in the calendar, or start a guided booking for you.",
  },
  client_booking: {
    client:
      "I can walk you through your **booking status**, the **payment steps**, or how to **reschedule** if your plans change.",
  },
  client_bookings_list: {
    client:
      "Welcome to **My Bookings**. Ask me to explain a status, the **advance / balance** timeline, or how to cancel.",
  },
  client_messages: {
    client:
      "All your booking notifications and artist conversations live here. Ask me to summarise updates or compose a quick message.",
  },
  client_ai_assistant: {
    client:
      "You are on the **AI Assistant** page. Ask me anything — recommendations, booking flow, payments, profile, or website features.",
  },
  artist_home: {
    artist:
      "Welcome, artist. I can help you manage your **profile**, **booking requests**, **calendar**, **earnings**, and client communication.",
  },
  artist_profile: {
    artist:
      "Polishing your profile is the fastest way to get more bookings. Ask me what is missing or how to improve **bio**, **rate**, or **gallery**.",
  },
  artist_calendar: {
    artist:
      "I can help you **add available time slots**, **block unavailable dates**, and prevent **double bookings**. Ask away.",
  },
  artist_bookings: {
    artist:
      "Each card here is a **booking request** or confirmed event. I can explain accept/reject, payouts, or how to message the client.",
  },
  artist_earnings: {
    artist:
      "I can explain **completed payments**, **pending payouts**, the **48-hour clearing window**, and how the platform fee works.",
  },
  artist_messages: {
    artist:
      "Every booking has a built-in chat thread. I can summarise unread messages or draft a response.",
  },
  artist_ai_assistant: {
    artist:
      "You are on the **Artist AI Support** page. Ask about calendar, earnings, booking requests, profile, or any platform feature.",
  },
};

const WELCOME_FALLBACK: Record<UserRole, string> = {
  guest:
    "Hi, I’m the **Book Your Artist** assistant. Ask how the platform works or how to join.",
  client:
    "I am your **AI Booking Assistant** — ask anything about artists, booking, payments, or your profile.",
  artist:
    "I am your **AI Support** for artists — ask about calendar, booking requests, earnings, or profile.",
  admin: "Admin support is limited. I can summarise recent platform stats.",
};

/* ------------------------------------------------------------------ */
/* Suggested topics per (role, page)                                  */
/* ------------------------------------------------------------------ */

const TOPICS_BY_ROLE: Record<UserRole, string[]> = {
  guest: [
    "What is Book Your Artist?",
    "How do I register as a client?",
    "How do I register as an artist?",
    "What can clients do?",
    "What can artists do?",
    "Why is this website useful?",
    "What artist categories are available?",
  ],
  client: [
    "Recommend artists for my event",
    "Help me complete my profile",
    "Explain booking process",
    "Explain payment process",
    "Show local artists",
    "Show international artists",
    "How do I cancel a booking?",
  ],
  artist: [
    "Help me complete my artist profile",
    "How do I manage booking requests?",
    "How do I update my availability calendar?",
    "How do earnings work?",
    "How do I improve my profile?",
    "How do I upload images?",
  ],
  admin: ["Platform stats", "How to verify an artist?"],
};

const TOPICS_BY_PAGE: Partial<Record<PageType, string[]>> = {
  client_search: [
    "Find DJs under my budget",
    "Show top-rated singers",
    "Recommend a band for a wedding",
    "Show international artists",
  ],
  client_artist_profile: [
    "Is this artist available next Saturday?",
    "Start a booking with this artist",
    "Compare with similar artists",
  ],
  client_bookings_list: [
    "Explain my booking status",
    "How do I pay the balance?",
    "How do I cancel a booking?",
  ],
  client_settings: [
    "Why should I add my location?",
    "What is the budget range used for?",
    "How do I add a profile image?",
  ],
  artist_calendar: [
    "How do I publish a slot?",
    "What do the slot colours mean?",
    "Can I delete a published slot?",
  ],
  artist_bookings: [
    "How do I accept a booking?",
    "How do I reject politely?",
    "When do I get paid?",
  ],
  artist_earnings: [
    "When is the next payout?",
    "What is the platform fee?",
    "How do I add my bank account?",
  ],
  artist_profile: [
    "What is missing in my profile?",
    "How do I add gallery items?",
    "Tips to rank higher in search",
  ],
};

function topicsFor(role: UserRole, pageType: PageType): string[] {
  const pageTopics = TOPICS_BY_PAGE[pageType] ?? [];
  // Combine page-specific (front) + role-default (back), de-duplicated, capped.
  const combined = [...pageTopics, ...TOPICS_BY_ROLE[role]];
  return Array.from(new Set(combined)).slice(0, 6);
}

/* ------------------------------------------------------------------ */
/* Page badges shown in the chat header                               */
/* ------------------------------------------------------------------ */

const PAGE_BADGES: Record<PageType, string> = {
  public_home: "Home",
  auth: "Sign in / Sign up",
  client_home: "Client home",
  client_profile: "My Profile",
  client_settings: "Profile Settings",
  client_search: "Browse Artists",
  client_artist_profile: "Artist Profile",
  client_booking: "Booking",
  client_bookings_list: "My Bookings",
  client_messages: "Notifications",
  client_ai_assistant: "AI Assistant",
  artist_home: "Artist Home",
  artist_profile: "Artist Profile",
  artist_calendar: "Calendar",
  artist_bookings: "Booking Requests",
  artist_earnings: "Earnings",
  artist_messages: "Messages",
  artist_ai_assistant: "AI Support",
  admin: "Admin",
  other: "Site",
};

/* ------------------------------------------------------------------ */
/* Public entry point                                                 */
/* ------------------------------------------------------------------ */

export interface BuildContextInput {
  pathname: string | null | undefined;
  userRole: UserRole;
  userId?: string;
  isLoggedIn?: boolean;
}

export function buildBotContext({
  pathname,
  userRole,
  userId,
  isLoggedIn,
}: BuildContextInput): BotContext {
  const pageType = detectPageType(pathname);
  const role = inferEffectiveRole(userRole, pageType);
  const welcomeMessage =
    WELCOME_MAP[pageType]?.[role] ??
    WELCOME_MAP[pageType]?.guest ??
    WELCOME_FALLBACK[role];
  return {
    userRole: role,
    isLoggedIn: isLoggedIn ?? role !== "guest",
    userId,
    currentPage: pathname ?? "",
    pageType,
    welcomeMessage,
    suggestedTopics: topicsFor(role, pageType),
    pageBadge: PAGE_BADGES[pageType],
  };
}

/**
 * If a guest is sitting on an artist-area URL (e.g. they were sent a link to
 * `/artist/calendar`), still answer in the artist tone — most likely they are
 * an artist who is signed out. Same for client URLs.
 */
function inferEffectiveRole(role: UserRole, pageType: PageType): UserRole {
  if (role !== "guest") return role;
  if (pageType.startsWith("artist_")) return "artist";
  if (pageType.startsWith("client_")) return "client";
  return "guest";
}

/** Helper that turns a User object from `useAuth()` into a `UserRole`. */
export function roleFromUser(u: { role?: string } | null | undefined): UserRole {
  const r = (u?.role || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "artist") return "artist";
  if (r === "client") return "client";
  return "guest";
}
