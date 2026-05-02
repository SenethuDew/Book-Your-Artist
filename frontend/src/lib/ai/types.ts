/**
 * Shared types for the AI booking assistant (client + API route).
 */

/** Intents produced by keyword-based detection (replaceable with OpenAI later). */
export type AssistantIntent =
  | "greet"
  | "recommend"
  | "book"
  | "local_search"
  | "international_search"
  | "payment"
  | "profile"
  | "booking_status"
  | "budget_search"
  | "event_planning"
  | "cancel_reschedule"
  | "famous"
  | "stats"
  | "help"
  | "fallback"
  /* ---- Context/role-aware intents (Step 5 of the upgrade plan) ---- */
  | "website_info"
  | "platform_advantages"
  | "website_features"
  | "register_help"
  | "client_login_help"
  | "artist_login_help"
  | "client_dashboard_help"
  | "client_profile_help"
  | "artist_search_help"
  | "artist_recommendation"
  | "booking_help"
  | "booking_status_help"
  | "payment_help"
  | "cancellation_help"
  | "artist_dashboard_help"
  | "artist_profile_help"
  | "artist_calendar_help"
  | "artist_booking_request_help"
  | "artist_earnings_help"
  | "artist_visibility_help"
  | "international_artist_help"
  | "local_artist_help";

/** High-level role used to route AI behaviour. */
export type UserRole = "guest" | "client" | "artist" | "admin";

/** A logical page-bucket derived from `usePathname()`. */
export type PageType =
  | "public_home"
  | "auth"
  | "client_home"
  | "client_profile"
  | "client_settings"
  | "client_search"
  | "client_artist_profile"
  | "client_booking"
  | "client_bookings_list"
  | "client_messages"
  | "client_ai_assistant"
  | "artist_home"
  | "artist_profile"
  | "artist_calendar"
  | "artist_bookings"
  | "artist_earnings"
  | "artist_messages"
  | "artist_ai_assistant"
  | "admin"
  | "other";

/** Lightweight artist profile snapshot used for artist-side personalization. */
export interface ArtistProfileSnapshot {
  stageName?: string;
  category?: string;
  origin?: "local" | "international";
  bio?: string;
  hourlyRate?: number;
  location?: string;
  profileImage?: string;
  coverImage?: string;
  genres?: string[];
  hasAvailability?: boolean;
  isVerified?: boolean;
  bankConnected?: boolean;
}

/** One step in the guided booking wizard (one question at a time). */
export type BookingWizardStep =
  | "eventType"
  | "date"
  | "location"
  | "category"
  | "budget"
  | "origin"
  | "recommend"
  | "summary"
  | "confirm"
  | "done";

/** Accumulated answers during the booking flow. */
export interface BookingData {
  eventType?: string;
  eventDate?: string;
  location?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  origin?: "local" | "international";
  /** User said "either" — skip strict origin filter in recommendations. */
  originFlexible?: boolean;
  selectedArtistId?: string;
  selectedArtistName?: string;
}

/** Persisted in Firestore `ai_sessions/{userId}`. */
export interface AISessionState {
  currentIntent: AssistantIntent;
  bookingStep: BookingWizardStep;
  bookingData: BookingData;
  selectedArtistId?: string;
  lastUserIntent?: AssistantIntent;
  updatedAt?: number;
}

/** Client-facing snapshot (Firestore `clients/{userId}` merged with API user). */
export interface ClientProfileSnapshot {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  preferredEventType?: string;
  preferredArtistCategory?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency?: "USD" | "LKR";
  preferredGenres?: string[];
  notificationSettings?: { email?: boolean; push?: boolean };
}

export interface ChatAction {
  label: string;
  type: "navigate" | "prompt";
  value: string;
  variant?: "primary" | "ghost";
}

/** Artist row returned to the UI (normalized from Firestore + catalog). */
export interface RecommendedArtist {
  id: string;
  name: string;
  category: string;
  location: string;
  hourlyRate: number;
  rating: number;
  profileImage?: string;
  origin: "local" | "international";
  genres: string[];
  shortDescription: string;
  availabilityStatus: "available" | "limited" | "unknown";
  bookingCount?: number;
}

export interface BookingSummaryPayload {
  eventType?: string;
  category?: string;
  selectedArtistId?: string;
  selectedArtistName?: string;
  eventDate?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  origin?: "local" | "international";
  estimatedHourly?: number;
  currency?: "USD" | "LKR";
}

/** Per-field profile checklist row sent to the UI when relevant. */
export interface ProfileChecklistItem {
  field: string;
  label: string;
  done: boolean;
}

export interface ProfileChecklistPayload {
  audience: "client" | "artist";
  items: ProfileChecklistItem[];
  completion: number; // 0–100
  ctaHref: string;
}

/** API response shape for POST /api/ai-assistant */
export interface AssistantApiResponse {
  success: boolean;
  message?: string;
  reply: string;
  intent: AssistantIntent;
  artists?: RecommendedArtist[];
  actions?: ChatAction[];
  quickReplies?: string[];
  bookingSummary?: BookingSummaryPayload;
  profileChecklist?: ProfileChecklistPayload;
  /** Hint to the UI which kind of card to render (info / artistRec / bookingSummary / profileChecklist / earningsSummary). */
  cardType?: "info" | "artistRecommendation" | "bookingSummary" | "profileChecklist" | "earningsSummary";
  /** Page-aware welcome (only included on first hit per page). */
  welcome?: string;
  /** Updated session for Firestore `ai_sessions/{userId}` and the next API call. */
  session?: AISessionState;
  source: "rules" | "openai";
}

/** Stored in `ai_chats/{userId}/messages/{messageId}`. */
export interface StoredChatMessage {
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
  intent: AssistantIntent;
  metadata?: Record<string, unknown>;
}

