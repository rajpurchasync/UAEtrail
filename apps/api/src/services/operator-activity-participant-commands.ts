import { ApiError } from '../lib/api-error.js';
import { findTenantActivityById } from '../lib/activities-store.js';
import {
  clearActivityParticipantCheckIn,
  findActivityParticipantByIdAndActivity,
} from '../lib/activity-engagement-store.js';
import { createAuditLog } from '../lib/audit.js';

export const undoTenantActivityParticipantCheckIn = async (input: {
  tenantId: string;
  activityId: string;
  participantId: string;
  actorUserId: string;
}) => {
  const activity = await findTenantActivityById(input.activityId, input.tenantId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const participant = await findActivityParticipantByIdAndActivity(
    input.participantId,
    input.activityId
  );
  if (!participant) {
    throw new ApiError(404, 'participant_not_found', 'Participant not found.');
  }

  await clearActivityParticipantCheckIn(input.participantId);

  await createAuditLog({
    actorId: input.actorUserId,
    action: 'participant.undo_checkin',
    entityType: 'activity_participant',
    entityId: input.participantId,
    tenantId: input.tenantId,
  });
};
