"use client";

/**
 * Floating AI Assistant bubble — visible bottom-right on every client and
 * public page (hidden on artist/admin/auth routes).
 *
 * Reuses the same /api/ai-assistant route, ChatMessage, ArtistRecommendationCard,
 * BookingSummaryCard, TypingIndicator, and QuickPromptChips as the full page,
 * so behaviour stays in sync. Uses sessionRef + localStorage so the widget
 * remembers context across page navigations.
 */

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Send, X, Sparkles, Maximize2, MessageCircle, RefreshCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts";
import ChatMessage, { type UIMessage } from "@/components/ai/ChatMessage";
import QuickPromptChips from "@/components/ai/QuickPromptChips";
import TypingIndicator from "@/components/ai/TypingIndicator";
import { buildBotContext, roleFromUser } from "@/lib/ai/contextDetector";
import type {
  AISessionState,
  AssistantApiResponse,
  BookingSummaryPayload,
  ClientProfileSnapshot,
  RecommendedArtist,
} from "@/lib/ai/types";

/* ----- Visibility rules ----- */
const HIDDEN_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/login",
  "/auth",
  "/home/admin",
  "/dashboard/admin",
  "/client/ai-assistant",
  "/artist/ai-assistant",
];

function shouldHideForPath(path: string | null): boolean {
  if (!path) return false;
  return HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isArtistPath(path: string | null): boolean {
  if (!path) return false;
  return path.startsWith("/artist") || path.startsWith("/home/artist") || path.startsWith("/dashboard/artist");
}

/* ----- Per-user local storage helpers -----
 * Keys are namespaced by userId so two accounts on the same browser never see
 * each other's chat. Guests get their own "guest" namespace that is wiped on
 * login/logout.
 */
const LS_KEY_OPEN = "bya_widget_open"; // boolean, not user-sensitive
const LS_PREFIX_MSGS = "bya_widget_messages_v2_";
const LS_PREFIX_SESSION = "bya_widget_session_v2_";
const LS_KEY_OWNER = "bya_widget_current_owner";

const msgsKey = (uid: string) => `${LS_PREFIX_MSGS}${uid}`;
const sessKey = (uid: string) => `${LS_PREFIX_SESSION}${uid}`;

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
function removeLS(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** One-time cleanup of the legacy unscoped keys (so old leaked chats vanish). */
function purgeLegacyKeys() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("bya_widget_messages_v1");
    localStorage.removeItem("bya_widget_session_v1");
    // Also remove any partner v1 keys the old code wrote (e.g. for AI page).
    localStorage.removeItem("bya_ai_chat_v3");
  } catch {
    /* ignore */
  }
}

/** Build the per-page intro message using the shared context detector so the
 *  greeting on the widget matches what the API would return. */
const introMessage = (name: string | undefined, welcome: string): UIMessage => {
  const greet = name ? `Hi, **${name.split(" ")[0]}** 👋` : "Hi 👋";
  return {
    id: "intro",
    role: "assistant",
    ts: Date.now(),
    content: `${greet} — ${welcome}`,
  };
};

