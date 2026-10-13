import { RewardAction } from '../domain/enums.js';
import { findAuthUserById, findAuthUserByReferralCode } from '../lib/auth-users.js';
import { MEMBER_BADGE_DEFINITIONS } from '../lib/member-badges-config.js';
import {
  countMemberActions,
  createUserBadge,
  findUserBadges,
  hasMemberAction,
  recordMemberActionLog,
} from '../lib/member-badge-store.js';
import { isBusinessHostById } from '../lib/user-type.js';
import { PROFILE_BADGES_PATH } from '../lib/member-routes.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { scheduleNotification } from './notifications.js';
import { getMongoClient } from '../lib/mongo.js';

const ACTION_LABELS: Record<RewardAction, string> = {
  SIGNUP_WELCOME: 'Welcome',
  REFERRAL_BONUS_REFERRER: 'Friend joined via your invite',
  REFERRAL_BONUS_JOINER: 'Joined with a friend\'s invite',
  LOCATION_SUBMITTED: 'Location submitted',
  LOCATION_PUBLISHED: 'Location approved',
  ACTIVITY_PUBLISHED: 'Activity published',
  ACTIVITY_HOSTED: 'Activity hosted',
  ACTIVITY_ATTENDED: 'Activity attended',
  REVIEW_WRITTEN: 'Review written',
};

export interface RecordMemberActionInput {
  userId: string;
  action: RewardAction;
  referenceId: string;
  label?: string;
  meta?: Record<string, unknown>;
}

/** Track qualifying actions and evaluate badges — no Trail Points. */
export async function recordMemberAction(input: RecordMemberActionInput): Promise<{ recorded: boolean }> {
  if (await isBusinessHostById(input.userId)) {
    return { recorded: false };
  }

  const logged = await recordMemberActionLog({
    userId: input.userId,
    action: input.action,
    referenceId: input.referenceId,
    label: input.label ?? ACTION_LABELS[input.action],
    meta: input.meta,
  });

  if (logged) {
    scheduleSideEffect(evaluateMemberBadges(input.userId), 'member_badges.evaluate_after_action');
    return { recorded: true };
  }

  return { recorded: false };
}

export async function evaluateMemberBadges(userId: string): Promise<string[]> {
  const badges = await findUserBadges(userId);
  const earnedKeys = new Set(badges.map((b) => b.badgeKey));

  const checks: Array<{ key: string; shouldAward: () => Promise<boolean> }> = [
    {
      key: 'newbie',
      shouldAward: async () => Boolean(await findAuthUserById(userId)),
    },
    {
      key: 'active',
      shouldAward: async () => hasMemberAction(userId, RewardAction.ACTIVITY_ATTENDED),
    },
    {
      key: 'host',
      shouldAward: async () => hasMemberAction(userId, RewardAction.ACTIVITY_PUBLISHED),
    },
    {
      key: 'helpful_critic',
      shouldAward: async () => hasMemberAction(userId, RewardAction.REVIEW_WRITTEN),
    },
    {
      key: 'goat',
      shouldAward: async () => (await countMemberActions(userId, RewardAction.ACTIVITY_ATTENDED)) >= 5,
    },
    {
      key: 'ambassador',
      shouldAward: async () => (await countMemberActions(userId, RewardAction.REFERRAL_BONUS_REFERRER)) >= 3,
    },
    {
      key: 'contributor',
      shouldAward: async () =>
        (await hasMemberAction(userId, RewardAction.LOCATION_SUBMITTED)) ||
        (await hasMemberAction(userId, RewardAction.LOCATION_PUBLISHED)),
    },
    {
      key: 'trusted_host',
      shouldAward: async () => (await countMemberActions(userId, RewardAction.ACTIVITY_HOSTED)) >= 5,
    },
  ];

  const newlyEarned: string[] = [];

  for (const check of checks) {
    if (earnedKeys.has(check.key)) continue;
    if (!(await check.shouldAward())) continue;

    const created = await createUserBadge({ userId, badgeKey: check.key });
    if (created) {
      newlyEarned.push(check.key);

      const badge = MEMBER_BADGE_DEFINITIONS.find((b) => b.key === check.key);
      if (badge) {
        scheduleNotification(
          {
            userId,
            title: `Badge unlocked: ${badge.name}`,
            body: badge.description,
            type: 'SYSTEM',
            meta: { kind: 'badge', badgeKey: check.key, path: PROFILE_BADGES_PATH },
          },
          'member_badges.unlocked'
        );
      }
    }
  }

  return newlyEarned;
}

export async function listMemberBadges(userId: string) {
  if (await isBusinessHostById(userId)) {
    return [];
  }

  await evaluateMemberBadges(userId);
  const earned = await findUserBadges(userId);
  const earnedKeys = new Set(earned.map((b) => b.badgeKey));

  return MEMBER_BADGE_DEFINITIONS.map((def) => {
    const row = earned.find((b) => b.badgeKey === def.key);
    return {
      key: def.key,
      name: def.name,
      description: def.description,
      emoji: def.emoji,
      earned: earnedKeys.has(def.key),
      earnedAt: row?.earnedAt.toISOString() ?? null,
    };
  });
}

export async function listPublicMemberBadges(userId: string) {
  const earned = await findUserBadges(userId);
  const earnedKeys = new Set(earned.map((b) => b.badgeKey));

  return MEMBER_BADGE_DEFINITIONS.map((def) => {
    const row = earned.find((b) => b.badgeKey === def.key);
    return {
      key: def.key,
      name: def.name,
      description: def.description,
      emoji: def.emoji,
      earned: earnedKeys.has(def.key),
      earnedAt: row?.earnedAt.toISOString() ?? null,
    };
  }).filter((b) => b.earned);
}

export async function processSignupBadges(userId: string, referralCode?: string | null): Promise<void> {
  await recordMemberAction({
    userId,
    action: RewardAction.SIGNUP_WELCOME,
    referenceId: userId,
  });

  if (!referralCode?.trim()) return;

  const referrer = await findAuthUserByReferralCode(referralCode.trim().toUpperCase());
  if (!referrer || referrer._id === userId) return;

  await getMongoClient()!
    .db()
    .collection<{ _id: string }>('auth_users')
    .updateOne({ _id: userId }, { $set: { referredById: referrer._id, updatedAt: new Date() } });

  await recordMemberAction({
    userId: referrer._id,
    action: RewardAction.REFERRAL_BONUS_REFERRER,
    referenceId: userId,
  });

  await recordMemberAction({
    userId,
    action: RewardAction.REFERRAL_BONUS_JOINER,
    referenceId: referrer._id,
  });
}
