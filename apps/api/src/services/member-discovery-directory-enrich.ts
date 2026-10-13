import type {
  MemberBrowseCardDTO,
  MemberProfileRoleLabel,
  SocialPersonBuddyRequestState,
} from '@uaetrail/shared-types';
import { resolveMemberProfileRoleLabel } from '../domain/member-profile-label.js';
import { UserRole } from '../domain/enums.js';
import { countUserCheckedInParticipations } from '../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../lib/auth-users.js';
import { listBuddyRequestsForUser } from '../lib/buddy-store.js';
import { resolveMemberHostStatus } from './member-host-status.js';
import { canMessageUser } from './chat-policy.js';

const BIO_PREVIEW_MAX = 140;

const trimBio = (bio: string | null | undefined): string | null => {
  const trimmed = bio?.trim();
  if (!trimmed) return null;
  if (trimmed.length <= BIO_PREVIEW_MAX) return trimmed;
  return `${trimmed.slice(0, BIO_PREVIEW_MAX - 1).trimEnd()}…`;
};

const buddyRequestStateForTarget = (
  targetUserId: string,
  pendingIncoming: Set<string>,
  pendingOutgoing: Set<string>
): SocialPersonBuddyRequestState => {
  if (pendingIncoming.has(targetUserId)) return 'incoming';
  if (pendingOutgoing.has(targetUserId)) return 'outgoing';
  return 'none';
};

export const enrichMemberBrowseDirectory = async (
  viewerUserId: string,
  cards: MemberBrowseCardDTO[]
): Promise<MemberBrowseCardDTO[]> => {
  if (cards.length === 0) return cards;

  const userIds = cards.map((card) => card.id);
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  const [requests, attendedPairs, messagePairs, rolePairs] = await Promise.all([
    listBuddyRequestsForUser(viewerUserId, 'all'),
    Promise.all(
      userIds.map(async (userId) => [userId, await countUserCheckedInParticipations(userId)] as const)
    ),
    Promise.all(
      userIds.map(async (userId) => [userId, await canMessageUser(viewerUserId, userId)] as const)
    ),
    Promise.all(
      userIds.map(async (userId) => {
        const hostStatus = await resolveMemberHostStatus(userId);
        const user = userMap.get(userId);
        const label = resolveMemberProfileRoleLabel({
          role: (user?.role as UserRole) ?? UserRole.PARTICIPANT,
          hostTiers: hostStatus.hostTiers,
          isCommunityHost: hostStatus.isCommunityHost,
          hasAgencyProfile: hostStatus.hasAgencyProfile,
          hasShopProfile: hostStatus.hasShopProfile,
        });
        return [userId, label] as const;
      })
    ),
  ]);

  const attendedMap = new Map(attendedPairs);
  const messageMap = new Map(messagePairs);
  const roleMap = new Map(rolePairs);
  const pendingIncoming = new Set(
    requests
      .filter((r) => r.status === 'pending' && r.toUserId === viewerUserId)
      .map((r) => r.fromUserId)
      .filter(Boolean) as string[]
  );
  const pendingOutgoing = new Set(
    requests
      .filter((r) => r.status === 'pending' && r.fromUserId === viewerUserId)
      .map((r) => r.toUserId)
      .filter(Boolean) as string[]
  );

  return cards.map((card) => {
    const user = userMap.get(card.id);
    const buddyRequestState = buddyRequestStateForTarget(card.id, pendingIncoming, pendingOutgoing);
    const canSendBuddyRequest =
      buddyRequestState === 'none' && card.id !== viewerUserId;

    return {
      ...card,
      bioPreview: trimBio(user?.profile?.bio ?? null),
      activitiesAttended: attendedMap.get(card.id) ?? 0,
      profileRoleLabel: (roleMap.get(card.id) ?? 'community_member') as MemberProfileRoleLabel,
      canMessage: messageMap.get(card.id) ?? false,
      canSendBuddyRequest,
      buddyRequestState,
    };
  });
};
