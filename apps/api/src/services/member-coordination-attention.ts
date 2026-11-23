import type {
  MemberCoordinationAttentionDTO,
  MemberCoordinationAttentionItemDTO,
} from '@uaetrail/shared-types';
import {
  countTenantPendingJoinRequests,
  countUserUpcomingPendingJoinRequests,
} from '../lib/activity-engagement-store.js';
import { countPendingIncomingFriendRequests } from '../lib/friend-store.js';
import { countUnreadNotificationsByMetaKind } from '../lib/notifications-store.js';
import { resolveMemberStatus } from './member-status.js';
import {
  countPendingActivityJoinInvitesForUser,
  listPendingActivityJoinInvitesForUser,
} from './activity-invite.js';

/** `GET /me/coordination-attention` — factual coordination signals for the signed-in member. */
export const loadMemberCoordinationAttention = async (
  userId: string
): Promise<MemberCoordinationAttentionDTO> => {
  const hostStatus = await resolveMemberStatus(userId);
  const tenantId = hostStatus.tenantId;

  const [
    hostJoinQueue,
    joinerPendingHost,
    incomingFriendCount,
    activityInviteCount,
    unreadByKind,
  ] = await Promise.all([
    tenantId && hostStatus.canPublish ? countTenantPendingJoinRequests(tenantId) : Promise.resolve(0),
    countUserUpcomingPendingJoinRequests(userId),
    countPendingIncomingFriendRequests(userId),
    countPendingActivityJoinInvitesForUser(userId),
    countUnreadNotificationsByMetaKind(userId, [
      'request_withdrawal',
      'activity_participant_revoked',
      'join_request_rejected',
    ]),
  ]);

  const items: MemberCoordinationAttentionItemDTO[] = [];

  if (hostJoinQueue > 0) {
    items.push({ kind: 'host_join_queue', count: hostJoinQueue });
  }

  const withdrawals = unreadByKind.request_withdrawal ?? 0;
  if (withdrawals > 0) {
    items.push({ kind: 'join_request_withdrawn', count: withdrawals });
  }

  if (joinerPendingHost > 0) {
    items.push({ kind: 'joiner_pending_host', count: joinerPendingHost });
  }

  const rejected = unreadByKind.join_request_rejected ?? 0;
  if (rejected > 0) {
    items.push({ kind: 'join_request_rejected', count: rejected });
  }

  const revoked = unreadByKind.activity_participant_revoked ?? 0;
  if (revoked > 0) {
    items.push({ kind: 'participant_revoked', count: revoked });
  }

  if (incomingFriendCount > 0) {
    items.push({ kind: 'friend_request_incoming', count: incomingFriendCount });
  }

  if (activityInviteCount > 0) {
    let activityId: string | null = null;
    let inviterDisplayName: string | null = null;
    if (activityInviteCount === 1) {
      const [first] = await listPendingActivityJoinInvitesForUser(userId, 1);
      if (first) {
        activityId = first.activityId;
        inviterDisplayName = first.inviterDisplayName;
      }
    }
    items.push({
      kind: 'activity_join_invite',
      count: activityInviteCount,
      activityId,
      inviterDisplayName,
    });
  }

  return { items };
};
