import { describe, expect, it } from 'vitest';
import {
  EXPLORE_MAP_CACHE_MS,
  clearExploreMapMemoryCache,
  readExploreMapMemoryCache,
  readExploreMapStalePayload,
  writeExploreMapMemoryCache,
} from '../src/lib/explore-map-cache.js';
import { createReadinessGate } from '../src/lib/readiness.js';
import {
  noteRedisConnectFailed,
  noteRedisConnectSucceeded,
  redisConnectAllowed,
  REDIS_CONNECT_BACKOFF_MS,
} from '../src/lib/redis.js';

describe('explore map stale catalog', () => {
  it('keeps the last payload after the fresh window and drops it on invalidate', () => {
    clearExploreMapMemoryCache();
    const now = Date.now();
    writeExploreMapMemoryCache({ items: [{ id: 'hike' }] }, now);
    expect(readExploreMapMemoryCache(now + 1_000)).toEqual({ items: [{ id: 'hike' }] });
    expect(readExploreMapMemoryCache(now + EXPLORE_MAP_CACHE_MS + 1)).toBeNull();
    expect(readExploreMapStalePayload()).toEqual({ items: [{ id: 'hike' }] });
    clearExploreMapMemoryCache();
    expect(readExploreMapStalePayload()).toBeNull();
  });
});

describe('readiness gate', () => {
  it('shares one ping across concurrent checks and skips pings inside the fresh window', async () => {
    let pings = 0;
    const gate = createReadinessGate(async () => {
      pings += 1;
    }, 1_000);
    await Promise.all([gate(0), gate(0)]);
    expect(pings).toBe(1);
    await gate(500);
    expect(pings).toBe(1);
    await gate(1_500);
    expect(pings).toBe(2);
  });
});

describe('redis connect backoff', () => {
  it('pauses reconnects after a failed handshake', () => {
    const now = 10_000;
    noteRedisConnectFailed(now);
    try {
      expect(redisConnectAllowed(now + 1)).toBe(false);
      expect(redisConnectAllowed(now + REDIS_CONNECT_BACKOFF_MS)).toBe(true);
    } finally {
      noteRedisConnectSucceeded();
    }
    expect(redisConnectAllowed(now)).toBe(true);
  });
});
