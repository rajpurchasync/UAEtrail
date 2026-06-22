import { Prisma, RewardAction } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
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
  tierEnumToKey,
  tierKeyToEnum
} from '../lib/rewards-config.js';
import { dispatchNotification } from './notifications.js';

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface AwardPointsInput {
  userId: string;
  action: RewardAction;
  referenceId: string;
  label?: string;
  meta?: Record<string, unknown>;
  notify?: boolean;
}

async function syncMembershipTier(db: DbClient, userId: string, points: number): Promise<string | null> {
  const tierDef = getTierForPoints(points);
  const nextTierEnum = tierKeyToEnum(tierDef.key);

  const profile = await db.profile.findUnique({
    where: { userId },
    select: { membershipTier: true }
  });
  const previousTier = profile?.membershipTier ?? 'FREE';

  if (previousTier === nextTierEnum) return null;

  await db.profile.update({
    where: { userId },
    data: { membershipTier: nextTierEnum }
  });

  if (tierDef.badgeKey) {
    try {
      await db.userBadge.create({ data: { userId, badgeKey: tierDef.badgeKey } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
  }

  if ('$connect' in db && tierDef.key !== 'free') {
    void dispatchNotification(db as PrismaClient, {
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

export async function awardPoints(db: DbClient, input: AwardPointsInput): Promise<{ awarded: boolean; points: number }> {
  const points = REWARD_POINTS[input.action];
  if (points <= 0) return { awarded: false, points: 0 };

  let totalPoints = 0;

  const writeLedger = async (tx: DbClient) => {
    await tx.rewardLedger.create({
      data: {
        userId: input.userId,
        action: input.action,
        points,
        referenceId: input.referenceId,
        label: input.label ?? REWARD_LABELS[input.action],
        meta: input.meta as Prisma.InputJsonValue | undefined
      }
    });

    const profile = await tx.profile.upsert({
      where: { userId: input.userId },
      update: { rewardPoints: { increment: points } },
      create: { userId: input.userId, rewardPoints: points },
      select: { rewardPoints: true }
    });
    totalPoints = profile.rewardPoints;
    await syncMembershipTier(tx, input.userId, totalPoints);
  };

  try {
    if ('$transaction' in db && typeof db.$transaction === 'function') {
      await db.$transaction(async (tx) => writeLedger(tx));
    } else {
      await writeLedger(db);
    }

    if (input.notify !== false && '$connect' in db) {
      const progressHint = buildPointsToNextTierMessage(totalPoints);
      void dispatchNotification(db as PrismaClient, {
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

      void evaluateAchievementBadges(db as PrismaClient, input.userId).catch(() => undefined);
    }

    return { awarded: true, points };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { awarded: false, points: 0 };
    }
    throw error;
  }
}

async function countLedger(db: DbClient, userId: string, action: RewardAction): Promise<number> {
  return db.rewardLedger.count({ where: { userId, action } });
}

async function hasLedger(db: DbClient, userId: string, action: RewardAction): Promise<boolean> {
  const entry = await db.rewardLedger.findFirst({
    where: { userId, action },
    select: { id: true }
  });
  return Boolean(entry);
}

export async function evaluateAchievementBadges(db: DbClient, userId: string): Promise<string[]> {
  const earnedKeys = new Set(
    (await db.userBadge.findMany({ where: { userId }, select: { badgeKey: true } })).map((b) => b.badgeKey)
  );

  const checks: Array<{ key: string; shouldAward: () => Promise<boolean> }> = [
    {
      key: 'trail_mapper',
      shouldAward: async () =>
        (await hasLedger(db, userId, RewardAction.LOCATION_SUBMITTED)) ||
        (await hasLedger(db, userId, RewardAction.LOCATION_PUBLISHED))
    },
    {
      key: 'community_voice',
      shouldAward: async () => (await countLedger(db, userId, RewardAction.COMMUNITY_POST)) >= 5
    },
    {
      key: 'helpful_hand',
      shouldAward: async () => (await countLedger(db, userId, RewardAction.COMMUNITY_REPLY)) >= 10
    },
    {
      key: 'trip_leader',
      shouldAward: async () => hasLedger(db, userId, RewardAction.EVENT_PUBLISHED)
    },
    {
      key: 'trusted_host',
      shouldAward: async () => (await countLedger(db, userId, RewardAction.EVENT_HOSTED)) >= 5
    },
    {
      key: 'reviewer',
      shouldAward: async () => hasLedger(db, userId, RewardAction.REVIEW_WRITTEN)
    },
    {
      key: 'ambassador',
      shouldAward: async () => (await countLedger(db, userId, RewardAction.REFERRAL_BONUS_REFERRER)) >= 3
    },
    {
      key: 'adventurer',
      shouldAward: async () => (await countLedger(db, userId, RewardAction.TRIP_ATTENDED)) >= 5
    }
  ];

  const newlyEarned: string[] = [];

  for (const check of checks) {
    if (earnedKeys.has(check.key)) continue;
    if (!(await check.shouldAward())) continue;

    try {
      await db.userBadge.create({ data: { userId, badgeKey: check.key } });
      newlyEarned.push(check.key);

      const badge = ACHIEVEMENT_BADGE_DEFINITIONS.find((b) => b.key === check.key);
      if (badge && '$connect' in db) {
        void dispatchNotification(db as PrismaClient, {
          userId,
          title: `Badge unlocked: ${badge.name}`,
          body: badge.description,
          type: 'SYSTEM',
          meta: { kind: 'badge', badgeKey: check.key }
        }).catch(() => undefined);
      }
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
  }

  return newlyEarned;
}

/** @deprecated Use evaluateAchievementBadges */
export const evaluateBadges = evaluateAchievementBadges;

export async function processSignupRewards(
  db: DbClient,
  userId: string,
  referralCode?: string | null
): Promise<void> {
  await awardPoints(db, {
    userId,
    action: RewardAction.SIGNUP_WELCOME,
    referenceId: userId,
    notify: true
  });

  if (!referralCode?.trim()) return;

  const referrer = await db.user.findUnique({
    where: { referralCode: referralCode.trim().toUpperCase() },
    select: { id: true }
  });
  if (!referrer || referrer.id === userId) return;

  await db.user.update({
    where: { id: userId },
    data: { referredById: referrer.id }
  });

  await awardPoints(db, {
    userId: referrer.id,
    action: RewardAction.REFERRAL_BONUS_REFERRER,
    referenceId: userId,
    label: 'A friend joined with your invite link',
    notify: true
  });

  await awardPoints(db, {
    userId,
    action: RewardAction.REFERRAL_BONUS_JOINER,
    referenceId: referrer.id,
    label: 'Joined with a friend\'s invite',
    notify: true
  });
}

export async function getRewardSummary(db: DbClient, userId: string) {
  const [user, ledger, badges] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        profile: { select: { rewardPoints: true, membershipTier: true } }
      }
    }),
    db.rewardLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    }),
    db.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'asc' }
    })
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

  // Keep stored tier in sync if points were backfilled
  if (user?.profile && tierKeyToEnum(tier.key) !== user.profile.membershipTier && '$connect' in db) {
    void syncMembershipTier(db as PrismaClient, userId, points).catch(() => undefined);
  }

  return {
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

export async function getLeaderboard(db: DbClient, limit = 10) {
  const rows = await db.profile.findMany({
    where: { rewardPoints: { gt: 0 } },
    orderBy: { rewardPoints: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } }, email: true } }
    }
  });

  return rows.map((row, index) => {
    const tier = getTierForPoints(row.rewardPoints);
    return {
      rank: index + 1,
      userId: row.userId,
      displayName: row.user.profile?.displayName ?? row.user.email.split('@')[0],
      avatarUrl: row.user.profile?.avatarUrl ?? null,
      points: row.rewardPoints,
      tier: tier.name,
      /** @deprecated use tier */
      level: tier.name
    };
  });
}

export async function getRewardStats(db: DbClient) {
  const [activeCount, proCount, goatCount, contributorsCount, pointsAwarded] = await Promise.all([
    db.profile.count({ where: { membershipTier: 'ACTIVE' } }),
    db.profile.count({ where: { membershipTier: 'PRO' } }),
    db.profile.count({ where: { membershipTier: 'GOAT' } }),
    db.profile.count({ where: { rewardPoints: { gt: 0 } } }),
    db.rewardLedger.aggregate({ _sum: { points: true } })
  ]);

  return {
    activeCount,
    proCount,
    goatCount,
    contributorsCount,
    totalPointsAwarded: pointsAwarded._sum.points ?? 0,
    tierThresholds: MEMBERSHIP_TIERS.filter((t) => t.key !== 'free').map((t) => ({
      key: t.key,
      name: t.name,
      minPoints: t.minPoints,
      emoji: t.emoji
    }))
  };
}
