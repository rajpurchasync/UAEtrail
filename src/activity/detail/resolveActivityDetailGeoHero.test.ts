import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityDetailGeoHero } from './resolveActivityDetailGeoHero';

describe('resolveActivityDetailGeoHero', () => {
  it('uses browse hub label and geo node path when no curated area slug', () => {
    const hero = resolveActivityDetailGeoHero({
      id: 'a1',
      activityType: 'hiking',
      title: 'Morning ridge',
      locationName: 'Ridge parking',
      region: 'RAK',
      geoRef: {
        chain: ['c', 's', 'a', 'v'],
        countryId: 'c',
        stateId: 's',
        areaId: 'a',
        venueId: 'v',
        path: 'ae/rak/wadi',
        names: { country: 'UAE', state: 'RAK', area: 'Wadi', venue: 'Wadi Ghalilah' },
        searchTokens: [],
      },
      location: {
        id: 'loc',
        name: 'Ridge parking',
        region: 'RAK',
        activityType: 'hiking',
        description: '',
        images: [],
        featured: false,
        childFriendly: false,
        season: [],
        areaLabel: 'Wadi Ghalilah',
      },
    } as ActivityDetailDTO);
    expect(hero.areaLabel).toBe('Wadi Ghalilah');
    expect(hero.geoHubPath).toBe('/geo/n/v');
    expect(hero.areaSlug).toBeNull();
  });
});