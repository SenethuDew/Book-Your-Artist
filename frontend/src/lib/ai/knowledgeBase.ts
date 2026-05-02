/**
 * Book Your Artist — full website knowledge base.
 *
 * This is the "training data" for the rule-based assistant: every fact below is
 * matched against user questions in `answerFromKnowledge()`. When a relevant
 * topic is found we return a tagged Markdown answer plus suggested follow-ups
 * and action buttons. The knowledge base also feeds the OpenAI system prompt
 * (when an API key is configured) so both modes stay consistent.
 */

import { ALL_CATALOG_ARTISTS } from "@/lib/artistCatalog";
import type { ChatAction } from "./types";

export interface SiteRoute {
  path: string;
  label: string;
  audience: "client" | "artist" | "admin" | "public";
  description: string;
  keywords: string[];
}

/** Every page that exists in the codebase + audience + plain-English purpose. */
export const SITE_ROUTES: SiteRoute[] = [
  { path: "/", label: "Landing page", audience: "public", description: "Hero, featured artists, browse entry.", keywords: ["home", "landing", "front page"] },
  { path: "/about", label: "About", audience: "public", description: "Mission, how the platform works, team.", keywords: ["about", "company", "mission"] },
  { path: "/sign-in", label: "Sign in", audience: "public", description: "Login form for clients and artists.", keywords: ["login", "sign in", "log in"] },
  { path: "/sign-up", label: "Create account", audience: "public", description: "Choose client or artist + register.", keywords: ["register", "sign up", "create account", "join"] },

  { path: "/home/client", label: "Client home", audience: "client", description: "Personalized dashboard with notifications, smart search, recommended artists.", keywords: ["dashboard", "home", "client home"] },
  { path: "/search", label: "Browse Artists", audience: "client", description: "Filter artists by category, location, genre, budget.", keywords: ["search", "browse", "find artist", "directory"] },
  { path: "/artist/:id", label: "Artist profile", audience: "client", description: "Bio, gallery, ratings, booking calendar with green published slots, quick booking, location map.", keywords: ["artist profile", "details", "bio", "calendar"] },
  { path: "/bookings", label: "My bookings", audience: "client", description: "Status of every booking, advance + balance, contact links.", keywords: ["my bookings", "upcoming", "history"] },
  { path: "/bookings/:id", label: "Booking detail", audience: "client", description: "One booking with payment timeline, location, artist contact.", keywords: ["booking detail", "single booking"] },
  { path: "/checkout/advance", label: "Pay advance", audience: "client", description: "Stripe checkout for the 50% advance.", keywords: ["pay advance", "deposit", "stripe"] },
  { path: "/checkout", label: "Checkout", audience: "client", description: "Full payment / balance checkout.", keywords: ["checkout", "balance", "pay"] },
  { path: "/booking-success", label: "Booking success", audience: "client", description: "Confirmation screen after a successful payment.", keywords: ["success", "confirmation"] },
  { path: "/messages", label: "Notifications", audience: "client", description: "Booking notifications and conversations with artists.", keywords: ["notifications", "messages", "chat"] },
  { path: "/profile", label: "My profile", audience: "client", description: "Snapshot of profile completion, location, image, role.", keywords: ["my profile", "client profile"] },
  { path: "/profile/settings", label: "Profile settings", audience: "client", description: "Edit name, email, phone, location, profile image, preferences.", keywords: ["settings", "edit profile", "preferences"] },
  { path: "/profile/delete-profile", label: "Delete profile", audience: "client", description: "Permanent account deletion.", keywords: ["delete account", "delete profile"] },
  { path: "/client/ai-assistant", label: "AI Assistant", audience: "client", description: "Conversational booking concierge (you are here).", keywords: ["ai", "assistant", "concierge", "bot"] },

  { path: "/home/artist", label: "Artist home", audience: "artist", description: "Earnings, booking pipeline, profile completion.", keywords: ["artist dashboard", "artist home"] },
  { path: "/artist/profile", label: "Artist profile manager", audience: "artist", description: "Manage public artist info, genres, hourly rate.", keywords: ["my artist profile"] },
  { path: "/artist/edit-profile", label: "Edit artist profile", audience: "artist", description: "Update artist bio, gallery, rate, social links.", keywords: ["edit artist", "update artist profile"] },
  { path: "/artist/calendar", label: "Artist calendar", audience: "artist", description: "Add availability slots, publish, accept/reject booking requests.", keywords: ["availability", "publish slots", "calendar"] },
  { path: "/artist/bookings", label: "Artist bookings", audience: "artist", description: "Incoming and confirmed bookings with payouts.", keywords: ["artist bookings"] },
  { path: "/artist/earnings", label: "Earnings", audience: "artist", description: "Payouts and revenue per booking.", keywords: ["earnings", "payouts", "revenue"] },
  { path: "/artist/messages", label: "Artist messages", audience: "artist", description: "Conversations with clients.", keywords: ["artist chat", "artist messages"] },
  { path: "/artist/ai-assistant", label: "Artist AI Support", audience: "artist", description: "Conversational support for the artist (you are here).", keywords: ["ai", "support", "assistant artist"] },

  { path: "/home/admin", label: "Admin dashboard", audience: "admin", description: "Approvals, suspensions, platform stats.", keywords: ["admin"] },
];

