import type { SocialPersonTripHintDTO } from '@uaetrail/shared-types';

export const EXPLORE_PEOPLE_BROWSE_PANEL_TITLE = 'People';
export const EXPLORE_PEOPLE_BROWSE_PANEL_SUBCOPY =
  'Who’s going, who you follow, and who’s looking for a crew — find your next outing together.';

export const EXPLORE_PEOPLE_BROWSE_MAP_BUTTON_LABEL = EXPLORE_PEOPLE_BROWSE_PANEL_TITLE;

export const explorePeopleBrowseMapButtonAriaLabel = (friendCount: number): string =>
  friendCount > 0
    ? `People. ${friendCount} friends`
    : 'People. See who’s going and your crew';

export const EXPLORE_PEOPLE_BROWSE_LOADING = 'Loading your people…';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_ALL =
  'No friends or follows yet — connect on outings or follow hosts you like.';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_FRIENDS =
  'No friends yet — send a buddy request from a member profile.';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED =
  'You are not following anyone yet — follow hosts and members from their profile.';
export const EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_PEOPLE = 'People';
export const EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_PLACES = 'Places';
export const EXPLORE_PEOPLE_BROWSE_FOLLOWED_SEGMENT_EVENTS = 'Hosts & shops';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED_PLACES =
  'No followed places yet — follow a trail or camp on the map for outing alerts.';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED_HOSTS =
  'No followed hosts or shops yet — follow from their profile or a shop on the map.';

export const EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER = 'Search people…';
export const EXPLORE_PEOPLE_BROWSE_DISCOVER_SEARCH_PLACEHOLDER = 'Search by name or city…';

export const EXPLORE_PEOPLE_BROWSE_TAB_DISCOVER = 'Discover';

export const EXPLORE_SEARCH_SCOPE_BUDDIES_LABEL = 'Buddies';
export const EXPLORE_SEARCH_SCOPE_BUDDIES_DESCRIPTION =
  'Find members on outings and public profiles — connect with hosts and hikers (Pro unlocks more)';

export const EXPLORE_PEOPLE_BROWSE_DISCOVER_ON_TRIPS_TITLE = 'On outings';
export const EXPLORE_PEOPLE_BROWSE_DISCOVER_FRIENDS_GOING_TITLE = 'Friends';
export const EXPLORE_PEOPLE_BROWSE_DISCOVER_HOSTS_GOING_TITLE = 'Hosts';
export const EXPLORE_PEOPLE_BROWSE_DISCOVER_LOOKING_TITLE = 'Looking for company';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER_LOOKING =
  'No one is posting “looking for” right now — try another date or check back later.';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER_FOLLOWED =
  'You are not following anyone yet — follow hosts and members from their profile.';
export const BUDDIES_DISCOVERY_INTRO =
  'Find members on live outings or browse public profiles — add friends, message, or plan something together.';

export const EXPLORE_PEOPLE_BROWSE_DISCOVER_DIRECTORY_TITLE = 'Public profiles';
export const EXPLORE_PEOPLE_BROWSE_EMPTY_DISCOVER =
  'No one matches right now — try another day on the map filter or check back when more outings are live.';

export const explorePeopleBrowseDiscoverQuotaLine = (
  quota: { remaining: number | null; limit: number | null; windowDays: number }
): string => {
  if (quota.remaining === null || quota.limit === null) {
    return 'Unlimited profile discovery';
  }
  return `${quota.remaining} of ${quota.limit} new profile opens left · ${quota.windowDays} days`;
};

export const EXPLORE_PEOPLE_BROWSE_ACTION_MESSAGE = 'Message';
export const EXPLORE_PEOPLE_BROWSE_ACTION_PLAN_TRIP = 'Plan a trip';
export const EXPLORE_PEOPLE_BROWSE_ACTION_ADD_FRIEND = 'Add friend';
export const EXPLORE_PEOPLE_BROWSE_ACTION_VIEW_PROFILE = 'Profile';

export const memberPersonAttendedLine = (count: number): string =>
  count === 1 ? '1 outing attended' : `${count} outings attended`;

export const memberPersonTripHintLine = (trip: SocialPersonTripHintDTO): string => {
  const verb = trip.role === 'hosting' ? 'Hosting' : 'Going on';
  const datePart = trip.date ? formatMemberTripDate(trip.date) : 'soon';
  const title = trip.title.trim() || 'an outing';
  return `${verb} ${title} · ${datePart}`;
};

const formatMemberTripDate = (isoDate: string): string => {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
