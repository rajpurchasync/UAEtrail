import type { BuddyRequestDTO, BuddySummaryDTO } from '@uaetrail/shared-types';
import { buddyPairKey, sortedBuddyUserIds, type BuddyRequestStatus } from '../domain/buddy-connection.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users-store.js';
import { newEntityId } from './entity-builders.js';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import {
  invalidateBuddyIdsCacheForPair,
  readBuddyAdjacencyIds,
  writeBuddyAdjacencyIds,
} from './social-adjacency-read-cache.js';
import { profileDisplayNameFromAuthUser } from '../domain/person-name.js';
import { followUser } from './follow-store.js';

const REQUESTS_COLLECTION = 'buddy_requests';
const PAIRS_COLLECTION = 'buddy_pairs';

type MongoBuddyRequest = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  status: BuddyRequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  respondedAt: Date | null;
};

type MongoBuddyPair = {
  _id: string;
  userIds: [string, string];
  requestId: string;
  createdAt: Date;
};

const requestsCollection = () => getMongoClient()!.db().collection<MongoBuddyRequest>(REQUESTS_COLLECTION);
const pairsCollection = () => getMongoClient()!.db().collection<MongoBuddyPair>(PAIRS_COLLECTION);

const mapUserPreview = (user: Awaited<ReturnType<typeof findAuthUserById>>) =>
  user
    ? {
        id: user._id,
        displayName: profileDisplayNameFromAuthUser(user),
        avatarUrl: user.profile?.avatarUrl ?? null,
      }
    : null;

const mapRequestDto = (
  doc: MongoBuddyRequest,
  users?: Map<string, NonNullable<ReturnType<typeof mapUserPreview>>>
): BuddyRequestDTO => ({
  id: doc._id,
  fromUserId: doc.fromUserId,
  toUserId: doc.toUserId,
  status: doc.status,
  message: doc.message,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
  fromUser: users?.get(doc.fromUserId) ?? undefined,
  toUser: users?.get(doc.toUserId) ?? undefined,
});

const loadUserMapForRequests = async (docs: MongoBuddyRequest[]) => {
  const userIds = [...new Set(docs.flatMap((doc) => [doc.fromUserId, doc.toUserId]))];
  const users = await findAuthUsersByIds(userIds);
  const map = new Map<string, NonNullable<ReturnType<typeof mapUserPreview>>>();
  for (const user of users) {
    const preview = mapUserPreview(user);
    if (preview) map.set(user._id, preview);
  }
  return map;
};

export const areAcceptedBuddies = async (userA: string, userB: string): Promise<boolean> => {
  if (!userA || !userB || userA === userB) return userA === userB;
  const pair = await pairsCollection().findOne({ _id: buddyPairKey(userA, userB) });
  return Boolean(pair);
};

const ensurePairForAcceptedRequest = async (request: MongoBuddyRequest): Promise<void> => {
  const pairId = buddyPairKey(request.fromUserId, request.toUserId);
  const now = new Date();
  await pairsCollection().updateOne(
    { _id: pairId },
    {
      $setOnInsert: {
        _id: pairId,
        userIds: sortedBuddyUserIds(request.fromUserId, request.toUserId),
        requestId: request._id,
        createdAt: now,
      },
    },
    { upsert: true }
  );
  void invalidateBuddyIdsCacheForPair(request.fromUserId, request.toUserId);
};

export const createBuddyRequest = async (input: {
  fromUserId: string;
  toUserId: string;
  message?: string | null;
}): Promise<BuddyRequestDTO> => {
  const { fromUserId, toUserId } = input;
  if (fromUserId === toUserId) {
    throw new ApiError(400, 'invalid_buddy_request', 'You cannot add yourself as a buddy.');
  }

  const target = await findAuthUserById(toUserId);
  if (!target) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  if (await areAcceptedBuddies(fromUserId, toUserId)) {
    throw new ApiError(409, 'already_buddies', 'You are already connected with this member.');
  }

  const reversePending = await requestsCollection().findOne({
    fromUserId: toUserId,
    toUserId: fromUserId,
    status: 'pending',
  });
  if (reversePending) {
    return acceptBuddyRequest(reversePending._id, fromUserId);
  }

  const existingPending = await requestsCollection().findOne({
    fromUserId,
    toUserId,
    status: 'pending',
  });
  if (existingPending) {
    throw new ApiError(409, 'buddy_request_pending', 'Buddy request already sent.');
  }

  const now = new Date();
  const doc: MongoBuddyRequest = {
    _id: newEntityId(),
    fromUserId,
    toUserId,
    status: 'pending',
    message: input.message?.trim() || null,
    createdAt: now,
    updatedAt: now,
    respondedAt: null,
  };
  await requestsCollection().insertOne(doc);
  const users = await loadUserMapForRequests([doc]);
  return mapRequestDto(doc, users);
};

