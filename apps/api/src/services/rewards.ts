import { MongoServerError } from 'mongodb';
import { MembershipTier, RewardAction } from '../domain/enums.js';
import {
  ACHIEVEMENT_BADGE_DEFINITIONS,
  BADGE_DEFINITIONS,
  buildPointsToNextTierMessage,
  EARN_PATH_SUGGESTIONS,
  getNextTier,
  getTierForPoints,
  MEMBERSHIP_TIERS,
  REWARD_LABELS,
  REWARD_POINTS,
  tierKeyToEnum
} from '../lib/rewards-config.js';
import { findAuthUserById, findAuthUserByReferralCode } from '../lib/auth-users.js';
import { listCompanyTenantOwnerIds } from '../lib/tenant-store.js';
import { isBusinessOrganizerById } from '../lib/user-type.js';
import { getMongoClient } from '../lib/mongo.js';
import { dispatchNotification } from './notifications.js';
import {
  countRewardLedgerEntries,
  createRewardLedgerEntry,
  createUserBadge,
  findUserBadges,
  hasRewardLedgerEntry,
  listUserRewardLedger
} from '../lib/reward-ledger-store.js';

export interface AwardPointsInput {
  userId: string;
  action: RewardAction;
  referenceId: string;
  label?: string;
  meta?: Record<string, unknown>;
  notify?: boolean;
}

type AuthUserDoc = {
  _id: string;
  email: string;
  referralCode: string;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    rewardPoints?: number;
    membershipTier?: MembershipTier;
  };
};

const usersCollection = () => getMongoClient()!.db().collection<AuthUserDoc>('auth_users');

const isDuplicateKeyError = (error: unknown): boolean =>
  error instanceof MongoServerError && error.code === 11000;

async function incrementUserRewardPoints(userId: string, points: number): Promise<number> {
  const result = await usersCollection().findOneAndUpdate(
    { _id: userId },
    {
      $inc: { 'profile.rewardPoints': points },
      $set: { updatedAt: new Date() }
    },
    { returnDocument: 'after' }
  );

  return result?.profile?.rewardPoints ?? points;
}

async function updateUserMembershipTier(userId: string, tier: MembershipTier): Promise<void> {
  await usersCollection().updateOne(
    { _id: userId },
    { $set: { 'profile.membershipTier': tier, updatedAt: new Date() } }
  );
}

async function setUserReferredBy(userId: string, referredById: string): Promise<void> {
  await usersCollection().updateOne(
    { _id: userId },
    { $set: { referredById, updatedAt: new Date() } }
  );
}

async function syncMembershipTier(userId: string, points: number): Promise<string | null> {
  const tierDef = getTierForPoints(points);
  const nextTierEnum = tierKeyToEnum(tierDef.key);

  const user = await usersCollection().findOne({ _id: userId }, { projection: { profile: 1 } });
  const previousTier = user?.profile?.membershipTier ?? MembershipTier.FREE;

  if (previousTier === nextTierEnum) return null;

  await updateUserMembershipTier(userId, nextTierEnum);

  if (tierDef.badgeKey) {
    await createUserBadge({ userId, badgeKey: tierDef.badgeKey });
  }

  if (tierDef.key !== 'free') {
    void dispatchNotification({
      userId,
      title: `Upgraded to ${tierDef.name}! ${tierDef.emoji}`,
      body: `${tierDef.tagline} — share your badge with friends.`,
      type: 'SYSTEM',
      meta: {
        kind: 'tier_upgrade',
        tier: tierDef.key,
        tierName: tierDef.name,
        emoji: tierDef.emoji,
        points,
        shareTitle: `I'm ${tierDef.name} on UAE Trails`,
        shareText: `I just reached ${tierDef.name} tier by contributing to the UAE outdoor community. Join me on UAE Trails!`,
        sharePath: '/trail-points'
      }
    }).catch(() => undefined);
  }

  return tierDef.key;
}

