import { describe, expect, it } from 'vitest';
import type { AreaDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreAreaLensItems } from '../src/lib/explore-map-area-lens.js';
import { testAreas } from './helpers/test-seed.js';

const area = (slug: string, id: string): AreaDTO => ({
  id,
  slug,
  name: slug === 'hatta' ? 'Hatta' : 'Jebel Jais',
  region: 'Dubai',
  status: 'published',
  center: { latitude: 24.8, longitude: 56.1 },
  bounds: [],
  priority: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('buildExploreAreaLensItems', () => {
  it('rolls up hosted and venue counts per area', () => {
    const areas = [area(testAreas.hatta.slug, testAreas.hatta.id)];
    const catalog: ExploreMapItemDTO[] = [
      {
        id: 'activity:1',
        kind: 'hiking',
        source: 'activity',
        activityMode: 'hosted',
        title: 'Hike',
        latitude: 1,
        longitude: 2,
        path: '/activity/1',
        areaId: testAreas.hatta.id,
      },
      {
        id: 'venue:1',
        kind: 'hiking',
        source: 'venue',
        title: 'Trail',
        latitude: 1,
        longitude: 2,
        path: '/trail/1',
        areaId: testAreas.hatta.id,
      },
    ];

    const rows = buildExploreAreaLensItems(areas, catalog);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.source).toBe('area');
    expect(rows[0]?.areaLensStats?.hostedActivities).toBe(1);
    expect(rows[0]?.areaLensStats?.trailSpots).toBe(1);
    expect(rows[0]?.subtitle).toContain('outing');
  });

  it('counts member_availability pins in availabilityPins rollup field', () => {
    const areas = [area(testAreas.hatta.slug, testAreas.hatta.id)];
    const catalog: ExploreMapItemDTO[] = [
      {
        id: 'availability:u1:s1',
        kind: 'hiking',
        source: 'availability',
        title: 'Free Saturday',
        latitude: 1,
        longitude: 2,
        path: '/profile/u1',
        areaId: testAreas.hatta.id,
      },
      {
        id: 'activity:seek',
        kind: 'hiking',
        source: 'activity',
        activityMode: 'seeking',
        title: 'Legacy seeking',
        latitude: 1,
        longitude: 2,
        path: '/activity/seek',
        areaId: testAreas.hatta.id,
      },
    ];
    const rows = buildExploreAreaLensItems(areas, catalog);
    expect(rows[0]?.areaLensStats?.availabilityPins).toBe(1);
    expect(rows[0]?.areaLensStats?.hostedActivities).toBe(0);
    expect(rows[0]?.subtitle).toContain('available');
  });

  it('counts facility pins from explore map items (facilities collection)', () => {
    const areas = [area(testAreas.hatta.slug, testAreas.hatta.id)];
    const catalog: ExploreMapItemDTO[] = [
      {
        id: 'facility:1',
        kind: 'event',
        source: 'venue',
        title: 'Toilet',
        latitude: 1,
        longitude: 2,
        path: '/facility/1',
        areaId: testAreas.hatta.id,
        placeKind: 'toilet',
      },
    ];
    const rows = buildExploreAreaLensItems(areas, catalog);
    expect(rows[0]?.areaLensStats?.facilities).toBe(1);
  });
});
