"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  RefreshCcw,
  Trash2,
  Music,
  CreditCard,
  UserCog,
  Star,
  HelpCircle,
  Zap,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";
import { getApiBaseUrl, getAuthToken } from "@/lib/api";
import ChatMessage, { UIMessage } from "@/components/ai/ChatMessage";
import { loadAIChat, saveAIChat, clearAIChat } from "@/lib/aiChatStore";
import type { BookingFlowState } from "@/app/api/ai-assistant/route";

interface ProfileSnapshot {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  preferences?: { eventType?: string; budget?: number; genres?: string[] };
}

const STORAGE_KEY = "bya_ai_chat_v3";

const PROMPT_CATEGORIES: Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompts: string[];
}> = [
  {
    id: "recommend",
    label: "Find Artists",
    icon: Music,
    prompts: [
      "Recommend a DJ in Colombo under $200",
      "Best singer for a wedding reception",
      "Suggest a live band for a corporate event",
      "Show top international artists",
    ],
  },
  {
    id: "booking",
    label: "Booking Flow",
    icon: Zap,
    prompts: [
      "Book a DJ for a wedding",
      "Help me book a singer next Saturday",
      "Start a booking for a birthday party",
    ],
  },
  {
    id: "payment",
    label: "Payments",
    icon: CreditCard,
    prompts: [
      "How does payment work?",
      "What is the cancellation policy?",
      "Show platform statistics",
    ],
  },
  {
    id: "profile",
    label: "My Profile",
    icon: UserCog,
    prompts: [
      "How complete is my profile?",
      "Help me complete my profile",
      "Why do I need a location?",
    ],
  },
  {
    id: "famous",
    label: "Music World",
    icon: Star,
    prompts: [
      "Famous Sri Lankan singers",
      "Top international DJs",
      "Best live bands globally",
    ],
  },
];

const introMessage = (name?: string): UIMessage => ({
  id: "intro",
  role: "assistant",
  ts: Date.now(),
  content: `Hi${name ? `, **${name.split(" ")[0]}**` : ""}! I'm your **AI Booking Concierge**. I can:\n- Recommend live, verified artists by category, city, or budget\n- Walk you through a complete booking step-by-step\n- Explain Stripe payments, refunds, and cancellation\n- Help you complete your client profile\n\nPick a quick prompt on the right or type below.`,
  actions: [
    { label: "View Artists", type: "navigate", value: "/search", variant: "ghost" },
    { label: "View Profile", type: "navigate", value: "/profile", variant: "ghost" },
  ],
});

function AISupportContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<UIMessage[]>([introMessage(user?.name)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingFlow, setBookingFlow] = useState<BookingFlowState | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState(PROMPT_CATEGORIES[0].id);
  const [dynamicReplies, setDynamicReplies] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const userId = user?._id || user?.id;

  /* -------- Load profile from backend -------- */
  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data?.user) {
          setProfile({
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            location: data.user.location,
            profileImage: data.user.profileImage,
            preferences: data.user.preferences,
          });
        }
      } catch {
        /* ignore */
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  /* -------- Hydrate from Firestore + localStorage -------- */
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      // localStorage first (instant)
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.messages) && parsed.messages.length) {
            if (!cancelled) {
              setMessages(parsed.messages);
              if (parsed.bookingFlow) setBookingFlow(parsed.bookingFlow);
            }
          }
        }
      } catch {
        /* ignore */
      }

      // Then Firestore (authoritative cross-device)
      if (userId) {
        const remote = await loadAIChat(userId);
        if (!cancelled && remote && remote.messages.length) {
          setMessages(remote.messages);
          setBookingFlow(remote.bookingFlow);
        }
      }
      if (!cancelled) setHydrated(true);
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* -------- Persist on change (debounced via effect cycle) -------- */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, bookingFlow }));
    } catch {
      /* ignore */
    }
    if (userId) saveAIChat(userId, messages, bookingFlow);
  }, [messages, bookingFlow, hydrated, userId]);

  /* -------- Auto-scroll -------- */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const activePrompts = useMemo(
    () => PROMPT_CATEGORIES.find((c) => c.id === activeCategory)?.prompts || [],
    [activeCategory]
  );

  /* -------- Build dynamic quick replies based on last 3 user messages -------- */
  useEffect(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      setDynamicReplies([
        "Recommend a DJ for a wedding",
        "Start a booking",
        "How do I pay?",
      ]);
      return;
    }
    const t = lastUser.content.toLowerCase();
    const dynamic: string[] = [];
    if (t.includes("dj")) dynamic.push("Find a singer instead", "Show low-budget DJs");
    if (t.includes("singer")) dynamic.push("Find a band instead", "Show top Sri Lankan singers");
    if (t.includes("band")) dynamic.push("Show DJs", "Find international bands");
    if (t.includes("wedding")) dynamic.push("Show DJs for wedding", "Best singers for wedding");
    if (t.includes("budget") || /\$\d/.test(t)) dynamic.push("Increase my budget", "No budget limit");
    if (t.includes("profile")) dynamic.push("Open Profile Settings", "Why complete my profile?");
    if (!dynamic.length)
      dynamic.push("Recommend an artist", "Start a booking", "How does payment work?");
    setDynamicReplies(dynamic.slice(0, 4));
  }, [messages]);

  /* -------- Core call -------- */
  const callAssistant = async (conversation: UIMessage[]) => {
    setLoading(true);
    setError("");
    try {
      const userMsg = conversation[conversation.length - 1];
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: conversation
            .slice(0, -1)
            .filter((m) => m.id !== "intro")
            .map((m) => ({ role: m.role, content: m.content })),
          profile,
          bookingFlow,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "AI assistant failed.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          ts: Date.now(),
          content: data.reply,
          artists: data.artists,
          actions: data.actions,
        },
      ]);

      if (data.bookingFlow) {
        setBookingFlow(data.bookingFlow.active ? data.bookingFlow : undefined);
      }
      if (Array.isArray(data.quickReplies) && data.quickReplies.length) {
        setDynamicReplies(data.quickReplies.slice(0, 4));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI assistant unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: UIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      ts: Date.now(),
      content: trimmed,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    await callAssistant(next);
  };

  const regenerate = async () => {
    if (loading) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const sliceEnd = messages.length - lastUserIdx;
    const trimmed = messages.slice(0, sliceEnd);
    setMessages(trimmed);
    await callAssistant(trimmed);
  };

  const clearChat = async () => {
    setMessages([introMessage(user?.name)]);
    setBookingFlow(undefined);
    setError("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (userId) await clearAIChat(userId);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  const profileMissingCount = useMemo(() => {
    if (!profile) return 0;
    return [profile.name, profile.email, profile.phone, profile.location, profile.profileImage]
      .filter((v) => !v).length;
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#07040f] text-white selection:bg-violet-500/30 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-64 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Top bar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/home/client"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 text-xs font-black uppercase tracking-[0.22em]">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" /> AI Concierge
          </span>
          <div className="flex items-center gap-2">
            {bookingFlow?.active && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-400/30 text-emerald-200">
                <Zap className="w-3 h-3" /> Booking flow · {bookingFlow.step}
              </span>
            )}
            <button
              onClick={regenerate}
              disabled={loading || messages.filter((m) => m.role === "user").length === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
              title="Regenerate"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Regenerate
            </button>
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Hero */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 sm:p-8 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl mb-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300 flex items-center gap-2">
              <Bot className="w-4 h-4 text-fuchsia-300" /> AI Booking Concierge
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold mt-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-fuchsia-300">
              Smart help for booking, profile & music
            </h1>
            <p className="text-gray-400 mt-3 max-w-3xl">
              Context-aware conversations, live artist recommendations, step-by-step booking flow,
              profile coaching, and real-world music industry insights — all in one chat.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                "Context-aware",
                "Profile-aware",
                "Live artist cards",
                "Step-by-step booking",
                "Cross-device chat",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/10 bg-gray-950/40 text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {profile && profileMissingCount > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
                <UserCog className="w-4 h-4" />
                Your profile is missing <strong>{profileMissingCount}</strong>{" "}
                field{profileMissingCount === 1 ? "" : "s"}. I can help you finish it.
                <button
                  onClick={() => router.push("/profile/settings")}
                  className="ml-auto px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-xs font-black"
                >
                  Open Settings
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Chat */}
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden">
            <div
              ref={scrollRef}
              className="px-5 sm:px-7 py-6 space-y-5 max-h-[64vh] min-h-[440px] overflow-y-auto"
            >
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} onPrompt={sendMessage} />
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-sm text-violet-200">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gray-950/60 px-4 py-3 inline-flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">AI is thinking</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={regenerate} className="text-xs underline hover:text-red-200">
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic quick replies */}
            {!!dynamicReplies.length && (
              <div className="border-t border-white/10 bg-gray-950/40 px-4 sm:px-5 py-3 flex flex-wrap gap-2">
                {dynamicReplies.map((r) => (
                  <button
                    key={r}
                    onClick={() => sendMessage(r)}
                    disabled={loading}
                    className="rounded-full border border-violet-400/20 bg-violet-500/10 hover:bg-violet-500/20 text-violet-100 text-xs font-bold px-3 py-1.5 transition-all disabled:opacity-50"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="border-t border-white/10 bg-gray-950/70 p-4 sm:p-5 flex items-end gap-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={1}
                placeholder={
                  bookingFlow?.active
                    ? `Booking flow · ${bookingFlow.step} — type your answer`
                    : "Ask anything – e.g. 'Recommend a singer in Kandy under $250 for a wedding'"
                }
                className="flex-1 resize-none rounded-2xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/40 max-h-32"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 font-black text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-fuchsia-300" />
                <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
                  Quick Prompts
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {PROMPT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all ${
                        active
                          ? "bg-violet-500/20 border-violet-400/40 text-white"
                          : "bg-gray-950/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <Icon className="w-3 h-3" /> {cat.label}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                {activePrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={loading}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left rounded-2xl border border-white/10 bg-gray-950/50 px-4 py-3 text-sm text-gray-200 hover:border-violet-400/40 hover:bg-violet-500/10 disabled:opacity-50 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-cyan-300" />
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                  Capabilities
                </p>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2"><span className="text-fuchsia-400">●</span>Smart artist recommendation engine.</li>
                <li className="flex gap-2"><span className="text-fuchsia-400">●</span>Step-by-step booking flow inside chat.</li>
                <li className="flex gap-2"><span className="text-fuchsia-400">●</span>Profile-aware: uses your prefs to suggest.</li>
                <li className="flex gap-2"><span className="text-fuchsia-400">●</span>Action buttons → Book, View Profile, Browse.</li>
                <li className="flex gap-2"><span className="text-fuchsia-400">●</span>Conversation persisted to Firestore.</li>
              </ul>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}

export default function AISupportPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <AISupportContent />
    </ProtectedRoute>
  );
}
