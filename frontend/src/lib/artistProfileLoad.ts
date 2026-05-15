import {
  INTERNATIONAL_ARTISTS,
  SAMPLE_ARTISTS,
  getArtistFromFirestore,
  getArtistBookings,
} from "@/lib/firebaseBookingAPI";
import {
  loadArtistProfileFromApi,
  type ArtistProfilePayload,
} from "@/lib/homeArtists";

export type { ArtistProfilePayload };

export interface PublishedAvailabilitySlot {
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  bookingId?: {
    eventLocation?: {
      venue?: string;
      address?: string;
      city?: string;
      country?: string;
    };
    eventType?: string;
  };
}

/**
 * Fast path: Mongo/API first (parallel profile + availability).
 * Firestore is optional enrichment only — never blocks the initial paint.
 */
export async function loadArtistProfilePageData(artistId: string): Promise<{
  artist: ArtistProfilePayload | null;
  publishedAvailability: PublishedAvailabilitySlot[];
  bookings: Array<Record<string, unknown>>;
}> {
  if (artistId.startsWith("intl-")) {
    const intl = INTERNATIONAL_ARTISTS.find((a) => a.id === artistId);
    return {
      artist: (intl as ArtistProfilePayload) || null,
      publishedAvailability: [],
      bookings: [],
    };
  }

  const sample = SAMPLE_ARTISTS.find((a) => a.id === artistId) as
    | ArtistProfilePayload
    | undefined;

  try {
    const { artist: fromApi, publishedAvailability } =
      await loadArtistProfileFromApi(artistId);

    if (fromApi) {
      return { artist: fromApi, publishedAvailability, bookings: [] };
    }

    if (sample) {
      return { artist: sample, publishedAvailability, bookings: [] };
    }

    const fromFirestore = await getArtistFromFirestore(artistId);
    if (fromFirestore) {
      return {
        artist: fromFirestore as ArtistProfilePayload,
        publishedAvailability,
        bookings: [],
      };
    }

    return { artist: null, publishedAvailability, bookings: [] };
  } catch {
    return {
      artist: sample ?? null,
      publishedAvailability: [],
      bookings: [],
    };
  }
}

/** Non-blocking calendar hints from Firestore (after profile is visible). */
export async function loadArtistBookingsBackground(
  artistId: string,
): Promise<Array<Record<string, unknown>>> {
  if (artistId.startsWith("intl-")) return [];
  try {
    const rows = await getArtistBookings(artistId);
    return (rows || []) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}

/** Refresh availability after a booking modal closes. */
export async function refreshArtistAvailability(
  artistId: string,
): Promise<PublishedAvailabilitySlot[]> {
  if (artistId.startsWith("intl-")) return [];
  const { publishedAvailability } = await loadArtistProfileFromApi(artistId);
  return publishedAvailability;
}
