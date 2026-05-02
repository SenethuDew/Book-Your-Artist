const axios = require("axios");
const ArtistProfile = require("../models/ArtistProfile");
const Booking = require("../models/Booking");
const User = require("../models/User");

/* =========================================================================
 * Static knowledge base – platform & real-world music industry facts.
 * Used both as ChatGPT system context and as fallback when no key is set.
 * ======================================================================= */
const PLATFORM_FACTS = {
  about:
    "Book Your Artist is a curated marketplace that connects clients with verified DJs, live bands, singers, and rappers in Sri Lanka and beyond. Clients browse profiles, check published availability, and book directly with secure payments.",
  features: [
    "Smart artist search with category, location and budget filters.",
    "Real-time booking calendar with green published slots.",
    "Secure Stripe payments – 50% advance, 50% balance 48h before the event.",
    "In-app messaging and notifications for every booking update.",
    "Verified profiles with portfolio media, ratings, and travel radius.",
    "Client AI Support assistant (this one) for recommendations and help.",
  ],
  bookingFlow: [
    "Search for artists by name, category, or location from the home page.",
    "Open an artist profile to review bio, genres, ratings, and price.",
    "Pick a published green slot in the booking calendar and submit details.",
    "Pay the 50% advance via Stripe checkout (cards / Apple Pay / Google Pay).",
    "Wait for artist confirmation; you’ll be notified instantly.",
    "Chat with the artist for setlists, sound, or stage requirements.",
    "Pay the remaining balance 48 hours before the event date.",
    "After the show, leave a rating to help future clients.",
  ],
  profileTips: [
    "Upload a real, well-lit profile photo so artists recognize the booking.",
    "Set your **city / venue** location – artists filter by travel radius.",
    "Add your phone number; artists need it for venue coordination.",
    "Keep your name and email accurate – they appear on invoices.",
    "Use the home-page search bar; suggestions appear as you type.",
    "Save favourite artists by visiting their profile and bookmarking.",
  ],
  paymentPolicy:
    "All payments go through Stripe (PCI-DSS Level 1). A 50% advance is held when the artist confirms; the remaining 50% is auto-charged 48h before the event. Refunds: 100% if cancelled >14 days out, 50% if 7–14 days, none under 7 days.",
  cancellation:
    "Cancellations made more than 14 days before the event get a full refund. Within 7–14 days the advance is forfeited; under 7 days the full quote is due (covers the artist's locked time).",
  faq: {
    "how do i contact an artist":
      "Open the artist's profile and use the **Quick Booking** form, or send a message via the in-app chat after a booking is confirmed.",
    "what events are supported":
      "Weddings, corporate events, birthdays, private parties, festivals, club nights, lounge sets, school events, and brand activations.",
    "how are artists verified":
      "Every profile is reviewed by the admin team for ID, portfolio quality, and at least one verifiable past performance before going live.",
    "can i negotiate price":
      "Yes – use the booking notes field to propose a custom package. Artists can accept, counter, or decline.",
  },
};

const REAL_WORLD_ARTISTS = {
  "sri lankan singers": [
    { name: "Yohani De Silva", note: "viral global hit 'Manike Mage Hithe', perfect for weddings & corporate events." },
    { name: "Umaria Sinhawansa", note: "polished pop/Sinhala fusion, great for elegant receptions." },
    { name: "BnS (Bathiya & Santhush)", note: "iconic duo, large-stage friendly." },
    { name: "Iraj Weeraratne", note: "fusion / hip-hop crossover, excellent for high-energy nights." },
    { name: "Kasun Kalhara", note: "soulful Sinhala vocals, ideal for intimate gatherings." },
  ],
  "international singers": [
    { name: "Taylor Swift", note: "global pop powerhouse." },
    { name: "Ed Sheeran", note: "acoustic & pop, universally loved." },
    { name: "Dua Lipa", note: "modern dance-pop." },
    { name: "The Weeknd", note: "R&B / synth-pop." },
    { name: "Adele", note: "soulful ballads." },
  ],
  "sri lankan djs": [
    { name: "DJ Mass MJC", note: "drops & remixes, club & wedding pro." },
    { name: "DJ Imalka", note: "popular open-format selector." },
    { name: "DJ Naveen", note: "wedding & lounge specialist." },
  ],
  "international djs": [
    { name: "Calvin Harris", note: "EDM superstar." },
    { name: "David Guetta", note: "stadium house anthems." },
    { name: "Martin Garrix", note: "festival-grade big-room sets." },
  ],
  "live bands": [
    { name: "Infinity", note: "Sri Lankan top wedding band." },
    { name: "Mid Lane", note: "high-energy versatile band." },
    { name: "News Sarith & Surith", note: "modern Sinhala rock-pop." },
    { name: "Coldplay", note: "iconic international touring band." },
    { name: "Maroon 5", note: "global pop/rock crossover." },
  ],
  rappers: [
    { name: "Costa", note: "leading Sri Lankan rapper." },
    { name: "Drill Team", note: "rap collective for hype shows." },
    { name: "Drake", note: "global hip-hop megastar." },
    { name: "Kendrick Lamar", note: "lyrical Pulitzer-winning rapper." },
  ],
};