export async function awardPoints(input: AwardPointsInput): Promise<{ awarded: boolean; points: number }> {
  const points = REWARD_POINTS[input.action];
  if (points <= 0) return { awarded: false, points: 0 };
  if (await isBusinessOrganizerById(input.userId)) {
    return { awarded: false, points: 0 };
  }

  try {
    await createRewardLedgerEntry({
      userId: input.userId,
      action: input.action,
      points,
      referenceId: input.referenceId,
      label: input.label ?? REWARD_LABELS[input.action],
      meta: input.meta
    });

    const totalPoints = await incrementUserRewardPoints(input.userId, points);
    await syncMembershipTier(input.userId, totalPoints);

    if (input.notify !== false) {
      const progressHint = buildPointsToNextTierMessage(totalPoints);
      void dispatchNotification({
        userId: input.userId,
        title: `+${points} Trail Points`,
        body: progressHint ? `${input.label ?? REWARD_LABELS[input.action]} · ${progressHint}` : (input.label ?? REWARD_LABELS[input.action]),
        type: 'SYSTEM',
        meta: {
          kind: 'reward',
          action: input.action,
          points,
          referenceId: input.referenceId,
          pointsToNextTier: progressHint
        }
      }).catch(() => undefined);

      void evaluateAchievementBadges(input.userId).catch(() => undefined);
    }

    return { awarded: true, points };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { awarded: false, points: 0 };
    }
    throw error;
  }
}

export async function evaluateAchievementBadges(userId: string): Promise<string[]> {
  const badges = await findUserBadges(userId);
  const earnedKeys = new Set(badges.map((b) => b.badgeKey));

  const checks: Array<{ key: string; shouldAward: () => Promise<boolean> }> = [
    {
      key: 'trail_mapper',
      shouldAward: async () =>
        (await hasRewardLedgerEntry(userId, RewardAction.LOCATION_SUBMITTED)) ||
        (await hasRewardLedgerEntry(userId, RewardAction.LOCATION_PUBLISHED))
    },
    {
      key: 'community_voice',
      shouldAward: async () => (await countRewardLedgerEntries(userId, RewardAction.COMMUNITY_POST)) >= 5
    },
    {
      key: 'helpful_hand',
      shouldAward: async () => (await countRewardLedgerEntries(userId, RewardAction.COMMUNITY_REPLY)) >= 10
    },
    {
      key: 'trip_leader',
      shouldAward: async () => hasRewardLedgerEntry(userId, RewardAction.ACTIVITY_PUBLISHED)
    },
    {
      key: 'trusted_host',
      shouldAward: async () => (await countRewardLedgerEntries(userId, RewardAction.ACTIVITY_HOSTED)) >= 5
    },
    {
      key: 'reviewer',
      shouldAward: async () => hasRewardLedgerEntry(userId, RewardAction.REVIEW_WRITTEN)
    },
    {
      key: 'ambassador',
      shouldAward: async () => (await countRewardLedgerEntries(userId, RewardAction.REFERRAL_BONUS_REFERRER)) >= 3
    },
    {
      key: 'adventurer',
      shouldAward: async () => (await countRewardLedgerEntries(userId, RewardAction.TRIP_ATTENDED)) >= 5
    }
  ];

  const newlyEarned: string[] = [];

  for (const check of checks) {
    if (earnedKeys.has(check.key)) continue;
    if (!(await check.shouldAward())) continue;

    const created = await createUserBadge({ userId, badgeKey: check.key });
    if (created) {
      newlyEarned.push(check.key);

      const badge = ACHIEVEMENT_BADGE_DEFINITIONS.find((b) => b.key === check.key);
      if (badge) {
        void dispatchNotification({
          userId,
          title: `Badge unlocked: ${badge.name}`,
          body: badge.description,
          type: 'SYSTEM',
          meta: { kind: 'badge', badgeKey: check.key }
        }).catch(() => undefined);
      }
    }
  }

  return newlyEarned;
}

