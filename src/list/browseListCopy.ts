import { resolveMobileFiveTab } from '../config/mobileFiveTabNav';
import { EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER } from '../content/explorePeopleBrowseCopy';
import { EXPLORE_GUEST_MAP_PREVIEW_NOTICE, EXPLORE_SEARCH_OPEN_PLACEHOLDER } from './discoveryListRuntime';
import { LIST_CAT_PARAM, parseListCatParam } from './browseListUrlState';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import type { ListExplorerBucket } from './explorer/listExplorerBucket';

/** List discovery page strings */
export const BROWSE_LIST_SIGN_IN = 'Sign in';
export const LIST_DISCOVER_LOOKING_PROMPT = 'What are you looking for?';
export const LIST_DISCOVER_RAIL_TRIPS = 'Upcoming';
export const LIST_DISCOVER_RAIL_PLACES = 'Near you';
export const LIST_DISCOVER_RAIL_SHOPS = 'Gear Shops';
export const BROWSE_LIST_SEARCH_PLACEHOLDER = 'Search…';
/** `/list` + explore hub Trips tab */
export const BROWSE_LIST_SEARCH_PLACEHOLDER_TRIPS = 'Search hikes, trips, hosts…';
/** `/list` + explore hub Places tab */
export const BROWSE_LIST_SEARCH_PLACEHOLDER_PLACES = 'Search trails, camps, venues…';
export const BROWSE_LIST_SEARCH_PLACEHOLDER_AGENCIES = 'Search outdoor brands and shops…';

export const resolveBrowseListSearchPlaceholder = (
  listCat: BrowseMainCategoryKey | null | undefined,
  bucket?: ListExplorerBucket
): string => {
  if (listCat === 'people') return EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER;
  if (listCat === 'venues') return BROWSE_LIST_SEARCH_PLACEHOLDER_PLACES;
  if (listCat === 'agencies') return BROWSE_LIST_SEARCH_PLACEHOLDER_AGENCIES;
  if (listCat === 'activities') return BROWSE_LIST_SEARCH_PLACEHOLDER_TRIPS;
  if (bucket === 'places') return BROWSE_LIST_SEARCH_PLACEHOLDER_PLACES;
  if (bucket === 'events') return BROWSE_LIST_SEARCH_PLACEHOLDER_TRIPS;
  return EXPLORE_SEARCH_OPEN_PLACEHOLDER;
};

/** Multi-scope search dropdown — only when the list is not pinned to one main category. */
export const browseListSearchUsesScopeHints = (listCat: BrowseMainCategoryKey | null | undefined): boolean =>
  listCat == null;
export const BROWSE_LIST_MAP_CTA = 'Map';
export const BROWSE_LIST_VIEW_ON_MAP = 'View on map';
export const BROWSE_LIST_FULL_SCREEN_CTA = 'Full screen browse';
export const browseListResultsFoundLabel = (count: number): string =>
  count === 1 ? '1 found' : `${count.toLocaleString()} found`;
export const BROWSE_LIST_SECTION_SOON = 'Happening soon';
export const BROWSE_LIST_SECTION_OTHERS = 'Find a crew';
export const BROWSE_LIST_SECTION_VENUES = 'Places';
export const BROWSE_LIST_SECTION_SHOPS = 'Shops';
export const BROWSE_LIST_EMPTY = 'Nothing matches — try clearing filters or search.';
export const BROWSE_LIST_CLEAR_FILTERS = 'Clear filters';

/** Mobile list create FAB — Plus icon is rendered separately. */
import {
  EXPLORE_CREATE_FAB_ADD_VENUE,
  EXPLORE_CREATE_FAB_FIND_CREW,
  EXPLORE_CREATE_FAB_HOST_TRIP,
} from '../content/exploreCreateFabCopy';

export const BROWSE_LIST_CREATE_TRIP = EXPLORE_CREATE_FAB_HOST_TRIP;
export const BROWSE_LIST_CREATE_VENUE = EXPLORE_CREATE_FAB_ADD_VENUE;
export const BROWSE_LIST_CREATE_CREW = EXPLORE_CREATE_FAB_FIND_CREW;

export const browseListCreateFabLabel = (listCat: 'activities' | 'venues' | 'people' | null): string => {
  if (listCat === 'venues') return BROWSE_LIST_CREATE_VENUE;
  if (listCat === 'people') return BROWSE_LIST_CREATE_CREW;
  return BROWSE_LIST_CREATE_TRIP;
};

export type BrowseListCreateFabHints = {
  isPeopleCategory?: boolean;
  explorerBucket?: ListExplorerBucket;
};

/** Five-tab context + list URL — same labels on `/list` and `/explore`. */
export const resolveBrowseListCreateFabLabel = (
  pathname: string,
  search: string,
  hints?: BrowseListCreateFabHints
): string => {
  if (hints?.isPeopleCategory) return BROWSE_LIST_CREATE_CREW;
  if (hints?.explorerBucket === 'places') return BROWSE_LIST_CREATE_VENUE;

  const tab = resolveMobileFiveTab(pathname, search);
  if (tab === 'venues') return BROWSE_LIST_CREATE_VENUE;
  if (tab === 'crews') return BROWSE_LIST_CREATE_CREW;
  if (tab === 'trips') return BROWSE_LIST_CREATE_TRIP;

  const params = new URLSearchParams(search.replace(/^\?/, ''));
  return browseListCreateFabLabel(parseListCatParam(params.get(LIST_CAT_PARAM)));
};
/** Guest list preview — same copy as the map banner. */
export const LIST_GUEST_CATALOG_PREVIEW_NOTICE = EXPLORE_GUEST_MAP_PREVIEW_NOTICE;
