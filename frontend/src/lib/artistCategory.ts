export type ArtistCategorySlug = "singers" | "djs" | "bands" | "rappers";

const GENERIC_CATEGORY_LABELS = new Set([
  "",
  "musician",
  "artist",
  "performer",
  "entertainer",
  "music",
]);

const SLUG_LABELS: Record<ArtistCategorySlug, string> = {
  singers: "Singers",
  djs: "DJs",
  bands: "Bands",
  rappers: "Rappers",
};

/** Map URL/filter values to canonical slugs. */
export function normalizeCategoryFilterSlug(
  filter?: string | null,
): ArtistCategorySlug | null {
  if (!filter?.trim()) return null;
  const f = filter.trim().toLowerCase().replace(/^live\s+/, "");
  if (f === "dj" || f === "djs") return "djs";
  if (f === "band" || f === "bands") return "bands";
  if (f === "singer" || f === "singers") return "singers";
  if (f === "rapper" || f === "rappers") return "rappers";
  return null;
}

function isGenericCategory(category: string): boolean {
  return GENERIC_CATEGORY_LABELS.has(category.trim().toLowerCase());
}

/** Classify free text (category, artistType, or genre string) — not broad genres like Pop/Rock. */
function classifyText(text: string): ArtistCategorySlug | null {
  const t = text.toLowerCase();
  if (/\bdjs?\b|deejay|disk jockey/.test(t)) return "djs";
  if (/\brappers?\b|hip[\s-]?hop|(?:^|[\s,/])rap(?:[\s,/]|$)|\btrap\b|grime|emcee/.test(t)) {
    return "rappers";
  }
  if (/\bbands?\b|ensemble|orchestra|live band/.test(t)) return "bands";
  if (/\bsingers?\b|vocalist|vocal\b|songwriter/.test(t)) return "singers";
  return null;
}

export function resolveArtistCategorySlug(input: {
  category?: string;
  artistType?: string;
  genres?: string[];
}): ArtistCategorySlug | null {
  const category = (input.category || "").trim();
  const artistType = (input.artistType || "").trim();

  if (category && !isGenericCategory(category)) {
    const fromCategory = classifyText(category);
    if (fromCategory) return fromCategory;
  }

  if (artistType) {
    const fromType = classifyText(artistType);
    if (fromType) return fromType;
  }

  if (category) {
    const fromCategory = classifyText(category);
    if (fromCategory) return fromCategory;
  }

  if (input.genres?.length) {
    const fromGenres = classifyText(input.genres.join(" "));
    if (fromGenres) return fromGenres;
  }

  return null;
}

export function categoryLabelFromSlug(slug: ArtistCategorySlug): string {
  return SLUG_LABELS[slug];
}

export function artistMatchesCategoryFilter(
  artist: {
    category?: string;
    artistType?: string;
    genres?: string[];
  },
  filter?: string | null,
): boolean {
  const wanted = normalizeCategoryFilterSlug(filter);
  if (!wanted) return true;
  return resolveArtistCategorySlug(artist) === wanted;
}
