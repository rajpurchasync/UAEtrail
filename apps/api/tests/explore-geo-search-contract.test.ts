import { describe, expect, it } from 'vitest';
import {
  exploreMapItemMatchesGeoSearch,
  mongoActivityGeoSearchFilter,
  mongoGeoSearchFilter,
} from '../src/lib/explore-geo-search.js';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

describe('explore geo search contract', () => {
  it('destination filter uses catalog destinationSlug only, not geoRef area names', () => {
    const item = {
      id: 'venue:x',
      source: 'place',
      title: 'Trail',
      destinationSlug: 'hatta',
      geoRef: {
        chain: [],
        countryId: 'c',
        stateId: 's',
        areaId: 'geo-area-dubai',
        path: 'ae/dubai',
        names: { country: 'UAE', state: 'Dubai', area: 'Hatta' },
        searchTokens: ['hatta', 'dubai'],
      },
    } as ExploreMapItemDTO;

    expect(
      exploreMapItemMatchesGeoSearch(item, { destination: 'hatta' })
    ).toBe(true);
    expect(
      exploreMapItemMatchesGeoSearch(item, { destination: 'jebel-jais' })
    ).toBe(false);
  });

  it('mongoGeoSearchFilter ignores destination query param shape', async () => {
    const filter = await mongoGeoSearchFilter({ q: 'dubai' });
    expect(filter).toBeTruthy();
    const empty = await mongoGeoSearchFilter({});
    expect(empty).toBeNull();
  });

  it('mongoActivityGeoSearchFilter scopes destination via locationId, not activities.destinationId', async () => {
    const destOnly = await mongoActivityGeoSearchFilter(
      { destination: 'hatta' },
      ['place-a', 'place-b']
    );
    expect(destOnly).toEqual({ locationId: { $in: ['place-a', 'place-b'] } });

    const destPlusGeo = await mongoActivityGeoSearchFilter(
      { destination: 'hatta', q: 'dubai' },
      ['place-a']
    );
    expect(destPlusGeo).toEqual({
      $and: [{ locationId: { $in: ['place-a'] } }, { 'geoRef.searchTokens': { $all: ['dubai'] } }],
    });

    const noPlaces = await mongoActivityGeoSearchFilter({ destination: 'hatta' }, []);
    expect(noPlaces).toEqual({ locationId: { $in: [] } });
  });
});