/* =========================================================================
 * Live data helpers – pull recommendations directly from the database.
 * ======================================================================= */
const fetchTopArtists = async ({ category, location, maxPrice, limit = 5 } = {}) => {
  const filter = { verified: true };
  if (category) filter.category = new RegExp(`^${category}`, "i");
  if (location) filter.location = new RegExp(location, "i");
  if (maxPrice) filter.hourlyRate = { $lte: maxPrice };

  const artists = await ArtistProfile.find(filter)
    .sort({ rating: -1, reviewCount: -1, hourlyRate: 1 })
    .limit(limit)
    .lean();

  return artists.map((a) => ({
    id: a._id,
    name: a.name,
    category: a.category,
    location: a.location,
    hourlyRate: a.hourlyRate,
    rating: a.rating,
    reviewCount: a.reviewCount,
    genres: a.genres,
    profileImage: a.profileImage,
  }));
};

const fetchPlatformStats = async () => {
  try {
    const [totalArtists, verifiedArtists, totalBookings, totalUsers, priceAgg] = await Promise.all([
      ArtistProfile.countDocuments({}),
      ArtistProfile.countDocuments({ verified: true }),
      Booking.countDocuments({}),
      User.countDocuments({}),
      ArtistProfile.aggregate([
        { $match: { hourlyRate: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            avg: { $avg: "$hourlyRate" },
            min: { $min: "$hourlyRate" },
            max: { $max: "$hourlyRate" },
          },
        },
      ]),
    ]);

    return {
      totalArtists,
      verifiedArtists,
      totalBookings,
      totalUsers,
      priceAvg: Math.round(priceAgg[0]?.avg || 0),
      priceMin: priceAgg[0]?.min || 0,
      priceMax: priceAgg[0]?.max || 0,
    };
  } catch {
    return null;
  }
};

/* =========================================================================
 * Intent detection + entity extraction (rule-based fallback brain).
 * ======================================================================= */
const CATEGORY_MAP = [
  { keys: ["dj", "djs"], label: "DJ" },
  { keys: ["singer", "vocalist", "vocal"], label: "Singer" },
  { keys: ["band", "live band", "live music"], label: "Band" },
  { keys: ["rapper", "rap", "hip hop", "hip-hop"], label: "Rapper" },
];

const detectCategory = (msg) => {
  for (const cat of CATEGORY_MAP) {
    if (cat.keys.some((k) => msg.includes(k))) return cat.label;
  }
  return null;
};

const extractBudget = (msg) => {
  const match = msg.match(/(?:under|below|less than|max|<=?)\s*\$?(\d{2,5})/i) || msg.match(/\$\s?(\d{2,5})/);
  return match ? parseInt(match[1], 10) : null;
};

const extractLocation = (msg) => {
  const cities = [
    "colombo", "kandy", "galle", "negombo", "jaffna", "matara",
    "nugegoda", "dehiwala", "moratuwa", "mount lavinia", "kurunegala",
  ];
  return cities.find((c) => msg.toLowerCase().includes(c)) || null;
};

const formatArtistList = (artists) => {
  if (!artists.length) return "";
  return artists
    .map((a, i) => {
      const stars = a.rating ? `★ ${a.rating.toFixed(1)} (${a.reviewCount || 0})` : "new";
      const price = a.hourlyRate ? `$${a.hourlyRate}/hr` : "price on request";
      const loc = a.location ? ` · ${a.location}` : "";
      const genres = a.genres?.length ? ` · ${a.genres.slice(0, 3).join(", ")}` : "";
      return `${i + 1}. **${a.name}** — ${a.category || "Artist"} · ${price} · ${stars}${loc}${genres}`;
    })
    .join("\n");
};

