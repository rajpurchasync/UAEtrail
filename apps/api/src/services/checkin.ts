import { ActivityStatus, RewardAction } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findLocationInMongo, findActivityDocInMongo } from '../lib/entity-sync.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { getMongoClient } from '../lib/mongo.js';
import { promptPostActivityReview } from './review-prompt.js';
import { awardPoints } from './rewards.js';
import { createAuditLog } from '../lib/audit.js';

const CHECKIN_EARLY_MS = 2 * 60 * 60 * 1000;
const CHECKIN_LATE_MS = 12 * 60 * 60 * 1000;

type ActivityTiming = { startAt: Date; endAt: Date | null; status: ActivityStatus };

function getCheckInWindow(activity: ActivityTiming) {
  const opensAt = new Date(activity.startAt.getTime() - CHECKIN_EARLY_MS);
  const closesAt = activity.endAt
    ? new Date(activity.endAt.getTime() + CHECKIN_LATE_MS)
    : new Date(activity.startAt.getTime() + CHECKIN_LATE_MS);
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
  activity: ActivityTiming,
  participant: { id: string; requestId: string; checkedInAt: Date | null }
) {
  const window = getCheckInWindow(activity);
  const checkedIn = Boolean(participant.checkedInAt);

  return {
    participantId: participant.id,
    requestId: participant.requestId,
    status: 'confirmed' as const,
    checkedInAt: participant.checkedInAt?.toISOString() ?? null,
    canCheckIn: !checkedIn && activity.status === ActivityStatus.PUBLISHED && window.isOpen,
    checkInOpensAt: window.opensAt.toISOString(),
    checkInClosesAt: window.closesAt.toISOString()
  };
}

type CheckInParticipantDoc = {
  _id: string;
  activityId: string;
  requestId: string;
  userId: string;
  approvedById: string;
  checkedInAt: Date | null;
  createdAt: Date;
};

const activityParticipantsCollection = () =>
  getMongoClient()!.db().collection<CheckInParticipantDoc>('activity_participants');

const loadParticipantForCheckIn = async (activityId: string, participantId: string) => {
  const participant = await activityParticipantsCollection().findOne({ _id: participantId, activityId });

  if (!participant) return null;

  const eventDoc = await findActivityDocInMongo(activityId);
  const location = eventDoc ? await findLocationInMongo(eventDoc.locationId) : null;
  const user = await findAuthUserById(participant.userId);

  if (!eventDoc || !location || !user) return null;

  return {
    id: participant._id,
    activityId: participant.activityId,
    requestId: participant.requestId,
    userId: participant.userId,
    approvedById: participant.approvedById,
    checkedInAt: participant.checkedInAt,
    createdAt: participant.createdAt,
    user: { id: user._id, email: user.email },
    activity: {
      id: eventDoc._id,
      tenantId: eventDoc.tenantId,
      locationId: eventDoc.locationId,
      createdById: eventDoc.createdById,
      hostId: eventDoc.hostId,
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
  activityId: string;
  participantId: string;
  actorUserId: string;
  source: 'self' | 'organizer';
  tenantId?: string;
}) {
  const participant = await loadParticipantForCheckIn(opts.activityId, opts.participantId);

  if (!participant) {
    throw new ApiError(404, 'participant_not_found', 'Participant not found.');
  }

  if (opts.source === 'self' && participant.userId !== opts.actorUserId) {
    throw new ApiError(403, 'forbidden', 'You can only check yourself in to this trip.');
  }

  if (opts.tenantId && participant.activity.tenantId !== opts.tenantId) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const activity = participant.activity;

  if (activity.status !== ActivityStatus.PUBLISHED) {
    throw new ApiError(400, 'activity_not_checkinable', 'This trip is not open for check-in.');
  }

  if (participant.checkedInAt) {
    return {
      checkedInAt: participant.checkedInAt,
      alreadyCheckedIn: true
    };
  }

  if (opts.source === 'self') {
    const window = getCheckInWindow(activity);
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

  await activityParticipantsCollection().updateOne({ _id: participant.id }, { $set: { checkedInAt } });

  void awardPoints({
    userId: participant.userId,
    action: RewardAction.TRIP_ATTENDED,
    referenceId: `${activity.id}:${participant.userId}`,
    label: `Attended: ${activity.title}`
  }).catch(() => undefined);

  const hostUserId = activity.hostId ?? activity.createdById;
  void awardPoints({
    userId: hostUserId,
    action: RewardAction.ACTIVITY_HOSTED,
    referenceId: activity.id,
    label: `Hosted trip: ${activity.title}`
  }).catch(() => undefined);

  await createAuditLog({
    actorId: opts.actorUserId,
    action: opts.source === 'self' ? 'participant.self_checkin' : 'participant.checkin',
    entityType: 'activity_participant',
    entityId: participant.id,
    tenantId: activity.tenantId
  });

  const activityType =
    activity.location.activityType === 'HIKING'
      ? 'hiking'
      : activity.location.activityType === 'CAMPING'
        ? 'camping'
        : 'event';
  await promptPostActivityReview({
    userId: participant.userId,
    activityId: activity.id,
    locationId: activity.locationId,
    locationName: activity.location.name,
    activityType
  });

  return { checkedInAt, alreadyCheckedIn: false };
}
