import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { parseExploreActivityDatePreset, serializeExploreActivityDatePreset } from '../routing';
import { parseExplorePriceFilter, type ExplorePriceFilter } from '../exploreOptionalFilters';
import type { BrowseMainCategoryKey } from '../../discovery/discoverySession';
import {
  LIST_CAT_PARAM,
  parseBrowseListFilterState,
  parseBrowseListGeoPath,
  parseBrowseListVenueRegions,
  scopeBrowseListStateForListCat,
  serializeBrowseListSearchParams,
} from '../../discovery/discoverySession';
import { parseExplorePanel } from '../routing';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { LIST_DISCOVERY_PATH } from '../../config/platform';

/** Search results route — list + map under one product chrome bar. */
export const EXPLORE_SEARCH_RESULTS_PATH = '/explore/search';

export const EXPLORE_SEARCH_SCOPE_PARAM = 'searchScope';
export const EXPLORE_SEARCH_VIEW_PARAM = 'view';
/**
 * Search home flag on `/explore/search` — not {@link COMPOSE_QUERY_KEY} (`?compose=menu` opens create FAB).
 */
export const EXPLORE_SEARCH_COMPOSE_PARAM = 'searchHome';

export type ExploreSearchView = 'list' | 'map';

export type ExploreSearchScope = 'join' | 'places' | 'crew' | 'groups';

const SEARCH_SCOPES = new Set<ExploreSearchScope>(['join', 'places', 'crew', 'groups']);

export const parseExploreSearchScope = (raw: string | null): ExploreSearchScope => {
  if (raw === 'deals') return 'join';
  if (raw && SEARCH_SCOPES.has(raw as ExploreSearchScope)) return raw as ExploreSearchScope;
  return 'join';
};

export const parseExploreSearchScopeFromParams = (params: URLSearchParams): ExploreSearchScope =>
  parseExploreSearchScope(params.get(EXPLORE_SEARCH_SCOPE_PARAM));

export const exploreSearchListCatForScope = (scope: ExploreSearchScope): BrowseMainCategoryKey => {
  switch (scope) {
    case 'places':
      return 'venues';
    case 'crew':
      return 'people';
    case 'groups':
      return 'activities';
    case 'join':
    default:
      return 'activities';
  }
};

export const exploreSearchScopeForListCat = (listCat: BrowseMainCategoryKey | null): ExploreSearchScope => {
  if (listCat === 'venues') return 'places';
  if (listCat === 'people') return 'crew';
  return 'join';
};

export const exploreSearchScopeIsGroups = (scope: ExploreSearchScope): boolean => scope === 'groups';

export type ExploreSearchBrowseState = {
  searchScope: ExploreSearchScope;
  query: string;
  activityDatePreset: ExploreActivityDatePreset;
  price: ExplorePriceFilter;
  venueRegions: string[];
  view: ExploreSearchView;
};

export const defaultExploreSearchBrowseState = (): ExploreSearchBrowseState => ({
  searchScope: 'join',
  query: '',
  activityDatePreset: 'week',
  price: 'all',
  venueRegions: [],
  view: 'list',
});

const parseSearchActivityDatePreset = (params: URLSearchParams): ExploreActivityDatePreset => {
  const raw = params.get('date');
  if (raw == null || raw.trim() === '') return 'week';
  return parseExploreActivityDatePreset(raw);
};

const parseSearchView = (params: URLSearchParams): ExploreSearchView =>
  params.get(EXPLORE_SEARCH_VIEW_PARAM) === 'map' ? 'map' : 'list';

export const parseExploreSearchBrowseState = (params: URLSearchParams): ExploreSearchBrowseState => ({
  searchScope: parseExploreSearchScopeFromParams(params),
  query: params.get('q')?.trim() ?? '',
  activityDatePreset: parseSearchActivityDatePreset(params),
  price: parseExplorePriceFilter(params.get('price')),
  venueRegions: parseBrowseListVenueRegions(params),
  view: parseSearchView(params),
});

export type ExploreSearchPathOptions = Partial<ExploreSearchBrowseState>;

const normalizeSearchPathState = (options?: ExploreSearchPathOptions): ExploreSearchBrowseState => {
  const merged = { ...defaultExploreSearchBrowseState(), ...options };
  return {
    ...merged,
    venueRegions: merged.venueRegions ?? [],
  };
};

const appendSearchBrowseParams = (params: URLSearchParams, state: ExploreSearchBrowseState) => {
  params.delete(EXPLORE_SEARCH_COMPOSE_PARAM);
  params.delete('compose');
  if (state.searchScope !== 'join') {
    params.set(EXPLORE_SEARCH_SCOPE_PARAM, state.searchScope);
  } else {
    params.delete(EXPLORE_SEARCH_SCOPE_PARAM);
  }
  params.set(LIST_CAT_PARAM, exploreSearchListCatForScope(state.searchScope));
  if (state.query.trim()) {
    params.set('q', state.query.trim());
  } else {
    params.delete('q');
  }
  const serializedDate = serializeExploreActivityDatePreset(state.activityDatePreset);
  if (serializedDate) params.set('date', serializedDate);
  else params.delete('date');
  const regions = state.venueRegions ?? [];
  if (regions.length > 0) params.set('regions', regions.join(','));
  else params.delete('regions');
  if (state.view === 'map') params.set(EXPLORE_SEARCH_VIEW_PARAM, 'map');
  else params.delete(EXPLORE_SEARCH_VIEW_PARAM);
};

/** Search home — scope tabs + where/when before committing `q`. */
export const isExploreSearchHomeState = (pathname: string, params: URLSearchParams): boolean => {
  if (pathname !== EXPLORE_SEARCH_RESULTS_PATH) return false;
  if (params.get(EXPLORE_SEARCH_VIEW_PARAM) === 'map') return false;
  if (params.get(EXPLORE_SEARCH_COMPOSE_PARAM) === '1') return true;
  return !params.has('q');
};

