"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, MapPin, Music, ArrowRight } from "lucide-react";
import type { CatalogArtist } from "@/lib/artistCatalog";

interface Props {
  artist: CatalogArtist;
  compact?: boolean;
}

export default function ArtistCard({ artist, compact = true }: Props) {
  const router = useRouter();

  const goToProfile = () => router.push(`/artist/${artist.id}`);

  return (
    <div
      onClick={goToProfile}
      className={`group cursor-pointer rounded-2xl border border-white/10 bg-gray-950/60 hover:bg-gray-900/80 hover:border-violet-400/40 transition-all overflow-hidden flex ${
        compact ? "gap-3 p-2.5" : "flex-col"
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 ${
          compact ? "w-16 h-16" : "w-full h-32"
        }`}
      >
        {artist.profileImage ? (
          <Image
            src={artist.profileImage}
            alt={artist.name}
            fill
            sizes={compact ? "64px" : "200px"}
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-violet-300">
            <Music className={compact ? "w-6 h-6" : "w-10 h-10"} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-white text-sm truncate">{artist.name}</p>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-300 shrink-0">
            <Star className="w-3 h-3 fill-amber-300" />
            {artist.rating.toFixed(1)}
          </span>
        </div>

        <p className="text-[11px] uppercase tracking-wider text-violet-300 font-bold mt-0.5">
          {artist.category}
          {artist.origin === "international" && " · Global"}
        </p>

        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{artist.location}</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-black text-fuchsia-300">
            ${artist.hourlyRate.toLocaleString()}/hr
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-200 group-hover:text-white transition-colors">
            View <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
