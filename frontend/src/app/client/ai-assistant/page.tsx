"use client";

/**
 * Advanced AI Booking Assistant — client page.
 * Uses Firestore: clients/{uid}, ai_sessions/{uid}, ai_chats/{uid}/messages/{id}
 * and POST /api/ai-assistant for rule-based (and optional OpenAI) replies.
 */

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  RefreshCcw,
  Trash2,
  WifiOff,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";
import { getApiBaseUrl, getAuthToken } from "@/lib/api";
import ChatMessage, { type UIMessage } from "@/components/ai/ChatMessage";
import QuickPromptChips from "@/components/ai/QuickPromptChips";
import TypingIndicator from "@/components/ai/TypingIndicator";
import type { AssistantApiResponse, AISessionState, ClientProfileSnapshot } from "@/lib/ai/types";
import type { RecommendedArtist } from "@/lib/ai/types";
import type { BookingSummaryPayload } from "@/lib/ai/types";
import {
  appendChatMessage,
  clearChatMessages,
  loadAISession,
  loadChatMessages,
  loadClientProfile,
  saveAISession,
  upsertClientProfileFromApi,
} from "@/lib/ai/persistence";

function introMessage(name?: string): UIMessage {
  return {
    id: "intro",
    role: "assistant",
    ts: Date.now(),
    content: `Welcome${name ? `, **${name.split(" ")[0]}**` : ""} — I am your **AI Booking Assistant**.\n\nI remember your **event**, **budget**, and **location** across messages, pull your **client profile** from Firestore when available, and can **walk you through booking** one question at a time.\n\nTry a chip below or type naturally.`,
  };
}

function mapApiUserToProfile(u: Record<string, unknown>): ClientProfileSnapshot {
  const prefs = (u.preferences ?? {}) as Record<string, unknown>;
  return {
    fullName: typeof u.name === "string" ? u.name : "",
    email: typeof u.email === "string" ? u.email : "",
    phone: typeof u.phone === "string" ? u.phone : "",
    location: typeof u.location === "string" ? u.location : "",
    profileImage: typeof u.profileImage === "string" ? u.profileImage : "",
    preferredEventType: typeof prefs.eventType === "string" ? prefs.eventType : "",
    preferredArtistCategory: typeof prefs.category === "string" ? prefs.category : "",
    budgetMin: typeof prefs.budgetMin === "number" ? prefs.budgetMin : undefined,
    budgetMax: typeof prefs.budgetMax === "number" ? prefs.budgetMax : undefined,
    budgetCurrency: prefs.budgetCurrency === "LKR" ? "LKR" : "USD",
    preferredGenres: Array.isArray(prefs.genres) ? (prefs.genres as string[]) : [],
    notificationSettings:
      typeof prefs.notifications === "object" && prefs.notifications
        ? (prefs.notifications as ClientProfileSnapshot["notificationSettings"])
        : undefined,
  };
}

function mergeProfiles(
  api: ClientProfileSnapshot,
  fire: ClientProfileSnapshot | null
): ClientProfileSnapshot {
  if (!fire) return api;
  return {
    ...api,
    ...fire,
    preferredGenres: fire.preferredGenres?.length ? fire.preferredGenres : api.preferredGenres,
  };
}

function storedMessagesToUi(rows: Awaited<ReturnType<typeof loadChatMessages>>): UIMessage[] {
  return rows.map((r, i) => ({
    id: `fs-${r.timestamp}-${i}`,
    role: r.sender === "user" ? "user" : "assistant",
    content: r.text,
    ts: r.timestamp,
    intent: r.intent,
  }));
}