export const acceptBuddyRequest = async (
  requestId: string,
  actorUserId: string
): Promise<BuddyRequestDTO> => {
  const request = await requestsCollection().findOne({ _id: requestId });
  if (!request) {
    throw new ApiError(404, 'buddy_request_not_found', 'Buddy request not found.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, 'buddy_request_not_pending', 'This buddy request is no longer pending.');
  }
  if (request.toUserId !== actorUserId && request.fromUserId !== actorUserId) {
    throw new ApiError(403, 'forbidden', 'You cannot respond to this buddy request.');
  }

  const now = new Date();
  const updated = await requestsCollection().findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { $set: { status: 'accepted', updatedAt: now, respondedAt: now } },
    { returnDocument: 'after' }
  );
  if (!updated) {
    throw new ApiError(409, 'buddy_request_not_pending', 'This buddy request is no longer pending.');
  }

  await ensurePairForAcceptedRequest(updated);

  // Mutual follow (no follow notification — buddy accept already notifies).
  await Promise.all([
    followUser(updated.fromUserId, updated.toUserId),
    followUser(updated.toUserId, updated.fromUserId),
  ]);

  await requestsCollection().updateMany(
    {
      status: 'pending',
      $or: [
        { fromUserId: updated.fromUserId, toUserId: updated.toUserId },
        { fromUserId: updated.toUserId, toUserId: updated.fromUserId },
      ],
      _id: { $ne: updated._id },
    },
    { $set: { status: 'cancelled', updatedAt: now, respondedAt: now } }
  );

  const users = await loadUserMapForRequests([updated]);
  return mapRequestDto(updated, users);
};

export const declineBuddyRequest = async (
  requestId: string,
  actorUserId: string
): Promise<BuddyRequestDTO> => {
  const request = await requestsCollection().findOne({ _id: requestId });
  if (!request) {
    throw new ApiError(404, 'buddy_request_not_found', 'Buddy request not found.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, 'buddy_request_not_pending', 'This buddy request is no longer pending.');
  }
  if (request.toUserId !== actorUserId) {
    throw new ApiError(403, 'forbidden', 'Only the recipient can decline this request.');
  }

  const now = new Date();
  const updated = await requestsCollection().findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { $set: { status: 'declined', updatedAt: now, respondedAt: now } },
    { returnDocument: 'after' }
  );
  if (!updated) {
    throw new ApiError(409, 'buddy_request_not_pending', 'This buddy request is no longer pending.');
  }

  const users = await loadUserMapForRequests([updated]);
  return mapRequestDto(updated, users);
};

export const cancelBuddyRequest = async (
  requestId: string,
  actorUserId: string
): Promise<BuddyRequestDTO> => {
  const request = await requestsCollection().findOne({ _id: requestId });
  if (!request) {
    throw new ApiError(404, 'buddy_request_not_found', 'Buddy request not found.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, 'buddy_request_not_pending', 'This buddy request is no longer pending.');
  }
  if (request.fromUserId !== actorUserId) {
    throw new ApiError(403, 'forbidden', 'Only the sender can cancel this request.');
  }

  const now = new Date();
  const updated = await requestsCollection().findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { $set: { status: 'cancelled', updatedAt: now, respondedAt: now } },
    { returnDocument: 'after' }
  );
  if (!updated) {
    throw new ApiError(409, 'buddy_request_not_pending', 'This buddy request is no longer pending.');
  }

  const users = await loadUserMapForRequests([updated]);
  return mapRequestDto(updated, users);
};

export const countPendingIncomingBuddyRequests = async (userId: string): Promise<number> =>
  requestsCollection().countDocuments({ toUserId: userId, status: 'pending' });