export interface FaqEntry {
  /** Stable id used for analytics/debugging */
  id: string;
  /** Short label for UI chips */
  label: string;
  /** Trigger keywords (any match will surface this entry) */
  keywords: string[];
  /** Markdown answer */
  answer: string;
  /** Optional suggested follow-up prompts */
  followUps?: string[];
  /** Optional in-chat action buttons */
  actions?: ChatAction[];
  /** Restrict the entry to one audience; default = both */
  audience?: "client" | "artist" | "any";
}

/* ============================================================
 * Curated FAQ — the meat of the bot's "training".
 * ========================================================== */
export const FAQ: FaqEntry[] = [
  {
    id: "what-is-bya",
    label: "What is Book Your Artist?",
    keywords: ["what is", "about platform", "tell me about", "book your artist", "platform", "how does this work"],
    answer:
      "**Book Your Artist** is a curated marketplace that connects clients with verified **DJs**, **singers**, **live bands**, and **rappers** — local Sri Lankan favourites and international stars.\n\n**You can:**\n- Discover artists by category, city, genre, or budget\n- Read verified reviews and watch portfolio media\n- Book a published time slot directly\n- Pay safely with **Stripe** (50% advance + 50% balance)\n- Chat with the artist and track everything in one dashboard",
    followUps: ["How do I book an artist?", "Show me top DJs", "How does payment work?"],
    actions: [
      { label: "View Artists", type: "navigate", value: "/search", variant: "primary" },
      { label: "About", type: "navigate", value: "/about", variant: "ghost" },
    ],
  },
  {
    id: "how-to-book",
    label: "How to book an artist",
    keywords: ["how do i book", "how to book", "booking process", "make a booking", "booking steps"],
    answer:
      "**Booking on Book Your Artist (5 simple steps):**\n1. Search artists by **category**, **city**, or **budget**.\n2. Open an artist profile, review **bio**, **portfolio**, **reviews**.\n3. Pick a **green published slot** in the booking calendar.\n4. Submit your details + pay the **50% advance** via Stripe.\n5. The artist confirms; you pay the **50% balance** 48 h before the event.\n\nOr say **\"Start a booking\"** here and I will guide you step-by-step.",
    followUps: ["Start a booking", "How does payment work?", "What is the cancellation policy?"],
    actions: [
      { label: "Start Booking", type: "prompt", value: "I want to book an artist", variant: "primary" },
      { label: "View Artists", type: "navigate", value: "/search", variant: "ghost" },
    ],
  },
  {
    id: "payment",
    label: "How payment works",
    keywords: ["payment", "stripe", "advance", "deposit", "pay balance", "how do i pay", "fees", "charges"],
    answer:
      "**Payments** are handled by **Stripe** (PCI-DSS Level 1) and support **cards**, **Apple Pay**, **Google Pay**.\n\n- **50% advance** is captured the moment the artist confirms.\n- **50% balance** is auto-charged **48 hours** before the event.\n- You can find every charge under **My Bookings → Booking detail**.\n- All amounts are shown in your selected currency on the artist profile.",
    followUps: ["What is the cancellation policy?", "How do I get a refund?", "Pay advance now"],
    actions: [
      { label: "View My Bookings", type: "navigate", value: "/bookings", variant: "primary" },
      { label: "Pay Advance", type: "navigate", value: "/checkout/advance", variant: "ghost" },
    ],
  },
  {
    id: "refund",
    label: "Refund / cancellation policy",
    keywords: ["refund", "cancel", "cancellation", "money back", "what if i cancel"],
    answer:
      "**Cancellation policy** (refund of advance):\n- More than **14 days** before the event → **100% refund**.\n- **7 – 14 days** before → **50% refund**.\n- Less than **7 days** → **no refund** (artist time is locked).\n\nReschedules within those windows are free if the artist agrees — open the booking and request a date change.",
    followUps: ["How do I cancel a booking?", "Reschedule my booking", "View My Bookings"],
    actions: [
      { label: "View My Bookings", type: "navigate", value: "/bookings", variant: "primary" },
    ],
  },
  {
    id: "how-many-categories",
    label: "Artist categories",
    keywords: ["categories", "what kinds of artists", "types of artists", "what artists"],
    answer:
      "We list four artist categories on the platform:\n- **DJs** — wedding, club, lounge, festival\n- **Singers** — pop, soul, R&B, fusion\n- **Bands** — pop, rock, jazz, baila\n- **Rappers** — hip-hop, drill, fusion\n\nYou can also filter **local** (Sri Lanka) vs **international** (Dua Lipa, Calvin Harris, Coldplay, Ne-Yo are listed for premium events).",
    followUps: ["Show me top DJs", "Find a band for a wedding", "Show international artists"],
    actions: [{ label: "View Artists", type: "navigate", value: "/search", variant: "primary" }],
  },
  {
    id: "verified-artists",
    label: "Are artists verified?",
    keywords: ["verified", "trustworthy", "scam", "real artist", "background check"],
    answer:
      "Every artist passes an **admin verification step** before going live: ID check, portfolio review, and at least one verifiable past performance. Verified profiles show ratings, review counts, and travel radius. You can always message support if anything looks off.",
    followUps: ["Recommend a DJ for a wedding", "Show top international artists"],
  },
  {
    id: "create-account",
    label: "Create an account",
    keywords: ["create account", "sign up", "register", "join", "make an account", "new user"],
    answer:
      "Create a free account in 30 seconds:\n1. Open **Sign Up**.\n2. Choose **Client** (booking artists) or **Artist** (offering services).\n3. Verify your email and you are in.\n\nYou can browse without an account, but booking + saving favourites needs one.",
    followUps: ["Help me complete my profile", "How do I book?"],
    actions: [
      { label: "Sign Up", type: "navigate", value: "/sign-up", variant: "primary" },
      { label: "Sign In", type: "navigate", value: "/sign-in", variant: "ghost" },
    ],
  },
  {
    id: "complete-profile",
    label: "Complete my profile",
    keywords: ["complete my profile", "missing fields", "profile incomplete", "fill profile"],
    answer:
      "A complete profile speeds up booking and helps artists contact you. Recommended fields:\n- **Full name** + **email** + **phone**\n- **Location** (so artists can confirm travel radius)\n- **Profile image**\n- Optional: **preferred event type**, **preferred artist category**, **budget range**, **preferred genres**\n\nUpdate everything in **Profile → Profile Settings**.",
    followUps: ["Why is location important?", "Update my preferences"],
    actions: [
      { label: "Go to Profile Settings", type: "navigate", value: "/profile/settings", variant: "primary" },
      { label: "View My Profile", type: "navigate", value: "/profile", variant: "ghost" },
    ],
  },
  {
    id: "location-importance",
    label: "Why location matters",
    keywords: ["why location", "location important", "address required"],
    answer:
      "Many artists set a **travel radius** in their profile. We use your client location to:\n- Filter the **right artists** automatically\n- Show accurate **map directions** on the booking page\n- Calculate optional **travel fees** when applicable\n\nUpdate it any time in **Profile Settings**.",
    followUps: ["Update my profile", "Recommend artists nearby"],
  },
  {
    id: "calendar-slots",
    label: "Booking calendar / green slots",
    keywords: ["calendar", "green slot", "available", "slot", "publish"],
    answer:
      "Each artist publishes their availability as **green slots** in the booking calendar. **Grey** slots are unpublished, **orange** are pending requests, and **red** are already booked. You can only book a **green slot** — pick one, fill the form, and pay the advance.",
    followUps: ["Start a booking", "Find available artists this weekend"],
    actions: [{ label: "Find Artists", type: "navigate", value: "/search", variant: "primary" }],
  },
  {
    id: "artist-onboarding",
    label: "I am an artist — how do I join?",
    keywords: ["i am an artist", "artist sign up", "as artist", "become an artist", "list my services"],
    answer:
      "Welcome! As an artist you can:\n1. Sign up and choose **Artist**.\n2. Complete your **Artist Profile** (bio, hourly rate, genres, gallery).\n3. Open the **Calendar** and add availability slots.\n4. Click **Publish** so clients can find your slots.\n5. Accept or decline incoming requests; payouts appear in **Earnings**.",
    followUps: ["How are payouts calculated?", "How long does verification take?"],
    actions: [{ label: "Sign Up as Artist", type: "navigate", value: "/sign-up", variant: "primary" }],
  },
  {
    id: "artist-payouts",
    label: "Artist payouts",
    keywords: ["payout", "earnings", "how much do artists earn", "payout schedule"],
    answer:
      "Artists earn the **full quoted rate minus the platform fee** (currently ~10%). The advance unlocks immediately on confirmation; the balance unlocks **48 h** after the event (allowing for dispute window). Payouts go to the bank account on file.",
    followUps: ["I am an artist — how do I join?", "How does verification work?"],
    actions: [{ label: "Earnings (artist)", type: "navigate", value: "/artist/earnings", variant: "ghost" }],
  },
  {
    id: "messages-notifications",
    label: "Messages & notifications",
    keywords: ["message", "notification", "chat", "contact artist", "inbox"],
    answer:
      "Open **Notifications** in the navbar to see every booking update and unread message. Each booking has a built-in chat thread so you can confirm setlists, sound checks, and venue logistics.",
    followUps: ["View My Bookings", "Recommend a DJ"],
    actions: [{ label: "Open Notifications", type: "navigate", value: "/messages", variant: "primary" }],
  },
  {
    id: "famous-artists",
    label: "Famous performers",
    keywords: ["famous", "popular", "legendary", "celebrity", "top artists in the world"],
    answer:
      "**Locally on the platform** — Yohani De Silva, Umaria Sinhawansa, Sanuka, DJ Mass, DJ Imalka, Infinity, WePlus, Mid Lane, News Sarith & Surith.\n\n**International picks** featured for premium events — Dua Lipa, Calvin Harris, Coldplay, Ne-Yo.\n\nGlobally beyond our roster — Taylor Swift, Ed Sheeran, Drake, Kendrick Lamar, Maroon 5 are the most-booked names by category.",
    followUps: ["Show international artists", "Best singer for a wedding", "Top DJs"],
    actions: [{ label: "View Artists", type: "navigate", value: "/search", variant: "ghost" }],
  },
  {
    id: "ai-help",
    label: "What can the AI do?",
    keywords: ["what can you do", "ai help", "commands", "skills", "capabilities"],
    answer:
      "I am your **AI Booking Assistant**. I can:\n- **Recommend artists** by category, city, budget, event type\n- **Run a step-by-step booking flow** — one question at a time, remembering your answers\n- Use your **client profile** so you do not repeat yourself\n- Explain **payments**, **cancellation**, and **profile setup**\n- Show **Local vs International** options and famous performers\n- Take you to the right page with one tap (View Profile, Start Booking, Open Settings)\n\nTry: *\"Recommend a DJ in Colombo under 200\"* or *\"Help me book a singer for a wedding next Saturday\"*.",
    followUps: ["Start a booking", "Find DJs under my budget", "Help me complete my profile"],
  },
  {
    id: "currency",
    label: "Currency & pricing",
    keywords: ["currency", "lkr", "usd", "pricing", "rate", "how much"],
    answer:
      "Prices on artist cards are shown in the artist's quoted currency (most rates are **USD/hr**). On checkout you see the converted total. You can save your preferred budget in **Profile Settings** and I will use it automatically.",
    followUps: ["Find DJs under my budget", "How does payment work?"],
  },
  {
    id: "delete-account",
    label: "Delete my account",
    keywords: ["delete account", "remove me", "deactivate"],
    answer:
      "You can delete your client account permanently from **Profile → Delete Profile**. This removes profile data and chat history; completed bookings remain in our records for invoicing/audit purposes.",
    followUps: ["Update my profile instead"],
    actions: [{ label: "Delete Profile", type: "navigate", value: "/profile/delete-profile", variant: "ghost" }],
    audience: "client",
  },

  /* ---------------- Public / common pages ---------------- */
  {
    id: "login",
    label: "How to log in (client or artist)",
    keywords: ["log in", "login", "sign in", "signin", "how do i login", "access account"],
    answer:
      "**Logging in:**\n1. Click **Sign In** in the top-right of the landing page (or open `/sign-in`).\n2. Enter the **email** and **password** you used at sign-up.\n3. We auto-detect your role and redirect you:\n   - **Client** → `/home/client`\n   - **Artist** → `/home/artist`\n   - **Admin** → `/home/admin`\n\nForgot your password? Use the **Forgot password?** link on the sign-in form.",
    followUps: ["How do I create an account?", "I cannot sign in"],
    actions: [
      { label: "Sign In", type: "navigate", value: "/sign-in", variant: "primary" },
      { label: "Sign Up", type: "navigate", value: "/sign-up", variant: "ghost" },
    ],
    audience: "any",
  },
  {
    id: "signup-client",
    label: "Create a CLIENT account",
    keywords: ["create client account", "client sign up", "register as client", "new client account", "join as client"],
    answer:
      "**Create a client account in 30 seconds:**\n1. Open **Sign Up** (`/sign-up`).\n2. Choose **Client** as your role.\n3. Fill **full name**, **email**, **password**, and (optional) **phone**.\n4. Submit → you are signed in and sent to **`/home/client`**.\n5. Open **Profile Settings** to add your **location**, **photo**, and **preferences** so artists can match you better.",
    followUps: ["How do I book an artist?", "Help me complete my profile"],
    actions: [
      { label: "Sign Up", type: "navigate", value: "/sign-up", variant: "primary" },
      { label: "Profile Settings", type: "navigate", value: "/profile/settings", variant: "ghost" },
    ],
    audience: "any",
  },
  {
    id: "signup-artist",
    label: "Create an ARTIST account",
    keywords: ["create artist account", "artist sign up", "register as artist", "join as artist", "become artist"],
    answer:
      "**Create an artist account:**\n1. Open **Sign Up** (`/sign-up`).\n2. Choose **Artist** as your role.\n3. Provide **stage name**, **email**, **password**, **phone**, **category** (DJ / Singer / Band / Rapper), **hourly rate**.\n4. Submit → you land in **`/home/artist`**.\n5. Complete **Profile Settings**, add **gallery**, then open **Calendar** to publish your first availability slots.\n6. Once verified by admin, your profile becomes searchable in **`/search`**.",
    followUps: ["How do I publish availability?", "Where do I add my hourly rate?", "How do I get paid?"],
    actions: [
      { label: "Sign Up", type: "navigate", value: "/sign-up", variant: "primary" },
      { label: "Artist Profile Settings", type: "navigate", value: "/artist/profile", variant: "ghost" },
    ],
    audience: "any",
  },
  {
    id: "common-home",
    label: "Common home / landing page",
    keywords: ["landing page", "home page", "main page", "front page", "what is the home page"],
    answer:
      "The **landing page** (`/`) is the public entry point. It shows:\n- **Hero** with the platform pitch\n- **Featured artists** (top-rated, including international stars)\n- **Browse Artists** button → `/search`\n- **Sign In** / **Sign Up** for clients and artists\n- Quick links to **About**\n\nLogged-in users go straight to `/home/client` or `/home/artist`.",
    followUps: ["Sign in", "Create an account", "Browse artists"],
    actions: [
      { label: "Landing Page", type: "navigate", value: "/", variant: "primary" },
      { label: "About", type: "navigate", value: "/about", variant: "ghost" },
    ],
    audience: "any",
  },

  /* ---------------- Artist-side ---------------- */
  {
    id: "artist-dashboard",
    label: "Artist dashboard overview",
    keywords: ["artist dashboard", "artist home", "my artist page", "artist overview"],
    answer:
      "**Artist Dashboard** (`/home/artist`) shows:\n- **Total earnings** + **monthly earnings** + **pending payouts**\n- **Total bookings**, **upcoming bookings**, **completed bookings**\n- **Pending booking requests** that need a response\n- **Average rating** with trend\n- Quick links to **Bookings**, **Calendar**, **Earnings**, **Profile**, **Notifications**, and the **AI Support** assistant",
    followUps: ["How do I add availability?", "How do I respond to booking requests?", "Where do I see earnings?"],
    actions: [
      { label: "Open Dashboard", type: "navigate", value: "/home/artist", variant: "primary" },
    ],
    audience: "artist",
  },
  {
    id: "artist-calendar",
    label: "Artist booking calendar / publish availability",
    keywords: ["calendar", "publish slot", "publish availability", "add slot", "availability slot", "make available", "set availability"],
    answer:
      "**Artist Calendar** (`/artist/calendar`):\n1. Click **Add Slot** and pick a **date**, **start**, and **end** time.\n2. Set the **status** to **Available**.\n3. Click **Publish** so the slot turns into a **green tile** on every client's view of your profile.\n4. Slot states:\n   - **Grey** — drafted/unpublished\n   - **Green** — published & bookable\n   - **Orange** — pending request from a client (you can **Accept** or **Reject** in-place; the booked location appears under the time)\n   - **Red** — confirmed and locked\n5. Use the calendar **week / month** view toggles to manage scale.",
    followUps: ["How do I respond to a booking request?", "Can I delete a published slot?", "Why is no one booking me?"],
    actions: [
      { label: "Open Calendar", type: "navigate", value: "/artist/calendar", variant: "primary" },
      { label: "View Bookings", type: "navigate", value: "/artist/bookings", variant: "ghost" },
    ],
    audience: "artist",
  },
  {
    id: "artist-booking-requests",
    label: "Booking requests (accept / reject)",
    keywords: ["booking request", "accept booking", "reject booking", "decline booking", "incoming booking", "new request"],
    answer:
      "**Handling booking requests** (`/artist/bookings` or directly inside the orange slot on `/artist/calendar`):\n- Each request shows the **client name**, **event date / time**, **location**, **event type**, and **proposed price**.\n- Click **Accept** to confirm — the slot turns red and the client's **50% advance** is captured.\n- Click **Reject** to decline politely (the client is auto-notified and the slot returns to green).\n- You can chat with the client first via **Notifications** before deciding.",
    followUps: ["Where do I see all my bookings?", "How are payouts scheduled?"],
    actions: [
      { label: "Booking Requests", type: "navigate", value: "/artist/bookings", variant: "primary" },
      { label: "Calendar", type: "navigate", value: "/artist/calendar", variant: "ghost" },
    ],
    audience: "artist",
  },
  {
    id: "artist-notifications",
    label: "Artist notifications",
    keywords: ["notification", "alert", "message", "inbox", "artist messages"],
    answer:
      "**Notifications** (`/artist/messages`) is your live feed for:\n- **New booking requests** (with one-tap Accept / Reject)\n- **Status changes** (advance paid, balance due, cancellation)\n- **Client messages** for setlists, sound, venue logistics\n- **Payout updates** when funds are released to your account\n\nThe bell badge in the navbar shows unread count.",
    followUps: ["How do I respond to a booking request?", "Where do I see earnings?"],
    actions: [
      { label: "Open Notifications", type: "navigate", value: "/artist/messages", variant: "primary" },
    ],
    audience: "artist",
  },
  {
    id: "artist-earnings",
    label: "Earnings & payouts",
    keywords: ["earnings", "payout", "money", "income", "revenue", "paid", "how much have i earned"],
    answer:
      "**Earnings** (`/artist/earnings`) breaks down:\n- **Total earnings** (all-time)\n- **Monthly earnings** (current month)\n- **Pending payouts** (waiting for the 48-h post-event clearing window)\n- **Per-booking** rows showing client, date, gross, platform fee (~10%), and net payout\n\n**Schedule:**\n- **50% advance** unlocks immediately when you confirm.\n- **50% balance** is captured 48 h before the event and unlocks 48 h after.\n- Payouts are sent to the bank account on file.",
    followUps: ["What is the platform fee?", "When do I get paid?", "Where do I add my bank account?"],
    actions: [
      { label: "Open Earnings", type: "navigate", value: "/artist/earnings", variant: "primary" },
      { label: "Profile Settings", type: "navigate", value: "/artist/profile", variant: "ghost" },
    ],
    audience: "artist",
  },
  {
    id: "artist-profile-edit",
    label: "Edit artist profile / hourly rate",
    keywords: ["edit profile", "update profile", "change rate", "hourly rate", "stage name", "gallery", "profile settings", "edit artist"],
    answer:
      "**Artist Profile Settings** (`/artist/profile` or **Edit Profile** at `/artist/edit-profile`) lets you update:\n- **Stage name**, **bio**, **category**, **genres**\n- **Hourly rate** + minimum booking length\n- **Location** + travel radius\n- **Profile image**, **cover image**, **gallery** (videos, photos, audio)\n- **Social links** (Instagram, YouTube, Spotify)\n- **Bank details** for payouts\n\nA complete, polished profile dramatically improves bookings.",
    followUps: ["Why is verification needed?", "How do I publish availability?"],
    actions: [
      { label: "Profile Settings", type: "navigate", value: "/artist/profile", variant: "primary" },
      { label: "Edit Profile", type: "navigate", value: "/artist/edit-profile", variant: "ghost" },
    ],
    audience: "artist",
  },
  {
    id: "artist-verification",
    label: "Artist verification",
    keywords: ["verification", "approve me", "pending approval", "verify my profile", "how long approval"],
    answer:
      "After sign-up your profile is **pending admin verification**:\n- Admin reviews **ID**, **portfolio quality**, and at least one verifiable past performance.\n- Typical review time: **1–3 business days**.\n- You can already publish slots and edit your profile while pending — they go live in `/search` once approved.",
    followUps: ["How do I improve my profile?", "Where do I see my approval status?"],
    audience: "artist",
  },
  {
    id: "artist-tips",
    label: "Tips to get more bookings",
    keywords: ["more bookings", "increase bookings", "no bookings", "tips", "rank higher"],
    answer:
      "**Boost your visibility on Book Your Artist:**\n- Use a **professional profile photo** + cover image.\n- Add a **strong bio** with notable past gigs.\n- Upload **3–6 portfolio media** items (videos > photos).\n- Keep **rates competitive** for your category.\n- Publish at least **6 weekend slots** per month so you appear in *available this weekend* searches.\n- Respond to requests **within 4 hours** — fast responders rank higher.\n- Ask happy clients to **leave reviews** after the show.",
    followUps: ["How do I publish availability?", "Edit artist profile"],
    audience: "artist",
  },

  /* ---------------- Misc / cross-audience ---------------- */
  {
    id: "switch-roles",
    label: "Use one account as both client and artist",
    keywords: ["both client and artist", "switch role", "use as both", "two accounts"],
    answer:
      "Each account has **one role** at sign-up to keep dashboards clean. If you want to be both, create a **separate artist account** with a different email. We are evaluating multi-role accounts for a future release.",
    followUps: ["Create an artist account", "Sign in"],
    audience: "any",
  },
  {
    id: "support-contact",
    label: "Contact support",
    keywords: ["support", "help me", "contact us", "human", "talk to a person"],
    answer:
      "I cover most questions instantly. For payment disputes or verification escalations, drop a note via the **Notifications → Support** thread, or email **support@bookyourartist.local** (replace with your real address). Typical response: **24 h** on business days.",
    followUps: ["Refund policy", "Verification time"],
    audience: "any",
  },
];

