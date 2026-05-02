"use client";

/**
 * ProfileChecklistCard
 * --------------------
 * Compact card that visualises which profile fields the user has completed.
 * The orchestrator returns a `profileChecklist` payload (see
 * `lib/ai/types.ts → ProfileChecklistPayload`) whenever the bot detects a
 * profile-related question; we render it inside the chat bubble for clarity.
 */

import Link from "next/link";
import { Check, Circle, ArrowRight } from "lucide-react";
import type { ProfileChecklistPayload } from "@/lib/ai/types";

interface Props {
  payload: ProfileChecklistPayload;
}

export default function ProfileChecklistCard({ payload }: Props) {
  const { audience, items, completion, ctaHref } = payload;
  const isArtist = audience === "artist";

  return (
    <div className="mt-2 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-fuchsia-950/30 p-3 text-xs shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-violet-200">
          {isArtist ? "Artist profile checklist" : "Client profile checklist"}
        </p>
        <span className="text-[11px] font-extrabold text-fuchsia-200">
          {completion}% complete
        </span>
      </div>

      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
          style={{ width: `${completion}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it.field}
            className="flex items-center gap-2 text-[12px] text-violet-100/90"
          >
            {it.done ? (
              <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-violet-400/70 shrink-0" />
            )}
            <span className={it.done ? "line-through opacity-60" : ""}>{it.label}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[11px] font-bold shadow hover:opacity-90"
      >
        {completion === 100 ? "Open Profile" : "Complete Profile"}
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
