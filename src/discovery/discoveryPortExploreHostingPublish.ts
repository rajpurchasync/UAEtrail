/** Hosting publish payload — destination, schedule normalization, draft helpers. */
export {
  inferEmirateFromPin,
  resolveCustomproposedDestinationName,
  resolvePublishedDestinationForPoint,
  resolvePublishedDestinationIdForPoint,
  resolveRequiredEmirate,
} from '../explore/hostingPublishDestination';
export { normalizeHostingEndDate } from '../explore/ui/hostingScheduleDraft';
export {
  buildHostingActivityRequirements,
  defaultDescription,
  isActivityHostingFlow,
  isEventHostingFlow,
  isHikingHostingFlow,
  isStructuredHostingFlow,
  resolveActivityTitle,
  resolveActivityType,
  usesGoingFromHostingStep,
  type ActivityDifficulty,
  type CreateActivityDraft,
} from '../explore/ui/hostingFlowEngine';