const ruleBasedAnswer = async (message) => {
  const msg = message.toLowerCase().trim();
  if (!msg) {
    return "Ask me anything about artists, profile setup, payments, or famous performers!";
  }

  const category = detectCategory(msg);
  const location = extractLocation(msg);
  const budget = extractBudget(msg);

  // === Live recommendation intent ===
  const wantsRecommendation =
    /\b(recommend|suggest|best|top|find|show|need|looking for|book a|hire a|who should i|who is the best)\b/.test(
      msg
    ) || (category && /\b(for|wedding|party|event|birthday|corporate)\b/.test(msg));

  if (wantsRecommendation) {
    try {
      const live = await fetchTopArtists({
        category,
        location,
        maxPrice: budget,
        limit: 5,
      });
      if (live.length) {
        const filterParts = [
          category && `category **${category}**`,
          location && `in **${location}**`,
          budget && `under **$${budget}/hr**`,
        ]
          .filter(Boolean)
          .join(", ");
        const intro = filterParts
          ? `Top live picks ${filterParts}:`
          : "Top-rated artists on the platform right now:";
        return `${intro}\n${formatArtistList(live)}\n\n_Tap **Browse Artists** in the navbar to filter or open a profile to book._`;
      }
    } catch {
      /* fall through */
    }

    if (category && REAL_WORLD_ARTISTS[`sri lankan ${category.toLowerCase()}s`]) {
      const list = REAL_WORLD_ARTISTS[`sri lankan ${category.toLowerCase()}s`];
      return `Famous Sri Lankan ${category}s you might book or model your event around:\n${list
        .map((a, i) => `${i + 1}. **${a.name}** — ${a.note}`)
        .join("\n")}`;
    }
  }

  // === Famous artists ===
  if (/\b(famous|popular|top|legend|iconic)\b/.test(msg)) {
    let bucket = null;
    if (msg.includes("dj")) bucket = msg.includes("international") ? "international djs" : "sri lankan djs";
    else if (msg.includes("band")) bucket = "live bands";
    else if (msg.includes("rap") || msg.includes("hip")) bucket = "rappers";
    else if (msg.includes("singer") || msg.includes("vocal"))
      bucket = msg.includes("international") ? "international singers" : "sri lankan singers";

    if (bucket) {
      const list = REAL_WORLD_ARTISTS[bucket];
      return `**${bucket.replace(/\b\w/g, (c) => c.toUpperCase())}**:\n${list
        .map((a, i) => `${i + 1}. **${a.name}** — ${a.note}`)
        .join("\n")}`;
    }
    return `Globally famous performers:\n- Pop: Taylor Swift, Ed Sheeran, Dua Lipa\n- DJ: Calvin Harris, David Guetta, Martin Garrix\n- Bands: Coldplay, Maroon 5\n- Rap: Drake, Kendrick Lamar\n\nLocally on the platform, **Yohani De Silva**, **DJ Mass**, and **Infinity** are top-booked.`;
  }

  // === Booking flow ===
  if (/\b(book|booking|reserve|how do i|how to|process|steps)\b/.test(msg) && !msg.includes("profile")) {
    return `**How booking works on Book Your Artist:**\n${PLATFORM_FACTS.bookingFlow
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n")}`;
  }

  // === Profile help ===
  if (/\b(profile|account|settings|my info|complete)\b/.test(msg)) {
    return `**Tips to strengthen your client profile:**\n${PLATFORM_FACTS.profileTips
      .map((t) => `- ${t}`)
      .join("\n")}\n\nGo to the avatar menu → **Profile Settings** to update everything in one place.`;
  }

  // === Pricing / payment ===
  if (/\b(price|cost|payment|advance|fee|charge|stripe|refund)\b/.test(msg)) {
    const stats = await fetchPlatformStats();
    const liveLine = stats
      ? `Live platform pricing: average **$${stats.priceAvg}/hr**, range **$${stats.priceMin}–$${stats.priceMax}/hr** across ${stats.verifiedArtists} verified artists.\n\n`
      : "";
    return `${liveLine}${PLATFORM_FACTS.paymentPolicy}\n\n**Cancellation:** ${PLATFORM_FACTS.cancellation}`;
  }

  // === Platform stats ===
  if (/\b(stats|statistics|how many|numbers|popular artists|trending)\b/.test(msg)) {
    const stats = await fetchPlatformStats();
    if (stats) {
      return `**Book Your Artist – live stats:**\n- 🎤 ${stats.verifiedArtists} verified artists (${stats.totalArtists} total)\n- 👥 ${stats.totalUsers} registered users\n- 📅 ${stats.totalBookings} bookings completed\n- 💰 Avg rate $${stats.priceAvg}/hr (range $${stats.priceMin}–$${stats.priceMax})`;
    }
  }

  // === FAQ keywords ===
  for (const [k, v] of Object.entries(PLATFORM_FACTS.faq)) {
    if (msg.includes(k.split(" ")[0]) && msg.includes(k.split(" ").slice(-1)[0])) {
      return v;
    }
  }

  // === About platform ===
  if (/\b(about|what is|who are you|platform|book your artist)\b/.test(msg)) {
    return `${PLATFORM_FACTS.about}\n\n**Key features:**\n${PLATFORM_FACTS.features
      .map((f) => `- ${f}`)
      .join("\n")}`;
  }

  // === Wedding / event presets ===
  if (/\b(wedding|reception|birthday|corporate|party|festival|event)\b/.test(msg)) {
    try {
      const live = await fetchTopArtists({ limit: 6 });
      if (live.length) {
        return `For your event, here are top-rated picks across categories:\n${formatArtistList(
          live
        )}\n\nUse the **Search** page to filter by **DJ**, **Singer**, **Band**, or **Rapper** and add a date.`;
      }
    } catch {
      /* fall through */
    }
  }

  // === Greetings ===
  if (/^(hi|hello|hey|yo|good (morning|evening|afternoon)|namaste|ayubowan)\b/.test(msg)) {
    return "Hello! I'm your **AI Booking Concierge** for Book Your Artist. I can:\n- Recommend live, verified artists by category, city, or budget\n- Walk you through booking, payments, and cancellation\n- Share famous local & international performers\n- Help you complete your client profile\n\nWhat would you like help with?";
  }

  return `I'm your **AI Booking Concierge**. Try one of these:\n- _"Recommend a DJ in Colombo under $200"_\n- _"Best singer for a wedding"_\n- _"How do I book and pay?"_\n- _"Help me complete my profile"_\n- _"Famous Sri Lankan rappers"_\n- _"Show platform statistics"_`;
};

