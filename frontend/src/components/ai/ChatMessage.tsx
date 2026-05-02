"use client";

import { useRouter } from "next/navigation";
import { Bot, User as UserIcon, Copy, Check, Calendar } from "lucide-react";
import { useState } from "react";
import ArtistCard from "./ArtistCard";
import type { CatalogArtist } from "@/lib/artistCatalog";

export interface ChatAction {
  label: string;
  type: "navigate" | "prompt";
  value: string;
  variant?: "primary" | "ghost";
}

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  artists?: CatalogArtist[];
  actions?: ChatAction[];
}

interface Props {
  msg: UIMessage;
  onPrompt?: (text: string) => void;
}

/* -------- Markdown-lite inline renderer -------- */
const renderInline = (text: string) => {
  const parts: Array<string | { type: "b" | "i" | "code"; value: string }> = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push({ type: "b", value: m[1] });
    else if (m[2]) parts.push({ type: "i", value: m[2] });
    else if (m[3]) parts.push({ type: "code", value: m[3] });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) => {
    if (typeof p === "string") return <span key={i}>{p}</span>;
    if (p.type === "b") return <strong key={i} className="text-white font-bold">{p.value}</strong>;
    if (p.type === "i") return <em key={i} className="italic text-violet-100">{p.value}</em>;
    return (
      <code key={i} className="rounded bg-black/40 border border-white/10 px-1.5 py-0.5 text-[0.85em] text-fuchsia-200">
        {p.value}
      </code>
    );
  });
};

const Markdown = ({ text }: { text: string }) => {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let buf: string[] = [];
  let kind: "ul" | "ol" | null = null;

  const flush = (key: number) => {
    if (!buf.length) return;
    const items = buf.map((b, i) => <li key={i} className="leading-relaxed">{renderInline(b)}</li>);
    blocks.push(
      kind === "ol" ? (
        <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-0.5 my-1">{items}</ol>
      ) : (
        <ul key={`ul-${key}`} className="list-disc pl-5 space-y-0.5 my-1 marker:text-fuchsia-400">{items}</ul>
      )
    );
    buf = [];
    kind = null;
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*[-•]\s+/.test(line)) {
      if (kind !== "ul") flush(i);
      kind = "ul";
      buf.push(line.replace(/^\s*[-•]\s+/, ""));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (kind !== "ol") flush(i);
      kind = "ol";
      buf.push(line.replace(/^\s*\d+\.\s+/, ""));
    } else {
      flush(i);
      if (!line.trim()) blocks.push(<div key={`sp-${i}`} className="h-1" />);
      else blocks.push(<p key={`p-${i}`} className="leading-relaxed">{renderInline(line)}</p>);
    }
  });
  flush(lines.length);
  return <div className="space-y-1">{blocks}</div>;
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatMessage({ msg, onPrompt }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleAction = (a: ChatAction) => {
    if (a.type === "navigate") router.push(a.value);
    else if (a.type === "prompt" && onPrompt) onPrompt(a.value);
  };

  return (
    <div className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-fuchsia-900/40">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[82%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl border px-4 py-3 text-sm w-full ${
            isUser
              ? "bg-gradient-to-br from-violet-600/35 to-fuchsia-600/25 border-violet-500/30 text-white"
              : "bg-gray-950/60 border-white/10 text-gray-100"
          }`}
        >
          <Markdown text={msg.content} />

          {!!msg.artists?.length && (
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {msg.artists.map((a) => (
                <ArtistCard key={a.id} artist={a} compact />
              ))}
            </div>
          )}

          {!!msg.actions?.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {msg.actions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(a)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    a.variant === "primary"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_18px_-6px_rgba(168,85,247,0.7)] hover:from-violet-500 hover:to-fuchsia-500"
                      : "border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {a.label.toLowerCase().includes("book") && <Calendar className="w-3.5 h-3.5" />}
                  {a.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              {isUser ? "You" : "Concierge"} · {formatTime(msg.ts)}
            </span>
            {!isUser && msg.id !== "intro" && (
              <button
                onClick={copy}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all inline-flex items-center gap-1 text-[11px] font-bold"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
          <UserIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
