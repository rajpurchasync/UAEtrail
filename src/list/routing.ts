import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import type { BrowseListFilterState } from './browseListFilters';
import {
  inferListCatFromExploreHandoff,
  serializeBrowseListToExploreSearchParams,
} from './browseListMapHandoff';
import {
  LIST_CAT_PARAM,
  parseBrowseListFilterState,
  parseBrowseListVenueRegions,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

export type ListDiscoveryPathOptions = Partial<BrowseListFilterState> & {
  regions?: string[];
};

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
    buddiesSegment: options?.buddiesSegment ?? 'going',
  };
  const params = serializeBrowseListSearchParams(state, options?.regions ?? []);
  const qs = params.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};

export const exploreMapPathFromListSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  const state = parseBrowseListFilterState(params);
  const regions = parseBrowseListVenueRegions(params);
  const listCat = parseListCatParam(params.get(LIST_CAT_PARAM));
  const exploreParams = serializeBrowseListToExploreSearchParams(state, regions, { listCat });
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
  const listParams = serializeBrowseListSearchParams(state, regions);
  const inferredListCat = inferListCatFromExploreHandoff(state, params);
  if (inferredListCat) listParams.set(LIST_CAT_PARAM, inferredListCat);
  const qs = listParams.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};
