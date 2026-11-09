import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  BROWSE_DISCOVER_PARAM,
  LIST_CAT_PARAM,
  parseBrowseListFilterState,
  parseBrowseListGeoIds,
  parseBrowseListVenueRegions,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

import { BUDDIES_SEGMENT_URL_PARAM } from './buddiesDiscoverySegment';
import {
  LIST_LAYOUT_PARAM,
  parseListExplorerLayout,
  serializeListExplorerLayout,
  type ListExplorerLayout,
} from './explorer/listExplorerLayout';
import {
  LIST_SORT_PARAM,
  parseListExplorerSort,
  serializeListExplorerSort,
  type ListExplorerSortMode,
} from './explorer/listExplorerSort';

const LIST_FILTER_PARAM_KEYS = [
  'q',
  'topics',
  'filter',
  'price',
  'when',
  'date',
  'regions',
  'geo',
  LIST_CAT_PARAM,
  BUDDIES_SEGMENT_URL_PARAM,
  LIST_LAYOUT_PARAM,
  LIST_SORT_PARAM,
] as const;

/** Explore-only keys — keep when list overlay updates browse filters. */
const EXPLORE_PRESERVE_PARAM_KEYS = [
  'searchScope',
  'searchFocus',
  'panel',
  'pinKind',
  'view',
  'subtype',
  'outingTopic',
  'pin',
  'myPlan',
  'myTrips',
  'list',
] as const;

type UseListDiscoveryUrlStateOptions = {
  /** Keep `browse=1` on `/explore` when discover filters change. */
  mapOverlay?: boolean;
};

export const useListDiscoveryUrlState = (options?: UseListDiscoveryUrlStateOptions) => {
  const mapOverlay = options?.mapOverlay ?? false;
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const filters = useMemo(() => parseBrowseListFilterState(searchParams), [searchParams]);
  const venueRegions = useMemo(() => parseBrowseListVenueRegions(searchParams), [searchParams]);
  const geoIds = useMemo(() => parseBrowseListGeoIds(searchParams), [searchParams]);

  const listCat = useMemo(
    () => parseListCatParam(searchParams.get(LIST_CAT_PARAM)),
    [searchParams]
  );

  const layout = useMemo(
    () => parseListExplorerLayout(searchParams.get(LIST_LAYOUT_PARAM)),
    [searchParams]
  );

  const sort = useMemo(
    () => parseListExplorerSort(searchParams.get(LIST_SORT_PARAM)),
    [searchParams]
  );

  const syncUrl = useCallback(
    (
      patch: Partial<BrowseListFilterState> & {
        regions?: string[];
        geoIds?: string[];
        listCat?: BrowseMainCategoryKey | null;
        layout?: ListExplorerLayout;
        sort?: ListExplorerSortMode;
      }
    ) => {
      const next: BrowseListFilterState = {
        ...filters,
        ...patch,
      };
      const regions = patch.regions ?? venueRegions;
      const nextGeoIds = patch.geoIds ?? geoIds;
      const listParams = serializeBrowseListSearchParams(next, regions, nextGeoIds);
      const nextLayout = patch.layout ?? layout;
      const layoutParam = serializeListExplorerLayout(nextLayout);
      if (layoutParam) listParams.set(LIST_LAYOUT_PARAM, layoutParam);

      const nextSort = patch.sort ?? sort;
      const sortParam = serializeListExplorerSort(nextSort);
      if (sortParam) listParams.set(LIST_SORT_PARAM, sortParam);
      else listParams.delete(LIST_SORT_PARAM);

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
        params.delete(BROWSE_DISCOVER_PARAM);
        if (patch.listCat !== undefined) {
          if (patch.listCat === 'venues') params.set('panel', 'venues');
          else params.set('panel', 'activities');
        }
      }
      const qs = params.toString();
      navigate(
        { pathname: location.pathname, search: qs ? `?${qs}` : '' },
        { replace: true, state: location.state }
      );
    },
    [filters, venueRegions, geoIds, listCat, layout, sort, location.pathname, location.state, mapOverlay, navigate, searchParams]
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
    geoIds,
    listCat,
    layout,
    sort,
    searchString,
    listPath: searchString ? `${LIST_DISCOVERY_PATH}?${searchString}` : LIST_DISCOVERY_PATH,
    setQuery,
    toggleCategory,
    setTripTopics,
    syncUrl,
  };
};
