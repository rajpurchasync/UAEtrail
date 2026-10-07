import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import type { BrowseListFilterState } from './browseListFilters';
import {
  parseBrowseListFilterState,
  parseBrowseListVenueRegions,
  serializeBrowseListSearchParams,
  serializeBrowseListToExploreSearchParams,
} from './browseListUrlState';

export type ListDiscoveryPathOptions = Partial<BrowseListFilterState> & {
  regions?: string[];
};

/** Full-screen list discovery — query aligned with explore browse where possible. */
export const listDiscoveryPath = (options?: ListDiscoveryPathOptions): string => {
  const state: BrowseListFilterState = {
    query: options?.query ?? '',
    categories: options?.categories ?? [],
    tripTopic: options?.tripTopic ?? 'all',
    tripLookingOnly: options?.tripLookingOnly ?? false,
    price: options?.price ?? 'all',
    when: options?.when ?? 'any',
    activityDatePreset: options?.activityDatePreset ?? 'anyday',
  };
  const params = serializeBrowseListSearchParams(state, options?.regions ?? []);
  const qs = params.toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};

export const exploreMapPathFromListSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  const state = parseBrowseListFilterState(params);
  const regions = parseBrowseListVenueRegions(params);
  const exploreParams = serializeBrowseListToExploreSearchParams(state, regions);
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
  const qs = serializeBrowseListSearchParams(state, regions).toString();
  return qs ? `${LIST_DISCOVERY_PATH}?${qs}` : LIST_DISCOVERY_PATH;
};
