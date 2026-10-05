/**
 * Explore "Who's going?" panel — user-facing copy only (URL: view=going).
 * Code symbols use goingPanel / buddy / member-discovery — not whosGoing.
 */

export const EXPLORE_GOING_PANEL_TITLE = "Who's going?";
export const EXPLORE_GOING_PANEL_SUBCOPY =
  'See friends on upcoming trips and meet new people to go with.';

export const EXPLORE_GOING_MAP_BUTTON_LABEL = EXPLORE_GOING_PANEL_TITLE;

export const exploreGoingMapButtonAriaLabel = (totalJoining: number): string =>
  totalJoining > 0
    ? `Who's going? ${totalJoining} people joining outings`
    : "Who's going? Find friends and people on upcoming trips";

export const MEMBER_DISCOVERY_ROSTER_LOADING = 'Finding people who are getting outside…';

export const memberDiscoveryQuotaLine = (remaining: number, limit: number): string =>
  `${remaining} of ${limit} profile views left this month`;

export const MEMBER_DISCOVERY_QUOTA_UPGRADE_LINK = 'Go Pro';
export const MEMBER_DISCOVERY_QUOTA_UPGRADE_SUFFIX = 'to keep meeting people through Discover.';

export const MEMBER_DISCOVERY_DIRECTORY_EMPTY =
  'No members to show yet — check back as more people join outings.';

export const MEMBER_DISCOVERY_QUOTA_GATE_TITLE = 'Discovery limit reached';
export const MEMBER_DISCOVERY_QUOTA_GATE_BODY =
  'Free members can open five new profiles from Discover each month. Pro members get unlimited discovery.';
export const MEMBER_DISCOVERY_QUOTA_GATE_CTA = 'See Pro options';

export const EXPLORE_BUDDY_JOIN_ME_INVITE = 'Join me';
export const exploreBuddyJoinMeInviteSent = (name: string): string =>
  `Join invite sent to ${name}.`;

export const EXPLORE_GOING_TAB_TRIPS_EMPTY =
  'No outings with people joining yet — widen the date filter or check back as more plans go live.';

export const MEMBER_DISCOVERY_EMPTY_ALL_TITLE = 'No one new to discover yet';
export const MEMBER_DISCOVERY_EMPTY_ALL_BODY =
  'Try another day on the map, or check back as more members join outings. Your crew is always under Buddies.';

export const MEMBER_DISCOVERY_ON_TRIPS_EMPTY =
  'No strangers on upcoming trips for this map view — browse members below or try another date.';

export const memberDiscoveryQuotaExhaustedNudge = (limit: number): string =>
  `You've opened ${limit} new member profiles this month. Go Pro to keep discovering people to go with.`;

export const MEMBER_DISCOVERY_CONNECT = 'Connect';
export const MEMBER_DISCOVERY_CONNECT_PENDING = 'Pending';
export const memberDiscoveryConnectSent = (name: string): string =>
  `Buddy request sent to ${name}.`;
export const MEMBER_DISCOVERY_CONNECT_ERROR = 'Could not send buddy request.';
