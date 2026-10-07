/** List discovery page strings */
export const BROWSE_LIST_SIGN_IN = 'Sign in';
export const LIST_DISCOVER_LOOKING_PROMPT = 'What are you looking for?';
export const LIST_DISCOVER_RAIL_TRIPS = 'Upcoming';
export const LIST_DISCOVER_RAIL_PLACES = 'Near you';
export const LIST_DISCOVER_RAIL_SHOPS = 'Gear Shops';
export const BROWSE_LIST_SEARCH_PLACEHOLDER = 'Search…';
export const BROWSE_LIST_MAP_CTA = 'Map';
export const browseListResultsFoundLabel = (count: number): string =>
  count === 1 ? '1 found' : `${count.toLocaleString()} found`;
export const BROWSE_LIST_SECTION_SOON = 'Happening soon';
export const BROWSE_LIST_SECTION_OTHERS = 'Find a crew';
export const BROWSE_LIST_SECTION_VENUES = 'Venues';
export const BROWSE_LIST_SECTION_SHOPS = 'Shops';
export const BROWSE_LIST_EMPTY = 'Nothing matches — try clearing filters or search.';
export const BROWSE_LIST_CLEAR_FILTERS = 'Clear filters';