export default function AIAssistantWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const hidden = shouldHideForPath(pathname);

  /* Build a single context object — pathname + role + welcome + topics. */
  const userRole = useMemo(() => {
    const r = roleFromUser(user);
    if (r === "guest" && isArtistPath(pathname)) return "artist";
    return r;
  }, [user, pathname]);

  const ctx = useMemo(
    () =>
      buildBotContext({
        pathname,
        userRole,
        userId: user?._id || user?.id,
        isLoggedIn: Boolean(user),
      }),
    [pathname, userRole, user]
  );

  const audience: "client" | "artist" | "any" =
    userRole === "artist" ? "artist" : userRole === "client" ? "client" : "any";
  const fullPagePath = audience === "artist" ? "/artist/ai-assistant" : "/client/ai-assistant";

  /** Stable identity for namespacing localStorage. */
  const ownerId = user?._id || user?.id || "guest";

  /* `mounted` gates anything that touches localStorage / window so SSR and the
   * first client render produce identical HTML (no hydration mismatch). */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    purgeLegacyKeys();
    setMounted(true);
  }, []);

  const [open, setOpen] = useState<boolean>(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([introMessage(undefined, "")]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ClientProfileSnapshot | null>(null);

  const sessionRef = useRef<AISessionState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Hydrate the persisted "open" state once on the client after mount. */
  useEffect(() => {
    if (!mounted) return;
    setOpen(loadLS(LS_KEY_OPEN, false));
  }, [mounted]);

  /* Persist open state (not user-sensitive). Skip until mounted so we never
   * write the placeholder default back over the real value. */
  useEffect(() => {
    if (!mounted) return;
    saveLS(LS_KEY_OPEN, open);
  }, [open, mounted]);

  /* When the signed-in user changes, swap to that user's chat namespace.
   * Also clears the previous owner's keys so account switches do not leak. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prevOwner = loadLS<string | null>(LS_KEY_OWNER, null);
    if (prevOwner && prevOwner !== ownerId) {
      // Wipe previous owner's chat to prevent any cross-account leakage.
      removeLS(msgsKey(prevOwner));
      removeLS(sessKey(prevOwner));
    }
    saveLS(LS_KEY_OWNER, ownerId);

    const storedMsgs = loadLS<UIMessage[] | null>(msgsKey(ownerId), null);
    const storedSession = loadLS<AISessionState | null>(sessKey(ownerId), null);

    setMessages(
      storedMsgs && storedMsgs.length ? storedMsgs : [introMessage(user?.name, ctx.welcomeMessage)]
    );
    sessionRef.current = storedSession;
    setError("");
  }, [ownerId, user?.name, ctx.welcomeMessage]);

  /* Persist messages under the current owner namespace (cap last 40). */
  useEffect(() => {
    saveLS(msgsKey(ownerId), messages.slice(-40));
  }, [messages, ownerId]);

  /* Load lightweight profile snapshot for personalization */
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile({
      fullName: user.name,
      email: user.email,
    });
  }, [user]);

  /* Auto-scroll to latest */
  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  /* Re-render the intro greeting whenever the page or user changes. */
  useEffect(() => {
    setMessages((m) => {
      if (m.length === 1 && m[0].id === "intro") return [introMessage(user?.name, ctx.welcomeMessage)];
      return m;
    });
  }, [user?.name, ctx.welcomeMessage]);

  /** Page-aware quick prompts — generated by `contextDetector`. */
  const dynamicPrompts = useMemo(() => {
    const base = [...ctx.suggestedTopics];
    if (audience === "client") {
      if (sessionRef.current?.bookingStep && sessionRef.current.bookingStep !== "done") {
        base.unshift("Continue booking");
      }
    }
    return Array.from(new Set(base)).slice(0, 6);
  }, [ctx.suggestedTopics, audience]);

  const sendRaw = useCallback(
    async (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed || loading) return;

      setError("");

      const userMsg: UIMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        ts: Date.now(),
        content: trimmed,
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: trimmed,
            userId: user?._id || user?.id || "guest",
            userRole,
            currentPage: pathname ?? "",
            audience,
            conversationState: { session: sessionRef.current },
            clientProfile: profile,
          }),
        });
        const data = (await res.json()) as AssistantApiResponse & { success?: boolean; message?: string };
        if (!res.ok || data.success === false) {
          throw new Error(data.message || "AI is unavailable right now.");
        }
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
        if (data.session) {
          sessionRef.current = data.session;
          saveLS(sessKey(ownerId), data.session);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error.");
      } finally {
        setLoading(false);
      }
    },
    [loading, user?._id, user?.id, profile, audience, userRole, pathname, ownerId]
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
    setMessages([introMessage(user?.name, ctx.welcomeMessage)]);
    sessionRef.current = null;
    removeLS(msgsKey(ownerId));
    removeLS(sessKey(ownerId));
    setError("");
  };

  const onBookArtist = (artist: RecommendedArtist) => {
    sendRaw(`__select_artist__:${artist.id}::${artist.name}`);
  };

  const onSummaryConfirm = (summary: BookingSummaryPayload) => {
    if (summary.selectedArtistId) {
      router.push(`/artist/${summary.selectedArtistId}?from=ai-assistant`);
      setOpen(false);
    }
  };

  if (hidden) return null;
  /* Render nothing on the server / first paint to keep SSR HTML stable. */
  if (!mounted) return null;

  return (
    <>
      {/* Floating toggle bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
          className="fixed bottom-5 right-5 z-[60] group"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 blur-md opacity-70 group-hover:opacity-90 transition-opacity" />
          <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-fuchsia-900/40 ring-2 ring-white/20 hover:scale-105 transition-transform">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#07040f]" />
          </span>
          <span className="absolute right-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-900/95 border border-white/10 text-[11px] font-bold text-violet-100 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Sparkles className="w-3 h-3 text-fuchsia-300" /> Ask the AI
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className={`fixed z-[60] right-3 bottom-3 sm:right-5 sm:bottom-5 ${
            expanded
              ? "w-[min(96vw,720px)] h-[min(86vh,720px)]"
              : "w-[min(94vw,400px)] h-[min(80vh,560px)]"
          } rounded-3xl border border-white/10 bg-[#0a0612]/95 backdrop-blur-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden transition-all`}
        >
          <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-950/80 to-fuchsia-950/40">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">AI Booking Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] uppercase tracking-[0.18em] font-bold px-1.5 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-200">
                    {userRole === "guest" ? "Guest" : userRole === "artist" ? "Artist" : userRole === "admin" ? "Admin" : "Client"}
                  </span>
                  {ctx.pageBadge && (
                    <span className="text-[9px] uppercase tracking-[0.18em] font-bold px-1.5 py-0.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-200 truncate max-w-[120px]">
                      {ctx.pageBadge}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href={fullPagePath}
                onClick={() => setOpen(false)}
                title="Open full page"
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                title={expanded ? "Shrink" : "Expand"}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={regenerate}
                title="Retry last"
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={clearChat}
                title="Clear chat"
                className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#07040f]">
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
              <div className="rounded-xl border border-red-500/30 bg-red-950/50 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-3 py-2.5 space-y-2 bg-[#0a0612]/95">
            <QuickPromptChips prompts={dynamicPrompts} onSelect={sendRaw} disabled={loading} />
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
                placeholder="Ask about artists, booking, payments…"
                className="flex-1 resize-none rounded-xl border border-white/10 bg-gray-950/80 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40 max-h-28"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-white disabled:opacity-40 shadow-[0_0_18px_-6px_rgba(168,85,247,0.6)]"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
