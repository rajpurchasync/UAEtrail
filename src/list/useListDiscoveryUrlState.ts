import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  LIST_CAT_PARAM,
  parseBrowseListFilterState,
  parseBrowseListVenueRegions,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

import { BUDDIES_SEGMENT_URL_PARAM } from './buddiesDiscoverySegment';

const LIST_FILTER_PARAM_KEYS = [
  'q',
  'topics',
  'filter',
  'price',
  'when',
  'date',
  'regions',
  LIST_CAT_PARAM,
  BUDDIES_SEGMENT_URL_PARAM,
] as const;

/** Explore-only keys — keep when list overlay updates browse filters. */
const EXPLORE_PRESERVE_PARAM_KEYS = [
  'searchScope',
  'searchFocus',
  'panel',
  'pinKind',
  'view',
  'peopleTab',
  'socialTab',
  'buddies',
  'places',
  'activity',
  'subtype',
  'outingTopic',
  'pin',
  'myTrips',
] as const;

type UseListDiscoveryUrlStateOptions = {
  /** Keep `list=1` on `/explore` when filters change. */
  mapOverlay?: boolean;
};

export const useListDiscoveryUrlState = (options?: UseListDiscoveryUrlStateOptions) => {
  const mapOverlay = options?.mapOverlay ?? false;
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseBrowseListFilterState(searchParams), [searchParams]);
  const venueRegions = useMemo(() => parseBrowseListVenueRegions(searchParams), [searchParams]);

  const listCat = useMemo(
    () => parseListCatParam(searchParams.get(LIST_CAT_PARAM)),
    [searchParams]
  );

  const syncUrl = useCallback(
    (patch: Partial<BrowseListFilterState> & { regions?: string[]; listCat?: BrowseMainCategoryKey | null }) => {
      const next: BrowseListFilterState = {
        ...filters,
        ...patch,
      };
      const regions = patch.regions ?? venueRegions;
      const listParams = serializeBrowseListSearchParams(next, regions);

      const params = new URLSearchParams(searchParams);
      const preserved = new Map<string, string>();
      if (mapOverlay) {
        for (const key of EXPLORE_PRESERVE_PARAM_KEYS) {
          const value = searchParams.get(key);
          if (value) preserved.set(key, value);
        }
      }
      for (const key of LIST_FILTER_PARAM_KEYS) {
        params.delete(key);
      }
      listParams.forEach((value, key) => {
        params.set(key, value);
      });
      if (mapOverlay) {
        preserved.forEach((value, key) => {
          params.set(key, value);
        });
      }
      if (patch.listCat === null) {
        params.delete(LIST_CAT_PARAM);
      } else if (patch.listCat) {
        params.set(LIST_CAT_PARAM, patch.listCat);
      } else if (listCat) {
        params.set(LIST_CAT_PARAM, listCat);
      }
      if (mapOverlay) {
        params.set('list', '1');
      }
      setSearchParams(params, { replace: true });
    },
    [filters, venueRegions, listCat, mapOverlay, searchParams, setSearchParams]
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

  const setTripTopics = useCallback(
    (tripTopics: BrowseTripTopicKey[]) => syncUrl({ tripTopics }),
    [syncUrl]
  );

  const searchString = searchParams.toString();

  return {
    filters,
    venueRegions,
    listCat,
    searchString,
    listPath: searchString ? `${LIST_DISCOVERY_PATH}?${searchString}` : LIST_DISCOVERY_PATH,
    setQuery,
    toggleCategory,
    setTripTopics,
    syncUrl,
  };
};
