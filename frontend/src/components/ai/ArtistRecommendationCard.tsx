"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, MapPin, Music, Heart, Calendar, ExternalLink } from "lucide-react";
import type { RecommendedArtist } from "@/lib/ai/types";

const FAVORITES_KEY = "bya_ai_favorites";

interface Props {
  artist: RecommendedArtist;
  onBookNow: (artist: RecommendedArtist) => void;
}

function toggleFavorite(id: string) {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export default function ArtistRecommendationCard({ artist, onBookNow }: Props) {
  const router = useRouter();
  const badge =
    artist.origin === "international" ? "International" : "Local";
  const badgeClass =
    artist.origin === "international"
      ? "bg-cyan-500/15 text-cyan-200 border-cyan-400/30"
      : "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";

  const availLabel =
    artist.availabilityStatus === "available"
      ? "Available"
      : artist.availabilityStatus === "limited"
        ? "Limited availability"
        : "Availability on request";

  return (
    <div className="rounded-2xl border border-white/10 bg-gray-950/70 overflow-hidden flex flex-col">
      <div className="flex gap-3 p-3">
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20">
          {artist.profileImage ? (
            <Image
              src={artist.profileImage}
              alt={artist.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-violet-300">
              <Music className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-white text-sm leading-tight truncate">{artist.name}</p>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-300 shrink-0">
              <Star className="w-3 h-3 fill-amber-300" />
              {artist.rating.toFixed(1)}
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-violet-300 font-bold mt-1">
            {artist.category}
          </p>
          <span
            className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}
          >
            {badge}
          </span>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{artist.shortDescription}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{artist.location}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{availLabel}</p>
          {artist.bookingCount != null && (
            <p className="text-[11px] text-gray-500">{artist.bookingCount} reviews / bookings</p>
          )}
        </div>
      </div>
      <div className="px-3 pb-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
        <span className="text-sm font-black text-fuchsia-300">
          ${artist.hourlyRate.toLocaleString()}/hr
        </span>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => router.push(`/artist/${artist.id}`)}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-gray-200 hover:bg-white/10"
          >
            <ExternalLink className="w-3 h-3" /> View Profile
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(artist.id)}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-gray-200 hover:bg-white/10"
          >
            <Heart className="w-3 h-3 text-fuchsia-400" /> Favorites
          </button>
          <button
            type="button"
            onClick={() => onBookNow(artist)}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-[11px] font-black text-white"
          >
            <Calendar className="w-3 h-3" /> Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
