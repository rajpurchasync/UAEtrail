import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { applyExploreMapHttpProjection } from '../src/lib/explore-map-list-projection.js';

const sampleActivityItem = (): ExploreMapItemDTO =>
  ({
    id: 'activity:act-1',
    source: 'activity',
    kind: 'hiking',
    title: 'Friday hike',
    latitude: 25.1,
    longitude: 55.2,
    activity: {
      id: 'act-1',
      title: 'Friday hike',
      description: 'Long trail description that should not ship on default map pins.',
      images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      tenantId: 'tenant-1',
      joinMode: 'open',
    },
    locationCard: {
      id: 'loc-1',
      name: 'Trail',
      images: ['https://example.com/l1.jpg', 'https://example.com/l2.jpg'],
    },
    participantPreviews: [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }, { id: 'u4' }],
    about: 'About text',
    websiteUrl: 'https://example.com',
    contactPhone: '+971500000000',
  }) as ExploreMapItemDTO;

describe('explore map HTTP projection (W2 pin default)', () => {
  it('strips nested payload by default', () => {
    const slim = applyExploreMapHttpProjection([sampleActivityItem()], undefined)[0];
    expect(slim.activity?.description).toBe('');
    expect(slim.activity?.images).toHaveLength(1);
    expect(slim.locationCard?.images).toHaveLength(1);
    expect(slim.participantPreviews).toHaveLength(3);
    expect(slim.about).toBeNull();
    expect(slim.discoveryCard).toBeTruthy();
  });

  it('keeps nested payload when projection=full', () => {
    const full = applyExploreMapHttpProjection([sampleActivityItem()], 'full')[0];
    expect(full.activity?.description).toContain('Long trail');
    expect(full.activity?.images).toHaveLength(2);
    expect(full.about).toBe('About text');
  });
});