export const listBuddyRequestsForUser = async (
  userId: string,
  direction: 'incoming' | 'outgoing' | 'all' = 'all'
): Promise<BuddyRequestDTO[]> => {
  const query =
    direction === 'incoming'
      ? { toUserId: userId }
      : direction === 'outgoing'
        ? { fromUserId: userId }
        : { $or: [{ fromUserId: userId }, { toUserId: userId }] };

  const docs = await requestsCollection().find(query).sort({ createdAt: -1 }).limit(100).toArray();
  const users = await loadUserMapForRequests(docs);
  return docs.map((doc) => mapRequestDto(doc, users));
};

const BUDDY_ID_LIST_CACHE_CAP = 500;

export const countBuddyPairsForUser = async (userId: string): Promise<number> =>
  pairsCollection().countDocuments({ userIds: userId });

export const listBuddyIdsForUser = async (userId: string, limit = BUDDY_ID_LIST_CACHE_CAP): Promise<string[]> => {
  const capped = Math.min(Math.max(limit, 1), BUDDY_ID_LIST_CACHE_CAP);
  const cached = await readBuddyAdjacencyIds(userId);
  if (cached) return cached.slice(0, capped);

  const pairs = await pairsCollection()
    .find({ userIds: userId }, { projection: { userIds: 1 } })
    .sort({ createdAt: -1 })
    .limit(BUDDY_ID_LIST_CACHE_CAP)
    .toArray();
  const ids = pairs.map((pair) => (pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0]));
  await writeBuddyAdjacencyIds(userId, ids);
  return ids.slice(0, capped);
};

type MutualBuddyRow = {
  buddyId: string;
  connectedAt: Date;
};

export const listMutualBuddiesBetween = async (
  targetUserId: string,
  viewerUserId: string,
  limit: number
): Promise<{ buddies: BuddySummaryDTO[]; totalMutual: number }> => {
  if (!targetUserId || !viewerUserId || targetUserId === viewerUserId) {
    return { buddies: [], totalMutual: 0 };
  }

  const capped = Math.min(Math.max(limit, 1), 200);
  const [facet] = await pairsCollection()
    .aggregate<{
      items: MutualBuddyRow[];
      total: { n: number }[];
    }>([
      { $match: { userIds: targetUserId } },
      {
        $addFields: {
          buddyId: {
            $cond: {
              if: { $eq: [{ $arrayElemAt: ['$userIds', 0] }, targetUserId] },
              then: { $arrayElemAt: ['$userIds', 1] },
              else: { $arrayElemAt: ['$userIds', 0] },
            },
          },
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.BUDDY_PAIRS,
          let: { buddyId: '$buddyId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$buddyId', '$userIds'] },
                    { $in: [viewerUserId, '$userIds'] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'viewerLink',
        },
      },
      { $match: { 'viewerLink.0': { $exists: true } } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $limit: capped },
            { $project: { _id: 0, buddyId: 1, connectedAt: '$createdAt' } },
          ],
          total: [{ $count: 'n' }],
        },
      },
    ])
    .toArray();

  const rows = facet?.items ?? [];
  const totalMutual = facet?.total?.[0]?.n ?? 0;
  if (rows.length === 0) {
    return { buddies: [], totalMutual };
  }

  const buddyIds = rows.map((row) => row.buddyId);
  const users = await findAuthUsersByIds(buddyIds);
  const userMap = new Map(users.map((user) => [user._id, user]));
  const connectedById = new Map(rows.map((row) => [row.buddyId, row.connectedAt.toISOString()]));

  const buddies = buddyIds
    .map((buddyId) => {
      const user = userMap.get(buddyId);
      if (!user) return null;
      return {
        userId: buddyId,
        displayName: profileDisplayNameFromAuthUser(user),
        avatarUrl: user.profile?.avatarUrl ?? null,
        connectedAt: connectedById.get(buddyId) ?? new Date(0).toISOString(),
      };
    })
    .filter((item): item is BuddySummaryDTO => item !== null);

  return { buddies, totalMutual };
};

const mapBuddySummaries = (
  userId: string,
  pairs: MongoBuddyPair[],
  userMap: Map<string, Awaited<ReturnType<typeof findAuthUserById>>>
): BuddySummaryDTO[] =>
  pairs
    .map((pair) => {
      const buddyId = pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0];
      const user = userMap.get(buddyId);
      if (!user) return null;
      return {
        userId: buddyId,
        displayName: profileDisplayNameFromAuthUser(user),
        avatarUrl: user.profile?.avatarUrl ?? null,
        connectedAt: pair.createdAt.toISOString(),
      };
    })
    .filter((item): item is BuddySummaryDTO => item !== null);