/* =========================================================================
 * OpenAI integration with live context.
 * ======================================================================= */
const buildSystemPrompt = async () => {
  let liveContext = "";
  try {
    const [stats, top] = await Promise.all([
      fetchPlatformStats(),
      fetchTopArtists({ limit: 8 }),
    ]);
    if (stats) {
      liveContext += `\n\nLIVE PLATFORM STATS: ${stats.verifiedArtists} verified artists, ${stats.totalUsers} users, ${stats.totalBookings} bookings, avg rate $${stats.priceAvg}/hr (range $${stats.priceMin}-$${stats.priceMax}).`;
    }
    if (top.length) {
      liveContext += `\n\nTOP ARTISTS RIGHT NOW:\n${top
        .map(
          (a) =>
            `- ${a.name} (${a.category || "Artist"}, ${a.location || "n/a"}, $${a.hourlyRate}/hr, ★${
              a.rating?.toFixed(1) || "new"
            })`
        )
        .join("\n")}`;
    }
  } catch {
    /* ignore */
  }

  return `You are the **AI Booking Concierge** for "Book Your Artist", a marketplace for booking DJs, singers, live bands, and rappers (with strong roots in Sri Lanka).

Your job: help **clients** in four areas:
1. Recommend artists by category (DJ, Singer, Band, Rapper), location, mood/event type, language, or budget. Cite **real** platform artists when available.
2. Guide profile setup (image, name, phone, location, account verification).
3. Explain booking flow, Stripe payments, refunds, cancellations, messaging.
4. Share real-world music industry knowledge: famous Sri Lankan & international performers, what suits each event type, set-list ideas.

Style rules:
- Be concise, friendly, expert, and **specific** — never vague.
- Use **markdown**: bold names, bullet lists, numbered steps. Keep replies under 220 words unless asked for depth.
- Reference real platform features by name: Search, Browse Artists, Booking Calendar, Quick Booking, Profile Settings, Notifications.
- If asked something unrelated to music/events/the platform, politely steer back.
- Never invent prices or artist names that aren't in the live data unless clearly framed as real-world examples.

PLATFORM FACTS:
${PLATFORM_FACTS.about}
Booking flow: ${PLATFORM_FACTS.bookingFlow.join(" | ")}
Payments: ${PLATFORM_FACTS.paymentPolicy}
Cancellation: ${PLATFORM_FACTS.cancellation}
${liveContext}`;
};

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const systemPrompt = await buildSystemPrompt();
        const messages = [
          { role: "system", content: systemPrompt },
          ...(Array.isArray(history) ? history.slice(-10) : []),
          { role: "user", content: message },
        ];

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages,
            temperature: 0.55,
            max_tokens: 600,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        const reply = response.data?.choices?.[0]?.message?.content?.trim();
        if (reply) {
          return res.json({ success: true, reply, source: "openai" });
        }
      } catch (err) {
        console.error("[AI] OpenAI failure, falling back:", err.response?.data || err.message);
      }
    }

    const reply = await ruleBasedAnswer(message);
    return res.json({ success: true, reply, source: "concierge" });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      success: false,
      message: "AI assistant is temporarily unavailable.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
