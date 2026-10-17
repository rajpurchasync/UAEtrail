import { getRedisClient } from './redis.js';

export const EXPLORE_MAP_REDIS_KEY = 'explore:map:payload:v6';
export const EXPLORE_MAP_CACHE_MS = 60_000;
export const EXPLORE_MAP_CACHE_TTL_SEC = 60;

type ExploreMapCacheEntry<T> = { expiresAt: number; payload: T };

let exploreMapMemoryCache: ExploreMapCacheEntry<unknown> | null = null;

export const readExploreMapMemoryCache = <T>(now = Date.now()): T | null => {
  if (!exploreMapMemoryCache || exploreMapMemoryCache.expiresAt <= now) return null;
  return exploreMapMemoryCache.payload as T;
};

/** Changes when the in-process explore map payload is refreshed (for viewer-enrich reuse). */
export const readExploreMapMemoryCacheGeneration = (now = Date.now()): number | null => {
  if (!exploreMapMemoryCache || exploreMapMemoryCache.expiresAt <= now) return null;
  return exploreMapMemoryCache.expiresAt;
};

export const writeExploreMapMemoryCache = <T>(payload: T, now = Date.now()): void => {
  exploreMapMemoryCache = { expiresAt: now + EXPLORE_MAP_CACHE_MS, payload };
};

export const clearExploreMapMemoryCache = (): void => {
  exploreMapMemoryCache = null;
};

/** When Redis is used, in-process memory is invalid if the shared payload key was deleted (e.g. after seed). */
export const exploreMapRedisPayloadExists = async (): Promise<boolean | null> => {
  const redis = await getRedisClient();
  if (!redis) return null;
  try {
    const exists = await redis.exists(EXPLORE_MAP_REDIS_KEY);
    return exists > 0;
  } catch {
    return null;
  }
};

/**
 * Drop in-process and Redis explore map payloads.
 * Production writes must call `scheduleExploreMapCacheInvalidation` (outbox when enabled).
 * Direct callers: this module, schedule fallback, outbox processor, tests, and seed scripts.
 */
export const invalidateExploreMapCache = async (): Promise<void> => {
  exploreMapMemoryCache = null;
  const { invalidateExploreMapMemberEngagementCache } = await import('./explore-map-member-engagement.js');
  invalidateExploreMapMemberEngagementCache();
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(EXPLORE_MAP_REDIS_KEY);
  } catch {
    /* non-fatal */
  }
};
