"use client";

/**
 * Artist-side AI Support page — full-width chat trained on artist tooling
 * (calendar, booking requests, notifications, earnings, profile, payouts).
 */

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bot, Send, Sparkles, RefreshCcw, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";
import ChatMessage, { type UIMessage } from "@/components/ai/ChatMessage";
import QuickPromptChips from "@/components/ai/QuickPromptChips";
import TypingIndicator from "@/components/ai/TypingIndicator";
import type {
  AISessionState,
  AssistantApiResponse,
  ClientProfileSnapshot,
} from "@/lib/ai/types";
import { quickPromptsForAudience } from "@/lib/ai/knowledgeBase";

const intro = (name?: string): UIMessage => ({
  id: "intro",
  role: "assistant",
  ts: Date.now(),
  content: `Welcome${name ? `, **${name.split(" ")[0]}**` : ""} — I am the **AI Support** assistant for artists on Book Your Artist.\n\nI know everything about:\n- **Booking calendar** — adding, publishing, accepting, rejecting slots\n- **Booking requests** — what to do when an orange tile appears\n- **Notifications** — message threads, alerts, payout updates\n- **Earnings & payouts** — fees, schedule, bank account\n- **Profile & verification** — going live in client search\n- **Tips** to rank higher and get more bookings\n\nAsk anything below.`,
});

function ArtistAssistantInner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [messages, setMessages] = useState<UIMessage[]>([intro(user?.name)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sessionRef = useRef<AISessionState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].id === "intro" ? [intro(user?.name)] : m));
  }, [user?.name]);

  const profile: ClientProfileSnapshot | null = useMemo(
    () => (user ? { fullName: user.name, email: user.email } : null),
    [user]
  );

  const sendRaw = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError("");
      setMessages((m) => [
        ...m,
        { id: `u-${Date.now()}`, role: "user", ts: Date.now(), content: trimmed },
      ]);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: trimmed,
            userId: user?._id || user?.id,
            userRole: "artist",
            currentPage: pathname ?? "/artist/ai-assistant",
            audience: "artist",
            conversationState: { session: sessionRef.current },
            clientProfile: profile,
          }),
        });
        const data = (await res.json()) as AssistantApiResponse & { success?: boolean; message?: string };
        if (!res.ok || data.success === false) throw new Error(data.message || "AI failed");
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            ts: Date.now(),
            content: data.reply,
            artists: data.artists,
            actions: data.actions,
            intent: data.intent,
            bookingSummary: data.bookingSummary,
            profileChecklist: data.profileChecklist,
          },
        ]);
        if (data.session) sessionRef.current = data.session;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      } finally {
        setLoading(false);
      }
    },
    [loading, user?._id, user?.id, profile, pathname]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendRaw(input);
  };

  const regenerate = () => {
    const list = [...messages];
    let idx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === "user") {
        idx = i;
        break;
      }
    }
    if (idx < 0) return;
    const last = list[idx];
    setMessages(list.slice(0, idx));
    void sendRaw(last.content);
  };

  const clearChat = () => {
    setMessages([intro(user?.name)]);
    sessionRef.current = null;
    setError("");
  };

  const prompts = quickPromptsForAudience("artist");

  return (
    <div className="min-h-screen bg-[#07040f] text-white relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/home/artist" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Artist Home
          </Link>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200 border border-violet-500/30 rounded-full px-3 py-1 bg-violet-500/10">
            <Sparkles className="w-3 h-3 text-fuchsia-300" /> AI Support · Artist
          </span>
          <div className="flex items-center gap-2">
            <button onClick={regenerate} className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white px-2 py-1 rounded-lg border border-white/10">
              <RefreshCcw className="w-3.5 h-3.5" /> Retry
            </button>
            <button onClick={clearChat} className="inline-flex items-center gap-1 text-xs font-bold text-red-200 hover:text-white px-2 py-1 rounded-lg border border-red-500/30 bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 relative z-10">
        <header className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-violet-300 text-xs font-black uppercase tracking-[0.25em]">
            <Bot className="w-5 h-5 text-fuchsia-300" /> Artist Concierge
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
            Manage your calendar, requests, payouts and profile faster.
          </h1>
          <p className="text-sm text-gray-400 mt-3 max-w-2xl">
            Trained on every artist-side page: calendar publishing rules, request handling,
            earnings schedule, verification flow, and platform best practices.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-gray-950/40 backdrop-blur-xl overflow-hidden min-h-[420px] flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[calc(100vh-16rem)]">
            {messages.map((m) => (
              <ChatMessage key={m.id} msg={m} onPrompt={sendRaw} />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
          </div>
          <div className="border-t border-white/10 bg-[#0a0612]/95 px-4 py-3 space-y-2">
            <QuickPromptChips prompts={prompts} onSelect={sendRaw} disabled={loading} />
            <form onSubmit={onSubmit} className="flex items-end gap-2">
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
                placeholder="e.g. How do I publish weekend slots? Where do I see payouts?"
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

export default function ArtistAIAssistantPage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistAssistantInner />
    </ProtectedRoute>
  );
}
