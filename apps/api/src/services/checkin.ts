import { EventStatus, RewardAction } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findLocationInMongo, findEventDocInMongo } from '../lib/entity-sync.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { getMongoClient } from '../lib/mongo.js';
import { promptPostEventReview } from './review-prompt.js';
import { awardPoints } from './rewards.js';
import { createAuditLog } from '../lib/audit.js';

const CHECKIN_EARLY_MS = 2 * 60 * 60 * 1000;
const CHECKIN_LATE_MS = 12 * 60 * 60 * 1000;

type EventTiming = { startAt: Date; endAt: Date | null; status: EventStatus };

export function getCheckInWindow(event: EventTiming) {
  const opensAt = new Date(event.startAt.getTime() - CHECKIN_EARLY_MS);
  const closesAt = event.endAt
    ? new Date(event.endAt.getTime() + CHECKIN_LATE_MS)
    : new Date(event.startAt.getTime() + CHECKIN_LATE_MS);
  const now = new Date();

  return {
    opensAt,
    closesAt,
    isOpen: now >= opensAt && now <= closesAt,
    isUpcoming: now < opensAt,
    isClosed: now > closesAt
  };
}

export function buildParticipationDto(
  event: EventTiming,
  participant: { id: string; requestId: string; checkedInAt: Date | null }
) {
  const window = getCheckInWindow(event);
  const checkedIn = Boolean(participant.checkedInAt);

  return {
    participantId: participant.id,
    requestId: participant.requestId,
    status: 'confirmed' as const,
    checkedInAt: participant.checkedInAt?.toISOString() ?? null,
    canCheckIn: !checkedIn && event.status === EventStatus.PUBLISHED && window.isOpen,
    checkInOpensAt: window.opensAt.toISOString(),
    checkInClosesAt: window.closesAt.toISOString()
  };
}

type CheckInParticipantDoc = {
  _id: string;
  eventId: string;
  requestId: string;
  userId: string;
  approvedById: string;
  checkedInAt: Date | null;
  createdAt: Date;
};

const eventParticipantsCollection = () =>
  getMongoClient()!.db().collection<CheckInParticipantDoc>('event_participants');

const loadParticipantForCheckIn = async (eventId: string, participantId: string) => {
  const participant = await eventParticipantsCollection().findOne({ _id: participantId, eventId });

  if (!participant) return null;

  const eventDoc = await findEventDocInMongo(eventId);
  const location = eventDoc ? await findLocationInMongo(eventDoc.locationId) : null;
  const user = await findAuthUserById(participant.userId);

  if (!eventDoc || !location || !user) return null;

  return {
    id: participant._id,
    eventId: participant.eventId,
    requestId: participant.requestId,
    userId: participant.userId,
    approvedById: participant.approvedById,
    checkedInAt: participant.checkedInAt,
    createdAt: participant.createdAt,
    user: { id: user._id, email: user.email },
    event: {
      id: eventDoc._id,
      tenantId: eventDoc.tenantId,
      locationId: eventDoc.locationId,
      createdById: eventDoc.createdById,
      guideId: eventDoc.guideId,
      title: eventDoc.title,
      status: eventDoc.status,
      startAt: eventDoc.startAt,
      endAt: eventDoc.endAt,
      location: {
        id: location.id,
        name: location.name,
        activityType: location.activityType
      }
    }
  };
};

export async function performParticipantCheckIn(opts: {
  eventId: string;
  participantId: string;
  actorUserId: string;
  source: 'self' | 'organizer';
  tenantId?: string;
}) {
  const participant = await loadParticipantForCheckIn(opts.eventId, opts.participantId);

  if (!participant) {
    throw new ApiError(404, 'participant_not_found', 'Participant not found.');
  }

  if (opts.source === 'self' && participant.userId !== opts.actorUserId) {
    throw new ApiError(403, 'forbidden', 'You can only check yourself in to this trip.');
  }

  if (opts.tenantId && participant.event.tenantId !== opts.tenantId) {
    throw new ApiError(404, 'event_not_found', 'Event not found.');
  }

  const event = participant.event;

  if (event.status !== EventStatus.PUBLISHED) {
    throw new ApiError(400, 'event_not_checkinable', 'This trip is not open for check-in.');
  }

  if (participant.checkedInAt) {
    return {
      checkedInAt: participant.checkedInAt,
      alreadyCheckedIn: true
    };
  }

  if (opts.source === 'self') {
    const window = getCheckInWindow(event);
    if (!window.isOpen) {
      throw new ApiError(
        400,
        'checkin_window_closed',
        window.isUpcoming
          ? 'Check-in opens closer to the trip start time.'
          : 'The check-in window for this trip has closed.'
      );
    }
  }

  const checkedInAt = new Date();

  await eventParticipantsCollection().updateOne({ _id: participant.id }, { $set: { checkedInAt } });

  void awardPoints({
    userId: participant.userId,
    action: RewardAction.TRIP_ATTENDED,
    referenceId: `${event.id}:${participant.userId}`,
    label: `Attended: ${event.title}`
  }).catch(() => undefined);

  const hostUserId = event.guideId ?? event.createdById;
  void awardPoints({
    userId: hostUserId,
    action: RewardAction.EVENT_HOSTED,
    referenceId: event.id,
    label: `Hosted trip: ${event.title}`
  }).catch(() => undefined);

  await createAuditLog({
    actorId: opts.actorUserId,
    action: opts.source === 'self' ? 'participant.self_checkin' : 'participant.checkin',
    entityType: 'event_participant',
    entityId: participant.id,
    tenantId: event.tenantId
  });

  const activityType =
    event.location.activityType === 'HIKING'
      ? 'hiking'
      : event.location.activityType === 'CAMPING'
        ? 'camping'
        : 'community_event';
  await promptPostEventReview({
    userId: participant.userId,
    eventId: event.id,
    locationId: event.locationId,
    locationName: event.location.name,
    activityType
  });

  return { checkedInAt, alreadyCheckedIn: false };
}

/** @deprecated Use performParticipantCheckIn */
export const performParticipantCheckInDefault = performParticipantCheckIn;
