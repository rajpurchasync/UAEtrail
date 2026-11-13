import { getRedisClient } from './redis.js';

const ADJACENCY_CACHE_MS = 10 * 60 * 1000;
const ADJACENCY_REDIS_TTL_SEC = 600;

type IdListEntry = { expiresAt: number; ids: string[] };

const buddyIdsByUser = new Map<string, IdListEntry>();
const followingIdsByUser = new Map<string, IdListEntry>();

const buddyRedisKey = (userId: string) => `social:adj:buddies:${userId}`;
const followingRedisKey = (userId: string) => `social:adj:following:${userId}`;

const readIds = (map: Map<string, IdListEntry>, userId: string, now: number): string[] | undefined => {
  const hit = map.get(userId);
  if (!hit || hit.expiresAt <= now) return undefined;
  return hit.ids;
};

const writeIds = (map: Map<string, IdListEntry>, userId: string, ids: string[], now: number): void => {
  map.set(userId, { expiresAt: now + ADJACENCY_CACHE_MS, ids });
};

export const readCachedBuddyIdsForUser = (userId: string, now = Date.now()): string[] | undefined =>
  readIds(buddyIdsByUser, userId, now);

export const writeCachedBuddyIdsForUser = (userId: string, ids: string[], now = Date.now()): void => {
  writeIds(buddyIdsByUser, userId, ids, now);
};

export const readBuddyAdjacencyIds = async (userId: string, now = Date.now()): Promise<string[] | undefined> => {
  const local = readCachedBuddyIdsForUser(userId, now);
  if (local) return local;

  const redis = await getRedisClient();
  if (!redis) return undefined;
  try {
    const raw = await redis.get(buddyRedisKey(userId));
    if (!raw) return undefined;
    const ids = JSON.parse(raw) as string[];
    if (!Array.isArray(ids)) return undefined;
    writeCachedBuddyIdsForUser(userId, ids, now);
    return ids;
  } catch {
    return undefined;
  }
};

export const writeBuddyAdjacencyIds = async (userId: string, ids: string[]): Promise<void> => {
  const now = Date.now();
  writeCachedBuddyIdsForUser(userId, ids, now);
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.set(buddyRedisKey(userId), JSON.stringify(ids), { EX: ADJACENCY_REDIS_TTL_SEC });
  } catch {
    /* non-fatal */
  }
};

export const invalidateBuddyIdsCache = async (userId: string): Promise<void> => {
  buddyIdsByUser.delete(userId);
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(buddyRedisKey(userId));
  } catch {
    /* non-fatal */
  }
};

export const invalidateBuddyIdsCacheForPair = async (userA: string, userB: string): Promise<void> => {
  await Promise.all([invalidateBuddyIdsCache(userA), invalidateBuddyIdsCache(userB)]);
};

export const readCachedFollowingIdsForUser = (userId: string, now = Date.now()): string[] | undefined =>
  readIds(followingIdsByUser, userId, now);

export const writeCachedFollowingIdsForUser = (userId: string, ids: string[], now = Date.now()): void => {
  writeIds(followingIdsByUser, userId, ids, now);
};

export const readFollowingAdjacencyIds = async (
  userId: string,
  now = Date.now()
): Promise<string[] | undefined> => {
  const local = readCachedFollowingIdsForUser(userId, now);
  if (local) return local;

  const redis = await getRedisClient();
  if (!redis) return undefined;
  try {
    const raw = await redis.get(followingRedisKey(userId));
    if (!raw) return undefined;
    const ids = JSON.parse(raw) as string[];
    if (!Array.isArray(ids)) return undefined;
    writeCachedFollowingIdsForUser(userId, ids, now);
    return ids;
  } catch {
    return undefined;
  }
};

export const writeFollowingAdjacencyIds = async (userId: string, ids: string[]): Promise<void> => {
  const now = Date.now();
  writeCachedFollowingIdsForUser(userId, ids, now);
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.set(followingRedisKey(userId), JSON.stringify(ids), { EX: ADJACENCY_REDIS_TTL_SEC });
  } catch {
    /* non-fatal */
  }
};

export const invalidateFollowingIdsCache = async (userId: string): Promise<void> => {
  followingIdsByUser.delete(userId);
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(followingRedisKey(userId));
  } catch {
    /* non-fatal */
  }
};

/** Test / admin flush */
export const clearSocialAdjacencyReadCache = (): void => {
  buddyIdsByUser.clear();
  followingIdsByUser.clear();
};
