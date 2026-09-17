import { MembershipRole, RequestStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { countRecentMessagesBySender } from '../lib/chat-data.js';
import {
  hasActiveJoinRequestLink,
  hasHostToParticipantLink,
  hasParticipantToHostLink,
  hasSharedActivityParticipation,
  hasActivityInquiryAccess
} from '../lib/activity-engagement-store.js';
import { areAcceptedBuddies } from '../lib/buddy-store.js';

const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.APPROVED,
  RequestStatus.WAITLISTED
];

const ORGANIZER_ROLES: MembershipRole[] = [
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
    organizerRoles: ORGANIZER_ROLES,
    activeStatuses: ACTIVE_REQUEST_STATUSES
  });
  if (joinRequestLink) return true;

  const participantToHost = await hasParticipantToHostLink({
    participantUserId: senderId,
    hostUserId: receiverId,
    organizerRoles: ORGANIZER_ROLES
  });
  if (participantToHost) return true;

  const hostToParticipant = await hasHostToParticipantLink(senderId, receiverId);
  if (hostToParticipant) return true;

  if (options?.activityId) {
    const activityInquiry = await hasActivityInquiryAccess({
      activityId: options.activityId,
      receiverId,
      organizerRoles: ORGANIZER_ROLES
    });
    if (activityInquiry) return true;
  }

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
