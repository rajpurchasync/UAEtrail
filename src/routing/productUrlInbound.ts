/**
 * Product URL inbound aliases — parse-only (MIG-DISCO-REG + crews wire).
 * Serializers emit canonical query values from domain modules; do not add outbound shims here.
 */

/** List `/list` + explore shared filter token — availability-only browse. */
export const INBOUND_LIST_FILTER_LOOKING = 'looking';
export const CANONICAL_LIST_FILTER_AVAILABILITY = 'availability';

export const listFilterMeansAvailabilityOnly = (filterParam: string | null | undefined): boolean => {
  if (!filterParam) return false;
  const token = filterParam.trim().toLowerCase();
  return token === CANONICAL_LIST_FILTER_AVAILABILITY || token === INBOUND_LIST_FILTER_LOOKING;
};

/** Explore `activityMode` — legacy seeking meant fixed availability catalog rows. */
export const INBOUND_ACTIVITY_MODE_SEEKING = 'seeking';

export const parseInboundExploreActivityMode = (
  raw: string | null
): 'all' | 'hosted' | 'availability' | null => {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if (value === 'hosted') return 'hosted';
  if (value === 'availability' || value === INBOUND_ACTIVITY_MODE_SEEKING) return 'availability';
  if (value === 'all') return 'all';
  return null;
};

/** Explore `pinKind` retired tokens still accepted on inbound URLs. */
export const INBOUND_PIN_KIND_LOOKING = 'looking';
export const INBOUND_PIN_KIND_TRIPS = 'trips';
export const INBOUND_PIN_KIND_LOCATIONS = 'locations';

export const EXPLORE_PIN_KIND_INBOUND_TOKENS = [
  INBOUND_PIN_KIND_TRIPS,
  INBOUND_PIN_KIND_LOOKING,
  INBOUND_PIN_KIND_LOCATIONS,
] as const;

export const canonicalizeExplorePinKindToken = (key: string): string => {
  if (key === INBOUND_PIN_KIND_TRIPS || key === INBOUND_PIN_KIND_LOOKING) return 'activities';
  if (key === INBOUND_PIN_KIND_LOCATIONS) return 'places';
  return key;
};

/** `searchScope` + retired `searchFocus`. */
export const INBOUND_SEARCH_SCOPE_FOCUS_PARAM = 'searchFocus';

export const readExploreSearchScopeParam = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => {
  const canonical = searchParams.get('searchScope')?.trim();
  if (canonical) return canonical;
  return searchParams.get(INBOUND_SEARCH_SCOPE_FOCUS_PARAM)?.trim() || null;
};

/** Retired explore search scope tokens → canonical scope key (validated downstream). */
export const normalizeExploreSearchScopeInbound = (value: string | null): string | null => {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === 'trips' || key === 'trip' || key === 'activity') return 'activities';
  if (
    key === 'spots' ||
    key === 'spot' ||
    key === 'venue' ||
    key === 'venues' ||
    key === 'place'
  ) {
    return 'places';
  }
  if (key === 'looking' || key === 'demand' || key === 'person' || key === 'buddies') return 'people';
  if (key === 'shop' || key === 'shops') return 'shops';
  if (key === 'agency' || key === 'agencies' || key === 'operator' || key === 'operators') {
    return 'agencies';
  }
  if (key === 'activities' || key === 'places') return key;
  if (key === 'people') return 'people';
  return key;
};

/** Crews tab query param names. */
export const PEOPLE_LIST_TAB_URL_PARAM = 'peopleTab';
export const INBOUND_BUDDIES_LIST_TAB_PARAM = 'buddies';
export const INBOUND_SOCIAL_TAB_PARAM = 'socialTab';
export const INBOUND_GOING_TAB_PARAM = 'goingTab';

/** Sole people-tab segment read (canonical `peopleTab` + inbound-only aliases). */
export const readPeopleCrewsTabParam = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => {
  const canonical = searchParams.get(PEOPLE_LIST_TAB_URL_PARAM)?.trim();
  if (canonical) return canonical;
  const buddies = searchParams.get(INBOUND_BUDDIES_LIST_TAB_PARAM)?.trim();
  if (buddies) return buddies;
  const social = searchParams.get(INBOUND_SOCIAL_TAB_PARAM)?.trim();
  if (social) return social;
  const goingTab = searchParams.get(INBOUND_GOING_TAB_PARAM)?.trim();
  if (goingTab === 'people') return 'going';
  if (goingTab === 'discover') return 'available';
  if (goingTab === 'trips') return 'connect';
  return null;
};

/** Retired `peopleTab` values (not param names). */
/** Retired explore overlay query keys — stripped on browse sync (never written). */
export const INBOUND_EXPLORE_FULFILL_INTENT_PARAM = 'fulfillIntent';
export const INBOUND_EXPLORE_HOST_DEMAND_PARAM = 'hostDemand';

export const stripRetiredExploreOverlayParams = (params: URLSearchParams): void => {
  params.delete(INBOUND_EXPLORE_FULFILL_INTENT_PARAM);
  params.delete(INBOUND_EXPLORE_HOST_DEMAND_PARAM);
};

/** Inbound-only aliases — never emit on outbound URL sync. */
export const stripRetiredPeopleListTabParams = (params: URLSearchParams): void => {
  params.delete(INBOUND_BUDDIES_LIST_TAB_PARAM);
  params.delete(INBOUND_SOCIAL_TAB_PARAM);
  params.delete(INBOUND_GOING_TAB_PARAM);
};

/** Drop non-product map pins (`demand:` retired with MIG-DISCO-REG). */
export const sanitizeInboundExplorePinId = (pin: string | null | undefined): string | null => {
  const raw = pin?.trim();
  if (!raw) return null;
  if (raw.startsWith('demand:')) return null;
  return raw;
};

export const mapInboundPeopleBrowseTabValue = (raw: string): string | null => {
  switch (raw) {
    case 'all':
      return 'connect';
    case 'friends':
    case 'followed':
      return 'going';
    case 'discover':
      return 'available';
    case 'buddies':
      return 'hub';
    default:
      return null;
  }
};