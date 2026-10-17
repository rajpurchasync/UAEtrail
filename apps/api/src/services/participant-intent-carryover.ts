import { enrollHostApprovedActivityParticipant } from '../lib/activity-engagement-store.js';
import { listApprovedParticipantIntentJoinerUserIds } from '../lib/participant-intent-requests-store.js';

export type DemandCarryoverResult = {
  enrolledUserIds: string[];
  skippedUserIds: string[];
};

/** Copy demand-approved crew onto the poster's published activity (host-approved enrollment, not RSVP). */
export const carryApprovedDemandJoinersToActivity = async (input: {
  intentId: string;
  activityId: string;
  hostUserId: string;
}): Promise<DemandCarryoverResult> => {
  const userIds = await listApprovedParticipantIntentJoinerUserIds(input.intentId);
  const enrolledUserIds: string[] = [];
  const skippedUserIds: string[] = [];

  for (const userId of userIds) {
    const result = await enrollHostApprovedActivityParticipant({
      activityId: input.activityId,
      userId,
      reviewerId: input.hostUserId,
      hostNote: 'Joined from your demand plan',
      lenient: true,
    });
    if (result === 'enrolled') enrolledUserIds.push(userId);
    else skippedUserIds.push(userId);
  }

  return { enrolledUserIds, skippedUserIds };
};
