import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import {
  BUDDIES_PATH,
  CONTRIBUTIONS_PATH,
  EXPLORE_MAP_PATH,
  PLAN_PATH,
  exploreOrganizePath,
  explorePath,
} from '../config/routingCatalog';

export type BadgeEarnAction = {
  label: string;
  to: string;
};

const MEMBER_BADGE_ACTIONS: Record<string, BadgeEarnAction> = {
  newbie: { label: 'You\'re in — explore the map', to: EXPLORE_MAP_PATH },
  active: { label: 'Join a trip or activity', to: PLAN_PATH },
  host: { label: 'Organize a trip', to: exploreOrganizePath() },
  helpful_critic: { label: 'Write a review', to: explorePath({ list: true }) },
  goat: { label: 'Join more trips', to: PLAN_PATH },
  ambassador: { label: 'Invite friends', to: BUDDIES_PATH },
  contributor: { label: 'Add a spot', to: CONTRIBUTIONS_PATH },
  trusted_host: { label: 'Keep organizing trips', to: exploreOrganizePath() },
};

/** Primary CTA for unlocking or progressing toward a badge. */
export const resolveBadgeEarnAction = (badge: RewardBadgeDTO): BadgeEarnAction =>
  MEMBER_BADGE_ACTIONS[badge.key] ?? { label: 'Explore outings', to: explorePath({ list: true }) };
