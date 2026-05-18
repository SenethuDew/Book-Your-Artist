"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Star, Clock } from "lucide-react";
import {
  defaultArtistPlaceholder,
  resolveArtistMediaUrl,
} from "@/lib/artistMediaUrl";

export interface FirebaseArtist {
  id?: string;
  _id?: string;
  name?: string;
  stageName?: string;
  category?: string;
  profileImage?: string;
  hourlyRate?: number;
  basePrice?: number;
  rating?: number;
  location?: string;
  availability?: boolean | string;
}

interface FirebaseArtistCardProps {
  artist: FirebaseArtist;
  compact?: boolean;
}

function initialImageSrc(artist: FirebaseArtist): string {
  return (
    resolveArtistMediaUrl(artist.profileImage) ||
    defaultArtistPlaceholder(artist.category)
  );
}

export function FirebaseArtistCard({ artist, compact = false }: FirebaseArtistCardProps) {
  const [imgSrc, setImgSrc] = useState(() => initialImageSrc(artist));
  const placeholder = defaultArtistPlaceholder(artist.category);

  useEffect(() => {
    setImgSrc(initialImageSrc(artist));
  }, [artist.profileImage, artist.category]);

  const hourlyRate = artist.hourlyRate || artist.basePrice || 0;
  const rating = artist.rating !== undefined ? artist.rating.toFixed(1) : "New";

  return (
    <div className="group relative bg-[#1E112A]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-[#E8B638]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#E8B638]/20 flex flex-col h-full transform hover:-translate-y-2">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className={`relative ${compact ? "h-44 sm:h-48" : "h-56 sm:h-64"} w-full overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={artist.stageName || artist.name || "Artist"}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => {
            if (imgSrc !== placeholder) setImgSrc(placeholder);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E112A] via-[#1E112A]/40 to-transparent opacity-90" />

        <div className={`absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 ${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} rounded-full font-semibold tracking-wider text-[#E8B638] shadow-lg flex items-center gap-2`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8B638] animate-pulse" />
          {artist.category || "Artist"}
        </div>

        <div className={`absolute top-4 right-4 bg-gradient-to-r from-[#E8B638] to-yellow-600 ${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} rounded-full font-bold text-[#1E112A] shadow-lg flex items-center transform transition-transform group-hover:scale-105`}>
          <span className={`${compact ? "text-xs" : "text-sm"} border-r border-[#1E112A]/20 pr-1.5 mr-1.5`}>$</span>
          {hourlyRate}
          <span className="text-[10px] font-medium ml-1 opacity-80 uppercase tracking-tighter">/hr</span>
        </div>
      </div>

      <div className={`${compact ? "p-4 -mt-6" : "p-6 -mt-8"} flex flex-col flex-1 relative z-10`}>
        <h3 className={`${compact ? "text-xl mb-3" : "text-2xl mb-4"} font-bold text-white line-clamp-1 drop-shadow-md group-hover:text-[#E8B638] transition-colors`}>
          {artist.stageName || artist.name || "Unknown Artist"}
        </h3>

        <div className={`${compact ? "gap-2 mb-4 p-3" : "gap-3 mb-6 p-4"} flex flex-col bg-white/5 rounded-xl border border-white/5`}>
          <div className={`${compact ? "text-xs" : "text-sm"} flex items-center gap-2 font-semibold text-[#E8B638]`}>
            <div className="bg-[#E8B638]/20 p-1.5 rounded-md">
              <Star size={14} fill="currentColor" />
            </div>
            <span>
              {rating}{" "}
              {rating !== "New" && (
                <span className="text-white/40 font-normal ml-1">/ 5.0</span>
              )}
            </span>
          </div>

          <div className={`${compact ? "text-xs" : "text-sm"} flex items-center gap-2 text-gray-300`}>
            <div className="bg-purple-500/20 p-1.5 rounded-md text-purple-400">
              <MapPin size={14} />
            </div>
            <span className="line-clamp-1">{artist.location || "Location upon request"}</span>
          </div>

          <div className={`${compact ? "text-xs" : "text-sm"} flex items-center gap-2`}>
            <div
              className={`p-1.5 rounded-md ${
                artist.availability === "false"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              <Clock size={14} />
            </div>
            <span
              className={
                artist.availability === "false"
                  ? "text-red-400 font-medium"
                  : "text-emerald-400 font-medium"
              }
            >
              {artist.availability === "false"
                ? "Currently Unavailable"
                : "Available for Booking"}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <Link
            href={`/artist/${artist.id || artist._id}`}
            className={`w-full flex items-center justify-center gap-2 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} bg-white/10 hover:bg-[#E8B638] text-white hover:text-[#1E112A] rounded-xl transition-all duration-300 font-bold tracking-wide group/btn border border-white/10 hover:border-transparent cursor-pointer relative overflow-hidden`}
          >
            <span className="relative z-10 flex items-center gap-2">
              View Profile
              <svg
                className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
