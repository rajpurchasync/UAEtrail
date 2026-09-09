import type { BuddyRequestDTO, BuddySummaryDTO } from '@uaetrail/shared-types';
import { buddyPairKey, sortedBuddyUserIds, type BuddyRequestStatus } from '../domain/buddy-connection.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users.js';
import { newEntityId } from './entity-builders.js';
import { ApiError } from './api-error.js';
import { getMongoClient } from './mongo.js';

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
        displayName: user.profile?.displayName ?? user.email.split('@')[0],
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

export const listBuddiesForUser = async (userId: string): Promise<BuddySummaryDTO[]> => {
  const pairs = await pairsCollection()
    .find({ userIds: userId })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  if (pairs.length === 0) return [];

  const buddyIds = pairs.map((pair) => (pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0]));
  const users = await findAuthUsersByIds(buddyIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  return pairs
    .map((pair) => {
      const buddyId = pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0];
      const user = userMap.get(buddyId);
      if (!user) return null;
      return {
        userId: buddyId,
        displayName: user.profile?.displayName ?? user.email.split('@')[0],
        avatarUrl: user.profile?.avatarUrl ?? null,
        connectedAt: pair.createdAt.toISOString(),
      };
    })
    .filter((item): item is BuddySummaryDTO => item !== null);
};

/** Ends a buddy connection for both users. Silent — no notification is sent. */
export const unfriendBuddy = async (actorUserId: string, buddyUserId: string): Promise<void> => {
  if (actorUserId === buddyUserId) {
    throw new ApiError(400, 'invalid_buddy_request', 'You cannot unfriend yourself.');
  }

  const pairId = buddyPairKey(actorUserId, buddyUserId);
  const result = await pairsCollection().deleteOne({ _id: pairId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'buddy_not_found', 'You are not connected with this member.');
  }

  const now = new Date();
  await requestsCollection().updateMany(
    {
      status: 'pending',
      $or: [
        { fromUserId: actorUserId, toUserId: buddyUserId },
        { fromUserId: buddyUserId, toUserId: actorUserId },
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