/** @deprecated Use evaluateAchievementBadges */
export const evaluateBadges = evaluateAchievementBadges;

export async function processSignupRewards(
  userId: string,
  referralCode?: string | null
): Promise<void> {
  await awardPoints({
    userId,
    action: RewardAction.SIGNUP_WELCOME,
    referenceId: userId,
    notify: true
  });

  if (!referralCode?.trim()) return;

  const referrer = await findAuthUserByReferralCode(referralCode.trim().toUpperCase());
  if (!referrer || referrer._id === userId) return;

  await setUserReferredBy(userId, referrer._id);

  await awardPoints({
    userId: referrer._id,
    action: RewardAction.REFERRAL_BONUS_REFERRER,
    referenceId: userId,
    label: 'A friend joined with your invite link',
    notify: true
  });

  await awardPoints({
    userId,
    action: RewardAction.REFERRAL_BONUS_JOINER,
    referenceId: referrer._id,
    label: 'Joined with a friend\'s invite',
    notify: true
  });
}

export async function getRewardSummary(userId: string) {
  const user = await findAuthUserById(userId);
  const freeTier = getTierForPoints(0);

  if (await isBusinessOrganizerById(userId)) {
    return {
      trailPointsEligible: false,
      points: 0,
      membershipTier: {
        key: freeTier.key,
        name: freeTier.name,
        minPoints: freeTier.minPoints,
        emoji: freeTier.emoji,
        tagline: freeTier.tagline,
        benefits: freeTier.benefits
      },
      nextTier: null,
      level: {
        key: freeTier.key,
        name: freeTier.name,
        minPoints: freeTier.minPoints
      },
      nextLevel: null,
      referralCode: user?.referralCode ?? '',
      pathToNextTier: null,
      tierBadges: [],
      badges: [],
      recentActivity: []
    };
  }

  const [ledger, badges] = await Promise.all([
    listUserRewardLedger(userId, 30),
    findUserBadges(userId)
  ]);

  const points = user?.profile?.rewardPoints ?? 0;
  const tier = getTierForPoints(points);
  const nextTier = getNextTier(points);
  const earnedBadgeKeys = new Set(badges.map((b) => b.badgeKey));

  const pathToNextTier = nextTier
    ? {
        pointsRemaining: nextTier.minPoints - points,
        nextTierName: nextTier.name,
        nextTierKey: nextTier.key,
        nextTierEmoji: nextTier.emoji,
        suggestions: EARN_PATH_SUGGESTIONS.slice(0, 4).map((s) => ({
          title: s.title,
          points: s.points,
          path: s.path,
          note: s.note
        }))
      }
    : null;

  if (user?.profile && tierKeyToEnum(tier.key) !== user.profile.membershipTier) {
    void syncMembershipTier(userId, points).catch(() => undefined);
  }

  return {
    trailPointsEligible: true,
    points,
    membershipTier: {
      key: tier.key,
      name: tier.name,
      minPoints: tier.minPoints,
      emoji: tier.emoji,
      tagline: tier.tagline,
      benefits: tier.benefits
    },
    nextTier: nextTier
      ? {
          key: nextTier.key,
          name: nextTier.name,
          minPoints: nextTier.minPoints,
          emoji: nextTier.emoji,
          pointsRemaining: nextTier.minPoints - points
        }
      : null,
    /** @deprecated use membershipTier */
    level: {
      key: tier.key,
      name: tier.name,
      minPoints: tier.minPoints
    },
    /** @deprecated use nextTier */
    nextLevel: nextTier
      ? {
          key: nextTier.key,
          name: nextTier.name,
          minPoints: nextTier.minPoints,
          pointsRemaining: nextTier.minPoints - points
        }
      : null,
    referralCode: user?.referralCode ?? '',
    pathToNextTier,
    tierBadges: BADGE_DEFINITIONS.filter((b) => b.kind === 'tier').map((def) => {
      const earned = badges.find((b) => b.badgeKey === def.key);
      return {
        key: def.key,
        name: def.name,
        description: def.description,
        emoji: def.emoji,
        earned: earnedBadgeKeys.has(def.key),
        earnedAt: earned?.earnedAt.toISOString() ?? null
      };
    }),
    badges: ACHIEVEMENT_BADGE_DEFINITIONS.map((def) => {
      const earned = badges.find((b) => b.badgeKey === def.key);
      return {
        key: def.key,
        name: def.name,
        description: def.description,
        emoji: def.emoji,
        earned: earnedBadgeKeys.has(def.key),
        earnedAt: earned?.earnedAt.toISOString() ?? null
      };
    }),
    recentActivity: ledger.map((entry) => ({
      id: entry.id,
      action: entry.action,
      points: entry.points,
      label: entry.label ?? REWARD_LABELS[entry.action],
      createdAt: entry.createdAt.toISOString()
    }))
  };
}

