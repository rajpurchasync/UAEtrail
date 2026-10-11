import type { ActivityMapPeekAction } from '@uaetrail/shared-types';
import {
  detailPlanFooterKindForPeekPrimary,
  resolveActivityDetailEngagementFooterKind,
} from './resolveActivityDetailEngagement';

export { detailPlanFooterKindForPeekPrimary, resolveActivityDetailEngagementFooterKind };

/** Primary peek affordance (explore map) — same intent family as detail sticky footer on Plan. */
export const resolveActivityPeekPrimaryActionId = (
  actions: ActivityMapPeekAction[]
): import('@uaetrail/shared-types').ActivityMapPeekActionId | null => {
  const primary = actions.find((action) => action.prominence === 'primary');
  return primary?.id ?? null;
};
