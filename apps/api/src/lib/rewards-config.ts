import { RewardAction } from '../domain/enums.js';

export const REWARD_POINTS: Record<RewardAction, number> = {
  SIGNUP_WELCOME: 25,
  REFERRAL_BONUS_REFERRER: 50,
  REFERRAL_BONUS_JOINER: 25,
  LOCATION_SUBMITTED: 15,
  LOCATION_PUBLISHED: 100,
  ACTIVITY_PUBLISHED: 50,
  ACTIVITY_HOSTED: 75,
  ACTIVITY_ATTENDED: 30,
  COMMUNITY_POST: 20,
  COMMUNITY_REPLY: 5,
  REVIEW_WRITTEN: 25
};

export const REWARD_LABELS: Record<RewardAction, string> = {
  SIGNUP_WELCOME: 'Welcome bonus',
  REFERRAL_BONUS_REFERRER: 'Friend joined via your invite',
  REFERRAL_BONUS_JOINER: 'Joined with a friend\'s invite',
  LOCATION_SUBMITTED: 'Location submitted',
  LOCATION_PUBLISHED: 'Location approved & published',
  ACTIVITY_PUBLISHED: 'Activity published',
  ACTIVITY_HOSTED: 'Activity hosted successfully',
  ACTIVITY_ATTENDED: 'Activity attended',
  COMMUNITY_POST: 'Community post',
  COMMUNITY_REPLY: 'Community reply',
  REVIEW_WRITTEN: 'Review written'
};

export type MembershipTierKey = 'free' | 'active' | 'pro' | 'goat';

export interface MembershipTierDefinition {
  key: MembershipTierKey;
  name: string;
  minPoints: number;
  emoji: string;
  badgeKey: string | null;
  tagline: string;
  benefits: string[];
}

/** Earn Trail Points → auto-upgrade membership tier (no paid checkout required). */
export const MEMBERSHIP_TIERS: MembershipTierDefinition[] = [
  {
    key: 'free',
    name: 'Free',
    minPoints: 0,
    emoji: '🌱',
    badgeKey: null,
    tagline: 'Start exploring and earning points',
    benefits: [
      'Browse trails, camps & community activities',
      'Join free community events',
      'Earn Trail Points for every contribution'
    ]
  },
  {
    key: 'active',
    name: 'Active',
    minPoints: 100,
    emoji: '⚡',
    badgeKey: null,
    tagline: 'Recognised contributor',
    benefits: [
      'Active member badge on your profile',
      'Priority visibility in the community',
      'Unlock the path to Pro & GOAT tiers'
    ]
  },
  {
    key: 'pro',
    name: 'Pro',
    minPoints: 500,
    emoji: '🛡️',
    badgeKey: null,
    tagline: 'Trusted explorer',
    benefits: [
      'Trusted member badge',
      'Free hike invites each month',
      'Early access to select community activities'
    ]
  },
  {
    key: 'goat',
    name: 'GOAT',
    minPoints: 2000,
    emoji: '🐐',
    badgeKey: null,
    tagline: 'Greatest Of All Trails',
    benefits: [
      'GOAT badge — top contributor status',
      'Full premium membership benefits',
      'Exclusive trails, offline maps & gear discounts'
    ]
  }
];

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  emoji: string;
  kind: 'tier' | 'achievement';
}

/** Profile badges — earn rules in `evaluateMemberBadges` (rewards service). */
export const MEMBER_BADGE_ORDER = [
  'newbie',
  'active',
  'host',
  'helpful_critic',
  'goat',
  'ambassador',
  'contributor',
  'trusted_host',
] as const;

export type MemberBadgeKey = (typeof MEMBER_BADGE_ORDER)[number];

export const MEMBER_BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: 'newbie', name: 'Newbie', description: 'Signed-in user', emoji: '🌱', kind: 'achievement' },
  { key: 'active', name: 'Active', description: 'Join a trip or activity', emoji: '⚡', kind: 'achievement' },
  { key: 'host', name: 'Host', description: 'Organize a trip', emoji: '🏔️', kind: 'achievement' },
  {
    key: 'helpful_critic',
    name: 'Helpful Critic',
    description: 'Write a review',
    emoji: '✍️',
    kind: 'achievement',
  },
  { key: 'goat', name: 'GOAT', description: 'Join 5 trips', emoji: '🐐', kind: 'achievement' },
  { key: 'ambassador', name: 'Ambassador', description: 'Invite 3 friends', emoji: '🎁', kind: 'achievement' },
  { key: 'contributor', name: 'Contributor', description: 'Add a spot', emoji: '📍', kind: 'achievement' },
  {
    key: 'trusted_host',
    name: 'Trusted Host',
    description: 'Organize 5 trips',
    emoji: '⭐',
    kind: 'achievement',
  },
];

