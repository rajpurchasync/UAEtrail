import { MembershipRole, RequestStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { countRecentMessagesBySender } from '../lib/chat-messages-store.js';
import {
  batchCanMessagePartnersFromViewer,
  hasActiveJoinRequestLink,
  hasHostToParticipantLink,
  hasParticipantToHostLink,
  hasSharedActivityParticipation,
  hasActivityInquiryAccess
} from '../lib/activity-engagement-store.js';
import { areAcceptedBuddies, listBuddiesForUser } from '../lib/buddy-store.js';
import { hasDirectedMessageFromTo, listPartnersWhoSentToUser } from '../lib/chat-messages-store.js';
import { listInboundChatEnabledShopAdminIds } from '../lib/shop-store.js';

const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.APPROVED,
  RequestStatus.WAITLISTED
];

const HOST_MEMBERSHIP_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
  MembershipRole.TENANT_GUIDE
];

/** Max outbound messages per user per minute. */
const MESSAGES_PER_MINUTE = 30;

export async function assertChatRateLimit(senderId: string): Promise<void> {
  const since = new Date(Date.now() - 60_000);
  const recent = await countRecentMessagesBySender(senderId, since);
  if (recent >= MESSAGES_PER_MINUTE) {
    throw new ApiError(429, 'rate_limit_exceeded', 'Too many messages. Please slow down.');
  }
}

/**
 * Users may message when they are accepted buddies or share an active activity / request relationship.
 * A past DM thread alone does not grant access — unfriended buddies cannot keep messaging.
 *
 * Platform admins have no bypass: they cannot read private DMs or group chat unless they are
 * participants with the same relationship rules as any other member.
 */
export async function canMessageUser(
  senderId: string,
  receiverId: string,
  options?: { activityId?: string }
): Promise<boolean> {
  if (await areAcceptedBuddies(senderId, receiverId)) return true;

  const sharedActivity = await hasSharedActivityParticipation(senderId, receiverId);
  if (sharedActivity) return true;

  const joinRequestLink = await hasActiveJoinRequestLink({
    senderId,
    receiverId,
    hostMembershipRoles: HOST_MEMBERSHIP_ROLES,
    activeStatuses: ACTIVE_REQUEST_STATUSES
  });
  if (joinRequestLink) return true;

  const participantToHost = await hasParticipantToHostLink({
    participantUserId: senderId,
    hostUserId: receiverId,
    hostMembershipRoles: HOST_MEMBERSHIP_ROLES
  });
  if (participantToHost) return true;

  const hostToParticipant = await hasHostToParticipantLink(senderId, receiverId);
  if (hostToParticipant) return true;

  if (options?.activityId) {
    const activityInquiry = await hasActivityInquiryAccess({
      activityId: options.activityId,
      receiverId,
      hostMembershipRoles: HOST_MEMBERSHIP_ROLES
    });
    if (activityInquiry) return true;
  }

  const shopChatAdmins = await listInboundChatEnabledShopAdminIds([senderId, receiverId]);
  if (shopChatAdmins.has(receiverId)) return true;
  if (shopChatAdmins.has(senderId) && (await hasDirectedMessageFromTo(receiverId, senderId))) return true;

  return false;
}

export async function assertCanMessageUser(
  senderId: string,
  receiverId: string,
  options?: { activityId?: string }
): Promise<void> {
  if (await canMessageUser(senderId, receiverId, options)) return;

  throw new ApiError(
    403,
    'message_not_allowed',
    'You can only message people you are connected with as buddies or share an activity connection with.'
  );
}

/** Inbox: one buddy list read, then policy checks only for non-buddy partners. */
export async function filterInboxMessageablePartnerIds(
  viewerId: string,
  partnerIds: string[]
): Promise<Set<string>> {
  const unique = [...new Set(partnerIds.filter(Boolean))];
  if (unique.length === 0) return new Set();

  const buddies = await listBuddiesForUser(viewerId);
  const buddyIds = new Set(buddies.map((b) => b.userId));
  const allowed = new Set<string>();
  const toCheck: string[] = [];

  for (const partnerId of unique) {
    if (buddyIds.has(partnerId)) {
      allowed.add(partnerId);
    } else {
      toCheck.push(partnerId);
    }
  }

  if (toCheck.length > 0) {
    const linked = await batchCanMessagePartnersFromViewer({
      viewerId,
      partnerIds: toCheck,
      hostMembershipRoles: HOST_MEMBERSHIP_ROLES,
      activeStatuses: ACTIVE_REQUEST_STATUSES,
    });
    for (const partnerId of linked) {
      allowed.add(partnerId);
    }
  }

  const remaining = unique.filter((partnerId) => !allowed.has(partnerId));
  if (remaining.length > 0) {
    const shopChatAdmins = await listInboundChatEnabledShopAdminIds([viewerId, ...remaining]);
    for (const partnerId of remaining) {
      if (shopChatAdmins.has(partnerId)) allowed.add(partnerId);
    }
    const shopReplyCandidates = remaining.filter((partnerId) => !allowed.has(partnerId));
    if (shopChatAdmins.has(viewerId) && shopReplyCandidates.length > 0) {
      const inbound = await listPartnersWhoSentToUser(viewerId, shopReplyCandidates);
      for (const partnerId of inbound) {
        allowed.add(partnerId);
      }
    }
  }

  return allowed;
}
