import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { getRedisClient } from './redis.js';
import {
  EXPLORE_MAP_CACHE_TTL_SEC,
  EXPLORE_MAP_REDIS_KEY,
  invalidateExploreMapCache,
  readExploreMapMemoryCache,
  writeExploreMapMemoryCache,
} from './explore-map-cache.js';
import { buildExploreMapBasePayload } from './explore-map-base.js';

export { invalidateExploreMapCache };
export { buildExploreMapBasePayload } from './explore-map-base.js';

export const buildExploreMapPayload = async (): Promise<{ items: ExploreMapItemDTO[] }> => {
  const now = Date.now();
  const memoryCached = readExploreMapMemoryCache<{ items: ExploreMapItemDTO[] }>(now);
  if (memoryCached) {
    return memoryCached;
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
    } catch {
      /* fall through to rebuild */
    }
  }

  const payload = await buildExploreMapBasePayload();
  writeExploreMapMemoryCache(payload, now);

  if (redis) {
    try {
      await redis.setEx(EXPLORE_MAP_REDIS_KEY, EXPLORE_MAP_CACHE_TTL_SEC, JSON.stringify(payload));
    } catch {
      /* non-fatal */
    }
  }

  return payload;
};