/** @deprecated Use MEMBER_BADGE_DEFINITIONS */
export const ACHIEVEMENT_BADGE_DEFINITIONS = MEMBER_BADGE_DEFINITIONS;

export const BADGE_DEFINITIONS: BadgeDefinition[] = MEMBER_BADGE_DEFINITIONS;

export const EARN_OPPORTUNITIES = [
  { action: 'LOCATION_SUBMITTED' as const, title: 'Add a location', description: 'Share a trail or camp spot with the community', points: REWARD_POINTS.LOCATION_SUBMITTED + REWARD_POINTS.LOCATION_PUBLISHED },
  { action: 'ACTIVITY_PUBLISHED' as const, title: 'Host an activity', description: 'Publish and lead organized hikes or camps', points: REWARD_POINTS.ACTIVITY_PUBLISHED + REWARD_POINTS.ACTIVITY_HOSTED },
  { action: 'ACTIVITY_ATTENDED' as const, title: 'Join an activity', description: 'Get checked in when you attend an organized event', points: REWARD_POINTS.ACTIVITY_ATTENDED },
  { action: 'COMMUNITY_POST' as const, title: 'Community posts', description: 'Ask questions, share activity reports, tips & photos', points: REWARD_POINTS.COMMUNITY_POST },
  { action: 'COMMUNITY_REPLY' as const, title: 'Help others', description: 'Reply to posts and support fellow explorers', points: REWARD_POINTS.COMMUNITY_REPLY },
  { action: 'REVIEW_WRITTEN' as const, title: 'Write reviews', description: 'Rate locations and hosts after your adventures', points: REWARD_POINTS.REVIEW_WRITTEN },
  { action: 'REFERRAL_BONUS_REFERRER' as const, title: 'Invite friends', description: 'Share your invite link — you both earn points', points: REWARD_POINTS.REFERRAL_BONUS_REFERRER }
];

/** Actionable links shown in “path to next tier” checklist */
export const EARN_PATH_SUGGESTIONS = [
  { title: 'Invite a friend', points: REWARD_POINTS.REFERRAL_BONUS_REFERRER, path: '/my-rewards', note: 'Copy your invite link' },
  { title: 'Join an activity', points: REWARD_POINTS.ACTIVITY_ATTENDED, path: '/activities?tab=joined', note: 'Get checked in on the day' },
  { title: 'Community post', points: REWARD_POINTS.COMMUNITY_POST, path: '/community', note: 'Activity report, tip, or question' },
  { title: 'Write a review', points: REWARD_POINTS.REVIEW_WRITTEN, path: '/explore?panel=venues&list=1', note: 'After a trail or camp visit' },
  { title: 'Reply in community', points: REWARD_POINTS.COMMUNITY_REPLY, path: '/community', note: 'Help fellow explorers' },
  { title: 'Host an activity', points: REWARD_POINTS.ACTIVITY_PUBLISHED, path: '/become-organizer', note: 'Become an organizer first' }
];

export const getTierForPoints = (points: number): MembershipTierDefinition => {
  let current = MEMBERSHIP_TIERS[0];
  for (const tier of MEMBERSHIP_TIERS) {
    if (points >= tier.minPoints) current = tier;
  }
  return current;
};

export const getNextTier = (points: number): MembershipTierDefinition | null => {
  const current = getTierForPoints(points);
  const idx = MEMBERSHIP_TIERS.findIndex((t) => t.key === current.key);
  return MEMBERSHIP_TIERS[idx + 1] ?? null;
};

export const tierKeyToEnum = (key: MembershipTierKey): 'FREE' | 'ACTIVE' | 'PRO' | 'GOAT' =>
  key.toUpperCase() as 'FREE' | 'ACTIVE' | 'PRO' | 'GOAT';

const tierEnumToKey = (tier: string): MembershipTierKey =>
  tier.toLowerCase() as MembershipTierKey;

export const tierEnumToDisplay = (tier: string | null | undefined) => {
  if (!tier || tier === 'FREE') return null;
  const key = tierEnumToKey(tier);
  const def = MEMBERSHIP_TIERS.find((t) => t.key === key);
  if (!def) return null;
  return { key: def.key, name: def.name, emoji: def.emoji };
};

export const buildPointsToNextTierMessage = (points: number): string | null => {
  const next = getNextTier(points);
  if (!next) return null;
  const remaining = next.minPoints - points;
  return `${remaining} pts to ${next.name}`;
};
