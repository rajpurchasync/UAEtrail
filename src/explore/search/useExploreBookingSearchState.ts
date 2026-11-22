import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { serializeExploreActivityDatePreset } from '../routing';
import { applyProductSearchMutation } from '../../routing/productSearchMutation';
import { parseBrowseListVenueRegions } from '../../list/browse/browseListUrlState';
import {
  EXPLORE_SEARCH_SCOPE_PARAM,
  exploreSearchResultsPath,
  parseExploreSearchBrowseState,
  type ExploreSearchScope,
} from './exploreSearchRouting';
import { useAuth } from '../../context/AuthContext';
import {
  exploreSearchStorageScope,
  readExploreSearchHomeScope,
  writeExploreSearchHomeScope,
  writeExploreSearchLastSearchEntry,
} from './exploreSearchLastSearch';
import { resolveExploreSearchDetectedWhereQuery } from './exploreSearchDetectedWhere';
import { exploreSearchWhereEffectiveQuery } from './exploreSearchWhereDisplay';
import { resolveExploreSearchDefaultVenueRegions } from './exploreSearchVenueState';
import { useExploreRegionPillOptions } from '../../config/useExploreRegionPillOptions';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { LIST_DISCOVERY_PATH } from '../../config/platform';

const SEARCH_MODAL_PATHS = new Set([EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH]);

/** Booking search modal — scope, where/when, commit → `/explore/search`. */
export const useExploreBookingSearchState = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const searchStorageScope = useMemo(
    () => exploreSearchStorageScope(user?.id),
    [user?.id]
  );
  const regionPillOptions = useExploreRegionPillOptions('AE');
  const [searchParams, setSearchParams] = useProductSearchParams();
  const parsed = useMemo(() => parseExploreSearchBrowseState(searchParams), [searchParams]);

  const modalOpen =
    searchParams.get('search') === '1' && SEARCH_MODAL_PATHS.has(pathname);

  const hydrateScopeFromParams = useCallback(
    (parsedScope: ExploreSearchScope): ExploreSearchScope => {
      if (searchParams.get(EXPLORE_SEARCH_SCOPE_PARAM)) return parsedScope;
      if (parsedScope !== 'join') return parsedScope;
      return readExploreSearchHomeScope(searchStorageScope);
    },
    [searchParams, searchStorageScope]
  );

  const [searchScope, setSearchScopeState] = useState<ExploreSearchScope>(() =>
    hydrateScopeFromParams(parsed.searchScope)
  );
  const [draftQuery, setDraftQuery] = useState(() =>
    parsed.query.trim() || resolveExploreSearchDetectedWhereQuery()
  );
  const [activityDatePreset, setActivityDatePreset] = useState<ExploreActivityDatePreset>(
    () => parsed.activityDatePreset
  );
  const [venueRegions, setVenueRegionsState] = useState<string[]>(() =>
    parsed.venueRegions.length > 0 ? parsed.venueRegions : parseBrowseListVenueRegions(searchParams)
  );

  const modalHydratedRef = useRef(false);

  useEffect(() => {
    if (!modalOpen) {
      modalHydratedRef.current = false;
      return;
    }
    if (modalHydratedRef.current) return;
    modalHydratedRef.current = true;

    setSearchScopeState(hydrateScopeFromParams(parsed.searchScope));
    setDraftQuery(parsed.query.trim() || resolveExploreSearchDetectedWhereQuery());
    setActivityDatePreset(parsed.activityDatePreset);
    setVenueRegionsState(
      parsed.venueRegions.length > 0
        ? parsed.venueRegions
        : parseBrowseListVenueRegions(searchParams)
    );
  }, [hydrateScopeFromParams, modalOpen, parsed, searchParams]);

  const detectedWhere = useMemo(() => resolveExploreSearchDetectedWhereQuery(), []);
  const committedWhere = useMemo(
    () => exploreSearchWhereEffectiveQuery('', parsed.query.trim() || detectedWhere),
    [detectedWhere, parsed.query]
  );

  const setSearchScope = useCallback(
    (scope: ExploreSearchScope) => {
      setSearchScopeState(scope);
      writeExploreSearchHomeScope(scope, searchStorageScope);
      if (scope === 'places' && venueRegions.length === 0) {
        const defaultRegions = resolveExploreSearchDefaultVenueRegions(regionPillOptions);
        if (defaultRegions.length > 0) setVenueRegionsState(defaultRegions);
      }
    },
    [regionPillOptions, searchStorageScope, venueRegions.length]
  );

  const setVenueRegions = useCallback((regions: string[]) => {
    setVenueRegionsState(regions);
  }, []);

  const setActivityDatePresetOnUrl = useCallback(
    (preset: ExploreActivityDatePreset) => {
      setActivityDatePreset(preset);
      if (!SEARCH_MODAL_PATHS.has(pathname)) return;
      applyProductSearchMutation(
        { pathname, navigate, setSearchParams },
        (params) => {
          const serialized = serializeExploreActivityDatePreset(preset);
          if (serialized) params.set('date', serialized);
          else params.delete('date');
        }
      );
    },
    [navigate, pathname, setSearchParams]
  );

  const commitSearch = useCallback(
    (scopeOverride?: ExploreSearchScope) => {
      const scope = scopeOverride ?? searchScope;
      if (scopeOverride && scopeOverride !== searchScope) {
        setSearchScopeState(scopeOverride);
        writeExploreSearchHomeScope(scopeOverride, searchStorageScope);
      }
      const query = exploreSearchWhereEffectiveQuery(draftQuery, parsed.query.trim() || detectedWhere);
      writeExploreSearchLastSearchEntry(
        {
          query,
          activityDatePreset,
          searchScope: scope,
          venueRegions,
        },
        searchStorageScope
      );
      navigate(
        exploreSearchResultsPath({
          query,
          activityDatePreset,
          searchScope: scope,
          venueRegions,
          view: 'list',
        })
      );
    },
    [
      activityDatePreset,
      detectedWhere,
      draftQuery,
      navigate,
      parsed.query,
      searchScope,
      searchStorageScope,
      venueRegions,
    ]
  );

  return {
    searchScope,
    setSearchScope,
    draftQuery,
    setDraftQuery,
    detectedWhere,
    committedWhere,
    activityDatePreset,
    setActivityDatePreset: setActivityDatePresetOnUrl,
    venueRegions,
    setVenueRegions,
    commitSearch,
  };
};