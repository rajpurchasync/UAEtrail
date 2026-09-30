import { getRedisClient } from './redis.js';

export const EXPLORE_MAP_REDIS_KEY = 'explore:map:payload:v2';
export const EXPLORE_MAP_CACHE_MS = 60_000;
export const EXPLORE_MAP_CACHE_TTL_SEC = 60;

type ExploreMapCacheEntry<T> = { expiresAt: number; payload: T };

let exploreMapMemoryCache: ExploreMapCacheEntry<unknown> | null = null;

export const readExploreMapMemoryCache = <T>(now = Date.now()): T | null => {
  if (!exploreMapMemoryCache || exploreMapMemoryCache.expiresAt <= now) return null;
  return exploreMapMemoryCache.payload as T;
};

export const writeExploreMapMemoryCache = <T>(payload: T, now = Date.now()): void => {
  exploreMapMemoryCache = { expiresAt: now + EXPLORE_MAP_CACHE_MS, payload };
};

/** Drop in-process and Redis explore map payloads after data writes. */
export const invalidateExploreMapCache = async (): Promise<void> => {
  exploreMapMemoryCache = null;
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(EXPLORE_MAP_REDIS_KEY);
  } catch {
    /* non-fatal */
  }
};
