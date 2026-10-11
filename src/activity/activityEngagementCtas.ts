import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { ActivityDetailTabFooterKind } from './activityDetailTabFooters';

/** Primary peek affordance (explore map) — same intent family as detail sticky footer on Plan. */
export const resolveActivityPeekPrimaryActionId = (
  actions: ActivityMapPeekAction[]
): ActivityMapPeekActionId | null => {
  const primary = actions.find((action) => action.prominence === 'primary');
  return primary?.id ?? null;
};

/**
 * Maps wire peek primary ids to detail Plan-tab footer kinds — tab-specific footers
 * (Place directions, Buddies invite) extend this on the detail surface only.
 */
export const detailPlanFooterKindForPeekPrimary = (
  peekPrimaryId: ActivityMapPeekActionId | null
): ActivityDetailTabFooterKind => {
  switch (peekPrimaryId) {
    case 'invite_crew':
      return 'buddies_invite';
    case 'link_carpool':
      return 'transport_linked_ride';
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
