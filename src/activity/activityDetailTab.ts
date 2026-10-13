import {
  ACTIVITY_DETAIL_TAB_BUDDIES,
  ACTIVITY_DETAIL_TAB_PLACE,
  ACTIVITY_DETAIL_TAB_PLAN,
  ACTIVITY_DETAIL_TAB_TRANSPORT,
} from '../content/activityDetailCopy';
import { activityDetailPath } from '../config/routingCatalog';

export const ACTIVITY_DETAIL_TAB_QUERY = 'tab';
export const ACTIVITY_DETAIL_JOINED_QUERY = 'joined';

export const activityDetailJoinedWelcomePath = (activityId: string): string =>
  `${activityDetailPath(activityId)}?${ACTIVITY_DETAIL_JOINED_QUERY}=1`;

export const ACTIVITY_DETAIL_TABS = ['plan', 'place', 'buddies', 'transport'] as const;
export type ActivityDetailTabId = (typeof ACTIVITY_DETAIL_TABS)[number];

export const ACTIVITY_DETAIL_TAB_LABELS: Record<ActivityDetailTabId, string> = {
  plan: ACTIVITY_DETAIL_TAB_PLAN,
  place: ACTIVITY_DETAIL_TAB_PLACE,
  buddies: ACTIVITY_DETAIL_TAB_BUDDIES,
  transport: ACTIVITY_DETAIL_TAB_TRANSPORT,
};

export const parseActivityDetailTabParam = (value: string | null | undefined): ActivityDetailTabId => {
  if (value === 'place' || value === 'buddies' || value === 'transport') return value;
  return 'plan';
};
