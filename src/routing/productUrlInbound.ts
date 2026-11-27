/**
 * Product URL query contract — canonical tokens only (GW-7).
 * Legacy inbound aliases are not accepted; serializers emit canonical values from domain modules.
 */

export const CANONICAL_LIST_FILTER_AVAILABILITY = 'availability';

export const listFilterMeansAvailabilityOnly = (filterParam: string | null | undefined): boolean =>
  filterParam?.trim().toLowerCase() === CANONICAL_LIST_FILTER_AVAILABILITY;

export const parseInboundExploreActivityMode = (
  raw: string | null
): 'all' | 'hosted' | 'availability' | null => {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if (value === 'hosted' || value === 'availability' || value === 'all') return value;
  return null;
};

export const readExploreSearchScopeParam = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => searchParams.get('searchScope')?.trim() || null;

/** Retired alias for `searchScope` — stripped on browse URL sync only (GW-7). */
export const INBOUND_SEARCH_SCOPE_FOCUS_PARAM = 'searchFocus' as const;

const CANONICAL_SEARCH_SCOPES = new Set([
  'activities',
  'places',
  'people',
  'shops',
  'agencies',
  'all',
]);

export const normalizeExploreSearchScopeInbound = (value: string | null): string | null => {
  const key = value?.trim().toLowerCase();
  if (!key || !CANONICAL_SEARCH_SCOPES.has(key)) return null;
  return key;
};

export const PEOPLE_LIST_TAB_URL_PARAM = 'peopleTab';

/** Canonical `peopleTab` only — no legacy param names. */
export const readPeopleCrewsTabParam = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => searchParams.get(PEOPLE_LIST_TAB_URL_PARAM)?.trim() || null;

export const sanitizeInboundExplorePinId = (pin: string | null | undefined): string | null => {
  const raw = pin?.trim();
  return raw || null;
};