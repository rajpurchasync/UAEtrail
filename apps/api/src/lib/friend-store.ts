import type { FriendRequestDTO, FriendSummaryDTO } from '@uaetrail/shared-types';
import { friendPairKey, sortedFriendUserIds, type FriendRequestStatus } from '../domain/friend-connection.js';
import { findAuthUserById, findAuthUsersByIds } from './auth-users-store.js';
import { newEntityId } from './entity-builders.js';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import {
  invalidateFriendIdsCacheForPair,
  readFriendAdjacencyIds,
  writeFriendAdjacencyIds,
} from './social-adjacency-read-cache.js';
import { profileDisplayNameFromAuthUser } from '../domain/person-name.js';
import {
  USER_CITY_LABELS,
  USER_COUNTRY_LABELS,
  type UserCity,
  type UserCountryCode,
} from '../domain/user-profile.js';
import { followUser } from './follow-store.js';
import { resolveCityLabelForViewer } from './find-crew-visibility-gate.js';

const REQUESTS_COLLECTION = 'friend_requests';
const PAIRS_COLLECTION = 'friend_pairs';

type MongoFriendRequest = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  respondedAt: Date | null;
};

type AuthUserRecord = NonNullable<Awaited<ReturnType<typeof findAuthUserById>>>;

const friendSummaryFromAuthUser = (
  userId: string,
  user: AuthUserRecord,
  connectedAt: string
): FriendSummaryDTO => ({
  userId,
  displayName: profileDisplayNameFromAuthUser(user),
  avatarUrl: user.profile?.avatarUrl ?? null,
  connectedAt,
  lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
});

type MongoFriendPair = {
  _id: string;
  userIds: [string, string];
  requestId: string;
  createdAt: Date;
};

const requestsCollection = () => getMongoClient()!.db().collection<MongoFriendRequest>(REQUESTS_COLLECTION);
const pairsCollection = () => getMongoClient()!.db().collection<MongoFriendPair>(PAIRS_COLLECTION);

const mapUserPreview = (
  user: Awaited<ReturnType<typeof findAuthUserById>>,
  cityLabel?: string | null
) =>
  user
    ? {
        id: user._id,
        displayName: profileDisplayNameFromAuthUser(user),
        avatarUrl: user.profile?.avatarUrl ?? null,
        cityLabel: cityLabel ?? null,
      }
    : null;

const locationLabelForViewer = async (
  viewerId: string,
  targetUser: NonNullable<Awaited<ReturnType<typeof findAuthUserById>>>,
  isFriend: boolean
): Promise<string | null> => {
  const city = targetUser.profile?.city;
  const rawCityLabel =
    city && city in USER_CITY_LABELS ? USER_CITY_LABELS[city as UserCity] : null;
  const cityLabel = await resolveCityLabelForViewer(targetUser, viewerId, rawCityLabel, { isFriend });
  if (cityLabel) return cityLabel;
  const countryCode = targetUser.profile?.countryCode;
  if (countryCode && countryCode in USER_COUNTRY_LABELS) {
    return USER_COUNTRY_LABELS[countryCode as UserCountryCode];
  }
  return null;
};

