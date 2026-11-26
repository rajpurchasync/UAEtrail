/** Linked rideshare — eligibility, compose prefill, UI panels, card projection (single port). */
export {
  canLinkRideshareToActivity,
  canOfferRideshareForAvailabilityItem,
  canShowAvailabilityLinkRideshareOffer,
  linkParentToRideshareActivity,
} from '../explore/linkActivityRideshareOffer';
export { buildRideshareDraftFromParentActivity } from '../explore/linkRidesharePrefill';
export { linkedParentRidesharePeekCopy } from '../explore/exploreLinkedParentRideshareCopy';
export { finalizeDiscoveryCardLinkedRideshare } from '../explore/linkedRideshareExplore';
export {
  filterEligibleSelfRideshares,
  mergeEligibleRideshareParents,
  type RideshareParentCandidate,
  type RideshareParentRelation,
  type SelfRideshareCandidate,
} from '../explore/eligibleRideshareParentActivities';
export { LinkParentActivityPanel } from '../explore/ui/LinkParentActivityPanel';
export { LinkRidesharePanel } from '../explore/ui/LinkRidesharePanel';