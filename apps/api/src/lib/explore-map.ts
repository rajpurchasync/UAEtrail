import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { logger } from './logger.js';
import { getRedisClient } from './redis.js';
import {
  EXPLORE_MAP_CACHE_TTL_SEC,
  EXPLORE_MAP_REDIS_KEY,
  clearExploreMapMemoryCache,
  exploreMapRedisPayloadExists,
  readExploreMapMemoryCache,
  readExploreMapStalePayload,
  writeExploreMapMemoryCache,
} from './explore-map-cache.js';
import { buildExploreMapBasePayload } from './explore-map-base.js';

export { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';
export { buildExploreMapBasePayload } from './explore-map-base.js';

let exploreMapInflight: Promise<{ items: ExploreMapItemDTO[] }> | null = null;

const loadExploreMapPayload = async (): Promise<{ items: ExploreMapItemDTO[] }> => {
  const now = Date.now();
  const memoryCached = readExploreMapMemoryCache<{ items: ExploreMapItemDTO[] }>(now);
  if (memoryCached) {
    const redisPayload = await exploreMapRedisPayloadExists();
    if (redisPayload === false) {
      clearExploreMapMemoryCache();
    } else {
      return memoryCached;
    }
  }

  const redis = await getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(EXPLORE_MAP_REDIS_KEY);
      if (cached) {
        const payload = JSON.parse(cached) as { items: ExploreMapItemDTO[] };
        writeExploreMapMemoryCache(payload, now);
        return payload;
      }
    } catch (err) {
      logger.warn({ err }, 'explore map redis read failed');
    }
  }

  const rebuildStarted = Date.now();
  const payload = await buildExploreMapBasePayload();
  logger.info(
    { durationMs: Date.now() - rebuildStarted, itemCount: payload.items.length },
    'explore map cache miss rebuild'
  );
  writeExploreMapMemoryCache(payload, now);

  if (redis) {
    try {
      await redis.setEx(EXPLORE_MAP_REDIS_KEY, EXPLORE_MAP_CACHE_TTL_SEC, JSON.stringify(payload));
    } catch (err) {
      logger.warn({ err }, 'explore map redis write failed');
    }
  }

  return payload;
};

const startExploreMapRefresh = (): Promise<{ items: ExploreMapItemDTO[] }> => {
  if (!exploreMapInflight) {
    exploreMapInflight = loadExploreMapPayload().finally(() => {
      exploreMapInflight = null;
    });
  }
  return exploreMapInflight;
};

/**
 * Fresh catalog is returned immediately.
 * After the fresh window, the last catalog is returned and one rebuild runs behind it.
 * A cold process waits for that single rebuild.
 */
export const buildExploreMapPayload = (): Promise<{ items: ExploreMapItemDTO[] }> => {
  const fresh = readExploreMapMemoryCache<{ items: ExploreMapItemDTO[] }>();
  if (fresh) return Promise.resolve(fresh);
  const stale = readExploreMapStalePayload<{ items: ExploreMapItemDTO[] }>();
  if (stale) {
    void startExploreMapRefresh().catch((err) => {
      logger.warn({ err }, 'explore map background refresh failed');
    });
    return Promise.resolve(stale);
  }
  return startExploreMapRefresh();
};
