import { describe, expect, it } from 'vitest';
import {
  resolveFacilityDetailAreaHero,
} from './resolveConsumerDetailAreaHero';

describe('resolveFacilityDetailAreaHero', () => {
  it('prefers curated area label and resolves slug from published areas list', () => {
    expect(
      resolveFacilityDetailAreaHero(
        {
          region: 'Dubai',
          areaLabel: 'Al Qudra',
          areaId: 'area-1',
          geoRef: null,
        },
        'al-qudra'
      )
    ).toEqual({
      region: 'Dubai',
      areaLabel: 'Al Qudra',
      areaSlug: 'al-qudra',
    });
  });

  it('falls back to geoRef names when region labels are sparse', () => {
    expect(
      resolveFacilityDetailAreaHero(
        {
          region: '',
          areaLabel: null,
          areaId: 'x',
          geoRef: {
            chain: [],
            countryId: 'c',
            stateId: 's',
            areaId: 'a',
            path: 'ae/dubai/foo',
            names: { country: 'UAE', state: 'Dubai', area: 'Hatta' },
            searchTokens: [],
          },
        },
        null
      )
    ).toEqual({
      region: 'Dubai',
      areaLabel: 'Hatta',
      areaSlug: null,
    });
  });
});
