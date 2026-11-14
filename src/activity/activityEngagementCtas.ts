import {
  pickActivityPeekTwoSlotActions,
  type ActivityMapPeekAction,
  type ActivityPeekTwoSlot,
} from '@uaetrail/shared-types';
import {
  detailPlanFooterKindForPeekPrimary,
  resolveActivityDetailEngagementFooterKind,
} from './resolveActivityDetailEngagement';

export { detailPlanFooterKindForPeekPrimary, resolveActivityDetailEngagementFooterKind };

/** Client projection — two peek/list buttons from a wire action list (L1 `pickActivityPeekTwoSlotActions`). */
export const resolveActivityPeekTwoSlot = (
  actions: readonly ActivityMapPeekAction[]
): ActivityPeekTwoSlot => pickActivityPeekTwoSlotActions(actions);

/** Primary peek affordance (explore map) — same intent family as detail sticky footer on Plan. */
export const resolveActivityPeekPrimaryActionId = (
  actions: ActivityMapPeekAction[]
): import('@uaetrail/shared-types').ActivityMapPeekActionId | null => {
  const primary = actions.find((action) => action.prominence === 'primary');
  return primary?.id ?? null;
};

/** Map peek primary CTA → same footer kind family as activity detail Plan tab (§9). */
export const resolveExploreMapEngagementFooterKind = (
  peekPrimaryActionId: import('@uaetrail/shared-types').ActivityMapPeekActionId | null
) => detailPlanFooterKindForPeekPrimary(peekPrimaryActionId);
