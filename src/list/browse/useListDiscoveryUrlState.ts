import { useCallback, useEffect, useMemo, useRef } from 'react';
import { scopeBrowseListStateForListCat } from './browseListMapHandoff';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { applyProductSearchMutation } from '../../routing/productSearchMutation';
import { LIST_DISCOVERY_PATH } from '../../config/platform';
import { EXPLORE_SEARCH_RESULTS_PATH } from '../../discovery/discoveryPortExploreSearchRouting';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import {
  LIST_CAT_PARAM,
  mergeDiscoveryBrowseListUrlParams,
  parseBrowseListFilterState,
  parseBrowseListVenueRegions,
  parseListCatParam,
  readDiscoveryBrowseListSession,
  type DiscoveryBrowseListUrlMergePatch,
} from '../../discovery/discoverySession';
import { CREWS_AVAILABILITY_SHEET_PARAM } from '../crews/crewsOpenSegment';
import type { CrewsAvailabilityGuideFilter, CrewsAvailableOpenLens } from '../crews/crewsOpenSegment';
import type { BrowseListLayout } from './browseListLayout';
import type { BrowseListSortMode } from './listBrowseSort';

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

  const readInput = useMemo(
    () => ({
      pathname: location.pathname,
      searchParams,
      mapOverlay,
    }),
    [location.pathname, mapOverlay, searchParams]
  );

  const session = useMemo(() => readDiscoveryBrowseListSession(readInput), [readInput]);
  const {
    listCat,
    filters,
    venueRegions,
    geoPath,
    layout,
    sort,
    crewsOpenLens,
    crewsAvailabilityGuideFilter,
  } = session;

  const syncUrl = useCallback(
    (
      patch: Partial<BrowseListFilterState> & {
        regions?: string[];
        geoPath?: string[];
        listCat?: BrowseMainCategoryKey | null;
        layout?: BrowseListLayout;
        sort?: BrowseListSortMode;
        crewsOpen?: CrewsAvailableOpenLens | null;
        crewsAvailGuide?: CrewsAvailabilityGuideFilter | null;
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
          mergeDiscoveryBrowseListUrlParams(params, patch as DiscoveryBrowseListUrlMergePatch, {
            pathname: location.pathname,
            mapOverlay,
            session,
            baseSearchParams: searchParams,
          });
        }
      );
    },
    [
      location.pathname,
      location.state,
      mapOverlay,
      navigate,
      searchParams,
      session,
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

  const availabilityParamStrippedRef = useRef(false);
  useEffect(() => {
    if (availabilityParamStrippedRef.current) return;
    if (searchParams.get(CREWS_AVAILABILITY_SHEET_PARAM) !== '1') return;
    availabilityParamStrippedRef.current = true;
    applyProductSearchMutation(
      {
        pathname: location.pathname,
        navigate,
        setSearchParams,
        locationState: location.state,
      },
      (params) => {
        params.delete(CREWS_AVAILABILITY_SHEET_PARAM);
      }
    );
  }, [location.pathname, location.state, navigate, searchParams, setSearchParams]);

  return {
    filters,
    crewsOpenLens,
    crewsAvailabilityGuideFilter,
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