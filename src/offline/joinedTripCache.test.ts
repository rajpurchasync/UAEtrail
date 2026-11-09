import { describe, expect, it } from 'vitest';
import { isJoinedTripCacheUrl, joinedTripCacheUrls, JOINED_TRIP_MAX_BYTES } from './joinedTripCache';

describe('joinedTripCache keys', () => {
  it('lists only the joined activity shell and private itinerary/gear URLs', () => {
    const urls = joinedTripCacheUrls('act-1');
    expect(urls).toEqual(['/api/activities/act-1', '/api/activities/act-1/private']);
    expect(urls.every((u) => u.startsWith('/api/activities/'))).toBe(true);
    expect(urls.some((u) => u === '/api' || u.startsWith('/api/explore'))).toBe(false);
    expect(JOINED_TRIP_MAX_BYTES).toBe(2 * 1024 * 1024);
  });

  it('does not treat unrelated API paths as cache hits', () => {
    const allowed = joinedTripCacheUrls('act-1');
    expect(isJoinedTripCacheUrl('/api/activities/act-1', allowed)).toBe(true);
    expect(isJoinedTripCacheUrl('/api/explore/map', allowed)).toBe(false);
    expect(isJoinedTripCacheUrl('/api/activities', allowed)).toBe(false);
  });
});
