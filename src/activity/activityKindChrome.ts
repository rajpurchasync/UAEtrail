import type { ActivityType } from '@uaetrail/shared-types';
import { resolveMapPinEmoji } from '@uaetrail/shared-types';
import { ACTIVITY_TYPE_LABELS, type ActivityType as LocalActivityType } from '../config/activityTypes';

const normalizeActivityType = (activityType: ActivityType | string): LocalActivityType => {
  if (activityType === 'hiking' || activityType === 'camping' || activityType === 'event') {
    return activityType;
  }
  return 'hiking';
};

/** Header chrome: emoji + short kind label (not the outing title). */
export const activityKindChromeLabel = (activityType: ActivityType | string): string =>
  ACTIVITY_TYPE_LABELS[normalizeActivityType(activityType)];

export const activityKindChromeEmoji = (activityType: ActivityType | string): string =>
  resolveMapPinEmoji(normalizeActivityType(activityType), 'activity');
