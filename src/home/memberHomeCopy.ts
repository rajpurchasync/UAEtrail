/** Home hub copy — intent + navigation. Not guest marketing at `/`. */

export const MEMBER_HOME_SEARCH_PLACEHOLDER = 'Search trips, places, crews, guides…';
export const MEMBER_HOME_SUBCOPY = 'What would you like to do today?';
export const MEMBER_HOME_CHOOSE_AREA = 'Choose area';
export const MEMBER_HOME_LOCATION_TITLE = 'Your area';
export const MEMBER_HOME_LOCATION_HINT =
  'We use your city or neighbourhood for weather and suggestions — same as when you host a plan.';
export const MEMBER_HOME_SEARCH_AREA_PLACEHOLDER = 'Search city or area';
export const MEMBER_HOME_LOCATION_DENIED = 'Could not read your location. Try again or search for your area.';
export const MEMBER_HOME_LOCATION_DENIED_PERMISSION =
  'Location is blocked for this site. On desktop: click the lock icon beside the address bar → Location → Allow, then reload and tap Use my location again.';
export const MEMBER_HOME_LOCATION_DENIED_TIMEOUT =
  'Location timed out. Try again, or search for your city or neighbourhood.';
export const MEMBER_HOME_LOCATION_UNSUPPORTED =
  'This browser cannot use device location. Search for your area instead.';
export const MEMBER_HOME_LOCATION_FINDING = 'Finding your area…';
export const MEMBER_HOME_NEAR_YOU = 'Near you';

export const MEMBER_HOME_CREATE_TRIP_TITLE = 'Plan a Trip';
export const MEMBER_HOME_CREATE_TRIP_SUB = 'Host a hike, camp & invite';
export const MEMBER_HOME_FIND_PLACES_TITLE = 'Find Places to Go';
export const MEMBER_HOME_FIND_PLACES_SUB = 'Trails & spots near you';
export const MEMBER_HOME_FIND_COMPANY_TITLE = 'Find Crews';
export const MEMBER_HOME_FIND_COMPANY_SUB = 'People and groups to go with';
export const MEMBER_HOME_HIRE_PROS_TITLE = 'Hire Professionals';
export const MEMBER_HOME_HIRE_PROS_SUB = 'Request private tours';
export const MEMBER_HOME_PROS_BADGE = 'PROS';

export const MEMBER_HOME_NEARBY_TITLE = 'Explore Nearby';
export const MEMBER_HOME_NEARBY_SUB = 'Trails, campsites & summits';
export const MEMBER_HOME_VIEW_MAP = 'View Map';

export const MEMBER_HOME_SUGGESTED_TITLE = 'Suggested near you';
export const MEMBER_HOME_SEE_ALL = 'SEE ALL';
export const MEMBER_HOME_TAB_TRIPS = 'Trips';
export const MEMBER_HOME_TAB_COMMUNITY = 'Community';
export const MEMBER_HOME_TAB_DEALS = 'Deals';
export const MEMBER_HOME_JOIN_TRIP = 'Join Trip';
export const MEMBER_HOME_REQUEST_TO_JOIN = 'Request to join';
export const MEMBER_HOME_HOST_PREFIX = 'Host:';
export const MEMBER_HOME_CARPOOL_OPEN = 'Carpool open';
export const MEMBER_HOME_COMMUNITY_EMPTY = 'No communities to join yet.';
export const MEMBER_HOME_TRIPS_EMPTY = 'No planned trips nearby yet — browse the map for more.';
export const MEMBER_HOME_DEALS_EMPTY = 'No deals near you yet — browse shops and outings on the map.';
export const MEMBER_HOME_PROS_EMPTY = 'No guides listed yet — find company instead.';

export const memberHomeGreeting = (hour: number, firstName: string | null): string => {
  const name = firstName?.trim() || null;
  const hello =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  return name ? `${hello}, ${name}` : hello;
};

export const memberHomeFirstName = (displayName: string | null | undefined): string | null => {
  const first = displayName?.trim().split(/\s+/)[0];
  return first || null;
};

export const memberHomeKindChip = (kind: string | null | undefined): string | null => {
  const key = kind?.trim().toLowerCase();
  if (!key) return null;
  if (key === 'hiking') return 'Day hike';
  if (key === 'camping') return 'Camping';
  if (key === 'rideshare') return 'Rideshare';
  if (key === 'running' || key === 'trail_run') return 'Trail run';
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
