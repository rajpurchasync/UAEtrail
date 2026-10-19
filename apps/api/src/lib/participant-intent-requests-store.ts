import type {
  ParticipantIntentJoinRequestDTO,
  ParticipantIntentJoinRequestViewDTO,
} from '@uaetrail/shared-types';
import type { ActivityRequest } from '../domain/types.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import {
  applyTenantActivityRequestDecision,
  createJoinOrWaitlistRequest,
  findActivityRequestByEventAndUser,
  findActivityRequestByIdAndActivity,
  listActivityEngagementForUserOnActivities,
  listActivityRequestsForActivity,
} from './activity-engagement-store.js';
import { ActivityStatus, RequestStatus } from '../domain/enums.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { resolveIntentPublishedActivityId } from './participant-intents-store.js';
import { findSeekingActivityByParticipantIntentId } from '../services/participant-intent-activity-readthrough.js';

type MongoParticipantIntentJoinRequest = {
  _id: string;
  intentId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  note: string | null;
  activityRequestId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MongoParticipantIntent = {
  _id: string;
  userId: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  activityId?: string | null;
  seekingActivityId?: string | null;
};

const ACTIVE_ACTIVITY_REQUEST_STATUSES: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.APPROVED,
  RequestStatus.WAITLISTED,
];

const requestsCollection = () =>
  getMongoClient()!.db().collection<MongoParticipantIntentJoinRequest>(
    COLLECTIONS.PARTICIPANT_INTENT_REQUESTS
  );

const seekingActivityToIntentRecord = (activity: MongoActivityDoc): MongoParticipantIntent | null => {
  const intentId = activity.participantIntentId?.trim();
  if (!intentId) return null;
  const ownerUserId = activity.hostId ?? activity.createdById;
  if (!ownerUserId) return null;

  let status: MongoParticipantIntent['status'] = 'active';
  if (activity.seekingConvertedActivityId) status = 'fulfilled';
  else if (activity.status === ActivityStatus.CANCELLED) status = 'cancelled';

  return {
    _id: intentId,
    userId: ownerUserId,
    status,
    activityId: activity._id,
    seekingActivityId: activity._id,
  };
};

/** Seeking activity for join/carryover — includes fulfilled/cancelled rows. */
const findIntentRecordForEngagement = async (
  intentId: string
): Promise<MongoParticipantIntent | null> => {
  const activity = await findSeekingActivityByParticipantIntentId(intentId);
  if (!activity) return null;
  return seekingActivityToIntentRecord(activity);
};

/** Active looking-for post — seeking activity only. */
const findActiveIntentRecord = async (intentId: string): Promise<MongoParticipantIntent | null> => {
  const activity = await findSeekingActivityByParticipantIntentId(intentId);
  if (!activity) return null;
  const mapped = seekingActivityToIntentRecord(activity);
  if (!mapped || mapped.status !== 'active') return null;
  return mapped;
};

