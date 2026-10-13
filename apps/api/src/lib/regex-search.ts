/** Max length for user-provided substring search passed to Mongo $regex. */
export const SEARCH_REGEX_MAX_LENGTH = 64;

/** Escape user input for use inside a MongoDB literal $regex (case-insensitive contains). */
export const escapeRegexLiteral = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normalize search text for safe case-insensitive contains matching.
 * Returns null when empty after trim (caller should skip $regex clause).
 */
export const normalizeSearchRegexInput = (raw: string | undefined | null): string | null => {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return null;
  const capped = trimmed.slice(0, SEARCH_REGEX_MAX_LENGTH);
  return escapeRegexLiteral(capped);
};
