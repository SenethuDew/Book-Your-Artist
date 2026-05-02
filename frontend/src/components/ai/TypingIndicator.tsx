"use client";

import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 text-sm text-violet-200">
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-fuchsia-900/40">
        <Bot className="w-4 h-4 animate-pulse" />
      </div>
      <div className="rounded-2xl border border-white/10 bg-gray-950/70 px-4 py-3 inline-flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400">AI is thinking</span>
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:120ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:240ms]" />
      </div>
    </div>
  );
}
