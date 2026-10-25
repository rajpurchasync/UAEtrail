import { ApiError } from '../lib/api-error.js';
import { findTenantActivityById } from '../lib/activities-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import { revokeHostActivityParticipant, setHostParticipantRating } from '../lib/activity-engagement-store.js';
import { activityTimingHasEnded } from '../lib/participant-roster-dto.js';
import { notifyParticipantRevokedByHost } from './participant-revoke-notifications.js';

const requireTenantActivity = async (activityId: string, tenantId: string) => {
  const activity = await findTenantActivityById(activityId, tenantId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  return activity;
};

export const revokeActivityParticipantAsHost = async (input: {
  tenantId: string;
  activityId: string;
  participantId: string;
  hostUserId: string;
  hostNote: string;
}): Promise<void> => {
  const note = input.hostNote.trim();
  if (note.length < 3) {
    throw new ApiError(400, 'note_required', 'A short note is required when revoking a participant.');
  }

  await requireTenantActivity(input.activityId, input.tenantId);

  const result = await revokeHostActivityParticipant({
    activityId: input.activityId,
    participantId: input.participantId,
    hostUserId: input.hostUserId,
    hostNote: note
  });

  await notifyParticipantRevokedByHost({
    userId: result.userId,
    activityId: input.activityId,
    requestId: result.requestId,
    actorUserId: input.hostUserId,
    hostNote: note
  });
};

export const rateActivityParticipantAsHost = async (input: {
  tenantId: string;
  activityId: string;
  participantId: string;
  hostUserId: string;
  score?: number;
  comment?: string | null;
  rideshare?: {
    cleanliness: number;
    punctuality: number;
    behaviour: number;
    payment?: number | null;
  } | null;
}) => {
  await requireTenantActivity(input.activityId, input.tenantId);

  const eventDoc = await findActivityDocInMongo(input.activityId);
  if (!eventDoc) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const activityEnded = activityTimingHasEnded(eventDoc.startAt, eventDoc.endAt ?? null);

  return setHostParticipantRating({
    activityId: input.activityId,
    participantId: input.participantId,
    score: input.score ?? 5,
    comment: input.comment,
    rideshare: input.rideshare,
    activityEnded
  });
};
