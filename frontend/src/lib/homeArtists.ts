import { API_BASE_URL } from "@/lib/api";
import {
  categoryLabelFromSlug,
  resolveArtistCategorySlug,
} from "@/lib/artistCategory";
import { resolveArtistMediaUrl } from "@/lib/artistMediaUrl";
import { SAMPLE_ARTISTS } from "@/lib/firebaseBookingAPI";

export interface HomeArtist {
  id?: string;
  _id?: string;
  name?: string;
  stageName?: string;
  category?: string;
  artistType?: string;
  location?: string;
  hourlyRate?: number;
  basePrice?: number;
  rating?: number;
  profileImage?: string;
  genres?: string[];
  availability?: boolean | string;
}

function withResolvedImage(artist: HomeArtist): HomeArtist {
  const profileImage = resolveArtistMediaUrl(artist.profileImage);
  return profileImage ? { ...artist, profileImage } : artist;
}

export function normalizeBackendArtist(artist: Record<string, unknown>): HomeArtist {
  const user = artist.user as Record<string, unknown> | undefined;
  const userId = String(user?._id || user?.id || artist.userId || artist._id || "");
  const profileImage = resolveArtistMediaUrl(
    (artist.profileImage || user?.profileImage) as string | undefined,
  );

  const categoryRaw = String(artist.category || "");
  const artistType = artist.artistType ? String(artist.artistType) : undefined;
  const genres = Array.isArray(artist.genres) ? (artist.genres as string[]) : [];
  const categorySlug = resolveArtistCategorySlug({
    category: categoryRaw,
    artistType,
    genres,
  });
  const category = categorySlug
    ? categoryLabelFromSlug(categorySlug)
    : categoryRaw || artistType || "Musician";

  return {
    id: userId,
    _id: userId,
    name: String(artist.name || user?.name || "Unknown Artist"),
    stageName: String(artist.stageName || artist.name || user?.name || "Unknown Artist"),
    category,
    artistType,
    location: String(artist.location || ""),
    genres,
    hourlyRate: Number(artist.hourlyRate) || 0,
    rating: typeof artist.rating === "number" ? artist.rating : 0,
    profileImage,
    availability: true,
  };
}

async function fetchWithTimeout(
  url: string,
  ms = 5000,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Loads artists for home / client dashboard sections from the API (fast),
 * then fills gaps with bundled sample profiles — never blocks on Firestore.
 */
export async function fetchHomeArtists(limit = 8): Promise<HomeArtist[]> {
  const seen = new Set<string>();
  const merged: HomeArtist[] = [];

  const addUnique = (list: HomeArtist[]) => {
    for (const artist of list) {
      const key = String(artist.id || artist._id || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(withResolvedImage(artist));
    }
  };

  try {
    const featuredRes = await fetchWithTimeout(
      `${API_BASE_URL}/api/artists/featured?limit=${limit}`,
      5000,
    );
    const featuredData = await featuredRes.json();
    if (featuredRes.ok && featuredData?.success && Array.isArray(featuredData.artists)) {
      addUnique(
        featuredData.artists.map((a: Record<string, unknown>) =>
          normalizeBackendArtist(a),
        ),
      );
    }
  } catch {
    /* API unavailable — continue to search + samples */
  }

  if (merged.length < limit) {
    try {
      const params = new URLSearchParams({
        limit: String(Math.max(limit, 20)),
        sort: "-createdAt",
      });
      const searchRes = await fetchWithTimeout(
        `${API_BASE_URL}/api/artists/search?${params.toString()}`,
        5000,
      );
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData?.success && Array.isArray(searchData.artists)) {
        addUnique(
          searchData.artists.map((a: Record<string, unknown>) =>
            normalizeBackendArtist(a),
          ),
        );
      }
    } catch {
      /* ignore */
    }
  }

  addUnique(SAMPLE_ARTISTS as HomeArtist[]);

  return merged.slice(0, limit);
}

/** Search page roster — same fast path as home, higher limit. */
export async function fetchSearchArtists(limit = 100): Promise<HomeArtist[]> {
  return fetchHomeArtists(limit);
}

export type ArtistProfilePayload = HomeArtist & {
  biography?: string;
  bio?: string;
  coverImage?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
  };
  experience?: string;
  yearsOfExperience?: string | number;
  availability?: boolean;
};

export function mapApiArtistToProfile(
  id: string,
  raw: Record<string, unknown>,
): ArtistProfilePayload {
  const base = normalizeBackendArtist(raw);
  const user = raw.user as Record<string, unknown> | undefined;
  return {
    ...base,
    id,
    _id: id,
    biography: String(raw.bio || raw.biography || ""),
    bio: String(raw.bio || raw.biography || ""),
    coverImage: resolveArtistMediaUrl(raw.coverImage as string | undefined),
    socialLinks: (raw.socialLinks as ArtistProfilePayload["socialLinks"]) || {},
    experience: String(raw.yearsOfExperience ?? raw.experience ?? ""),
    yearsOfExperience: raw.yearsOfExperience as string | number | undefined,
    availability: true,
    name: base.name || String(user?.name || ""),
    stageName: base.stageName || base.name,
  };
}

export async function loadArtistProfileFromApi(
  id: string,
): Promise<{
  artist: ArtistProfilePayload | null;
  publishedAvailability: Array<{
    _id?: string;
    date: string;
    startTime: string;
    endTime: string;
    status?: string;
    bookingId?: unknown;
  }>;
}> {
  const [profileRes, availRes] = await Promise.all([
    fetchWithTimeout(`${API_BASE_URL}/api/artists/${id}`, 8000),
    fetchWithTimeout(`${API_BASE_URL}/api/availability/artist/${id}`, 8000),
  ]);

  let artist: ArtistProfilePayload | null = null;
  if (profileRes.ok) {
    const profileData = (await profileRes.json()) as {
      success?: boolean;
      artist?: Record<string, unknown>;
    };
    if (profileData?.success && profileData.artist) {
      artist = mapApiArtistToProfile(id, profileData.artist);
    }
  }

  let publishedAvailability: Array<{
    _id?: string;
    date: string;
    startTime: string;
    endTime: string;
    status?: string;
    bookingId?: unknown;
  }> = [];

  if (availRes.ok) {
    const availData = (await availRes.json()) as {
      success?: boolean;
      availability?: typeof publishedAvailability;
    };
    if (availData?.success && Array.isArray(availData.availability)) {
      publishedAvailability = availData.availability;
    }
  }

  return { artist, publishedAvailability };
}
