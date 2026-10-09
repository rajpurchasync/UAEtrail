import { ApiError } from '../lib/api-error.js';
import {
  applyTenantActivityRequestDecision,
  createJoinOrWaitlistRequest,
  findActivityRequestByEventAndUser,
} from '../lib/activity-engagement-store.js';
import { logger } from '../lib/logger.js';

/** M2 step 1 — mirror intent join requests onto the linked seeking activity. */
export const mirrorIntentJoinRequestToActivity = async (input: {
  seekingActivityId: string;
  userId: string;
  note?: string | null;
}): Promise<string | null> => {
  try {
    const { request } = await createJoinOrWaitlistRequest({
      activityId: input.seekingActivityId,
      userId: input.userId,
      note: input.note ?? undefined,
    });
    return request.id;
  } catch (error) {
    if (error instanceof ApiError && error.code === 'request_exists') {
      const existing = await findActivityRequestByEventAndUser(
        input.seekingActivityId,
        input.userId
      );
      return existing?.id ?? null;
    }
    logger.warn(
      { err: error, seekingActivityId: input.seekingActivityId, userId: input.userId },
      'intent join mirror to activity_requests failed'
    );
    return null;
  }
};

export const mirrorIntentJoinDecisionToActivity = async (input: {
  activityRequestId: string;
  seekingActivityId: string;
  joinerUserId: string;
  ownerUserId: string;
  approved: boolean;
}): Promise<void> => {
  try {
    await applyTenantActivityRequestDecision({
      requestId: input.activityRequestId,
      activityId: input.seekingActivityId,
      userId: input.joinerUserId,
      reviewerId: input.ownerUserId,
      decision: input.approved ? 'approved' : 'rejected',
    });
  } catch (error) {
    logger.warn(
      { err: error, activityRequestId: input.activityRequestId },
      'intent join decision mirror to activity_requests failed'
    );
  }
};
