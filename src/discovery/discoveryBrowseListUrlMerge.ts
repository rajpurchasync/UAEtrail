/**
 * B-UNIFY-02 — merge list browse filter patches into URLSearchParams (explore overlay + list routes).
 */
import { stripRetiredPeopleListTabParams } from '../routing/productUrlInbound';
import type { BrowseListFilterState } from '../list/browse/browseListFilters';
import type { BrowseMainCategoryKey } from '../list/browse/browseListTaxonomy';
import { scopeBrowseListStateForListCat } from '../list/browse/browseListMapHandoff';
import {
  LIST_LAYOUT_PARAM,
  serializeBrowseListLayout,
  type BrowseListLayout,
} from '../list/browse/browseListLayout';
import {
  LIST_SORT_PARAM,
  serializeBrowseListSort,
  type BrowseListSortMode,
} from '../list/browse/listBrowseSort';
import {
  CREWS_AVAIL_GUIDE_PARAM,
  CREWS_OPEN_URL_PARAM,
  serializeCrewsAvailabilityGuideFilter,
  serializeCrewsAvailableOpenLens,
  type CrewsAvailabilityGuideFilter,
  type CrewsAvailableOpenLens,
} from '../list/crews/crewsOpenSegment';
import {
  BROWSE_DISCOVER_PARAM,
  LIST_CAT_PARAM,
  serializeBrowseListSearchParams,
} from './discoverySession';
import {
  EXPLORE_SEARCH_RESULTS_PATH,
  EXPLORE_SEARCH_SCOPE_PARAM,
  EXPLORE_SEARCH_VIEW_PARAM,
  exploreSearchScopeForListCat,
} from './discoveryPortExploreSearchRouting';
import {
  restoreExploreOverlayParams,
  snapshotExploreOverlayParams,
  stripDiscoveryListBrowseFilterParams,
} from './discoveryBrowseSessionParams';
import type { DiscoveryBrowseListSessionSnapshot } from './discoveryBrowseListSessionRead';

export type DiscoveryBrowseListUrlMergePatch = Partial<BrowseListFilterState> & {
  regions?: string[];
  geoPath?: string[];
  listCat?: BrowseMainCategoryKey | null;
  layout?: BrowseListLayout;
  sort?: BrowseListSortMode;
  crewsOpen?: CrewsAvailableOpenLens | null;
  crewsAvailGuide?: CrewsAvailabilityGuideFilter | null;
};

export type DiscoveryBrowseListUrlMergeContext = {
  pathname: string;
  mapOverlay: boolean;
  session: DiscoveryBrowseListSessionSnapshot;
  baseSearchParams: URLSearchParams;
};

export const mergeDiscoveryBrowseListUrlParams = (
  params: URLSearchParams,
  patch: DiscoveryBrowseListUrlMergePatch,
  ctx: DiscoveryBrowseListUrlMergeContext
): void => {
  const { session, mapOverlay, pathname, baseSearchParams } = ctx;
  const preserved = mapOverlay ? snapshotExploreOverlayParams(baseSearchParams) : new Map<string, string>();

  const patchedListCat = patch.listCat !== undefined ? patch.listCat : session.listCat;

  let next: BrowseListFilterState = {
    ...session.filters,
    ...patch,
  };
  let regions = patch.regions ?? session.venueRegions;
  const nextGeo = patch.geoPath ?? session.geoPath;
  if (!mapOverlay && (patchedListCat === 'activities' || patchedListCat === 'venues')) {
    next = scopeBrowseListStateForListCat(next, patchedListCat);
  }

  const listParams = serializeBrowseListSearchParams(next, regions, nextGeo);
  const nextLayout = patch.layout ?? session.layout;
  const layoutParam = serializeBrowseListLayout(nextLayout);
  if (layoutParam) listParams.set(LIST_LAYOUT_PARAM, layoutParam);

  const nextSort = patch.sort ?? session.sort;
  const sortParam = serializeBrowseListSort(nextSort);
  if (sortParam) listParams.set(LIST_SORT_PARAM, sortParam);
  else listParams.delete(LIST_SORT_PARAM);

  stripDiscoveryListBrowseFilterParams(params);
  listParams.forEach((value, key) => {
    params.set(key, value);
  });

  if (patch.crewsOpen !== undefined) {
    const serializedOpen = patch.crewsOpen ? serializeCrewsAvailableOpenLens(patch.crewsOpen) : null;
    if (serializedOpen) params.set(CREWS_OPEN_URL_PARAM, serializedOpen);
    else params.delete(CREWS_OPEN_URL_PARAM);
  }
  if (patch.crewsAvailGuide !== undefined) {
    const serializedGuide = patch.crewsAvailGuide
      ? serializeCrewsAvailabilityGuideFilter(patch.crewsAvailGuide)
      : null;
    if (serializedGuide) params.set(CREWS_AVAIL_GUIDE_PARAM, serializedGuide);
    else params.delete(CREWS_AVAIL_GUIDE_PARAM);
  }

  if (mapOverlay) {
    restoreExploreOverlayParams(params, preserved);
  }

  if (patch.listCat === null) {
    params.delete(LIST_CAT_PARAM);
  } else if (patch.listCat) {
    params.set(LIST_CAT_PARAM, patch.listCat);
  } else if (patchedListCat && patchedListCat !== 'activities') {
    params.set(LIST_CAT_PARAM, patchedListCat);
  } else if (!mapOverlay) {
    params.set(LIST_CAT_PARAM, 'activities');
  } else if (session.listCat) {
    params.set(LIST_CAT_PARAM, session.listCat);
  }

  if (mapOverlay) {
    params.set('list', '1');
    params.delete(BROWSE_DISCOVER_PARAM);
  }

  if (pathname === EXPLORE_SEARCH_RESULTS_PATH) {
    const scope = exploreSearchScopeForListCat(patchedListCat);
    if (scope === 'join') params.delete(EXPLORE_SEARCH_SCOPE_PARAM);
    else params.set(EXPLORE_SEARCH_SCOPE_PARAM, scope);
    const resultsView = baseSearchParams.get(EXPLORE_SEARCH_VIEW_PARAM);
    if (resultsView === 'map') params.set(EXPLORE_SEARCH_VIEW_PARAM, 'map');
    else params.delete(EXPLORE_SEARCH_VIEW_PARAM);
  }

  stripRetiredPeopleListTabParams(params);
};