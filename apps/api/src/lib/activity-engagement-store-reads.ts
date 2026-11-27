import { RequestStatus } from '../domain/enums.js';
import type { ActivityParticipant, ActivityRequest } from '../domain/types.js';
import { ApiError } from './api-error.js';
import {
  activityParticipantsCollection,
  activityRequestsCollection,
  patchActivityParticipantInMongo,
  toActivityParticipantRecord,
  toActivityRequestRecord,
} from './activity-engagement-store-internals.js';

export const findActivityRequestByEventAndUser = async (
  activityId: string,
  userId: string
): Promise<ActivityRequest | null> => {
  const row = await activityRequestsCollection().findOne({ activityId, userId });
  return row ? toActivityRequestRecord(row) : null;
};

export const findActivityRequestByIdAndActivity = async (
  requestId: string,
  activityId: string
): Promise<ActivityRequest | null> => {
  const row = await activityRequestsCollection().findOne({ _id: requestId, activityId });
  return row ? toActivityRequestRecord(row) : null;
};

export const findActivityRequestByIdForUser = async (
  id: string,
  userId: string
): Promise<ActivityRequest | null> => {
  const row = await activityRequestsCollection().findOne({ _id: id, userId });
  return row ? toActivityRequestRecord(row) : null;
};
export const findActivityParticipantByEventAndUser = async (
  activityId: string,
  userId: string
): Promise<ActivityParticipant | null> => {
  const row = await activityParticipantsCollection().findOne({ activityId, userId });
  return row ? toActivityParticipantRecord(row) : null;
};

/** Batch load for explore map `viewerAccess` hints (per viewer, not cached). */
export const listActivityEngagementForUserOnActivities = async (
  userId: string,
  activityIds: string[]
): Promise<{
  participantActivityIds: Set<string>;
  requestStatusByActivityId: Map<string, RequestStatus>;
}> => {
  const uniqueIds = [...new Set(activityIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { participantActivityIds: new Set(), requestStatusByActivityId: new Map() };
  }

  const [participantRows, requestRows] = await Promise.all([
    activityParticipantsCollection()
      .find({ userId, activityId: { $in: uniqueIds } })
      .project({ activityId: 1 })
      .toArray(),
    activityRequestsCollection()
      .find({ userId, activityId: { $in: uniqueIds } })
      .toArray(),
  ]);

  const participantActivityIds = new Set(participantRows.map((row) => row.activityId));
  const requestStatusByActivityId = new Map<string, RequestStatus>();
  for (const row of requestRows) {
    requestStatusByActivityId.set(row.activityId, row.status);
  }

  return { participantActivityIds, requestStatusByActivityId };
};

export const findActivityParticipantByIdAndActivity = async (
  id: string,
  activityId: string
): Promise<ActivityParticipant | null> => {
  const row = await activityParticipantsCollection().findOne({ _id: id, activityId });
  return row ? toActivityParticipantRecord(row) : null;
};

export const clearActivityParticipantCheckIn = async (id: string): Promise<void> => {
  await patchActivityParticipantInMongo(id, { checkedInAt: null });
};