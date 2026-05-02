/**
 * Bands / DJs are limited to one performance per calendar day (no split bill matinee + evening slots).
 */

function normalizeCategoryParts(category, artistType) {
  return `${category || ""} ${artistType || ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Works with mongoose artist profile docs or plain { category, artistType }. */
function isSingleGigPerDayCategory(profileLike) {
  if (!profileLike || typeof profileLike !== "object") return false;
  const blob = normalizeCategoryParts(profileLike.category, profileLike.artistType);
  return /\bdj\b|\bdjs\b|\bband\b|\bbands\b/.test(blob);
}

module.exports = { isSingleGigPerDayCategory, normalizeCategoryParts };
