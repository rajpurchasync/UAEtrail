import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import { BUDDIES_PATH, CONTRIBUTIONS_PATH, EXPLORE_MAP_PATH, TRIPS_PATH, explorePath } from '../config/routingCatalog';

export type BadgeEarnAction = {
  label: string;
  to: string;
};

const MEMBER_BADGE_ACTIONS: Record<string, BadgeEarnAction> = {
  newbie: { label: 'You\'re in — explore the map', to: EXPLORE_MAP_PATH },
  active: { label: 'Join a trip or activity', to: TRIPS_PATH },
  host: { label: 'Organize a trip', to: '/host/overview' },
  helpful_critic: { label: 'Write a review', to: explorePath({ list: true }) },
  goat: { label: 'Join more trips', to: TRIPS_PATH },
  ambassador: { label: 'Invite friends', to: BUDDIES_PATH },
  contributor: { label: 'Add a spot', to: CONTRIBUTIONS_PATH },
  trusted_host: { label: 'Keep organizing trips', to: '/host/overview' },
};

/** Primary CTA for unlocking or progressing toward a badge. */
export const resolveBadgeEarnAction = (badge: RewardBadgeDTO): BadgeEarnAction =>
  MEMBER_BADGE_ACTIONS[badge.key] ?? { label: 'Explore outings', to: explorePath({ list: true }) };
