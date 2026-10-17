/**
 * UI Product Language (UPL) — member-visible terms and marketing copy anchors.
 * **Not** HTTP paths, JSON keys, or Mongo fields. Those live in `@uaetrail/shared-types/wire-lexicon`.
 *
 * Use: import labels from here or from `workspaceVocabulary.ts`, `productNorthStar.ts`, `geographyVocabulary.ts`.
 * Implementation: docs/SYSTEM_COHERENCE.md §8.8
 */

export const UPL_PRODUCT_TAGLINE = 'Find your people · get outside · go together';

/** Map-first discovery home */
export const UPL_EXPLORE = 'Explore';

/** Scheduled outing */
export const UPL_ACTIVITY = 'Activity';

/** Person leading this outing on cards and detail */
export const UPL_HOST = 'Host';
export const UPL_HOSTED_BY = 'Hosted by';

/** Create / publish on map (capability) */
export const UPL_ORGANIZE = 'Organize';

/** Map mode: member looking for company */
export const UPL_SEEKING = 'Looking for company';

/**
 * Geography (CPC).
 * Area = admin-curated **name** (hub `/area/:slug`, filter `?area=`) — not a map pin.
 * Country / state / region come from map geography. Place / Facility carry `areaId`.
 */
export const UPL_AREA = 'Area';
export const UPL_PLACE = 'Place';
export const UPL_FACILITY = 'Facility';
export const UPL_MAP_LENS_SPOTS = 'Spots';

/** People discovery — not map pins */
export const UPL_PEOPLE = 'People';
export const UPL_FIND_YOUR_CREW = 'Find your crew';

/** Social graph (UI). Wire uses `buddy`. */
export const UPL_BUDDIES_PAGE = 'Buddies';
export const UPL_FRIENDS_LIST = 'Friends';
export const UPL_FOLLOWING = 'Following';

/** Plan hub */
export const UPL_PLAN = 'Plan';
export const UPL_GOALS = 'Goals';
export const UPL_AVAILABILITY = 'Availability';

/**
 * Pro membership — upgrade for individual guides and for shops/agencies.
 * Not the same as "host on one activity" (UPL_HOST).
 */
export const UPL_PRO_MEMBERSHIP = 'Pro membership';

/** Shop or agency business brand (UI). Not the HTTP publishing console. */
export const UPL_OPERATOR_BUSINESS = 'Operator';

/** Console shell (manage outings, team, join queue) */
export const UPL_PUBLISHING_WORKSPACE = 'Publishing workspace';

export const UPL_WISHLIST = 'Wishlist';
export const UPL_GROUPS = 'Groups';
export const UPL_MESSAGES = 'Messages';
export const UPL_REVIEWS = 'Reviews';
export const UPL_SHOP = 'Shop';

/** Join participation */
export const UPL_JOIN_REQUEST = 'Join request';
export const UPL_REQUEST_TO_JOIN = 'Request to join';
export const UPL_IM_GOING = "I'm going";

/** Withdraw copy — host is UPL; BWL field is `hostNote`. */
export const UPL_COMMENT_FOR_HOST = 'Comment for the host';
