import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  accumulateDestinationHubStats,
  destinationHubStatsSummaryForDestination,
} from '../src/lib/explore-map-destination-lens.js';
import { testAreas } from './helpers/test-seed.js';

describe('destination hub stats rollup', () => {
  it('rolls up hosted and venue counts per destination', () => {
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
        destinationId: testAreas.hatta.id,
      },
      {
        id: 'venue:1',
        kind: 'hiking',
        source: 'venue',
        title: 'Trail',
        latitude: 1,
        longitude: 2,
        path: '/place/1',
        destinationId: testAreas.hatta.id,
      },
    ];

    const stats = accumulateDestinationHubStats(catalog).get(testAreas.hatta.id);
    expect(stats?.hostedActivities).toBe(1);
    expect(stats?.trailSpots).toBe(1);

    const summary = destinationHubStatsSummaryForDestination(testAreas.hatta.id, catalog);
    expect(summary.summary).toContain('outing');
  });

  it('counts member_availability pins in availabilityPins rollup field', () => {
    const catalog: ExploreMapItemDTO[] = [
      {
        id: 'availability:u1:s1',
        kind: 'hiking',
        source: 'availability',
        title: 'Free Saturday',
        latitude: 1,
        longitude: 2,
        path: '/profile/u1',
        destinationId: testAreas.hatta.id,
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
        destinationId: testAreas.hatta.id,
      },
    ];
    const stats = accumulateDestinationHubStats(catalog).get(testAreas.hatta.id);
    expect(stats?.availabilityPins).toBe(1);
    expect(stats?.hostedActivities).toBe(0);
    expect(destinationHubStatsSummaryForDestination(testAreas.hatta.id, catalog).summary).toContain(
      'available'
    );
  });

  it('counts facility pins from explore map items (facilities collection)', () => {
    const catalog: ExploreMapItemDTO[] = [
      {
        id: 'facility:1',
        kind: 'event',
        source: 'venue',
        title: 'Toilet',
        latitude: 1,
        longitude: 2,
        path: '/facility/1',
        destinationId: testAreas.hatta.id,
        placeKind: 'toilet',
      },
    ];
    expect(accumulateDestinationHubStats(catalog).get(testAreas.hatta.id)?.facilities).toBe(1);
  });
});