export async function getUserLeaderboardRank(userId: string): Promise<number | null> {
  if (await isBusinessOrganizerById(userId)) return null;

  const user = await findAuthUserById(userId);
  const points = user?.profile?.rewardPoints ?? 0;
  if (points <= 0) return null;

  const excludedOwnerIds = await listCompanyTenantOwnerIds();
  const higherCount = await usersCollection().countDocuments({
    'profile.rewardPoints': { $gt: points },
    _id: { $nin: excludedOwnerIds }
  });
  return higherCount + 1;
}

export async function getLeaderboard(limit = 10) {
  const excludedOwnerIds = await listCompanyTenantOwnerIds();
  const rows = await usersCollection()
    .find({
      'profile.rewardPoints': { $gt: 0 },
      _id: { $nin: excludedOwnerIds }
    })
    .sort({ 'profile.rewardPoints': -1 })
    .limit(limit)
    .toArray();

  return rows.map((row, index) => {
    const rewardPoints = row.profile?.rewardPoints ?? 0;
    const tier = getTierForPoints(rewardPoints);
    return {
      rank: index + 1,
      userId: row._id,
      displayName: row.profile?.displayName ?? row.email.split('@')[0],
      avatarUrl: row.profile?.avatarUrl ?? null,
      points: rewardPoints,
      tier: tier.name,
      /** @deprecated use tier */
      level: tier.name
    };
  });
}

export async function getRewardStats() {
  const rewardLedgerCollection = () => getMongoClient()!.db().collection('reward_ledgers');

  const [activeCount, proCount, goatCount, contributorsCount, pointsAgg] = await Promise.all([
    usersCollection().countDocuments({ 'profile.membershipTier': MembershipTier.ACTIVE }),
    usersCollection().countDocuments({ 'profile.membershipTier': MembershipTier.PRO }),
    usersCollection().countDocuments({ 'profile.membershipTier': MembershipTier.GOAT }),
    usersCollection().countDocuments({ 'profile.rewardPoints': { $gt: 0 } }),
    rewardLedgerCollection()
      .aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: '$points' } } }])
      .toArray()
  ]);

  return {
    activeCount,
    proCount,
    goatCount,
    contributorsCount,
    totalPointsAwarded: pointsAgg[0]?.total ?? 0,
    tierThresholds: MEMBERSHIP_TIERS.filter((t) => t.key !== 'free').map((t) => ({
      key: t.key,
      name: t.name,
      minPoints: t.minPoints,
      emoji: t.emoji
    }))
  };
}

/** @deprecated Use awardPoints */
export const awardPointsDefault = awardPoints;

/** @deprecated Use processSignupRewards */
export const processSignupRewardsDefault = processSignupRewards;

/** @deprecated Use getRewardSummary */
export const getRewardSummaryDefault = getRewardSummary;

/** @deprecated Use getLeaderboard */
export const getLeaderboardDefault = getLeaderboard;

/** @deprecated Use getRewardStats */
export const getRewardStatsDefault = getRewardStats;
