import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import { EXPLORE_MAP_PATH } from '../config/platform';

export type BadgeEarnAction = {
  label: string;
  to: string;
};

const MEMBER_BADGE_ACTIONS: Record<string, BadgeEarnAction> = {
  newbie: { label: 'You\'re in — explore the map', to: EXPLORE_MAP_PATH },
  active: { label: 'Join a trip or activity', to: '/trips' },
  host: { label: 'Organize a trip', to: '/host/overview' },
  helpful_critic: { label: 'Write a review', to: `${EXPLORE_MAP_PATH}?list=1` },
  goat: { label: 'Join more trips', to: '/trips' },
  ambassador: { label: 'Invite friends', to: '/buddies' },
  contributor: { label: 'Add a spot', to: '/contributions' },
  trusted_host: { label: 'Keep organizing trips', to: '/host/overview' },
};

/** Primary CTA for unlocking or progressing toward a badge. */
export const resolveBadgeEarnAction = (badge: RewardBadgeDTO): BadgeEarnAction =>
  MEMBER_BADGE_ACTIONS[badge.key] ?? { label: 'Explore outings', to: '/explore?list=1' };
