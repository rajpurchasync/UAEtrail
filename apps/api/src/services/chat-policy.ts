import { MembershipRole, RequestStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { countRecentMessagesBySender, hasThreadBetweenUsers } from '../lib/chat-data.js';
import {
  hasActiveJoinRequestLink,
  hasHostToParticipantLink,
  hasParticipantToHostLink,
  hasSharedActivityParticipation,
  hasTripInquiryAccess
} from '../lib/activity-engagement-store.js';

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
 * Users may message if they already have a thread, share a trip, or have a join-request relationship.
 */
export async function assertCanMessageUser(
  senderId: string,
  receiverId: string,
  options?: { activityId?: string }
): Promise<void> {
  const existingThread = await hasThreadBetweenUsers(senderId, receiverId);
  if (existingThread) return;

  const sharedTrip = await hasSharedActivityParticipation(senderId, receiverId);
  if (sharedTrip) return;

  const joinRequestLink = await hasActiveJoinRequestLink({
    senderId,
    receiverId,
    organizerRoles: ORGANIZER_ROLES,
    activeStatuses: ACTIVE_REQUEST_STATUSES
  });
  if (joinRequestLink) return;

  const participantToHost = await hasParticipantToHostLink({
    participantUserId: senderId,
    hostUserId: receiverId,
    organizerRoles: ORGANIZER_ROLES
  });
  if (participantToHost) return;

  const hostToParticipant = await hasHostToParticipantLink(senderId, receiverId);
  if (hostToParticipant) return;

  if (options?.activityId) {
    const tripInquiry = await hasTripInquiryAccess({
      activityId: options.activityId,
      receiverId,
      organizerRoles: ORGANIZER_ROLES
    });
    if (tripInquiry) return;
  }

  throw new ApiError(
    403,
    'message_not_allowed',
    'You can only message people you have an existing conversation or trip connection with.'
  );
}
