"use client";

import { Calendar, MapPin, Sparkles, Wallet } from "lucide-react";
import type { BookingSummaryPayload } from "@/lib/ai/types";

interface Props {
  summary: BookingSummaryPayload;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export default function BookingSummaryCard({ summary, onConfirm, onEdit, onCancel }: Props) {
  const cur = summary.currency === "LKR" ? "LKR" : "USD";
  const budgetLine =
    summary.budgetMin != null || summary.budgetMax != null
      ? `${cur} ${(summary.budgetMin ?? 0).toLocaleString()} – ${(summary.budgetMax ?? summary.budgetMin ?? 0).toLocaleString()} / hr`
      : "—";

  return (
    <div className="mt-3 rounded-2xl border border-fuchsia-500/25 bg-gradient-to-br from-violet-950/80 to-fuchsia-950/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">
        <Sparkles className="w-3.5 h-3.5" /> Booking summary
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-gray-500 text-xs font-bold uppercase">Event</dt>
          <dd className="text-white font-semibold">{summary.eventType ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-bold uppercase">Artist type</dt>
          <dd className="text-white font-semibold">{summary.category ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2 flex items-start gap-2">
          <Calendar className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
          <div>
            <dt className="text-gray-500 text-xs font-bold uppercase">Date</dt>
            <dd className="text-white font-semibold">{summary.eventDate ?? "—"}</dd>
          </div>
        </div>
        <div className="sm:col-span-2 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
          <div>
            <dt className="text-gray-500 text-xs font-bold uppercase">Location</dt>
            <dd className="text-white font-semibold">{summary.location ?? "—"}</dd>
          </div>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-bold uppercase">Local / International</dt>
          <dd className="text-white font-semibold">{summary.origin ?? "Either"}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Wallet className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
          <div>
            <dt className="text-gray-500 text-xs font-bold uppercase">Budget</dt>
            <dd className="text-white font-semibold">{budgetLine}</dd>
          </div>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-gray-500 text-xs font-bold uppercase">Selected artist</dt>
          <dd className="text-white font-semibold">
            {summary.selectedArtistName ?? summary.selectedArtistId ?? "—"}
          </dd>
        </div>
        {summary.estimatedHourly != null && (
          <div className="sm:col-span-2 text-xs text-gray-400">
            Estimated reference rate:{" "}
            <span className="text-fuchsia-200 font-bold">
              {cur} {summary.estimatedHourly.toLocaleString()}/hr
            </span>{" "}
            (final price is set on the artist profile)
          </div>
        )}
      </dl>
      <div className="flex flex-wrap gap-2 pt-1">
        {onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-black text-white shadow-[0_0_18px_-6px_rgba(168,85,247,0.7)]"
          >
            Confirm and Continue
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-gray-200 hover:bg-white/10"
          >
            Edit Details
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
