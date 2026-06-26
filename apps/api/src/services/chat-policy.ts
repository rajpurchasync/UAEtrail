import { MembershipRole, RequestStatus, EventStatus } from '@prisma/client';
import { ApiError } from '../lib/api-error.js';
import { prisma } from '../lib/prisma.js';

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
  const recent = await prisma.chatMessage.count({
    where: { senderId, createdAt: { gte: since } }
  });
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
  options?: { eventId?: string }
): Promise<void> {
  const existingThread = await prisma.chatMessage.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    },
    select: { id: true }
  });
  if (existingThread) return;

  const sharedTrip = await prisma.eventParticipant.findFirst({
    where: {
      userId: senderId,
      event: {
        participants: { some: { userId: receiverId } }
      }
    },
    select: { id: true }
  });
  if (sharedTrip) return;

  const joinRequestLink = await prisma.eventRequest.findFirst({
    where: {
      status: { in: ACTIVE_REQUEST_STATUSES },
      OR: [
        {
          userId: senderId,
          event: {
            OR: [
              { guideId: receiverId },
              { createdById: receiverId },
              {
                tenant: {
                  memberships: {
                    some: { userId: receiverId, role: { in: ORGANIZER_ROLES } }
                  }
                }
              }
            ]
          }
        },
        {
          userId: receiverId,
          event: {
            OR: [
              { guideId: senderId },
              { createdById: senderId },
              {
                tenant: {
                  memberships: {
                    some: { userId: senderId, role: { in: ORGANIZER_ROLES } }
                  }
                }
              }
            ]
          }
        }
      ]
    },
    select: { id: true }
  });
  if (joinRequestLink) return;

  const participantToHost = await prisma.eventParticipant.findFirst({
    where: {
      userId: senderId,
      event: {
        OR: [
          { guideId: receiverId },
          { createdById: receiverId },
          {
            tenant: {
              memberships: {
                some: { userId: receiverId, role: { in: ORGANIZER_ROLES } }
              }
            }
          }
        ]
      }
    },
    select: { id: true }
  });
  if (participantToHost) return;

  const hostToParticipant = await prisma.eventParticipant.findFirst({
    where: {
      userId: receiverId,
      event: {
        OR: [{ guideId: senderId }, { createdById: senderId }]
      }
    },
    select: { id: true }
  });
  if (hostToParticipant) return;

  if (options?.eventId) {
    const tripInquiry = await prisma.event.findFirst({
      where: {
        id: options.eventId,
        status: EventStatus.PUBLISHED,
        OR: [
          { guideId: receiverId },
          { createdById: receiverId },
          {
            tenant: {
              memberships: {
                some: { userId: receiverId, role: { in: ORGANIZER_ROLES } }
              }
            }
          }
        ]
      },
      select: { id: true }
    });
    if (tripInquiry) return;
  }

  throw new ApiError(
    403,
    'message_not_allowed',
    'You can only message people you have an existing conversation or trip connection with.'
  );
}
