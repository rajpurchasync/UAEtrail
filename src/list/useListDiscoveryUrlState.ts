import { useCallback, useEffect, useMemo, useRef } from 'react';
import { inferListCatFromExploreHandoff, scopeBrowseListStateForListCat } from './browse/browseListMapHandoff';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { applyProductSearchMutation } from '../routing/productSearchMutation';
import { stripRetiredPeopleListTabParams } from '../routing/productUrlInbound';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import {
  EXPLORE_SEARCH_RESULTS_PATH,
  EXPLORE_SEARCH_SCOPE_PARAM,
  EXPLORE_SEARCH_VIEW_PARAM,
  INBOUND_HUB_SCOPE_PARAM,
  exploreSearchListCatForScope,
  exploreSearchScopeForListCat,
  parseExploreSearchBrowseState,
} from '../explore/search/exploreSearchRouting';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  BROWSE_DISCOVER_PARAM,
  LIST_CAT_PARAM,
  BROWSE_GEO_PARAM,
  parseBrowseListFilterState,
  parseBrowseListGeoPath,
  parseBrowseListVenueRegions,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

import { PEOPLE_LIST_TAB_URL_PARAM } from './peopleListBrowseUrl';
import {
  CREWS_AVAILABILITY_SHEET_PARAM,
  CREWS_OPEN_URL_PARAM,
  parseCrewsAvailabilitySheetOpen,
  parseCrewsAvailableOpenLens,
  serializeCrewsAvailableOpenLens,
  type CrewsAvailableOpenLens,
} from './crews/crewsOpenSegment';
import {
  LIST_LAYOUT_PARAM,
  parseListExplorerLayout,
  serializeListExplorerLayout,
  type ListExplorerLayout,
} from './browse/browseListLayout';
import {
  LIST_SORT_PARAM,
  parseListExplorerSort,
  serializeListExplorerSort,
  type ListExplorerSortMode,
} from './browse/listBrowseSort';

const LIST_FILTER_PARAM_KEYS = [
  'q',
  'topics',
  'filter',
  'tripTypes',
  'placeTypes',
  'price',
  'when',
  'date',
  'regions',
  BROWSE_GEO_PARAM,
  'hasTrip',
  'facilityKinds',
  LIST_CAT_PARAM,
  PEOPLE_LIST_TAB_URL_PARAM,
  LIST_LAYOUT_PARAM,
  LIST_SORT_PARAM,
  CREWS_OPEN_URL_PARAM,
  CREWS_AVAILABILITY_SHEET_PARAM,
] as const;

/** Explore-only keys — keep when list overlay updates browse filters. */
const EXPLORE_PRESERVE_PARAM_KEYS = [
  'searchScope',
  'searchFocus',
  'panel',
  'pinKind',
  'view',
  'places',
  'activity',
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
  /** `/explore/search` — minimal listCat repair only (no category scope loop). */
  searchResultsBrowse?: boolean;
};

