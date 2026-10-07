import { randomUUID } from 'crypto';
import type {
  ParticipantIntentJoinRequestDTO,
  ParticipantIntentJoinRequestViewDTO,
} from '@uaetrail/shared-types';
import { ObjectId, type Filter } from 'mongodb';
import { findAuthUsersByIds } from './auth-users.js';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

type MongoParticipantIntentJoinRequest = {
  _id: string;
  intentId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MongoParticipantIntent = {
  _id: string;
  userId: string;
  status: 'active' | 'fulfilled' | 'cancelled';
};

const requestsCollection = () =>
  getMongoClient()!.db().collection<MongoParticipantIntentJoinRequest>(
    COLLECTIONS.PARTICIPANT_INTENT_REQUESTS
  );

const intentsCollection = () =>
  getMongoClient()!.db().collection<MongoParticipantIntent>(COLLECTIONS.PARTICIPANT_INTENTS);

const intentLookupFilter = (intentId: string): Record<string, unknown> =>
  /^[a-f0-9]{24}$/i.test(intentId) && ObjectId.isValid(intentId)
    ? { $or: [{ _id: intentId }, { _id: new ObjectId(intentId) }] }
    : { _id: intentId };

const mapDto = (doc: MongoParticipantIntentJoinRequest): ParticipantIntentJoinRequestDTO => ({
  id: doc._id,
  intentId: doc.intentId,
  userId: doc.userId,
  status: doc.status,
  note: doc.note,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export const createParticipantIntentJoinRequest = async (input: {
  intentId: string;
  userId: string;
  note?: string | null;
}): Promise<ParticipantIntentJoinRequestDTO> => {
  const intent = await intentsCollection().findOne({
    ...intentLookupFilter(input.intentId),
    status: 'active',
  } as Filter<MongoParticipantIntent>);

  if (!intent) {
    throw new ApiError(404, 'intent_not_found', 'This plan is no longer on the map.');
  }
  if (intent.userId === input.userId) {
    throw new ApiError(400, 'cannot_join_own_intent', 'You posted this plan.');
  }

  const existing = await requestsCollection().findOne({
    intentId: intent._id,
    userId: input.userId,
    status: { $in: ['pending', 'approved'] },
  });

  if (existing) {
    throw new ApiError(409, 'request_exists', 'You already requested to join this plan.');
  }

  const now = new Date();
  const doc: MongoParticipantIntentJoinRequest = {
    _id: randomUUID(),
    intentId: intent._id,
    userId: input.userId,
    status: 'pending',
    note: input.note?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  await requestsCollection().insertOne(doc);
  return mapDto(doc);
};

const findActiveIntentForOwner = async (
  intentId: string,
  ownerUserId: string
): Promise<MongoParticipantIntent | null> =>
  intentsCollection().findOne({
    ...intentLookupFilter(intentId),
    userId: ownerUserId,
    status: 'active',
  } as Filter<MongoParticipantIntent>);

export const listParticipantIntentJoinRequestsForOwner = async (
  intentId: string,
  ownerUserId: string
): Promise<ParticipantIntentJoinRequestViewDTO[]> => {
  const intent = await findActiveIntentForOwner(intentId, ownerUserId);
  if (!intent) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
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
  const intent = await intentsCollection().findOne(
    intentLookupFilter(intentId) as Filter<MongoParticipantIntent>
  );
  if (!intent) return [];

  const docs = await requestsCollection()
    .find({ intentId: intent._id, status: 'approved' })
    .toArray();

  return docs.map((doc) => doc.userId).filter((userId) => userId !== intent.userId);
};

/** Batch map for explore map demand `viewerAccess` (per viewer). */
export const mapIntentJoinRequestStatusByIntentIdsForUser = async (
  userId: string,
  intentIds: string[]
): Promise<Map<string, 'pending' | 'approved'>> => {
  const uniqueIds = [...new Set(intentIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const docs = await requestsCollection()
    .find({
      userId,
      intentId: { $in: uniqueIds },
      status: { $in: ['pending', 'approved'] },
    })
    .project({ intentId: 1, status: 1 })
    .toArray();

  const result = new Map<string, 'pending' | 'approved'>();
  for (const doc of docs) {
    if (doc.status === 'pending' || doc.status === 'approved') {
      result.set(doc.intentId, doc.status);
    }
  }
  return result;
};

export const findParticipantIntentJoinRequestForUser = async (
  intentId: string,
  userId: string
): Promise<ParticipantIntentJoinRequestDTO | null> => {
  const intent = await intentsCollection().findOne({
    ...intentLookupFilter(intentId),
    status: 'active',
  } as Filter<MongoParticipantIntent>);
  if (!intent) return null;

  const doc = await requestsCollection().findOne({
    intentId: intent._id,
    userId,
    status: { $in: ['pending', 'approved'] },
  });

  return doc ? mapDto(doc) : null;
};
