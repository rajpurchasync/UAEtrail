import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import type { BrowseListFilterState } from './browseListFilters';
import {
  inferListCatFromExploreHandoff,
  serializeBrowseListToExploreSearchParams,
} from './browseListMapHandoff';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  LIST_CAT_PARAM,
  parseBrowseListFilterState,
  parseBrowseListGeoIds,
  parseBrowseListVenueRegions,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

export type ListDiscoveryPathOptions = Partial<BrowseListFilterState> & {
  regions?: string[];
  geoIds?: string[];
  listCat?: BrowseMainCategoryKey | null;
};

/** Full-screen member discovery (`/list?listCat=people`) — not explore map overlay. */
export const listPeopleDiscoveryPath = (): string =>
  listDiscoveryPath({
    listCat: 'people',
    categories: ['people'],
    activityDatePreset: 'anyday',
    buddiesSegment: 'looking',
  });

/** Full-screen list discovery — query aligned with explore browse where possible. */
export const listDiscoveryPath = (options?: ListDiscoveryPathOptions): string => {
  const state: BrowseListFilterState = {
    query: options?.query ?? '',
    categories: options?.categories ?? [],
    tripTopics: options?.tripTopics ?? [],
    placeTopics: options?.placeTopics ?? [],
    tripLookingOnly: options?.tripLookingOnly ?? false,
    price: options?.price ?? 'all',
    when: options?.when ?? 'any',
    activityDatePreset: options?.activityDatePreset ?? 'anyday',
    buddiesSegment: options?.buddiesSegment ?? 'looking',
  };
  const params = serializeBrowseListSearchParams(state, options?.regions ?? [], options?.geoIds ?? []);
  if (options?.listCat) params.set(LIST_CAT_PARAM, options.listCat);
  const qs = params.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};

export const exploreMapPathFromListSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  const state = parseBrowseListFilterState(params);
  const regions = parseBrowseListVenueRegions(params);
  const geoIds = parseBrowseListGeoIds(params);
  const listCat = parseListCatParam(params.get(LIST_CAT_PARAM));
  const exploreParams = serializeBrowseListToExploreSearchParams(state, regions, { listCat, geoIds });
  const qs = exploreParams.toString();
  return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
};

/** @deprecated Use {@link exploreMapPathFromListSearch} */
export const exploreMapPathFromList = (search: string): string => exploreMapPathFromListSearch(search);

/** Build `/list` from current explore query (`q`, `topics`, `date`, `regions`, `price`). */
export const listDiscoveryPathFromExploreSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  const state = parseBrowseListFilterState(params);
  const regions = parseBrowseListVenueRegions(params);
  const geoIds = parseBrowseListGeoIds(params);
  const listParams = serializeBrowseListSearchParams(state, regions, geoIds);
  const explicitListCat = parseListCatParam(params.get(LIST_CAT_PARAM));
  const inferredListCat = inferListCatFromExploreHandoff(state, params);
  const listCat = explicitListCat ?? inferredListCat;
  if (listCat) listParams.set(LIST_CAT_PARAM, listCat);
  const qs = listParams.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};