const mapDto = (doc: MongoParticipantIntentJoinRequest): ParticipantIntentJoinRequestDTO => ({
  id: doc._id,
  intentId: doc.intentId,
  userId: doc.userId,
  status: doc.status,
  note: doc.note,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const activityRequestToIntentStatus = (
  status: RequestStatus
): ParticipantIntentJoinRequestDTO['status'] | null => {
  if (status === RequestStatus.APPROVED) return 'approved';
  if (status === RequestStatus.PENDING || status === RequestStatus.WAITLISTED) return 'pending';
  if (status === RequestStatus.REJECTED) return 'rejected';
  if (status === RequestStatus.CANCELLED) return 'withdrawn';
  return null;
};

const activityRequestToDto = (
  intentId: string,
  request: ActivityRequest
): ParticipantIntentJoinRequestDTO => {
  const status = activityRequestToIntentStatus(request.status) ?? 'pending';
  return {
    id: request.id,
    intentId,
    userId: request.userId,
    status,
    note: request.note ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
};

const loadIntentJoinRequestsFromActivity = async (
  intent: MongoParticipantIntent,
  activityId: string
): Promise<ParticipantIntentJoinRequestViewDTO[]> => {
  const rows = await listActivityRequestsForActivity(activityId);
  const visible = rows.filter(
    (row) => activityRequestToIntentStatus(row.status) !== 'withdrawn'
  );
  if (visible.length === 0) return [];

  const userIds = [...new Set(visible.map((row) => row.userId))];
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  return visible.map((row) => {
    const requester = userMap.get(row.userId);
    const dto = activityRequestToDto(intent._id, row);
    return {
      ...dto,
      requester: {
        userId: row.userId,
        displayName: requester?.profile?.displayName ?? null,
        avatarUrl: requester?.profile?.avatarUrl ?? null,
      },
    };
  });
};

const resolvePendingActivityJoinRequest = async (
  intent: MongoParticipantIntent,
  requestId: string,
  publishedActivityId: string
): Promise<ActivityRequest> => {
  const direct = await findActivityRequestByIdAndActivity(requestId, publishedActivityId);
  if (direct) {
    if (direct.status !== RequestStatus.PENDING && direct.status !== RequestStatus.WAITLISTED) {
      throw new ApiError(400, 'request_not_pending', 'This request was already handled.');
    }
    return direct;
  }

  const intentBridgeRow = await requestsCollection().findOne({
    _id: requestId,
    intentId: intent._id,
  });
  const linkedId = intentBridgeRow?.activityRequestId;
  if (linkedId) {
    const linked = await findActivityRequestByIdAndActivity(linkedId, publishedActivityId);
    if (linked) {
      if (linked.status !== RequestStatus.PENDING && linked.status !== RequestStatus.WAITLISTED) {
        throw new ApiError(400, 'request_not_pending', 'This request was already handled.');
      }
      return linked;
    }
  }

  throw new ApiError(404, 'request_not_found', 'Join request not found.');
};

export const createParticipantIntentJoinRequest = async (input: {
  intentId: string;
  userId: string;
  note?: string | null;
}): Promise<ParticipantIntentJoinRequestDTO> => {
  const intent = await findActiveIntentRecord(input.intentId);

  if (!intent) {
    throw new ApiError(404, 'intent_not_found', 'This plan is no longer on the map.');
  }
  if (intent.userId === input.userId) {
    throw new ApiError(400, 'cannot_join_own_intent', 'You posted this plan.');
  }

  const publishedActivityId = resolveIntentPublishedActivityId(intent);

  if (!publishedActivityId) {
    throw new ApiError(
      410,
      'seeking_activity_required',
      'This plan is no longer joinable — use the activity on the map.'
    );
  }

  const existing = await findActivityRequestByEventAndUser(publishedActivityId, input.userId);
  if (existing && ACTIVE_ACTIVITY_REQUEST_STATUSES.includes(existing.status)) {
    throw new ApiError(409, 'request_exists', 'You already requested to join this plan.');
  }

  const { request } = await createJoinOrWaitlistRequest({
    activityId: publishedActivityId,
    userId: input.userId,
    note: input.note ?? undefined,
  });
  return activityRequestToDto(intent._id, request);
};

const findActiveIntentForOwner = async (
  intentId: string,
  ownerUserId: string
): Promise<MongoParticipantIntent | null> => {
  const intent = await findActiveIntentRecord(intentId);
  if (!intent || intent.userId !== ownerUserId) return null;
  return intent;
};

export const listParticipantIntentJoinRequestsForOwner = async (
  intentId: string,
  ownerUserId: string
): Promise<ParticipantIntentJoinRequestViewDTO[]> => {
  const intent = await findActiveIntentForOwner(intentId, ownerUserId);
  if (!intent) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
  }

  const publishedActivityId = resolveIntentPublishedActivityId(intent);
  if (publishedActivityId) {
    return loadIntentJoinRequestsFromActivity(intent, publishedActivityId);
  }

  const docs = await requestsCollection()
    .find({ intentId: intent._id, status: { $ne: 'withdrawn' } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  if (docs.length === 0) return [];

  const userIds = [...new Set(docs.map((doc) => doc.userId))];
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  return docs.map((doc) => {
    const requester = userMap.get(doc.userId);
    return {
      ...mapDto(doc),
      requester: {
        userId: doc.userId,
        displayName: requester?.profile?.displayName ?? null,
        avatarUrl: requester?.profile?.avatarUrl ?? null,
      },
    };
  });
};

const resolveJoinRequestForIntent = async (
  intentId: string,
  requestId: string,
  ownerUserId: string
): Promise<{ intent: MongoParticipantIntent; request: MongoParticipantIntentJoinRequest }> => {
  const intent = await findActiveIntentForOwner(intentId, ownerUserId);
  if (!intent) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
  }

  const request = await requestsCollection().findOne({
    _id: requestId,
    intentId: intent._id,
  });

  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Join request not found.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(400, 'request_not_pending', 'This request was already handled.');
  }

  return { intent, request };
};

export const approveParticipantIntentJoinRequest = async (
  intentId: string,
  requestId: string,
  ownerUserId: string
): Promise<ParticipantIntentJoinRequestDTO> => {
  const intent = await findActiveIntentForOwner(intentId, ownerUserId);
  if (!intent) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
  }

  const publishedActivityId = resolveIntentPublishedActivityId(intent);
  if (publishedActivityId) {
    const activityRequest = await resolvePendingActivityJoinRequest(
      intent,
      requestId,
      publishedActivityId
    );
    await applyTenantActivityRequestDecision({
      requestId: activityRequest.id,
      activityId: publishedActivityId,
      userId: activityRequest.userId,
      reviewerId: ownerUserId,
      decision: 'approved',
    });
    const updated = await findActivityRequestByIdAndActivity(
      activityRequest.id,
      publishedActivityId
    );
    if (!updated) {
      throw new ApiError(500, 'approval_failed', 'Could not approve this join request.');
    }
    return activityRequestToDto(intent._id, updated);
  }

  const { request } = await resolveJoinRequestForIntent(intentId, requestId, ownerUserId);
  const now = new Date();
  const updated = await requestsCollection().findOneAndUpdate(
    { _id: request._id, status: 'pending' },
    { $set: { status: 'approved', updatedAt: now } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new ApiError(400, 'request_not_pending', 'This request was already handled.');
  }

  return mapDto(updated);
};

export const rejectParticipantIntentJoinRequest = async (
  intentId: string,
  requestId: string,
  ownerUserId: string
): Promise<ParticipantIntentJoinRequestDTO> => {
  const intent = await findActiveIntentForOwner(intentId, ownerUserId);
  if (!intent) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
  }

  const publishedActivityId = resolveIntentPublishedActivityId(intent);
  if (publishedActivityId) {
    const activityRequest = await resolvePendingActivityJoinRequest(
      intent,
      requestId,
      publishedActivityId
    );
    await applyTenantActivityRequestDecision({
      requestId: activityRequest.id,
      activityId: publishedActivityId,
      userId: activityRequest.userId,
      reviewerId: ownerUserId,
      decision: 'rejected',
    });
    const updated = await findActivityRequestByIdAndActivity(
      activityRequest.id,
      publishedActivityId
    );
    if (!updated) {
      throw new ApiError(500, 'rejection_failed', 'Could not decline this join request.');
    }
    return activityRequestToDto(intent._id, updated);
  }

  const { request } = await resolveJoinRequestForIntent(intentId, requestId, ownerUserId);
  const now = new Date();
  const updated = await requestsCollection().findOneAndUpdate(
    { _id: request._id, status: 'pending' },
    { $set: { status: 'rejected', updatedAt: now } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    throw new ApiError(400, 'request_not_pending', 'This request was already handled.');
  }

  return mapDto(updated);
};

/** Approved joiners to copy onto a linked published activity (excludes poster). */
export const listApprovedParticipantIntentJoinerUserIds = async (
  intentId: string
): Promise<string[]> => {
  const intent = await findIntentRecordForEngagement(intentId);
  if (!intent) return [];

  const publishedActivityId = resolveIntentPublishedActivityId(intent);
  if (publishedActivityId) {
    const rows = await listActivityRequestsForActivity(publishedActivityId);
    return rows
      .filter((row) => row.status === RequestStatus.APPROVED)
      .map((row) => row.userId)
      .filter((userId) => userId !== intent.userId);
  }

  const docs = await requestsCollection()
    .find({ intentId: intent._id, status: 'approved' })
    .toArray();

  return docs.map((doc) => doc.userId).filter((userId) => userId !== intent.userId);
};

/** Batch map for explore map seeking `viewerAccess` (per viewer). */
export const mapIntentJoinRequestStatusByIntentIdsForUser = async (
  userId: string,
  intentIds: string[]
): Promise<Map<string, 'pending' | 'approved'>> => {
  const uniqueIds = [...new Set(intentIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const activities = await getMongoClient()!
    .db()
    .collection<MongoActivityDoc>(COLLECTIONS.ACTIVITIES)
    .find({
      participantIntentId: { $in: uniqueIds },
      activityMode: 'seeking',
    })
    .toArray();

  const activityIdByIntentId = new Map<string, string>();
  for (const activity of activities) {
    const mapped = seekingActivityToIntentRecord(activity);
    if (!mapped || mapped.status !== 'active') continue;
    const activityId = resolveIntentPublishedActivityId(mapped);
    if (activityId) {
      activityIdByIntentId.set(mapped._id, activityId);
    }
  }

  const result = new Map<string, 'pending' | 'approved'>();

  if (activityIdByIntentId.size > 0) {
    const activityIds = [...new Set(activityIdByIntentId.values())];
    const engagement = await listActivityEngagementForUserOnActivities(userId, activityIds);
    for (const [intentId, activityId] of activityIdByIntentId) {
      const status = engagement.requestStatusByActivityId.get(activityId);
      if (status === RequestStatus.APPROVED) {
        result.set(intentId, 'approved');
      } else if (
        status === RequestStatus.PENDING ||
        status === RequestStatus.WAITLISTED
      ) {
        result.set(intentId, 'pending');
      }
    }
  }

  const leftoverIntentIds = uniqueIds.filter((id) => !activityIdByIntentId.has(id));
  if (leftoverIntentIds.length > 0) {
    const docs = await requestsCollection()
      .find({
        userId,
        intentId: { $in: leftoverIntentIds },
        status: { $in: ['pending', 'approved'] },
      })
      .project({ intentId: 1, status: 1 })
      .toArray();

    for (const doc of docs) {
      if (doc.status === 'pending' || doc.status === 'approved') {
        result.set(doc.intentId, doc.status);
      }
    }
  }

  return result;
};

export const findParticipantIntentJoinRequestForUser = async (
  intentId: string,
  userId: string
): Promise<ParticipantIntentJoinRequestDTO | null> => {
  const intent = await findActiveIntentRecord(intentId);
  if (!intent) return null;

  const publishedActivityId = resolveIntentPublishedActivityId(intent);
  if (publishedActivityId) {
    const activityRequest = await findActivityRequestByEventAndUser(publishedActivityId, userId);
    if (!activityRequest) return null;
    const status = activityRequestToIntentStatus(activityRequest.status);
    if (!status || status === 'withdrawn' || status === 'rejected') return null;
    return activityRequestToDto(intent._id, activityRequest);
  }

  const doc = await requestsCollection().findOne({
    intentId: intent._id,
    userId,
    status: { $in: ['pending', 'approved'] },
  });

  return doc ? mapDto(doc) : null;
};
