/** Consumer explore landing — where/when search (booking-style). */
export const EXPLORE_SEARCH_WHERE_LABEL = 'Where';
export const EXPLORE_SEARCH_WHERE_PLACEHOLDER = 'Where to?';
export const EXPLORE_SEARCH_WHEN_LABEL = 'When';
export const EXPLORE_SEARCH_STATE_LABEL = 'State';
export const EXPLORE_SEARCH_CTA = 'Search';
export const EXPLORE_SEARCH_HOME_TITLE = 'Search';
export const EXPLORE_SEARCH_RESULTS_TITLE = 'Search results';
export const EXPLORE_SEARCH_RECOMMENDED_TITLE = 'Recommended for you';
export const EXPLORE_SEARCH_MATCHES_TITLE = 'Matches';
export const EXPLORE_SEARCH_MATCHES_EMPTY = 'No matches yet — tap Search for the full list.';
export const EXPLORE_SEARCH_RECOMMENDED_EMPTY = 'Nothing to show yet — try Search or another tab.';
export const EXPLORE_SEARCH_EDIT = 'Edit search';
export const EXPLORE_SEARCH_VIEW_MAP = 'View on map';
export const EXPLORE_SEARCH_VIEW_LIST = 'View as list';
export const EXPLORE_SEARCH_RESULTS_COUNT = (count: number): string =>
  count === 1 ? '1 result' : `${count} results`;

export const EXPLORE_SEARCH_RESULT_SCOPES = [
  { mode: 'join' as const, label: 'Trips' },
  { mode: 'places' as const, label: 'Places' },
  { mode: 'crew' as const, label: 'Crews' },
  { mode: 'groups' as const, label: 'Groups' },
] as const;

export const EXPLORE_SEARCH_SECTION_TRIPS = 'Trips';
export const EXPLORE_SEARCH_SECTION_SPOTS = 'Places';
export const EXPLORE_SEARCH_SECTION_CREW = 'Crews';
export const EXPLORE_SEARCH_SECTION_GROUPS = 'Groups';

/** Compose-home inline match preview (before Search CTA). */
export const EXPLORE_SEARCH_COMPOSE_MATCH_LIMIT = 8;

export const EXPLORE_SEARCH_RECENT_TITLE = 'Latest searches';
export const EXPLORE_SEARCH_MAP_MATCHES_TITLE = 'Matches on the map';
export const EXPLORE_RECENT_SEARCHES_MAX = 3;