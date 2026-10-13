import { describe, expect, it } from 'vitest';
import {
  buildDiscoveryCardProjectionFromMapItem,
  resolveDiscoveryCardEntityRef,
} from './discovery-card-projection.js';

const hostedActivityItem = () =>
  ({
    id: 'activity:act-1',
    kind: 'hiking',
    source: 'activity',
    activityMode: 'hosted',
    title: 'Friday hike',
    latitude: 25.1,
    longitude: 55.2,
    path: '/activity/act-1',
    activity: {
      id: 'act-1',
      title: 'Friday hike',
      activityType: 'hiking',
      status: 'published',
      requirements: ['Women only'],
    },
  }) as import('./index.js').ExploreMapItemDTO;

describe('discovery-card-projection', () => {
  it('resolveDiscoveryCardEntityRef for hosted activity', () => {
    expect(resolveDiscoveryCardEntityRef(hostedActivityItem())).toEqual({
      kind: 'activity',
      activityId: 'act-1',
    });
  });

  it('buildDiscoveryCardProjectionFromMapItem uses presentation primary CTA', () => {
    const projection = buildDiscoveryCardProjectionFromMapItem(hostedActivityItem());
    expect(projection.headline.length).toBeGreaterThan(0);
    expect(projection.entityRef).toEqual({ kind: 'activity', activityId: 'act-1' });
    expect(projection.primaryCta.length).toBeGreaterThan(0);
  });
});