const appendSearchHomeBrowseParams = (params: URLSearchParams, state: ExploreSearchBrowseState) => {
  params.set(EXPLORE_SEARCH_COMPOSE_PARAM, '1');
  params.delete('compose');
  params.delete(EXPLORE_SEARCH_VIEW_PARAM);
  if (state.searchScope !== 'join') {
    params.set(EXPLORE_SEARCH_SCOPE_PARAM, state.searchScope);
  } else {
    params.delete(EXPLORE_SEARCH_SCOPE_PARAM);
  }
  if (state.query.trim()) {
    params.set('q', state.query.trim());
  } else {
    params.delete('q');
  }
  const serializedDate = serializeExploreActivityDatePreset(state.activityDatePreset);
  if (serializedDate) params.set('date', serializedDate);
  else params.delete('date');
  const regions = state.venueRegions ?? [];
  if (regions.length > 0) params.set('regions', regions.join(','));
  else params.delete('regions');
  params.delete(LIST_CAT_PARAM);
};

export const exploreSearchHomePath = (options?: ExploreSearchPathOptions): string => {
  const state = normalizeSearchPathState(options);
  const params = new URLSearchParams();
  appendSearchHomeBrowseParams(params, state);
  const qs = params.toString();
  return qs ? `${EXPLORE_SEARCH_RESULTS_PATH}?${qs}` : EXPLORE_SEARCH_RESULTS_PATH;
};

/** Search results — list default; `view: 'map'` for map stage under same chrome. */
export const exploreSearchResultsPath = (options?: ExploreSearchPathOptions): string => {
  const state = normalizeSearchPathState(options);
  const params = new URLSearchParams();
  appendSearchBrowseParams(params, state);
  const qs = params.toString();
  return qs ? `${EXPLORE_SEARCH_RESULTS_PATH}?${qs}` : EXPLORE_SEARCH_RESULTS_PATH;
};

/** Edit search — full-page compose with current filters prefilled. */
export const exploreSearchModalEntryPath = (
  options?: Pick<ExploreSearchPathOptions, 'query' | 'activityDatePreset' | 'venueRegions' | 'searchScope'>
): string => exploreSearchHomePath(options);

/** Map handoff from search results list URL. */
export const exploreSearchMapViewPathFromListSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  params.set(EXPLORE_SEARCH_VIEW_PARAM, 'map');
  const qs = params.toString();
  return qs ? `${EXPLORE_SEARCH_RESULTS_PATH}?${qs}` : `${EXPLORE_SEARCH_RESULTS_PATH}?view=map`;
};

/** Full explore map with search filters (pins on main map). */
export const exploreSearchExploreMapPath = (options?: ExploreSearchPathOptions): string => {
  const state = normalizeSearchPathState(options);
  const params = new URLSearchParams();
  if (state.searchScope === 'places') {
    params.set('panel', 'venues');
    params.set('pinKind', 'places');
  } else if (state.searchScope === 'crew') {
    params.set('panel', 'activities');
    params.set('pinKind', 'activities');
    params.set('view', 'people');
  } else {
    params.set('panel', 'activities');
    params.set('pinKind', 'activities');
  }
  if (state.query.trim()) params.set('q', state.query.trim());
  const serializedDate = serializeExploreActivityDatePreset(state.activityDatePreset);
  if (serializedDate) params.set('date', serializedDate);
  if (state.venueRegions.length > 0) params.set('regions', state.venueRegions.join(','));
  const qs = params.toString();
  return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
};

export const exploreSearchListPathFromMapSearch = (search: string): string => {
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  const scope = parseExploreSearchScopeFromParams(params);
  if (params.get('view') === 'people') {
    return exploreSearchResultsPath({ searchScope: 'crew', view: 'list' });
  }
  const panel = parseExplorePanel(params.get('panel'));
  const derivedScope: ExploreSearchScope =
    panel === 'venues' || panel === 'shops' ? 'places' : scope;
  const browse = parseExploreSearchBrowseState(params);
  const listCat = exploreSearchListCatForScope(derivedScope);
  let state = parseBrowseListFilterState(params);
  state = {
    ...scopeBrowseListStateForListCat(state, listCat),
    query: browse.query || state.query,
    activityDatePreset: browse.activityDatePreset,
  };
  const regions = parseBrowseListVenueRegions(params);
  const geoPath = parseBrowseListGeoPath(params);
  const listParams = serializeBrowseListSearchParams(state, regions, geoPath);
  listParams.set(LIST_CAT_PARAM, listCat);
  if (derivedScope !== 'join') listParams.set(EXPLORE_SEARCH_SCOPE_PARAM, derivedScope);
  listParams.delete(EXPLORE_SEARCH_VIEW_PARAM);
  const qs = listParams.toString();
  return qs ? `${EXPLORE_SEARCH_RESULTS_PATH}?${qs}` : EXPLORE_SEARCH_RESULTS_PATH;
};

export const exploreSearchJoinListFilters = (
  state: ExploreSearchBrowseState
): Omit<import('../../list/browse/browseListFilters').BrowseListFilterState, 'categories'> => ({
  query: state.query,
  tripTopics: [],
  tripAvailabilityOnly: false,
  placeTopics: [],
  price: 'all',
  when: 'any',
  activityDatePreset: state.activityDatePreset,
  crewBrowseLane: 'people',
  crewPeopleFacet: 'available',
  crewPeopleSurface: 'find',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
});

/** Search results use standard product chrome (not hub identity header). */
export const isExploreSearchResultsPath = (pathname: string): boolean =>
  pathname === EXPLORE_SEARCH_RESULTS_PATH;