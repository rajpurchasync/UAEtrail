import { RewardAction } from '../domain/enums.js';

export const REWARD_POINTS: Record<RewardAction, number> = {
  SIGNUP_WELCOME: 25,
  REFERRAL_BONUS_REFERRER: 50,
  REFERRAL_BONUS_JOINER: 25,
  LOCATION_SUBMITTED: 15,
  LOCATION_PUBLISHED: 100,
  ACTIVITY_PUBLISHED: 50,
  ACTIVITY_HOSTED: 75,
  TRIP_ATTENDED: 30,
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
  ACTIVITY_PUBLISHED: 'Trip published',
  ACTIVITY_HOSTED: 'Trip hosted successfully',
  TRIP_ATTENDED: 'Trip attended',
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
      'Browse trails, camps & community trips',
      'Join free community events',
      'Earn Trail Points for every contribution'
    ]
  },
  {
    key: 'active',
    name: 'Active',
    minPoints: 100,
    emoji: '⚡',
    badgeKey: 'tier_active',
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
    badgeKey: 'tier_pro',
    tagline: 'Trusted explorer',
    benefits: [
      'Trusted member badge',
      'Free hike invites each month',
      'Early access to select community trips'
    ]
  },
  {
    key: 'goat',
    name: 'GOAT',
    minPoints: 2000,
    emoji: '🐐',
    badgeKey: 'tier_goat',
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

const TIER_BADGE_DEFINITIONS: BadgeDefinition[] = MEMBERSHIP_TIERS.filter((t) => t.badgeKey).map((t) => ({
  key: t.badgeKey!,
  name: t.name,
  description: t.tagline,
  emoji: t.emoji,
  kind: 'tier' as const
}));

export const ACHIEVEMENT_BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: 'trail_mapper', name: 'Trail Mapper', description: 'Submit your first location', emoji: '🗺️', kind: 'achievement' },
  { key: 'community_voice', name: 'Community Voice', description: 'Share 5 community posts', emoji: '💬', kind: 'achievement' },
  { key: 'helpful_hand', name: 'Helpful Hand', description: 'Reply 10 times in the community', emoji: '🤝', kind: 'achievement' },
  { key: 'trip_leader', name: 'Trip Leader', description: 'Publish your first trip', emoji: '🏔️', kind: 'achievement' },
  { key: 'trusted_host', name: 'Trusted Host', description: 'Host 5 successful trips', emoji: '⭐', kind: 'achievement' },
  { key: 'reviewer', name: 'Reviewer', description: 'Write your first review', emoji: '✍️', kind: 'achievement' },
  { key: 'ambassador', name: 'Ambassador', description: 'Invite 3 friends who join', emoji: '🎁', kind: 'achievement' },
  { key: 'adventurer', name: 'Adventurer', description: 'Attend 5 trips', emoji: '🥾', kind: 'achievement' }
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [...TIER_BADGE_DEFINITIONS, ...ACHIEVEMENT_BADGE_DEFINITIONS];

export const EARN_OPPORTUNITIES = [
  { action: 'LOCATION_SUBMITTED' as const, title: 'Add a location', description: 'Share a trail or camp spot with the community', points: REWARD_POINTS.LOCATION_SUBMITTED + REWARD_POINTS.LOCATION_PUBLISHED },
  { action: 'ACTIVITY_PUBLISHED' as const, title: 'Host a trip', description: 'Publish and lead organized hikes or camps', points: REWARD_POINTS.ACTIVITY_PUBLISHED + REWARD_POINTS.ACTIVITY_HOSTED },
  { action: 'TRIP_ATTENDED' as const, title: 'Join a trip', description: 'Get checked in when you attend an organized event', points: REWARD_POINTS.TRIP_ATTENDED },
  { action: 'COMMUNITY_POST' as const, title: 'Community posts', description: 'Ask questions, share trip reports, tips & photos', points: REWARD_POINTS.COMMUNITY_POST },
  { action: 'COMMUNITY_REPLY' as const, title: 'Help others', description: 'Reply to posts and support fellow explorers', points: REWARD_POINTS.COMMUNITY_REPLY },
  { action: 'REVIEW_WRITTEN' as const, title: 'Write reviews', description: 'Rate locations and hosts after your adventures', points: REWARD_POINTS.REVIEW_WRITTEN },
  { action: 'REFERRAL_BONUS_REFERRER' as const, title: 'Invite friends', description: 'Share your invite link — you both earn points', points: REWARD_POINTS.REFERRAL_BONUS_REFERRER }
];

/** Actionable links shown in “path to next tier” checklist */
export const EARN_PATH_SUGGESTIONS = [
  { title: 'Invite a friend', points: REWARD_POINTS.REFERRAL_BONUS_REFERRER, path: '/my-rewards', note: 'Copy your invite link' },
  { title: 'Join a trip', points: REWARD_POINTS.TRIP_ATTENDED, path: '/trips', note: 'Get checked in on the day' },
  { title: 'Community post', points: REWARD_POINTS.COMMUNITY_POST, path: '/community', note: 'Trip report, tip, or question' },
  { title: 'Write a review', points: REWARD_POINTS.REVIEW_WRITTEN, path: '/discovery', note: 'After a trail or camp visit' },
  { title: 'Reply in community', points: REWARD_POINTS.COMMUNITY_REPLY, path: '/community', note: 'Help fellow explorers' },
  { title: 'Host a trip', points: REWARD_POINTS.ACTIVITY_PUBLISHED, path: '/become-host', note: 'Become a host first' }
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
