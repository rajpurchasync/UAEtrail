import type { MemberFollowStateDTO, MemberFollowSummaryDTO } from '@uaetrail/shared-types';
import { findAuthUserById, findAuthUsersByIds } from './auth-users-store.js';
import { COLLECTIONS } from './collections.js';
import { ApiError } from './api-error.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import {
  invalidateFollowingIdsCache,
  readFollowingAdjacencyIds,
  writeFollowingAdjacencyIds,
} from './social-adjacency-read-cache.js';

type MongoUserFollow = {
  _id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
};

const collection = () => getMongoClient()!.db().collection<MongoUserFollow>(COLLECTIONS.USER_FOLLOWS);

export const followUser = async (followerId: string, followingId: string): Promise<MemberFollowStateDTO> => {
  if (followerId === followingId) {
    throw new ApiError(400, 'invalid_follow', 'You cannot follow yourself.');
  }
  const target = await findAuthUserById(followingId);
  if (!target) {
    throw new ApiError(404, 'user_not_found', 'Member not found.');
  }

  const now = new Date();
  await collection().updateOne(
    { followerId, followingId },
    {
      $setOnInsert: {
        _id: newEntityId(),
        followerId,
        followingId,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  void invalidateFollowingIdsCache(followerId);
  return { isFollowing: true, canFollow: false };
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<MemberFollowStateDTO> => {
  await collection().deleteOne({ followerId, followingId });
  void invalidateFollowingIdsCache(followerId);
  return getFollowState(followerId, followingId);
};

export const isFollowingUser = async (followerId: string, followingId: string): Promise<boolean> => {
  if (followerId === followingId) return false;
  const doc = await collection().findOne({ followerId, followingId }, { projection: { _id: 1 } });
  return Boolean(doc);
};

export const getFollowState = async (viewerId: string, targetUserId: string): Promise<MemberFollowStateDTO> => {
  if (viewerId === targetUserId) {
    return { isFollowing: false, canFollow: false };
  }
  const following = await isFollowingUser(viewerId, targetUserId);
  return { isFollowing: following, canFollow: !following };
};

export const listFollowingForUser = async (followerId: string): Promise<MemberFollowSummaryDTO[]> => {
  const docs = await collection().find({ followerId }).sort({ createdAt: -1 }).limit(200).toArray();
  if (docs.length === 0) return [];

  const userIds = docs.map((doc) => doc.followingId);
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  return docs
    .map((doc) => {
      const user = userMap.get(doc.followingId);
      if (!user) return null;
      return {
        userId: doc.followingId,
        displayName: user.profile?.displayName ?? user.email.split('@')[0],
        avatarUrl: user.profile?.avatarUrl ?? null,
        followedAt: doc.createdAt.toISOString(),
      };
    })
    .filter((row): row is MemberFollowSummaryDTO => row !== null);
};

/** Users who follow `userId` (for publish notifications). */
export const countFollowersForUser = async (userId: string): Promise<number> =>
  collection().countDocuments({ followingId: userId });

export const listFollowerIdsForUser = async (userId: string): Promise<string[]> => {
  const docs = await collection()
    .find({ followingId: userId }, { projection: { followerId: 1 } })
    .limit(500)
    .toArray();
  return docs.map((doc) => doc.followerId);
};

const FOLLOWING_ID_LIST_CACHE_CAP = 500;

export const listFollowingIdsForUser = async (
  followerId: string,
  limit = FOLLOWING_ID_LIST_CACHE_CAP
): Promise<string[]> => {
  const capped = Math.min(Math.max(limit, 1), FOLLOWING_ID_LIST_CACHE_CAP);
  const cached = await readFollowingAdjacencyIds(followerId);
  if (cached) return cached.slice(0, capped);

  const docs = await collection()
    .find({ followerId }, { projection: { followingId: 1 } })
    .sort({ createdAt: -1 })
    .limit(FOLLOWING_ID_LIST_CACHE_CAP)
    .toArray();
  const ids = docs.map((doc) => doc.followingId);
  await writeFollowingAdjacencyIds(followerId, ids);
  return ids.slice(0, capped);
};

/** Accounts both members follow (one-way follows — not buddies). */
export const listCommonFollowingBetween = async (
  viewerUserId: string,
  targetUserId: string,
  limit = 32
): Promise<MemberFollowSummaryDTO[]> => {
  if (viewerUserId === targetUserId) return [];
  const [viewerIds, targetIds] = await Promise.all([
    listFollowingIdsForUser(viewerUserId),
    listFollowingIdsForUser(targetUserId),
  ]);
  const targetSet = new Set(targetIds);
  const commonIds: string[] = [];
  for (const id of viewerIds) {
    if (id === viewerUserId || id === targetUserId) continue;
    if (!targetSet.has(id)) continue;
    commonIds.push(id);
    if (commonIds.length >= limit) break;
  }
  if (commonIds.length === 0) return [];

  const users = await findAuthUsersByIds(commonIds);
  const userMap = new Map(users.map((user) => [user._id, user]));
  return commonIds
    .map((userId) => {
      const user = userMap.get(userId);
      if (!user) return null;
      return {
        userId,
        displayName: user.profile?.displayName ?? user.email.split('@')[0],
        avatarUrl: user.profile?.avatarUrl ?? null,
        followedAt: '',
      };
    })
    .filter((row): row is MemberFollowSummaryDTO => row !== null);
};
