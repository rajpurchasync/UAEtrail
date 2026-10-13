import { ActivityStatus, RewardAction } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findLocationInMongo, findActivityDocInMongo } from '../lib/entity-sync.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { getMongoClient } from '../lib/mongo.js';
import { promptPostActivityReview } from './review-prompt.js';
import { createAuditLog } from '../lib/audit.js';
import { awardPoints } from './rewards.js';

type ActivityTiming = { startAt: Date; endAt: Date | null; status: ActivityStatus };

export function buildParticipationDto(
  _activity: ActivityTiming,
  participant: { id: string; requestId: string; checkedInAt: Date | null }
) {
  return {
    participantId: participant.id,
    requestId: participant.requestId,
    status: 'confirmed' as const,
    checkedInAt: participant.checkedInAt?.toISOString() ?? null,
    canCheckIn: false,
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
  tenantId?: string;
}) {
  const participant = await loadParticipantForCheckIn(opts.activityId, opts.participantId);

  if (!participant) {
    throw new ApiError(404, 'participant_not_found', 'Participant not found.');
  }

  if (opts.tenantId && participant.activity.tenantId !== opts.tenantId) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const activity = participant.activity;

  if (activity.status !== ActivityStatus.PUBLISHED) {
    throw new ApiError(400, 'activity_not_checkinable', 'This activity is not open for check-in.');
  }

  if (participant.checkedInAt) {
    return {
      checkedInAt: participant.checkedInAt,
      alreadyCheckedIn: true
    };
  }

  const checkedInAt = new Date();

  await activityParticipantsCollection().updateOne({ _id: participant.id }, { $set: { checkedInAt } });

  const hostUserId = activity.hostId ?? activity.createdById;

  void awardPoints({
    userId: participant.userId,
    action: RewardAction.ACTIVITY_ATTENDED,
    referenceId: `${activity.id}:${participant.userId}`,
    label: `Attended: ${activity.title}`,
  }).catch(() => undefined);

  void awardPoints({
    userId: hostUserId,
    action: RewardAction.ACTIVITY_HOSTED,
    referenceId: activity.id,
    label: `Hosted activity: ${activity.title}`,
  }).catch(() => undefined);

  await createAuditLog({
    actorId: opts.actorUserId,
    action: 'participant.checkin',
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

  void import('../lib/member-map-pins-store.js')
    .then((mod) =>
      mod.upsertVisitedPinFromActivityCheckIn({
        userId: participant.userId,
        activityId: activity.id,
        checkedInAt,
      })
    )
    .then(() =>
      import('./member-goal-notifications.js').then((mod) =>
        mod.notifyMemberGoalAfterProgress(participant.userId)
      )
    )
    .catch(() => undefined);

  return { checkedInAt, alreadyCheckedIn: false };
}