function AIAssistantInner() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userId = user?._id || user?.id || "";

  const [profile, setProfile] = useState<ClientProfileSnapshot | null>(null);
  const [session, setSession] = useState<AISessionState | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([introMessage(user?.name)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offlineHint, setOfflineHint] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<AISessionState | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  /** Load API user → sync `clients/{uid}` → merge Firestore client + session + messages */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) {
        setHydrated(true);
        return;
      }
      try {
        const token = getAuthToken();
        if (token) {
          const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await res.json()) as { user?: Record<string, unknown> };
          if (!cancelled && data?.user) {
            const apiP = mapApiUserToProfile(data.user);
            await upsertClientProfileFromApi(userId, data.user);
            const fireP = await loadClientProfile(userId);
            setProfile(mergeProfiles(apiP, fireP));
          }
        }
        const [sess, hist] = await Promise.all([loadAISession(userId), loadChatMessages(userId)]);
        if (cancelled) return;
        if (sess) setSession(sess);
        if (hist.length) {
          const ui = storedMessagesToUi(hist);
          setMessages([introMessage(user?.name), ...ui]);
        }
      } catch {
        if (!cancelled) setOfflineHint(true);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, user?.name]);

  const dynamicPrompts = useMemo(() => {
    const out: string[] = [];
    if (profile?.budgetMax != null || profile?.budgetMin != null) {
      out.push("Find DJs under my budget");
    } else {
      out.push("Find artists under 200 per hour");
    }
    out.push("Recommend singers for a wedding");
    out.push("Show international artists");
    out.push("Help me complete my profile");
    out.push("Check my upcoming bookings");
    if (session?.bookingStep && session.bookingStep !== "done") {
      out.push("Continue booking");
    } else {
      out.push("Start a booking");
    }
    out.push("Find available artists this weekend");
    return [...new Set(out)].slice(0, 6);
  }, [profile, session]);

  const persistSession = useCallback(
    async (s: AISessionState | null) => {
      if (!userId || !s) return;
      sessionRef.current = s;
      setSession(s);
      await saveAISession(userId, s);
    },
    [userId]
  );

  const sendRaw = useCallback(
    async (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed || loading) return;

      if (!userId) {
        setError("You need to be signed in to use the assistant.");
        return;
      }

      setError("");
      setOfflineHint(false);

      const userMsg: UIMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        ts: Date.now(),
        content: trimmed,
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");

      await appendChatMessage(userId, {
        sender: "user",
        text: trimmed,
        intent: "fallback",
        metadata: {},
      });

      setLoading(true);
      try {
        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: trimmed,
            userId,
            userRole: "client",
            currentPage: pathname ?? "/client/ai-assistant",
            audience: "client",
            conversationState: { session: sessionRef.current },
            clientProfile: profile,
          }),
        });
        const data = (await res.json()) as AssistantApiResponse & { success?: boolean; message?: string };
        if (!res.ok || data.success === false) {
          throw new Error(data.message || "Assistant request failed.");
        }

        const assistantMsg: UIMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          ts: Date.now(),
          content: data.reply,
          artists: data.artists,
          actions: data.actions,
          intent: data.intent,
          bookingSummary: data.bookingSummary,
          profileChecklist: data.profileChecklist,
        };
        setMessages((m) => [...m, assistantMsg]);

        if (data.session) await persistSession(data.session);

        await appendChatMessage(userId, {
          sender: "assistant",
          text: data.reply,
          intent: data.intent,
          metadata: {
            artistIds: data.artists?.map((a) => a.id) ?? [],
            bookingStep: data.session?.bookingStep,
          },
        });
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "Something went wrong. Check your connection and Firebase configuration.";
        setError(msg);
        setOfflineHint(true);
      } finally {
        setLoading(false);
      }
    },
    [loading, userId, profile, persistSession, pathname]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendRaw(input);
  };

  const regenerate = () => {
    const list = [...messages];
    let lastUserIdx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx < 0) return;
    const lastUser = list[lastUserIdx];
    setMessages(list.slice(0, lastUserIdx));
    void sendRaw(lastUser.content);
  };

  const clearChat = async () => {
    setMessages([introMessage(user?.name)]);
    setSession(null);
    setError("");
    if (userId) {
      await clearChatMessages(userId);
      await saveAISession(userId, {
        currentIntent: "help",
        bookingStep: "done",
        bookingData: {},
        updatedAt: Date.now(),
      });
    }
  };

  const onBookArtist = (artist: RecommendedArtist) => {
    sendRaw(`__select_artist__:${artist.id}::${artist.name}`);
  };

  const onSummaryConfirm = (summary: BookingSummaryPayload) => {
    if (summary.selectedArtistId) {
      router.push(`/artist/${summary.selectedArtistId}?from=ai-assistant`);
    }
  };

  const showWelcome = hydrated && messages.length <= 1;

  return (
    <div className="min-h-screen bg-[#07040f] text-white selection:bg-violet-500/30 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href="/home/client"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200 border border-violet-500/30 rounded-full px-3 py-1 bg-violet-500/10">
            <Sparkles className="w-3 h-3 text-fuchsia-300" /> AI Assistant
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={regenerate}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white px-2 py-1 rounded-lg border border-white/10"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-200 hover:text-white px-2 py-1 rounded-lg border border-red-500/30 bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 relative z-10">
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-violet-300 text-xs font-black uppercase tracking-[0.25em]">
            <Bot className="w-5 h-5 text-fuchsia-300" /> Intelligent booking
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
            Plan events, match artists, and move into booking — without losing context.
          </h1>
          {showWelcome && (
            <>
              <p className="text-sm text-gray-400 mt-3 max-w-2xl">
                Trained on every page of Book Your Artist — categories, pricing, calendar, payments,
                profile setup, famous performers, and the full booking flow.
              </p>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  "How does booking work?",
                  "How does payment work?",
                  "What is the cancellation policy?",
                  "Are artists verified?",
                  "Show international artists",
                  "Help me complete my profile",
                ].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => sendRaw(topic)}
                    className="text-left text-xs font-bold text-gray-200 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-violet-500/10 hover:border-violet-400/30"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </>
          )}
        </header>

        <section className="rounded-3xl border border-white/10 bg-gray-950/40 backdrop-blur-xl overflow-hidden min-h-[420px] flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[calc(100vh-16rem)]">
            {offlineHint && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <WifiOff className="w-4 h-4 shrink-0" />
                If messages do not save, Firebase may be offline or rules may block writes — chat still
                works for this session.
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                onPrompt={sendRaw}
                onBookArtist={onBookArtist}
                onSummaryConfirm={onSummaryConfirm}
                onSummaryEdit={() => sendRaw("Edit booking details")}
                onSummaryCancel={() => sendRaw("cancel booking")}
              />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-[#0a0612]/95 px-4 py-3 space-y-2">
            <QuickPromptChips prompts={dynamicPrompts} onSelect={sendRaw} disabled={loading} />
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendRaw(input);
                  }
                }}
                rows={1}
                placeholder="e.g. Book a DJ for my wedding in Colombo next June…"
                className="flex-1 resize-none rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40 max-h-32"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40 shadow-[0_0_24px_-8px_rgba(168,85,247,0.6)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ClientAIAssistantPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <AIAssistantInner />
    </ProtectedRoute>
  );
}
