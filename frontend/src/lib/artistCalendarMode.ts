/**
 * Bands / DJs: one show per calendar day → calendar uses date + status instead of multiple time bands.
 */

export function isSingleGigPerDayCategory(
  category?: string | null,
  artistType?: string | null,
): boolean {
  const blob = `${category ?? ""} ${artistType ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return /\bdj\b|\bdjs\b|\bband\b|\bbands\b/.test(blob);
}
