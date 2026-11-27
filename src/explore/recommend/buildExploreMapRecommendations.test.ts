import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreMapRecommendations, scoreExploreMapRecommendation } from './buildExploreMapRecommendations';

const hosted = (id: string, startAt: string): ExploreMapItemDTO =>
  ({
    id,
    source: 'activity',
    activityMode: 'hosted',
    title: `Outing ${id}`,
    startAt,
    lat: 25,
    lng: 55,
  }) as ExploreMapItemDTO;

describe('buildExploreMapRecommendations', () => {
  const now = new Date('2026-11-23T12:00:00.000Z').getTime();

  it('ranks sooner hosted outings above far-future and places', () => {
    const items = [
      hosted('soon', '2026-11-24T08:00:00.000Z'),
      hosted('later', '2026-12-20T08:00:00.000Z'),
      {
        id: 'place-1',
        source: 'place',
        title: 'Trail',
        lat: 25,
        lng: 55,
        discoverFeatured: true,
      } as ExploreMapItemDTO,
    ];
    const ranked = buildExploreMapRecommendations(items, { nowMs: now, limit: 3 });
    expect(ranked[0]?.id).toBe('soon');
    expect(ranked[1]?.id).toBe('later');
    expect(scoreExploreMapRecommendation(items[2]!, now)).toBeGreaterThan(0);
  });

  it('excludes availability catalog and seeking pins', () => {
    const items = [
      {
        id: 'availability:u1',
        source: 'availability',
        activityMode: 'hosted',
        title: 'Open',
        lat: 25,
        lng: 55,
      } as ExploreMapItemDTO,
      { id: 's', source: 'activity', activityMode: 'seeking', title: 'Seek', lat: 25, lng: 55 } as ExploreMapItemDTO,
      hosted('ok', '2026-11-25T08:00:00.000Z'),
    ];
    expect(scoreExploreMapRecommendation(items[0]!, now)).toBe(-1);
    expect(scoreExploreMapRecommendation(items[1]!, now)).toBe(-1);
    expect(buildExploreMapRecommendations(items, { nowMs: now })).toHaveLength(1);
  });
});