import {
  DEFAULT_CREW_BROWSE_LANE,
  DEFAULT_CREW_PEOPLE_FACET,
  DEFAULT_CREW_PROFESSIONAL_KIND,
} from '@/crew-discovery/crewBrowseState';
import { DEFAULT_CREW_PEOPLE_SURFACE_WIRE, parseCrewPeopleSurface } from '@/crew-discovery/crewPeopleSurface';
import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../../config/platform';
import type { BrowseListFilterState } from './browseListFilters';
import {
  inferListCatFromExploreHandoff,
  scopeBrowseListStateForListCat,
  serializeBrowseListToExploreSearchParams,
} from './browseListMapHandoff';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  LIST_CAT_PARAM,
  parseBrowseListFilterState,
  parseBrowseListGeoPath,
  parseBrowseListVenueRegions,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

export type ListDiscoveryPathOptions = Partial<BrowseListFilterState> & {
  regions?: string[];
  geoPath?: string[];
  listCat?: BrowseMainCategoryKey | null;
};

const crewsPeopleListBase = (): ListDiscoveryPathOptions => ({
  listCat: 'people',
  categories: ['people'],
  activityDatePreset: 'anyday',
  crewBrowseLane: DEFAULT_CREW_BROWSE_LANE,
  crewPeopleFacet: DEFAULT_CREW_PEOPLE_FACET,
  crewProfessionalKind: DEFAULT_CREW_PROFESSIONAL_KIND,
});

/** Mobile Crews tab home — **My crew** page (`crewSurface` omitted). */
export const crewsHubHomePath = (): string =>
  listDiscoveryPath({
    ...crewsPeopleListBase(),
  });

/** Find crew — dedicated list shell (crew search + People · Outings · Communities). */
export const findCrewDiscoveryListPath = (): string =>
  listDiscoveryPath({
    ...crewsPeopleListBase(),
    crewPeopleSurface: 'find',
  });

/** Full-screen find crew search — hide product tab header (same as `/explore/search`). */
export const isFindCrewDiscoveryListPath = (pathname: string, search: string): boolean => {
  if (pathname !== LIST_DISCOVERY_PATH) return false;
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  return (
    parseListCatParam(params.get(LIST_CAT_PARAM)) === 'people' && parseCrewPeopleSurface(params) === 'find'
  );
};

/** @deprecated Alias — same as {@link findCrewDiscoveryListPath}. */
export const findCrewDiscoveryListShellPath = (): string => findCrewDiscoveryListPath();

/** Find crew with Community lane selected — join discoverable clubs. */
export const findCrewCommunityDiscoveryPath = (): string =>
  listDiscoveryPath({
    ...crewsPeopleListBase(),
    crewPeopleSurface: 'find',
    crewBrowseLane: 'community',
  });

/**
 * @deprecated Prefer {@link findCrewDiscoveryListPath} or {@link crewsHubHomePath}.
 * Kept for explore/desktop handoffs that mean discover browse.
 */
export const listPeopleDiscoveryPath = (): string => findCrewDiscoveryListPath();

/** Scoped list homes — mobile five-tab + drawer (import here, not `platform.ts`, to avoid cycles). */
export const tripsListHomePath = (): string =>
  listDiscoveryPath({ listCat: 'activities', categories: ['activities'] });

export const venuesListHomePath = (): string =>
  listDiscoveryPath({ listCat: 'venues', categories: ['venues'] });

/** Full-screen list discovery — query aligned with explore browse where possible. */
export const listDiscoveryPath = (options?: ListDiscoveryPathOptions): string => {
  const state: BrowseListFilterState = {
    query: options?.query ?? '',
    categories: options?.categories ?? [],
    tripTopics: options?.tripTopics ?? [],
    placeTopics: options?.placeTopics ?? [],
    tripAvailabilityOnly: options?.tripAvailabilityOnly ?? false,
    price: options?.price ?? 'all',
    when: options?.when ?? 'any',
    activityDatePreset: options?.activityDatePreset ?? 'anyday',
    crewBrowseLane: options?.crewBrowseLane ?? DEFAULT_CREW_BROWSE_LANE,
    crewPeopleFacet: options?.crewPeopleFacet ?? DEFAULT_CREW_PEOPLE_FACET,
    crewProfessionalKind: options?.crewProfessionalKind ?? DEFAULT_CREW_PROFESSIONAL_KIND,
    crewPeopleSurface: options?.crewPeopleSurface ?? DEFAULT_CREW_PEOPLE_SURFACE_WIRE,
    hasTrip: options?.hasTrip ?? false,
    facilityKinds: options?.facilityKinds ?? [],
    audience: options?.audience ?? 'anyone',
  };
  const params = serializeBrowseListSearchParams(
    state,
    options?.regions ?? [],
    options?.geoPath ?? []
  );
  if (options?.listCat) params.set(LIST_CAT_PARAM, options.listCat);
  const qs = params.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};

export const exploreMapPathFromListSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  let state = parseBrowseListFilterState(params);
  const regions = parseBrowseListVenueRegions(params);
  const geoPath = parseBrowseListGeoPath(params);
  const listCat = parseListCatParam(params.get(LIST_CAT_PARAM));
  if (listCat === 'activities' || listCat === 'venues') {
    state = scopeBrowseListStateForListCat(state, listCat);
  }
  const exploreParams = serializeBrowseListToExploreSearchParams(state, regions, { listCat, geoPath });
  const qs = exploreParams.toString();
  return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
};

/** Build `/list` from current explore query (`q`, `topics`, `date`, `regions`, `price`). */
export const listDiscoveryPathFromExploreSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  let state = parseBrowseListFilterState(params);
  const regions = parseBrowseListVenueRegions(params);
  const geoPath = parseBrowseListGeoPath(params);
  const explicitListCat = parseListCatParam(params.get(LIST_CAT_PARAM));
  const inferredListCat = inferListCatFromExploreHandoff(state, params);
  const listCat = explicitListCat ?? inferredListCat;
  if (listCat === 'activities' || listCat === 'venues') {
    state = scopeBrowseListStateForListCat(state, listCat);
  }
  const listParams = serializeBrowseListSearchParams(state, regions, geoPath);
  if (listCat) listParams.set(LIST_CAT_PARAM, listCat);
  const qs = listParams.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};
