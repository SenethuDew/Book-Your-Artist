/**
 * Smart artist recommendation engine.
 * Primary source: Firestore `artists` collection (same shape as Firebase booking demo).
 * Falls back to static catalog if Firebase is unavailable or empty.
 *
 * TODO: Add optional OpenAI re-ranking layer here (pass top 15 candidates + user story).
 */

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ALL_CATALOG_ARTISTS, type CatalogArtist } from "@/lib/artistCatalog";
import type { BookingData } from "./types";
import type { RecommendedArtist } from "./types";

const isFirebaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "YOUR_PROJECT_ID_HERE";

export interface RecommendCriteria extends BookingData {
  /** Free-text search from user message */
  genreHint?: string;
}

function catalogToRecommended(a: CatalogArtist): RecommendedArtist {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    location: a.location,
    hourlyRate: a.hourlyRate,
    rating: a.rating,
    profileImage: a.profileImage,
    origin: a.origin ?? (a.hourlyRate >= 10000 ? "international" : "local"),
    genres: a.genres ?? [],
    shortDescription: a.biography?.slice(0, 140) ?? `${a.category} · ${a.location}`,
    availabilityStatus: "unknown",
    bookingCount: undefined,
  };
}

function inferOriginFromDoc(data: Record<string, unknown>): "local" | "international" {
  const loc = String(data.location ?? "").toLowerCase();
  const rate = Number(data.hourlyRate ?? data.basePrice ?? 0);
  const id = String(data.id ?? "");
  if (id.startsWith("intl-")) return "international";
  if (rate >= 10000) return "international";
  if (/sri lanka|lanka|colombo|kandy|galle/.test(loc)) return "local";
  if (/usa|uk|london|vegas|los angeles/.test(loc)) return "international";
  return "local";
}

function docToRecommended(id: string, data: Record<string, unknown>): RecommendedArtist {
  const hourlyRate = Number(data.hourlyRate ?? data.basePrice ?? 0);
  const rating = Number(data.rating ?? 0) || 4.5;
  const reviews = Number(data.reviews ?? data.reviewCount ?? 0);
  const genres = Array.isArray(data.genres) ? (data.genres as string[]) : [];
  const bio = String(data.biography ?? data.bio ?? "");
  const availabilityRaw = String(data.availability ?? "").toLowerCase();
  let availabilityStatus: RecommendedArtist["availabilityStatus"] = "unknown";
  if (availabilityRaw === "available" || data.availability === true) availabilityStatus = "available";
  else if (availabilityRaw === "limited") availabilityStatus = "limited";

  return {
    id,
    name: String(data.name ?? data.stageName ?? "Artist"),
    category: String(data.category ?? "Artist"),
    location: String(data.location ?? ""),
    hourlyRate,
    rating,
    profileImage: typeof data.profileImage === "string" ? data.profileImage : undefined,
    origin: inferOriginFromDoc({ ...data, id }),
    genres,
    shortDescription: bio.slice(0, 140) || `${String(data.category)} · ${String(data.location)}`,
    availabilityStatus,
    bookingCount: reviews || undefined,
  };
}

async function loadFromFirestore(): Promise<RecommendedArtist[]> {
  if (!isFirebaseConfigured()) return ALL_CATALOG_ARTISTS.map(catalogToRecommended);
  try {
    const snap = await getDocs(collection(db, "artists"));
    if (snap.empty) return ALL_CATALOG_ARTISTS.map(catalogToRecommended);
    return snap.docs.map((d) => docToRecommended(d.id, { ...d.data(), id: d.id } as Record<string, unknown>));
  } catch {
    return ALL_CATALOG_ARTISTS.map(catalogToRecommended);
  }
}

function normalizeCategory(cat?: string): string {
  if (!cat) return "";
  const c = cat.toLowerCase();
  if (c.includes("dj")) return "djs";
  if (c.includes("singer")) return "singers";
  if (c.includes("band")) return "bands";
  if (c.includes("rap")) return "rappers";
  return c;
}

function eventMatches(a: RecommendedArtist, eventType?: string): boolean {
  if (!eventType) return true;
  const e = eventType.toLowerCase();
  const g = a.genres.join(" ").toLowerCase();
  if (e.includes("wedding") && /wedding|baila|pop|soul|band/i.test(g + a.shortDescription)) return true;
  if (e.includes("club") || e.includes("party")) {
    if (/dj|edm|house|techno|rap/i.test(g + a.category)) return true;
  }
  if (e.includes("corporate") && /jazz|lounge|pop|soul/i.test(g)) return true;
  return true;
}

/**
 * Score and return top 3–5 artists for the assistant.
 */
export async function recommendArtists(criteria: RecommendCriteria): Promise<RecommendedArtist[]> {
  const pool = await loadFromFirestore();
  const wantCat = normalizeCategory(criteria.category);
  const wantOrigin = criteria.origin;
  const max = criteria.budgetMax ?? undefined;
  const min = criteria.budgetMin ?? undefined;
  const locNeedle = criteria.location?.toLowerCase() ?? "";
  const genreNeedle = criteria.genreHint?.toLowerCase() ?? "";

  const filtered = pool.filter((a) => {
    if (wantCat && normalizeCategory(a.category) !== wantCat) return false;
    if (!criteria.originFlexible) {
      if (wantOrigin === "local" && a.origin !== "local") return false;
      if (wantOrigin === "international" && a.origin !== "international") return false;
    }
    if (max != null && a.hourlyRate > max) return false;
    if (min != null && a.hourlyRate < min) return false;
    if (locNeedle && !a.location.toLowerCase().includes(locNeedle.split(",")[0].trim())) return false;
    if (genreNeedle && !a.genres.some((g) => g.toLowerCase().includes(genreNeedle))) return false;
    if (!eventMatches(a, criteria.eventType)) return false;
    return true;
  });

  if (!filtered.length) {
    const relaxed = pool.filter((a) => {
      if (wantCat && normalizeCategory(a.category) !== wantCat) return false;
      if (max != null && a.hourlyRate > max * 1.35) return false;
      return true;
    });
    return relaxed.sort((a, b) => b.rating - a.rating).slice(0, 5);
  }

  return filtered.sort((a, b) => b.rating - a.rating || a.hourlyRate - b.hourlyRate).slice(0, 5);
}
