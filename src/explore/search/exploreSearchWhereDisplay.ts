import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';

export const EXPLORE_SEARCH_WHERE_COUNTRY_SUFFIX = ', United Arab Emirates';

/** Emirate / state line with country — dropdown + resting field. */
export const formatExploreSearchStateWithCountry = (stateRaw: string): string => {
  const trimmed = stateRaw.trim();
  if (!trimmed) return '';
  const state = EXPLORE_REGION_PILL_LABELS[trimmed] ?? trimmed;
  return formatExploreSearchWhereDisplay(state);
};

/** Booking-style resting label — short search query → “Dubai, United Arab Emirates”. */
export const formatExploreSearchWhereDisplay = (query: string): string => {
  const q = query.trim();
  if (!q) return '';
  if (/united arab emirates/i.test(q)) return q;
  return `${q}${EXPLORE_SEARCH_WHERE_COUNTRY_SUFFIX}`;
};

/** Effective where for browse when the draft is empty (after focus-clear). */
export const exploreSearchWhereEffectiveQuery = (draftQuery: string, detectedQuery: string): string =>
  draftQuery.trim() || detectedQuery.trim();