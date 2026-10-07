import type { SocialPersonTripHintDTO } from '@uaetrail/shared-types';

export const EXPLORE_SOCIAL_PANEL_TITLE = 'Social';
export const EXPLORE_SOCIAL_PANEL_SUBCOPY =
  'Friends and people you follow — message or plan something together.';

export const EXPLORE_SOCIAL_MAP_BUTTON_LABEL = EXPLORE_SOCIAL_PANEL_TITLE;

export const exploreSocialMapButtonAriaLabel = (friendCount: number): string =>
  friendCount > 0
    ? `Social. ${friendCount} friends`
    : 'Social. Your friends and people you follow';

export const EXPLORE_SOCIAL_LOADING = 'Loading your people…';
export const EXPLORE_SOCIAL_EMPTY_ALL =
  'No friends or follows yet — connect on outings or follow hosts you like.';
export const EXPLORE_SOCIAL_EMPTY_FRIENDS = 'No friends yet — send a buddy request from a member profile.';
export const EXPLORE_SOCIAL_EMPTY_FOLLOWED =
  'You are not following anyone yet — follow hosts and members from their profile.';
export const EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PEOPLE = 'People';
export const EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PLACES = 'Places';
export const EXPLORE_SOCIAL_FOLLOWED_SEGMENT_EVENTS = 'Outings';
export const EXPLORE_SOCIAL_EMPTY_FOLLOWED_PLACES =
  'No saved places yet — heart a trail or camp on the map to follow it here.';
export const EXPLORE_SOCIAL_EMPTY_FOLLOWED_EVENTS =
  'No saved outings yet — save an activity from its detail page to follow it here.';

export const EXPLORE_SOCIAL_SEARCH_PLACEHOLDER = 'Search people…';
export const EXPLORE_SOCIAL_DISCOVER_SEARCH_PLACEHOLDER = 'Search by name or city…';

export const EXPLORE_SOCIAL_TAB_DISCOVER = 'Discover';

export const EXPLORE_SOCIAL_DISCOVER_ON_TRIPS_TITLE = 'On outings';
export const EXPLORE_SOCIAL_DISCOVER_DIRECTORY_TITLE = 'Public profiles';
export const EXPLORE_SOCIAL_EMPTY_DISCOVER =
  'No one matches right now — try another day on the map filter or check back when more outings are live.';

export const exploreSocialDiscoverQuotaLine = (
  quota: { remaining: number | null; limit: number | null; windowDays: number }
): string => {
  if (quota.remaining === null || quota.limit === null) {
    return 'Unlimited profile discovery';
  }
  return `${quota.remaining} of ${quota.limit} new profile opens left · ${quota.windowDays} days`;
};

export const EXPLORE_SOCIAL_ACTION_MESSAGE = 'Message';
export const EXPLORE_SOCIAL_ACTION_PLAN_TRIP = 'Plan a trip';
export const EXPLORE_SOCIAL_ACTION_ADD_FRIEND = 'Add friend';
export const EXPLORE_SOCIAL_ACTION_VIEW_PROFILE = 'Profile';

export const socialPersonAttendedLine = (count: number): string =>
  count === 1 ? '1 outing attended' : `${count} outings attended`;

export const socialPersonTripHintLine = (trip: SocialPersonTripHintDTO): string => {
  const verb = trip.role === 'hosting' ? 'Hosting' : 'Going on';
  const datePart = trip.date ? formatSocialTripDate(trip.date) : 'soon';
  const title = trip.title.trim() || 'an outing';
  return `${verb} ${title} · ${datePart}`;
};

const formatSocialTripDate = (isoDate: string): string => {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
