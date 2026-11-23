/**
 * Matching bounded context — retrieval predicates + delivery (notify).
 * No consumer `/matching` URL; Discover/Plan HTTP routes call these modules.
 * Schedule: `scripts/governance/platform-layer-spine-touchpoints.json` → `decisions.matching`.
 */
export {
  activityCalendarDay,
  filterHostedEventsForMemberAvailability,
  hostedEventFitsMemberAvailability,
  memberAvailabilityDaySet,
} from './hosted-availability-fit.js';

export { rankMapExploreActivity } from './rank-map-explore.js';
export { rankMapExplorePlace } from './rank-map-explore-place.js';
export { loadRecommendationWishlistContext } from './recommendation-wishlist-context.js';

/** Supply/demand match side effects — wishlist · availability · hosted (not routes). */
export {
  fanOutSavedAreaWishlistNotifications,
  fanOutWishlistNotifications,
  notifyWishlistForMemberAvailability,
  notifyWishlistForPublishedActivity,
  resolveActivityOutingCategory,
  resolveActivityPinCoords,
} from './wishlist-match-notify.js';

export {
  notifyAvailabilityHoldersInAreaOfHostedActivity,
  notifyAvailabilityHoldersOfHostedActivity,
  notifyMemberOfHostedActivitiesForAvailability,
} from './availability-hosted-match.js';