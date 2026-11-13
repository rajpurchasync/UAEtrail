import type { ActivityPartyMemberDTO } from '@uaetrail/shared-types';
import { derivePartyHeadcountFromRoster } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { assertKidProfileComplete } from '../domain/family-kid-profile.js';
import { isSignupProfileComplete } from '../domain/user-profile.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import {
  findGroupMembersByIds,
  findGroupsByIds,
  getAdultMembershipsInGroups,
} from '../lib/social-groups-store.js';
import { createActivityFamilyInvitesBatch } from '../lib/activity-family-invites-store.js';
import { createNotificationRecord } from '../lib/notifications-store.js';
import { NotificationType } from '../domain/enums.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { env } from '../config/env.js';
import { activityDetailPath } from '../lib/member-routes.js';

const uniqueIds = (ids: string[]): string[] => [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

/**
 * Resolve family membership ids into a party roster for the primary joiner.
 * Adults start as `family_invited`; kids as `confirmed` (no account invite).
 * Batched Mongo lookups — O(1) round-trips vs per-member N+1.
 */
export const buildPartyRosterFromMembershipIds = async (input: {
  actorUserId: string;
  membershipIds: string[];
  existing?: ActivityPartyMemberDTO[] | null;
}): Promise<ActivityPartyMemberDTO[]> => {
  const ids = uniqueIds(input.membershipIds);
  if (ids.length === 0) return [];

  const existingByMembership = new Map(
    (input.existing ?? []).map((row) => [row.membershipId, row] as const)
  );

  const members = await findGroupMembersByIds(ids);
  const memberById = new Map(members.map((row) => [row.id, row] as const));
  const groupIds = [...new Set(members.map((row) => row.groupId))];
  const [groups, actorMemberships] = await Promise.all([
    findGroupsByIds(groupIds),
    getAdultMembershipsInGroups(groupIds, input.actorUserId),
  ]);
  const groupById = new Map(groups.map((row) => [row.id, row] as const));

  const adultUserIds = members
    .filter((row) => row.memberType === 'adult' && row.userId)
    .map((row) => row.userId!)
    .filter((userId) => userId !== input.actorUserId);
  const users = await findAuthUsersByIds(adultUserIds);
  const userById = new Map(users.map((row) => [row._id, row] as const));

  const roster: ActivityPartyMemberDTO[] = [];

  for (const membershipId of ids) {
    const member = memberById.get(membershipId);
    if (!member || !member.isActive) {
      throw new ApiError(400, 'party_member_not_found', 'Family member not found.');
    }

    const group = groupById.get(member.groupId);
    if (!group || group.type !== 'family') {
      throw new ApiError(400, 'party_member_not_family', 'Only family group members can join an outing together.');
    }

    const actorMembership = actorMemberships.get(member.groupId);
    if (!actorMembership || !actorMembership.isActive) {
      throw new ApiError(403, 'forbidden', 'You must be an adult member of this family to attach them.');
    }

    if (member.memberType === 'adult') {
      if (!member.userId) {
        throw new ApiError(
          400,
          'party_adult_not_joined',
          'Adult family members must accept their family invite before you can add them to an outing.'
        );
      }
      if (member.userId === input.actorUserId) {
        throw new ApiError(400, 'party_self_not_allowed', 'You are already on this outing as the primary joiner.');
      }
      const user = userById.get(member.userId);
      if (!user || !isSignupProfileComplete(user.profile)) {
        throw new ApiError(
          400,
          'party_adult_profile_incomplete',
          'That adult must finish their profile before you can add them to an outing.'
        );
      }
      const prior = existingByMembership.get(membershipId);
      const displayName =
        user.profile.displayName?.trim() ||
        member.displayName?.trim() ||
        user.email.split('@')[0] ||
        'Family member';
      roster.push({
        membershipId: member.id,
        groupId: member.groupId,
        memberType: 'adult',
        userId: member.userId,
        displayName,
        status: prior && prior.status !== 'declined' ? prior.status : 'family_invited',
      });
      continue;
    }

    assertKidProfileComplete(member);
    roster.push({
      membershipId: member.id,
      groupId: member.groupId,
      memberType: 'kid',
      userId: null,
      displayName: member.displayName?.trim() || 'Kid',
      status: 'confirmed',
    });
  }

  return roster;
};

export const headcountFromPartyRoster = (partyMembers: ActivityPartyMemberDTO[]) =>
  derivePartyHeadcountFromRoster(partyMembers);

/** Create outing invites + notifications for newly attached adults. */
export const sendOutingInvitesForNewAdults = async (input: {
  activityId: string;
  requestId: string;
  invitedByUserId: string;
  previous: ActivityPartyMemberDTO[] | null | undefined;
  next: ActivityPartyMemberDTO[];
  activityTitle: string;
}): Promise<void> => {
  const prevAdults = new Set(
    (input.previous ?? [])
      .filter((row) => row.memberType === 'adult' && row.status !== 'declined')
      .map((row) => row.membershipId)
  );

  const toInvite = input.next.filter(
    (row) =>
      row.memberType === 'adult' &&
      row.userId &&
      row.status === 'family_invited' &&
      !prevAdults.has(row.membershipId)
  );
  if (toInvite.length === 0) return;

  const invites = await createActivityFamilyInvitesBatch(
    toInvite.map((row) => ({
      activityId: input.activityId,
      requestId: input.requestId,
      membershipId: row.membershipId,
      groupId: row.groupId,
      inviteeUserId: row.userId!,
      invitedByUserId: input.invitedByUserId,
    }))
  );

  for (let i = 0; i < invites.length; i += 1) {
    const invite = invites[i]!;
    const row = toInvite[i]!;
    const path = `${activityDetailPath(input.activityId)}?familyInvite=${invite.token}`;
    scheduleSideEffect(
      createNotificationRecord({
        userId: row.userId!,
        type: NotificationType.SYSTEM,
        title: 'Family outing invite',
        body: `You're invited to join “${input.activityTitle}” with your family.`,
        meta: {
          activityId: input.activityId,
          requestId: input.requestId,
          familyInviteToken: invite.token,
          path,
          linkUrl: `${env.APP_BASE_URL}${path}`,
        },
      }),
      'activity.family_outing_invite_notification'
    );
  }
};
