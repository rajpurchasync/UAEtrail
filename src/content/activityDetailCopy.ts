import { SITE_TITLE_BRAND } from '../config/seo';

/** Consumer activity detail — tab labels only (not API / domain names). */
export const ACTIVITY_DETAIL_TAB_PLAN = 'Plan';
export const ACTIVITY_DETAIL_TAB_PLACE = 'Place';
/** Outing roster + crew chat tab (`?tab=crew`; legacy `?tab=buddies` parses). */
export const ACTIVITY_DETAIL_TAB_CREW = 'Crew';
/** @deprecated Use {@link ACTIVITY_DETAIL_TAB_CREW}. */
export const ACTIVITY_DETAIL_TAB_BUDDIES = ACTIVITY_DETAIL_TAB_CREW;
export const ACTIVITY_DETAIL_TAB_TRANSPORT = 'Transport';

export const ACTIVITY_DETAIL_CREW_LOCKED_HINT =
  'Join this outing to see who’s going and open the group chat.';

export const ACTIVITY_DETAIL_JOIN_REQUIRED_PLAN_HINT =
  'RSVP or request a spot to unlock meeting details and the group chat.';

/** Linked venue catalog row under the outing title (trail / camp / place). */
export const ACTIVITY_DETAIL_LINKED_VENUE_SUBLINE =
  'View venue guide & other scheduled outings at this location';

export const ACTIVITY_DETAIL_THIS_OUTING_LABEL = 'This scheduled outing';
export const ACTIVITY_DETAIL_LINKED_OUTING_LABEL = 'Linked outing';
export const ACTIVITY_DETAIL_LINKED_RIDESHARE_LABEL = 'Shared ride for this outing';

/** Consumer jump nav + scroll anchor for linked rideshare / plan linkage block. */
export const ACTIVITY_DETAIL_LINKED_RIDES_SECTION_ID = 'activity-detail-linked-rides';
export const ACTIVITY_DETAIL_LINKED_RIDES_JUMP_LABEL = 'Rides';

export const activityDetailLinkedVenueKindLabel = (
  placeKind: 'hiking' | 'camping' | 'event' | string | null | undefined
): string => {
  if (placeKind === 'camping') return 'Camp';
  if (placeKind === 'hiking') return 'Trail';
  if (placeKind === 'event') return 'Venue';
  return 'Place';
};

export const activityDetailLinkedVenueEyebrow = (
  placeKind: 'hiking' | 'camping' | 'event' | string | null | undefined
): string => `${activityDetailLinkedVenueKindLabel(placeKind)} on ${SITE_TITLE_BRAND}`;

export const ACTIVITY_DETAIL_TRANSPORT_EMPTY_HINT =
  'No shared ride or transport listing for this outing yet.';

export const ACTIVITY_DETAIL_TRANSPORT_PRO_HOST_HINT =
  'Pro members can link a carpool listing to this outing.';

export const ACTIVITY_DETAIL_TRANSPORT_PRO_PARTICIPANT_HINT =
  'Pro members can offer a shared ride for this outing.';

export const ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT =
  'Pro members can view host profiles and message before joining.';

export const ACTIVITY_DETAIL_PRO_ROSTER_HINT =
  'Pro members see everyone going — you’re viewing the full crew on this outing.';

export const ACTIVITY_DETAIL_PRO_SOCIAL_CTA = 'See Pro options';

export const ACTIVITY_DETAIL_JOIN_WELCOME_TITLE = "You're in";
export const ACTIVITY_DETAIL_GROUP_CHAT_ACTION = 'Group chat';
export const ACTIVITY_DETAIL_MEETING_PLACE_ACTION = 'Meeting spot';

export const ACTIVITY_DETAIL_POST_CHECK_IN_REVIEWS_TITLE =
  'You went — help the community';

export const ACTIVITY_DETAIL_REVIEWS_EMPTY_NEUTRAL = 'No reviews yet.';
export const ACTIVITY_DETAIL_REVIEWS_EMPTY_INVITE =
  'No reviews yet. Be the first to share your experience.';
export const ACTIVITY_DETAIL_REVIEWS_GATE_CHECK_IN =
  'Reviews open after your host checks you in on the outing.';
export const ACTIVITY_DETAIL_REVIEWS_GATE_AFTER_END =
  'Reviews open after this outing ends.';

export const ACTIVITY_DETAIL_HOST_CHECK_IN_CTA = 'Open roster & check in';

export const ACTIVITY_DETAIL_HOST_RATE_PARTICIPANTS_CTA = 'Rate participants on roster';

export const ACTIVITY_DETAIL_PLAN_SUSTAINABILITY_LINE =
  'Share rides when you can — fewer cars, fuller seats, same crew.';

export const ACTIVITY_DETAIL_PLACE_LOCKED_BODY =
  'Join on Plan to unlock the meeting point, map, and directions.';

export const ACTIVITY_DETAIL_PLACE_LOCKED_CTA = 'Back to Plan';

export const ACTIVITY_DETAIL_TRANSPORT_REACH_TITLE = 'How to get there';
export const ACTIVITY_DETAIL_HOST_CREW_TOOLS_HINT = 'Host tools on Crew';
/** @deprecated Use {@link ACTIVITY_DETAIL_HOST_CREW_TOOLS_HINT}. */
export const ACTIVITY_DETAIL_HOST_BUDDIES_TOOLS_HINT = ACTIVITY_DETAIL_HOST_CREW_TOOLS_HINT;

export const ACTIVITY_DETAIL_TAB_FOOTER_VIEW_RIDE = 'View shared ride';
export const ACTIVITY_DETAIL_TAB_FOOTER_DIRECTIONS = 'Directions';
export const ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING = 'Share outing';
