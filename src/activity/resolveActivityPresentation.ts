/** Detail presentation + peek engagement — split modules; this file keeps legacy import paths. */
export {
  resolveActivityDetailPresentation,
  resolveActivityPresentation,
  resolveActivityPresentationFromExploreCard,
  type ActivityPresentationInput,
} from './activityDetailPresentation';

export {
  activityMapPeekNeedsJoinContext,
  activityMapPeekShowsJoinFlow,
  activityMapPeekSkipsJoinContext,
  filterActivityMapPeekActionsForViewer,
  resolveActivityMapPeekActions,
  resolveActivityPeekEngagement,
  resolveActivityPresentationPeekActions,
  type ActivityPeekEngagement,
} from './activityPeekEngagement';