const mapRequestDto = (
  doc: MongoFriendRequest,
  users?: Map<string, NonNullable<ReturnType<typeof mapUserPreview>>>
): FriendRequestDTO => ({
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

const loadUserMapsForRequests = async (viewerId: string, docs: MongoFriendRequest[]) => {
  const userIds = [...new Set(docs.flatMap((doc) => [doc.fromUserId, doc.toUserId]))];
  const users = await findAuthUsersByIds(userIds);
  const authById = new Map(users.map((user) => [user._id, user]));
  const map = new Map<string, NonNullable<ReturnType<typeof mapUserPreview>>>();
  await Promise.all(
    users.map(async (user) => {
      const isFriend = await areAcceptedFriends(viewerId, user._id);
      const cityLabel = await locationLabelForViewer(viewerId, user, isFriend);
      const preview = mapUserPreview(user, cityLabel);
      if (preview) map.set(user._id, preview);
    })
  );
  return map;
};

export const areAcceptedFriends = async (userA: string, userB: string): Promise<boolean> => {
  if (!userA || !userB || userA === userB) return userA === userB;
  const pair = await pairsCollection().findOne({ _id: friendPairKey(userA, userB) });
  return Boolean(pair);
};

const ensurePairForAcceptedRequest = async (request: MongoFriendRequest): Promise<void> => {
  const pairId = friendPairKey(request.fromUserId, request.toUserId);
  const now = new Date();
  await pairsCollection().updateOne(
    { _id: pairId },
    {
      $setOnInsert: {
        _id: pairId,
        userIds: sortedFriendUserIds(request.fromUserId, request.toUserId),
        requestId: request._id,
        createdAt: now,
      },
    },
    { upsert: true }
  );
  void invalidateFriendIdsCacheForPair(request.fromUserId, request.toUserId);
};

export const createFriendRequest = async (input: {
  fromUserId: string;
  toUserId: string;
  message?: string | null;
}): Promise<FriendRequestDTO> => {
  const { fromUserId, toUserId } = input;
  if (fromUserId === toUserId) {
    throw new ApiError(400, 'invalid_friend_request', 'You cannot add yourself as a friend.');
  }

  const target = await findAuthUserById(toUserId);
  if (!target) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  if (await areAcceptedFriends(fromUserId, toUserId)) {
    throw new ApiError(409, 'already_buddies', 'You are already connected with this member.');
  }

  const reversePending = await requestsCollection().findOne({
    fromUserId: toUserId,
    toUserId: fromUserId,
    status: 'pending',
  });
  if (reversePending) {
    return acceptFriendRequest(reversePending._id, fromUserId);
  }

  const existingPending = await requestsCollection().findOne({
    fromUserId,
    toUserId,
    status: 'pending',
  });
  if (existingPending) {
    throw new ApiError(409, 'friend_request_pending', 'Friend request already sent.');
  }

  const now = new Date();
  const doc: MongoFriendRequest = {
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
  const users = await loadUserMapsForRequests(fromUserId, [doc]);
  return mapRequestDto(doc, users);
};

export const acceptFriendRequest = async (
  requestId: string,
  actorUserId: string
): Promise<FriendRequestDTO> => {
  const request = await requestsCollection().findOne({ _id: requestId });
  if (!request) {
    throw new ApiError(404, 'friend_request_not_found', 'Friend request not found.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, 'friend_request_not_pending', 'This friend request is no longer pending.');
  }
  if (request.toUserId !== actorUserId && request.fromUserId !== actorUserId) {
    throw new ApiError(403, 'forbidden', 'You cannot respond to this friend request.');
  }

  const now = new Date();
  const updated = await requestsCollection().findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { $set: { status: 'accepted', updatedAt: now, respondedAt: now } },
    { returnDocument: 'after' }
  );
  if (!updated) {
    throw new ApiError(409, 'friend_request_not_pending', 'This friend request is no longer pending.');
  }

  await ensurePairForAcceptedRequest(updated);

  // Mutual follow (no follow notification — friend accept already notifies).
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

  const users = await loadUserMapsForRequests(actorUserId, [updated]);
  return mapRequestDto(updated, users);
};

export const declineFriendRequest = async (
  requestId: string,
  actorUserId: string
): Promise<FriendRequestDTO> => {
  const request = await requestsCollection().findOne({ _id: requestId });
  if (!request) {
    throw new ApiError(404, 'friend_request_not_found', 'Friend request not found.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, 'friend_request_not_pending', 'This friend request is no longer pending.');
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
    throw new ApiError(409, 'friend_request_not_pending', 'This friend request is no longer pending.');
  }

  const users = await loadUserMapsForRequests(actorUserId, [updated]);
  return mapRequestDto(updated, users);
};

export const cancelFriendRequest = async (
  requestId: string,
  actorUserId: string
): Promise<FriendRequestDTO> => {
  const request = await requestsCollection().findOne({ _id: requestId });
  if (!request) {
    throw new ApiError(404, 'friend_request_not_found', 'Friend request not found.');
  }
  if (request.status !== 'pending') {
    throw new ApiError(409, 'friend_request_not_pending', 'This friend request is no longer pending.');
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
    throw new ApiError(409, 'friend_request_not_pending', 'This friend request is no longer pending.');
  }

  const users = await loadUserMapsForRequests(actorUserId, [updated]);
  return mapRequestDto(updated, users);
};

export const countPendingIncomingFriendRequests = async (userId: string): Promise<number> =>
  requestsCollection().countDocuments({ toUserId: userId, status: 'pending' });

export const listFriendRequestsForUser = async (
  userId: string,
  direction: 'incoming' | 'outgoing' | 'all' = 'all'
): Promise<FriendRequestDTO[]> => {
  const query =
    direction === 'incoming'
      ? { toUserId: userId }
      : direction === 'outgoing'
        ? { fromUserId: userId }
        : { $or: [{ fromUserId: userId }, { toUserId: userId }] };

  const docs = await requestsCollection().find(query).sort({ createdAt: -1 }).limit(100).toArray();
  const users = await loadUserMapsForRequests(userId, docs);
  return docs.map((doc) => mapRequestDto(doc, users));
};

const FRIEND_ID_LIST_CACHE_CAP = 500;

export const countFriendPairsForUser = async (userId: string): Promise<number> =>
  pairsCollection().countDocuments({ userIds: userId });

export const listFriendIdsForUser = async (userId: string, limit = FRIEND_ID_LIST_CACHE_CAP): Promise<string[]> => {
  const capped = Math.min(Math.max(limit, 1), FRIEND_ID_LIST_CACHE_CAP);
  const cached = await readFriendAdjacencyIds(userId);
  if (cached) return cached.slice(0, capped);

  const pairs = await pairsCollection()
    .find({ userIds: userId }, { projection: { userIds: 1 } })
    .sort({ createdAt: -1 })
    .limit(FRIEND_ID_LIST_CACHE_CAP)
    .toArray();
  const ids = pairs.map((pair) => (pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0]));
  await writeFriendAdjacencyIds(userId, ids);
  return ids.slice(0, capped);
};

type MutualFriendRow = {
  friendId: string;
  connectedAt: Date;
};

export const listMutualBuddiesBetween = async (
  targetUserId: string,
  viewerUserId: string,
  limit: number
): Promise<{ buddies: FriendSummaryDTO[]; totalMutual: number }> => {
  if (!targetUserId || !viewerUserId || targetUserId === viewerUserId) {
    return { buddies: [], totalMutual: 0 };
  }

  const capped = Math.min(Math.max(limit, 1), 200);
  const [facet] = await pairsCollection()
    .aggregate<{
      items: MutualFriendRow[];
      total: { n: number }[];
    }>([
      { $match: { userIds: targetUserId } },
      {
        $addFields: {
          friendId: {
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
          from: COLLECTIONS.FRIEND_PAIRS,
          let: { friendId: '$friendId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$friendId', '$userIds'] },
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
            { $project: { _id: 0, friendId: 1, connectedAt: '$createdAt' } },
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

  const friendIds = rows.map((row) => row.friendId);
  const users = await findAuthUsersByIds(friendIds);
  const userMap = new Map(users.map((user) => [user._id, user]));
  const connectedById = new Map(rows.map((row) => [row.friendId, row.connectedAt.toISOString()]));

  const buddies = friendIds.flatMap((friendId) => {
    const user = userMap.get(friendId);
    if (!user) return [];
    return [
      friendSummaryFromAuthUser(
        friendId,
        user,
        connectedById.get(friendId) ?? new Date(0).toISOString()
      ),
    ];
  });

  return { buddies, totalMutual };
};

const mapFriendSummaries = (
  userId: string,
  pairs: MongoFriendPair[],
  userMap: Map<string, AuthUserRecord>
): FriendSummaryDTO[] =>
  pairs.flatMap((pair) => {
    const friendId = pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0];
    const user = userMap.get(friendId);
    if (!user) return [];
    return [friendSummaryFromAuthUser(friendId, user, pair.createdAt.toISOString())];
  });

export const listFriendsForUser = async (userId: string, limit = 200): Promise<FriendSummaryDTO[]> => {
  const capped = Math.min(Math.max(limit, 1), 200);
  const pairs = await pairsCollection()
    .find({ userIds: userId })
    .sort({ createdAt: -1 })
    .limit(capped)
    .toArray();

  if (pairs.length === 0) return [];

  const friendIds = pairs.map((pair) => (pair.userIds[0] === userId ? pair.userIds[1] : pair.userIds[0]));
  const users = await findAuthUsersByIds(friendIds);
  const userMap = new Map(users.map((user) => [user._id, user]));
  const summaries = mapFriendSummaries(userId, pairs, userMap);
  return Promise.all(
    summaries.map(async (summary) => {
      const user = userMap.get(summary.userId);
      if (!user) return summary;
      const cityLabel = await locationLabelForViewer(userId, user, true);
      return { ...summary, cityLabel };
    })
  );
};

export const listFriendSummariesForIds = async (
  ownerUserId: string,
  friendIds: string[]
): Promise<FriendSummaryDTO[]> => {
  if (friendIds.length === 0) return [];
  const pairIds = friendIds.map((friendId) => friendPairKey(ownerUserId, friendId));
  const [pairs, users] = await Promise.all([
    pairsCollection().find({ _id: { $in: pairIds } }).toArray(),
    findAuthUsersByIds(friendIds),
  ]);
  const pairByFriend = new Map(
    pairs.map((pair) => {
      const friendId = pair.userIds[0] === ownerUserId ? pair.userIds[1] : pair.userIds[0];
      return [friendId, pair.createdAt.toISOString()] as const;
    })
  );
  const userMap = new Map(users.map((user) => [user._id, user]));
  return friendIds.flatMap((friendId) => {
    const user = userMap.get(friendId);
    if (!user) return [];
    return [
      friendSummaryFromAuthUser(
        friendId,
        user,
        pairByFriend.get(friendId) ?? new Date(0).toISOString()
      ),
    ];
  });
};

/** Ends a friend connection for both users. Silent — no notification is sent. */
/** Remove mutual friend link — `otherMemberUserId` is the other person's account id (`FriendSummaryDTO.userId`). */
export const unfriendMember = async (actorUserId: string, otherMemberUserId: string): Promise<void> => {
  if (actorUserId === otherMemberUserId) {
    throw new ApiError(400, 'invalid_friend_request', 'You cannot unfriend yourself.');
  }

  const pairId = friendPairKey(actorUserId, otherMemberUserId);
  const result = await pairsCollection().deleteOne({ _id: pairId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'friend_not_found', 'You are not connected with this member.');
  }

  void invalidateFriendIdsCacheForPair(actorUserId, otherMemberUserId);

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

export const getFriendRelationship = async (
  viewerUserId: string,
  targetUserId: string
): Promise<{
  areFriends: boolean;
  incomingRequest: FriendRequestDTO | null;
  outgoingRequest: FriendRequestDTO | null;
  canSendRequest: boolean;
}> => {
  if (viewerUserId === targetUserId) {
    return {
      areFriends: false,
      incomingRequest: null,
      outgoingRequest: null,
      canSendRequest: false,
    };
  }

  const areFriends = await areAcceptedFriends(viewerUserId, targetUserId);
  const [incomingDoc, outgoingDoc] = await Promise.all([
    requestsCollection().findOne({ fromUserId: targetUserId, toUserId: viewerUserId, status: 'pending' }),
    requestsCollection().findOne({ fromUserId: viewerUserId, toUserId: targetUserId, status: 'pending' }),
  ]);

  const docs = [incomingDoc, outgoingDoc].filter((doc): doc is MongoFriendRequest => doc !== null);
  const users = await loadUserMapsForRequests(viewerUserId, docs);

  return {
    areFriends,
    incomingRequest: incomingDoc ? mapRequestDto(incomingDoc, users) : null,
    outgoingRequest: outgoingDoc ? mapRequestDto(outgoingDoc, users) : null,
    canSendRequest: !areFriends && !incomingDoc && !outgoingDoc,
  };
};
