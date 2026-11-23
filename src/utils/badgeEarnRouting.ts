import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import {
  MY_CREWS_PATH,
  PROFILE_SUBMISSIONS_PATH,
  EXPLORE_MAP_PATH,
  PLAN_PATH,
  exploreHostPath,
  explorePath,
} from '../config/routingCatalog';

export type BadgeEarnAction = {
  label: string;
  to: string;
};

const MEMBER_BADGE_ACTIONS: Record<string, BadgeEarnAction> = {
  newbie: { label: 'You\'re in — explore the map', to: EXPLORE_MAP_PATH },
  active: { label: 'Join an outing', to: PLAN_PATH },
  host: { label: 'Host an outing', to: exploreHostPath() },
  helpful_critic: { label: 'Write a review', to: explorePath({ list: true }) },
  goat: { label: 'Join more outings', to: PLAN_PATH },
  ambassador: { label: 'Invite friends', to: MY_CREWS_PATH },
  contributor: { label: 'Add a spot', to: PROFILE_SUBMISSIONS_PATH },
  trusted_host: { label: 'Keep hosting outings', to: exploreHostPath() },
};

/** Primary CTA for unlocking or progressing toward a badge. */
export const resolveBadgeEarnAction = (badge: RewardBadgeDTO): BadgeEarnAction =>
  MEMBER_BADGE_ACTIONS[badge.key] ?? { label: 'Explore outings', to: explorePath({ list: true }) };
