import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveExploreMapRecommendationItems } from './resolveExploreMapRecommendationItems';

const item = (id: string): ExploreMapItemDTO =>
  ({
    id,
    source: 'activity',
    activityMode: 'hosted',
    title: id,
    startAt: '2026-12-01T08:00:00.000Z',
    lat: 25,
    lng: 55,
  }) as ExploreMapItemDTO;

describe('resolveExploreMapRecommendationItems', () => {
  it('orders map items by server exploreItemId list', () => {
    const mapItems = [item('activity:a'), item('activity:b'), item('activity:c')];
    const rows = [
      { exploreItemId: 'activity:c', source: 'activity', title: 'c', startAt: null, score: 1, signals: [] },
      { exploreItemId: 'activity:a', source: 'activity', title: 'a', startAt: null, score: 2, signals: [] },
    ];
    const resolved = resolveExploreMapRecommendationItems(mapItems, rows, 8);
    expect(resolved.map((r) => r.id)).toEqual(['activity:c', 'activity:a']);
  });
});