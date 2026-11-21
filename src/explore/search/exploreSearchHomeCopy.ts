/** Consumer explore landing — where/when search (booking-style). */
export const EXPLORE_SEARCH_WHERE_LABEL = 'Where';
export const EXPLORE_SEARCH_WHERE_PLACEHOLDER = 'Where to?';
export const EXPLORE_SEARCH_WHEN_LABEL = 'When';
export const EXPLORE_SEARCH_STATE_LABEL = 'State';
export const EXPLORE_SEARCH_CTA = 'Search';
export const EXPLORE_SEARCH_RESULTS_TITLE = 'Search results';
export const EXPLORE_SEARCH_EDIT = 'Edit search';
export const EXPLORE_SEARCH_VIEW_MAP = 'View on map';
export const EXPLORE_SEARCH_VIEW_LIST = 'View as list';
export const EXPLORE_SEARCH_RESULTS_COUNT = (count: number): string =>
  count === 1 ? '1 result' : `${count} results`;

export const EXPLORE_SEARCH_RESULT_SCOPES = [
  { mode: 'join' as const, label: 'Trips' },
  { mode: 'places' as const, label: 'Places' },
  { mode: 'crew' as const, label: 'Crews' },
] as const;

export const EXPLORE_SEARCH_SECTION_TRIPS = 'Trips';
export const EXPLORE_SEARCH_SECTION_SPOTS = 'Places';
export const EXPLORE_SEARCH_SECTION_CREW = 'Crews';

export const EXPLORE_SEARCH_RECENT_TITLE = 'Latest searches';
export const EXPLORE_SEARCH_MAP_MATCHES_TITLE = 'Matches on the map';
export const EXPLORE_RECENT_SEARCHES_MAX = 3;