export const useListDiscoveryUrlState = (options?: UseListDiscoveryUrlStateOptions) => {
  const mapOverlay = options?.mapOverlay ?? false;
  const searchResultsBrowse = options?.searchResultsBrowse ?? false;
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const rawListCat = useMemo(
    () => parseListCatParam(searchParams.get(LIST_CAT_PARAM)),
    [searchParams]
  );

  const listCat = useMemo(() => {
    if (location.pathname === EXPLORE_SEARCH_RESULTS_PATH) {
      return exploreSearchListCatForScope(parseExploreSearchBrowseState(searchParams).searchScope);
    }
    if (mapOverlay) return rawListCat;
    if (rawListCat === 'people' || rawListCat === 'agencies') return rawListCat;
    if (rawListCat) return rawListCat;
    const inferred = inferListCatFromExploreHandoff(parseBrowseListFilterState(searchParams), searchParams);
    if (inferred) return inferred;
    return 'activities';
  }, [location.pathname, mapOverlay, rawListCat, searchParams]);

  const filters = useMemo(() => {
    const raw = parseBrowseListFilterState(searchParams);
    if (listCat === 'activities' || listCat === 'venues') {
      return scopeBrowseListStateForListCat(raw, listCat);
    }
    return raw;
  }, [searchParams, listCat]);

  const venueRegions = useMemo(() => parseBrowseListVenueRegions(searchParams), [searchParams]);

  const geoPath = useMemo(() => parseBrowseListGeoPath(searchParams), [searchParams]);

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
        geoPath?: string[];
        listCat?: BrowseMainCategoryKey | null;
        layout?: ListExplorerLayout;
        sort?: ListExplorerSortMode;
        crewsOpen?: CrewsAvailableOpenLens | null;
        availabilitySheet?: boolean | null;
      }
    ) => {
      applyProductSearchMutation(
        {
          pathname: location.pathname,
          navigate,
          setSearchParams,
          locationState: location.state,
        },
        (params) => {
          const patchedListCat =
            patch.listCat !== undefined ? patch.listCat : listCat;
          let next: BrowseListFilterState = {
            ...filters,
            ...patch,
          };
          let regions = patch.regions ?? venueRegions;
          const nextGeo = patch.geoPath ?? geoPath;
          if (!mapOverlay && (patchedListCat === 'activities' || patchedListCat === 'venues')) {
            next = scopeBrowseListStateForListCat(next, patchedListCat);
          }
          const listParams = serializeBrowseListSearchParams(next, regions, nextGeo);
          const nextLayout = patch.layout ?? layout;
          const layoutParam = serializeListExplorerLayout(nextLayout);
          if (layoutParam) listParams.set(LIST_LAYOUT_PARAM, layoutParam);

          const nextSort = patch.sort ?? sort;
          const sortParam = serializeListExplorerSort(nextSort);
          if (sortParam) listParams.set(LIST_SORT_PARAM, sortParam);
          else listParams.delete(LIST_SORT_PARAM);

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
          if (patch.crewsOpen !== undefined) {
            const serializedOpen = patch.crewsOpen
              ? serializeCrewsAvailableOpenLens(patch.crewsOpen)
              : null;
            if (serializedOpen) params.set(CREWS_OPEN_URL_PARAM, serializedOpen);
            else params.delete(CREWS_OPEN_URL_PARAM);
          }
          if (patch.availabilitySheet === false) {
            params.delete(CREWS_AVAILABILITY_SHEET_PARAM);
          }
          if (mapOverlay) {
            preserved.forEach((value, key) => {
              params.set(key, value);
            });
          }
          if (patch.listCat === null) {
            params.delete(LIST_CAT_PARAM);
          } else if (patch.listCat) {
            params.set(LIST_CAT_PARAM, patch.listCat);
          } else if (patchedListCat && patchedListCat !== 'activities') {
            params.set(LIST_CAT_PARAM, patchedListCat);
          } else if (!mapOverlay) {
            params.set(LIST_CAT_PARAM, 'activities');
          } else if (listCat) {
            params.set(LIST_CAT_PARAM, listCat);
          }
          if (mapOverlay) {
            params.set('list', '1');
            params.delete(BROWSE_DISCOVER_PARAM);
          }
          if (location.pathname === EXPLORE_SEARCH_RESULTS_PATH) {
            const scope = exploreSearchScopeForListCat(patchedListCat);
            if (scope === 'join') params.delete(EXPLORE_SEARCH_SCOPE_PARAM);
            else params.set(EXPLORE_SEARCH_SCOPE_PARAM, scope);
            params.delete(INBOUND_HUB_SCOPE_PARAM);
            const resultsView = searchParams.get(EXPLORE_SEARCH_VIEW_PARAM);
            if (resultsView === 'map') params.set(EXPLORE_SEARCH_VIEW_PARAM, 'map');
            else params.delete(EXPLORE_SEARCH_VIEW_PARAM);
          }
          stripRetiredPeopleListTabParams(params);
        }
      );
    },
    [
      filters,
      venueRegions,
      geoPath,
      listCat,
      layout,
      sort,
      location.pathname,
      location.state,
      mapOverlay,
      navigate,
      searchParams,
      setSearchParams,
    ]
  );

  const listSearchKey = searchParams.toString();
  const scopeRepairRef = useRef<string | null>(null);
  useEffect(() => {
    if (mapOverlay) return;
    if (searchResultsBrowse || location.pathname === EXPLORE_SEARCH_RESULTS_PATH) {
      const paramCat = parseListCatParam(searchParams.get(LIST_CAT_PARAM));
      if (paramCat === listCat) {
        scopeRepairRef.current = null;
        return;
      }
      const fingerprint = `hub-cat|${listCat}`;
      if (scopeRepairRef.current === fingerprint) return;
      scopeRepairRef.current = fingerprint;
      syncUrl({ listCat });
      return;
    }
    if (listCat === 'people' || listCat === 'agencies') {
      const paramCat = parseListCatParam(searchParams.get(LIST_CAT_PARAM));
      if (paramCat === listCat) return;
      syncUrl({ listCat });
      return;
    }
    if (listCat !== 'activities' && listCat !== 'venues') return;
    const raw = parseBrowseListFilterState(searchParams);
    const scoped = scopeBrowseListStateForListCat(raw, listCat);
    const regions = parseBrowseListVenueRegions(searchParams);
    const paramCat = parseListCatParam(searchParams.get(LIST_CAT_PARAM));
    const needsListCat = paramCat !== listCat;
    const needsScope =
      JSON.stringify(raw.categories) !== JSON.stringify(scoped.categories) ||
      raw.tripTopics.join(',') !== scoped.tripTopics.join(',') ||
      raw.placeTopics.join(',') !== scoped.placeTopics.join(',') ||
      raw.tripAvailabilityOnly !== scoped.tripAvailabilityOnly;
    if (!needsListCat && !needsScope) return;
    const fingerprint = `${searchParams.toString()}|${listCat}`;
    if (scopeRepairRef.current === fingerprint) return;
    scopeRepairRef.current = fingerprint;
    syncUrl({ ...scoped, listCat, regions });
  }, [searchResultsBrowse, listCat, location.pathname, mapOverlay, listSearchKey, searchParams, syncUrl]);

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

  const crewsOpenLens = useMemo(
    () => parseCrewsAvailableOpenLens(searchParams.get(CREWS_OPEN_URL_PARAM)),
    [searchParams]
  );

  const availabilitySheetOpen = useMemo(
    () => parseCrewsAvailabilitySheetOpen(searchParams.get(CREWS_AVAILABILITY_SHEET_PARAM)),
    [searchParams]
  );

  return {
    filters,
    crewsOpenLens,
    availabilitySheetOpen,
    venueRegions,
    geoPath,
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