/* ============================================================
 * Helpers used by the API route + system prompt builders.
 * ========================================================== */

/** Find best FAQ match by counting keyword hits, optionally biased by audience. */
export function answerFromKnowledge(
  message: string,
  audience: "client" | "artist" | "any" = "any"
): FaqEntry | null {
  const m = message.toLowerCase();
  let best: { entry: FaqEntry; score: number } | null = null;
  for (const entry of FAQ) {
    const entryAud = entry.audience ?? "any";
    if (audience !== "any" && entryAud !== "any" && entryAud !== audience) continue;
    let score = 0;
    for (const kw of entry.keywords) {
      if (m.includes(kw)) score += kw.split(" ").length;
    }
    if (entryAud === audience && audience !== "any") score += 0.5;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best?.entry ?? null;
}

/** Public quick prompts grouped by audience for chips and welcome screens. */
export function quickPromptsForAudience(audience: "client" | "artist" | "any"): string[] {
  if (audience === "artist") {
    return [
      "How do I publish availability?",
      "How do I respond to booking requests?",
      "Where do I see earnings?",
      "How are payouts scheduled?",
      "Tips to get more bookings",
    ];
  }
  if (audience === "client") {
    return [
      "How does booking work?",
      "Recommend a DJ for a wedding",
      "How does payment work?",
      "Help me complete my profile",
      "Show international artists",
    ];
  }
  return [
    "How do I create an account?",
    "How do I log in?",
    "What is Book Your Artist?",
    "How does booking work?",
  ];
}

/** Search the sitemap for relevant page suggestions. */
export function findRoutes(query: string, max = 3): SiteRoute[] {
  const m = query.toLowerCase();
  return SITE_ROUTES
    .map((r) => {
      const hit =
        r.keywords.some((k) => m.includes(k)) ||
        m.includes(r.label.toLowerCase()) ||
        m.includes(r.path.toLowerCase());
      return hit ? r : null;
    })
    .filter((r): r is SiteRoute => r != null)
    .slice(0, max);
}

/** A compact training-data block injected into the OpenAI system prompt. */
export function buildKnowledgeContext(): string {
  const routes = SITE_ROUTES.slice(0, 14)
    .map((r) => `- ${r.path} (${r.audience}): ${r.description}`)
    .join("\n");
  const artists = ALL_CATALOG_ARTISTS.slice(0, 10)
    .map(
      (a) =>
        `- ${a.name} | ${a.category} | ${a.location} | $${a.hourlyRate}/hr | ★${a.rating} | ${a.origin ?? "local"}`
    )
    .join("\n");
  const faq = FAQ.slice(0, 8)
    .map((f) => `Q: ${f.label}\nA: ${f.answer.split("\n")[0]}`)
    .join("\n");
  return `\nWEBSITE PAGES:\n${routes}\n\nFEATURED ARTISTS:\n${artists}\n\nKEY FAQ:\n${faq}`;
}
