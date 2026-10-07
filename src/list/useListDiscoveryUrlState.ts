import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import type { MapFilterKey } from '../explore/routing';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  parseBrowseListFilterState,
  parseBrowseListVenueRegions,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

const LIST_FILTER_PARAM_KEYS = ['q', 'topics', 'filter', 'price', 'when', 'date', 'regions'] as const;

type UseListDiscoveryUrlStateOptions = {
  /** Keep `list=1` on `/explore` when filters change. */
  mapOverlay?: boolean;
};

export const useListDiscoveryUrlState = (options?: UseListDiscoveryUrlStateOptions) => {
  const mapOverlay = options?.mapOverlay ?? false;
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseBrowseListFilterState(searchParams), [searchParams]);
  const venueRegions = useMemo(() => parseBrowseListVenueRegions(searchParams), [searchParams]);

  const syncUrl = useCallback(
    (patch: Partial<BrowseListFilterState> & { regions?: string[] }) => {
      const next: BrowseListFilterState = {
        ...filters,
        ...patch,
      };
      const regions = patch.regions ?? venueRegions;
      const listParams = serializeBrowseListSearchParams(next, regions);

      const params = new URLSearchParams(searchParams);
      for (const key of LIST_FILTER_PARAM_KEYS) {
        params.delete(key);
      }
      listParams.forEach((value, key) => {
        params.set(key, value);
      });
      if (mapOverlay) {
        params.set('list', '1');
      }
      setSearchParams(params, { replace: true });
    },
    [filters, venueRegions, mapOverlay, searchParams, setSearchParams]
  );

  const setQuery = useCallback((query: string) => syncUrl({ query }), [syncUrl]);

  const toggleCategory = useCallback(
    (key: BrowseMainCategoryKey) => {
      const set = new Set(filters.categories);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      syncUrl({ categories: [...set] });
    },
    [filters.categories, syncUrl]
  );

  const setTripTopic = useCallback(
    (tripTopic: MapFilterKey) => syncUrl({ tripTopic }),
    [syncUrl]
  );

  const searchString = searchParams.toString();

  return {
    filters,
    venueRegions,
    searchString,
    listPath: searchString ? `${LIST_DISCOVERY_PATH}?${searchString}` : LIST_DISCOVERY_PATH,
    setQuery,
    toggleCategory,
    setTripTopic,
    syncUrl,
  };
};
