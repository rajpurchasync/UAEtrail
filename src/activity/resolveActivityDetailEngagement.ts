import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { ActivityDetailTabId } from './activityDetailTab';
import {
  resolveActivityDetailTabFooterKind,
  type ActivityDetailTabFooterInput,
  type ActivityDetailTabFooterKind,
} from './activityDetailTabFooters';

export type ActivityEngagementSurface = 'explore_map' | 'activity_detail';

/**
 * v3.2 §9 — one footer-kind resolver for map peek (Plan-equivalent) and detail tab footers.
 * UI still renders actions in surface-specific components.
 */
export const detailPlanFooterKindForPeekPrimary = (
  peekPrimaryId: ActivityMapPeekActionId | null
): ActivityDetailTabFooterKind => {
  switch (peekPrimaryId) {
    case 'invite_crew':
      return 'crew_invite';
    case 'link_rideshare':
      return 'transport_linked_ride';
    case 'share_activity':
    case 'manage_activity':
      return 'plan_host_share';
    case 'open_crew_chat':
    case 'message_host':
    case 'request_join':
    case 'pending_join':
    case 'view_detail':
    case null:
    default:
      return 'plan_join';
  }
};

export const resolveActivityDetailEngagementFooterKind = (input: {
  surface: ActivityEngagementSurface;
  tab?: ActivityDetailTabId;
  tabFooter: ActivityDetailTabFooterInput;
  peekPrimaryActionId?: ActivityMapPeekActionId | null;
}): ActivityDetailTabFooterKind => {
  if (input.surface === 'explore_map') {
    return detailPlanFooterKindForPeekPrimary(input.peekPrimaryActionId ?? null);
  }
  return resolveActivityDetailTabFooterKind({
    ...input.tabFooter,
    tab: input.tab ?? 'plan',
  });
};
