import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { browseCatalogHubLabel } from '../../discovery/discoverySessionListCatalogLabels';
import { resolveDiscoveryBrowseGeoHubPath } from '../../discovery/browse/resolveDiscoveryBrowseGeoLink';
import { buildActivityDetailDiscoveryCard } from './buildActivityDetailDiscoveryCard';

describe('buildActivityDetailDiscoveryCard', () => {
  it('feeds browse hub label + href from geoRef and location placeHubLabel', () => {
    const activity = {
      id: 'act-1',
      activityType: 'hiking',
      title: 'Ridge morning',
      locationName: 'Ridge trailhead',
      region: 'RAK',
      geoRef: {
        chain: ['c', 's', 'a', 'v'],
        countryId: 'c',
        stateId: 's',
        destinationId: 'a',
        venueId: 'v',
        path: 'ae/rak/wadi',
        names: { country: 'UAE', state: 'RAK', area: 'Wadi', venue: 'Wadi Ghalilah' },
        searchTokens: ['wadi'],
      },
      location: {
        id: 'loc-1',
        name: 'Ridge trailhead',
        region: 'RAK',
        activityType: 'hiking',
        description: '',
        images: [],
        featured: false,
        childFriendly: false,
        season: [],
        placeHubLabel: 'Wadi Ghalilah',
      },
    } as ActivityDetailDTO;

    const card = buildActivityDetailDiscoveryCard(activity);
    expect(browseCatalogHubLabel(card)).toBe('Wadi Ghalilah');
    expect(resolveDiscoveryBrowseGeoHubPath(card)).toBe('/geo/n/v');
    expect(card.geoRef?.venueId).toBe('v');
  });
});