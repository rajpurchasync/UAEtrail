import { EventStatus, NotificationType, RequestStatus } from '@prisma/client';
import type { Prisma, PrismaClient } from '@prisma/client';
import { ApiError } from '../lib/api-error.js';
import { assertCapacityAvailable } from '../domain/capacity.js';
import { dispatchNotification } from './notifications.js';

type DbClient = PrismaClient | Prisma.TransactionClient;

export const isEventFull = (capacity: number, participantCount: number): boolean =>
  participantCount >= capacity;

const ACTIVE_STATUSES: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.APPROVED,
  RequestStatus.WAITLISTED
];

export async function createJoinOrWaitlistRequest(
  db: PrismaClient,
  opts: { eventId: string; userId: string; note?: string }
) {
  const event = await db.event.findFirst({
    where: { id: opts.eventId, status: EventStatus.PUBLISHED },
    include: { participants: { select: { id: true } } }
  });
  if (!event) {
    throw new ApiError(404, 'event_not_found', 'Event not found.');
  }

  const existing = await db.eventRequest.findUnique({
    where: {
      eventId_userId: { eventId: opts.eventId, userId: opts.userId }
    }
  });

  if (existing && ACTIVE_STATUSES.includes(existing.status)) {
    throw new ApiError(409, 'request_exists', 'You already have an active request for this event.');
  }

  const waitlisted = isEventFull(event.capacity, event.participants.length);
  const status = waitlisted ? RequestStatus.WAITLISTED : RequestStatus.PENDING;

  const request = existing
    ? await db.eventRequest.update({
        where: { id: existing.id },
        data: {
          status,
          note: opts.note ?? existing.note,
          organizerNote: null,
          reviewedAt: null,
          reviewedById: null
        }
      })
    : await db.eventRequest.create({
        data: {
          eventId: opts.eventId,
          userId: opts.userId,
          note: opts.note,
          status
        }
      });

  return { request, waitlisted };
}

/** Promote oldest waitlisted request to pending when a slot opens. */
export async function promoteNextWaitlisted(db: DbClient, eventId: string): Promise<boolean> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { participants: { select: { id: true } } }
  });
  if (!event || isEventFull(event.capacity, event.participants.length)) {
    return false;
  }

  const next = await db.eventRequest.findFirst({
    where: { eventId, status: RequestStatus.WAITLISTED },
    orderBy: { createdAt: 'asc' }
  });
  if (!next) return false;

  await db.eventRequest.update({
    where: { id: next.id },
    data: { status: RequestStatus.PENDING }
  });

  await dispatchNotification(db, {
    userId: next.userId,
    title: 'A spot opened up!',
    body: 'Your waitlisted trip now has availability. Your request is pending organizer approval.',
    type: NotificationType.REQUEST_UPDATE,
    meta: { eventId, requestId: next.id, fromWaitlist: true }
  });

  return true;
}

export function assertCanApproveRequest(capacity: number, participantCount: number): void {
  assertCapacityAvailable(capacity, participantCount);
}
