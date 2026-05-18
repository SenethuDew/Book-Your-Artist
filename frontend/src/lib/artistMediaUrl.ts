import { getApiBaseUrl } from "@/lib/api";

/**
 * Resolves artist image paths for display in the browser.
 * - `/uploads/*` → Express API (user uploads)
 * - Other `/path` → Next.js public folder (same origin as the app)
 * - Absolute http(s) URLs → unchanged
 */
export function resolveArtistMediaUrl(
  raw: string | undefined | null,
): string | undefined {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return undefined;

  if (/^https?:\/\//i.test(s)) {
    try {
      const url = new URL(s);
      const path = url.pathname;
      if (path && !path.toLowerCase().startsWith("/uploads")) {
        const apiOrigin = new URL(getApiBaseUrl()).origin;
        if (url.origin === apiOrigin && typeof window !== "undefined") {
          return `${window.location.origin}${path}`;
        }
      }
    } catch {
      /* use original URL */
    }
    return s;
  }

  const path = s.startsWith("/") ? s : `/${s}`;

  if (path.toLowerCase().startsWith("/uploads")) {
    const base = getApiBaseUrl().replace(/\/$/, "");
    return `${base}${path}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }

  return path;
}

export function defaultArtistPlaceholder(category?: string): string {
  const c = (category || "").toLowerCase();
  if (c.includes("dj")) {
    return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop";
  }
  if (c.includes("band")) {
    return "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=500&fit=crop";
  }
  return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop";
}
