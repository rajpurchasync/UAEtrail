import type {
  MemberBrowseCardDTO,
  MemberProfileRoleLabel,
  SocialPersonBuddyRequestState,
} from '@uaetrail/shared-types';
import { countCheckedInParticipationsForUserIds } from '../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../lib/auth-users.js';
import { listBuddyRequestsForUser } from '../lib/buddy-store.js';
import { filterInboxMessageablePartnerIds } from './chat-policy.js';
import { batchResolveMemberProfileRoleLabelsForDirectory } from './member-host-status.js';

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

  const [requests, attendedMap, messageablePartnerIds, roleMap] = await Promise.all([
    listBuddyRequestsForUser(viewerUserId, 'all'),
    countCheckedInParticipationsForUserIds(userIds),
    filterInboxMessageablePartnerIds(viewerUserId, userIds),
    batchResolveMemberProfileRoleLabelsForDirectory(users),
  ]);
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
      canMessage: messageablePartnerIds.has(card.id),
      canSendBuddyRequest,
      buddyRequestState,
    };
  });
};
