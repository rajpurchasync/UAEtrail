import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from './index';
import {
  applyMapExploreGeoBoost,
  buildExploreMapRecommendationOrder,
  scoreExploreMapCatalogItem,
} from './map-explore-recommendation-score';

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

describe('map-explore-recommendation-score', () => {
  const now = new Date('2026-11-23T12:00:00.000Z').getTime();

  it('ranks sooner hosted outings above far-future and places', () => {
    const items = [
      hosted('soon', '2026-11-24T08:00:00.000Z'),
      hosted('later', '2026-12-20T08:00:00.000Z'),
      { id: 'place-1', source: 'place', title: 'Trail', lat: 25, lng: 55, discoverFeatured: true } as ExploreMapItemDTO,
    ];
    const ranked = buildExploreMapRecommendationOrder(items, { nowMs: now, limit: 3 });
    expect(ranked[0]?.id).toBe('soon');
    expect(ranked[1]?.id).toBe('later');
    expect(scoreExploreMapCatalogItem(items[2]!, now)?.score).toBeGreaterThan(0);
  });

  it('adds near_you when pin is within geo radius', () => {
    const ranked = scoreExploreMapCatalogItem(
      {
        id: 'activity:near',
        source: 'activity',
        activityMode: 'hosted',
        title: 'Nearby hike',
        startAt: '2026-11-25T08:00:00.000Z',
        latitude: 25.05,
        longitude: 55.05,
      } as ExploreMapItemDTO,
      now,
      { viewerGeo: { lat: 25, lng: 55 } }
    );
    expect(ranked?.signals).toContain('near_you');
    const boosted = applyMapExploreGeoBoost(
      { score: 80, signals: [] },
      { lat: 25.01, lng: 55.01 },
      { lat: 25, lng: 55 }
    );
    expect(boosted.signals).toContain('near_you');
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
    expect(scoreExploreMapCatalogItem(items[0]!, now)).toBeNull();
    expect(scoreExploreMapCatalogItem(items[1]!, now)).toBeNull();
    expect(buildExploreMapRecommendationOrder(items, { nowMs: now })).toHaveLength(1);
  });
});