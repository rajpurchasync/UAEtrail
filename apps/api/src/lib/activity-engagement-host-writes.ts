import { resolveActivityPartyHeadcount } from '@uaetrail/shared-types';
import { ActivityStatus, RequestStatus } from '../domain/enums.js';
import type { ActivityParticipant } from '../domain/types.js';
import { ApiError } from './api-error.js';
import { newEntityId } from './entity-builders.js';
import {
  findActivityDocInMongo,
  patchActivityInMongo,
  releaseActivityParticipantSlots,
  tryReserveActivityParticipantSlots,
} from './entity-sync.js';
import {
  addParticipantToActivityGroupChat,
  removeParticipantFromActivityGroupChat,
} from '../services/activity-group-chat.js';
import { assertParticipantMeetsWomenOnlyRequirement } from '../domain/activity-audience-requirements.js';
import { scheduleSideEffect } from './schedule-side-effect.js';
import {
  activityParticipantsCollection,
  activityRequestsCollection,
  patchActivityParticipantInMongo,
  patchActivityRequestInMongo,
  releaseSlotsForRequest,
} from './activity-engagement-store-internals.js';
import { promoteNextWaitlisted } from './activity-engagement-join-writes.js';
import {
  findActivityParticipantByEventAndUser,
  findActivityParticipantByIdAndActivity,
  findActivityRequestByEventAndUser,
} from './activity-engagement-store-reads.js';

export type EnrollHostApprovedActivityParticipantResult = 'enrolled' | 'skipped';

/**
 * Host-approved crew row (approval path) — used for tenant request approval and demand carry-over.
 * Does not use RSVP instant-join even when the activity is in rsvp mode.
 */