export const listBuddiesForUser = async (userId: string, limit = 200): Promise<BuddySummaryDTO[]> => {
  const capped = Math.min(Math.max(limit, 1), 200);
  const pairs = await pairsCollection()
    .find({ userIds: userId })
    .sort({ createdAt: -1 })
    .limit(capped)
    .toArray();

  if (pairs.length === 0) return [];

  const buddyIds = pairs.map((pair) => (pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0]));
  const users = await findAuthUsersByIds(buddyIds);
  const userMap = new Map(users.map((user) => [user._id, user]));
  return mapBuddySummaries(userId, pairs, userMap);
};

export const listBuddySummariesForIds = async (
  ownerUserId: string,
  buddyIds: string[]
): Promise<BuddySummaryDTO[]> => {
  if (buddyIds.length === 0) return [];
  const pairIds = buddyIds.map((buddyId) => buddyPairKey(ownerUserId, buddyId));
  const [pairs, users] = await Promise.all([
    pairsCollection().find({ _id: { $in: pairIds } }).toArray(),
    findAuthUsersByIds(buddyIds),
  ]);
  const pairByBuddy = new Map(
    pairs.map((pair) => {
      const buddyId = pair.userIds[0] === ownerUserId ? pair.userIds[1] : pair.userIds[0];
      return [buddyId, pair.createdAt.toISOString()] as const;
    })
  );
  const userMap = new Map(users.map((user) => [user._id, user]));
  return buddyIds
    .map((buddyId) => {
      const user = userMap.get(buddyId);
      if (!user) return null;
      return {
        userId: buddyId,
        displayName: profileDisplayNameFromAuthUser(user),
        avatarUrl: user.profile?.avatarUrl ?? null,
        connectedAt: pairByBuddy.get(buddyId) ?? new Date(0).toISOString(),
      };
    })
    .filter((item): item is BuddySummaryDTO => item !== null);
};

/** Ends a buddy connection for both users. Silent — no notification is sent. */
/** Remove mutual buddy link — `otherMemberUserId` is the other person's account id (`BuddySummaryDTO.userId`). */
export const unfriendBuddy = async (actorUserId: string, otherMemberUserId: string): Promise<void> => {
  if (actorUserId === otherMemberUserId) {
    throw new ApiError(400, 'invalid_buddy_request', 'You cannot unfriend yourself.');
  }

  const pairId = buddyPairKey(actorUserId, otherMemberUserId);
  const result = await pairsCollection().deleteOne({ _id: pairId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'buddy_not_found', 'You are not connected with this member.');
  }

  void invalidateBuddyIdsCacheForPair(actorUserId, otherMemberUserId);

  const now = new Date();
  await requestsCollection().updateMany(
    {
      status: 'pending',
      $or: [
        { fromUserId: actorUserId, toUserId: otherMemberUserId },
        { fromUserId: otherMemberUserId, toUserId: actorUserId },
      ],
    },
    { $set: { status: 'cancelled', updatedAt: now, respondedAt: now } }
  );
};

export const getBuddyRelationship = async (
  viewerUserId: string,
  targetUserId: string
): Promise<{
  areBuddies: boolean;
  incomingRequest: BuddyRequestDTO | null;
  outgoingRequest: BuddyRequestDTO | null;
  canSendRequest: boolean;
}> => {
  if (viewerUserId === targetUserId) {
    return {
      areBuddies: false,
      incomingRequest: null,
      outgoingRequest: null,
      canSendRequest: false,
    };
  }

  const areBuddies = await areAcceptedBuddies(viewerUserId, targetUserId);
  const [incomingDoc, outgoingDoc] = await Promise.all([
    requestsCollection().findOne({ fromUserId: targetUserId, toUserId: viewerUserId, status: 'pending' }),
    requestsCollection().findOne({ fromUserId: viewerUserId, toUserId: targetUserId, status: 'pending' }),
  ]);

  const docs = [incomingDoc, outgoingDoc].filter((doc): doc is MongoBuddyRequest => doc !== null);
  const users = await loadUserMapForRequests(docs);

  return {
    areBuddies,
    incomingRequest: incomingDoc ? mapRequestDto(incomingDoc, users) : null,
    outgoingRequest: outgoingDoc ? mapRequestDto(outgoingDoc, users) : null,
    canSendRequest: !areBuddies && !incomingDoc && !outgoingDoc,
  };
};
