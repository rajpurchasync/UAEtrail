import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../discoveryCardModel';
import { resolveDiscoveryBrowseGeoHubPath } from './resolveDiscoveryBrowseGeoLink';

const card = (overrides: Partial<DiscoveryCardModel>): DiscoveryCardModel =>
  ({
    id: 'venue:1',
    path: '/place/1',
    source: 'place',
    kind: 'hiking',
    tone: 'hiking',
    emoji: '🥾',
    headline: 'Trail',
    listTitle: 'Trail',
    listHost: null,
    subtitle: null,
    price: null,
    spotsLabel: null,
    venueHint: null,
    showJoinHint: false,
    primaryCta: 'View',
    secondaryCta: null,
    showJoinActions: false,
    shareTitle: 'Trail',
    sharePath: '/explore',
    sections: { details: [] },
    ...overrides,
  }) as DiscoveryCardModel;

describe('resolveDiscoveryBrowseGeoHubPath', () => {
  it('prefers geo L4 venue node over curated area', () => {
    expect(
      resolveDiscoveryBrowseGeoHubPath(
        card({
          geoRef: {
            chain: ['c', 's', 'a', 'v'],
            countryId: 'c',
            stateId: 's',
            areaId: 'a',
            venueId: 'geo-venue-hatta',
            path: 'ae/dubai/hatta/hatta-dam',
            names: { country: 'UAE', state: 'Dubai', area: 'Hatta', venue: 'Hatta Dam' },
            searchTokens: [],
          },
          areaSlug: 'hatta',
        })
      )
    ).toBe('/geo/n/geo-venue-hatta');
  });

  it('falls back to curated area slug when no venueId', () => {
    expect(
      resolveDiscoveryBrowseGeoHubPath(
        card({
          areaSlug: 'mleiha',
        })
      )
    ).toBe('/area/mleiha');
  });

  it('returns null when no geo or area slug', () => {
    expect(resolveDiscoveryBrowseGeoHubPath(card({}))).toBeNull();
  });
});