export const enrollHostApprovedActivityParticipant = async (opts: {
  activityId: string;
  userId: string;
  reviewerId: string;
  /** Host queue row id — avoids request upsert races on activityId+userId unique index. */
  requestId?: string;
  hostNote?: string | null;
  /** When true, skip users who fail audience rules or capacity instead of throwing. */
  lenient?: boolean;
}): Promise<EnrollHostApprovedActivityParticipantResult> => {
  const existingParticipant = await findActivityParticipantByEventAndUser(opts.activityId, opts.userId);
  if (existingParticipant) return 'skipped';

  const eventDoc = await findActivityDocInMongo(opts.activityId);
  if (!eventDoc || eventDoc.status !== ActivityStatus.PUBLISHED) {
    if (opts.lenient) return 'skipped';
    throw new ApiError(400, 'event_not_publishable', 'Event must be published before approval.');
  }

  if (eventDoc.hostId === opts.userId || eventDoc.createdById === opts.userId) return 'skipped';

  try {
    await assertParticipantMeetsWomenOnlyRequirement(opts.userId, eventDoc.requirements ?? []);
  } catch (error) {
    if (opts.lenient) return 'skipped';
    throw error;
  }

  if (eventDoc.participantSlotsUsed === undefined) {
    const participantCount = await activityParticipantsCollection().countDocuments({
      activityId: opts.activityId,
    });
    await patchActivityInMongo(opts.activityId, { participantSlotsUsed: participantCount });
  }

  const existing = await findActivityRequestByEventAndUser(opts.activityId, opts.userId);
  const partyHeadcount = resolveActivityPartyHeadcount(existing?.adults, existing?.kids);

  const reserved = await tryReserveActivityParticipantSlots(
    opts.activityId,
    partyHeadcount,
    ActivityStatus.PUBLISHED
  );
  if (!reserved) {
    if (opts.lenient) return 'skipped';
    throw new ApiError(400, 'activity_full', 'Activity capacity has already been reached.');
  }

  let requestId = opts.requestId ?? existing?.id;
  if (!requestId) {
    if (!opts.lenient) {
      throw new ApiError(404, 'request_not_found', 'Join request not found.');
    }
    requestId = newEntityId();
  }
  const participantId = newEntityId();
  const reviewedAt = new Date();

  try {
    const confirmedPartyMembers = (existing?.partyMembers ?? []).map((row) =>
      row.status === 'host_pending' || row.status === 'accepted'
        ? { ...row, status: 'confirmed' as const }
        : row
    );
    await activityRequestsCollection().updateOne(
      { activityId: opts.activityId, userId: opts.userId },
      {
        $set: {
          status: RequestStatus.APPROVED,
          note: existing?.note ?? null,
          hostNote: opts.hostNote ?? null,
          cancelReason: null,
          cancelMessage: null,
          cancelledAt: null,
          selectedPackageIndex: existing?.selectedPackageIndex ?? null,
          partyApprovalPending: false,
          ...(confirmedPartyMembers.length > 0 ? { partyMembers: confirmedPartyMembers } : {}),
          reviewedAt,
          reviewedById: opts.reviewerId,
          updatedAt: reviewedAt,
        },
        $setOnInsert: {
          _id: requestId,
          activityId: opts.activityId,
          userId: opts.userId,
          createdAt: reviewedAt,
        },
      },
      { upsert: true }
    );

    await activityParticipantsCollection().updateOne(
      { activityId: opts.activityId, userId: opts.userId },
      {
        $set: {
          activityId: opts.activityId,
          requestId,
          userId: opts.userId,
          approvedById: opts.reviewerId,
          checkedInAt: null,
        },
        $setOnInsert: {
          _id: participantId,
          createdAt: reviewedAt,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    await releaseActivityParticipantSlots(opts.activityId, partyHeadcount);
    throw error;
  }

  scheduleSideEffect(
    addParticipantToActivityGroupChat({
      activityId: opts.activityId,
      userId: opts.userId,
    }),
    'engagement.rsvp_add_group_chat'
  );

  return 'enrolled';
};

export const applyTenantActivityRequestDecision = async (input: {
  requestId: string;
  activityId: string;
  userId: string;
  reviewerId: string;
  decision: 'approved' | 'rejected';
  hostNote?: string;
}) => {
  const reviewedAt = new Date();

  if (input.decision === 'approved') {
    const enrolled = await enrollHostApprovedActivityParticipant({
      activityId: input.activityId,
      userId: input.userId,
      reviewerId: input.reviewerId,
      requestId: input.requestId,
      hostNote: input.hostNote ?? null,
    });

    if (enrolled === 'skipped') {
      const existingParticipant = await findActivityParticipantByEventAndUser(
        input.activityId,
        input.userId
      );
      if (existingParticipant) return;
      throw new ApiError(400, 'approval_failed', 'Could not approve this join request.');
    }
    return;
  }

  await patchActivityRequestInMongo(input.requestId, {
    status: RequestStatus.REJECTED,
    hostNote: input.hostNote ?? null,
    reviewedById: input.reviewerId,
    reviewedAt
  });

  const mongoRow = await activityRequestsCollection().findOne({ _id: input.requestId });
  if (!mongoRow) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }
};

export const cancelUserActivityRequestAndPromoteWaitlist = async (input: {
  requestId: string;
  activityId: string;
  userId: string;
  cancelReason: string;
  cancelMessage: string | null;
}) => {
  const cancelledAt = new Date();

  await patchActivityRequestInMongo(input.requestId, {
    status: RequestStatus.CANCELLED,
    cancelReason: input.cancelReason,
    cancelMessage: input.cancelMessage,
    cancelledAt
  });
  const deleted = await activityParticipantsCollection().deleteMany({ requestId: input.requestId });
  if (deleted.deletedCount > 0) {
    await releaseSlotsForRequest(input.activityId, input.requestId);
    scheduleSideEffect(
      removeParticipantFromActivityGroupChat({
        activityId: input.activityId,
        userId: input.userId,
      }),
      'engagement.cancel_remove_group_chat'
    );
  }
  await promoteNextWaitlisted(input.activityId);
};

export const revokeHostActivityParticipant = async (input: {
  activityId: string;
  participantId: string;
  hostUserId: string;
  hostNote: string;
}): Promise<{ requestId: string; userId: string }> => {
  const participant = await findActivityParticipantByIdAndActivity(input.participantId, input.activityId);
  if (!participant) {
    throw new ApiError(404, 'participant_not_found', 'Participant not found.');
  }
  if (participant.checkedInAt) {
    throw new ApiError(400, 'cannot_revoke_checked_in', 'Cannot revoke after attendance is confirmed.');
  }

  const cancelledAt = new Date();
  await patchActivityRequestInMongo(participant.requestId, {
    status: RequestStatus.CANCELLED,
    hostNote: input.hostNote,
    cancelReason: 'host_revoked',
    cancelMessage: input.hostNote,
    cancelledAt
  });

  const deleted = await activityParticipantsCollection().deleteOne({ _id: participant.id });
  if (deleted.deletedCount > 0) {
    await releaseSlotsForRequest(input.activityId, participant.requestId);
    scheduleSideEffect(
      removeParticipantFromActivityGroupChat({
        activityId: input.activityId,
        userId: participant.userId,
      }),
      'engagement.revoke_remove_group_chat'
    );
  }
  await promoteNextWaitlisted(input.activityId);

  return { requestId: participant.requestId, userId: participant.userId };
};

const meanRideshareScore = (rideshare: {
  cleanliness: number;
  punctuality: number;
  behaviour: number;
  payment?: number | null;
}): number => {
  const parts = [rideshare.cleanliness, rideshare.punctuality, rideshare.behaviour];
  if (rideshare.payment != null) parts.push(rideshare.payment);
  return Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length);
};

export const setHostParticipantRating = async (input: {
  activityId: string;
  participantId: string;
  score: number;
  comment?: string | null;
  rideshare?: {
    cleanliness: number;
    punctuality: number;
    behaviour: number;
    payment?: number | null;
  } | null;
  activityEnded: boolean;
}): Promise<ActivityParticipant> => {
  if (!input.activityEnded) {
    throw new ApiError(400, 'activity_not_ended', 'You can rate participants after the outing ends.');
  }
  const score = input.rideshare ? meanRideshareScore(input.rideshare) : input.score;
  if (score < 1 || score > 5) {
    throw new ApiError(400, 'invalid_rating', 'Rating must be between 1 and 5.');
  }

  const participant = await findActivityParticipantByIdAndActivity(input.participantId, input.activityId);
  if (!participant) {
    throw new ApiError(404, 'participant_not_found', 'Participant not found.');
  }
  if (!participant.checkedInAt) {
    throw new ApiError(400, 'not_checked_in', 'Confirm attendance before rating.');
  }
  if (participant.hostRatedAt) {
    throw new ApiError(400, 'already_rated', 'You already rated this participant.');
  }

  const ratedAt = new Date();
  await patchActivityParticipantInMongo(participant.id, {
    hostRatingScore: score,
    hostRatingComment: input.comment?.trim() || null,
    hostRatingRideshare: input.rideshare ?? null,
    hostRatedAt: ratedAt
  });

  const updated = await findActivityParticipantByIdAndActivity(input.participantId, input.activityId);
  if (!updated) {
    throw new ApiError(500, 'rating_failed', 'Could not save rating.');
  }
  return updated;
};

export const purgeUserActivityEngagement = async (userId: string): Promise<void> => {
  const participants = await activityParticipantsCollection().find({ userId }).toArray();
  for (const participant of participants) {
    await releaseSlotsForRequest(participant.activityId, participant.requestId);
  }
  await activityParticipantsCollection().deleteMany({ userId });
  await activityRequestsCollection().deleteMany({ userId });
};