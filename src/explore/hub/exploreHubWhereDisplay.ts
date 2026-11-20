import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';

export const EXPLORE_HUB_WHERE_COUNTRY_SUFFIX = ', United Arab Emirates';

/** Emirate / state line with country — dropdown + resting field. */
export const formatExploreHubStateWithCountry = (stateRaw: string): string => {
  const trimmed = stateRaw.trim();
  if (!trimmed) return '';
  const state = EXPLORE_REGION_PILL_LABELS[trimmed] ?? trimmed;
  return formatExploreHubWhereDisplay(state);
};

/** Booking-style resting label — short search query → “Dubai, United Arab Emirates”. */
export const formatExploreHubWhereDisplay = (query: string): string => {
  const q = query.trim();
  if (!q) return '';
  if (/united arab emirates/i.test(q)) return q;
  return `${q}${EXPLORE_HUB_WHERE_COUNTRY_SUFFIX}`;
};

/** Effective where for browse when the draft is empty (after focus-clear). */
export const exploreHubWhereEffectiveQuery = (draftQuery: string, detectedQuery: string): string =>
  draftQuery.trim() || detectedQuery.trim();

const HUB_WHERE_COUNTRY_SUFFIX_RE = /,\s*united arab emirates$/i;

/** Strip display suffix before map/list query matching. */
export const exploreHubWhereBrowseQuery = (query: string): string => {
  const q = query.trim();
  if (!q) return '';
  const stripped = q.replace(HUB_WHERE_COUNTRY_SUFFIX_RE, '').trim();
  return stripped || q;
};