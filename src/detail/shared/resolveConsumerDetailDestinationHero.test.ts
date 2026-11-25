import { describe, expect, it } from 'vitest';
import { resolveFacilityDetailDestinationHero } from './resolveConsumerDetailDestinationHero';

describe('resolveFacilityDetailDestinationHero', () => {
  it('prefers place-hub label and resolves slug from published destinations', () => {
    expect(
      resolveFacilityDetailDestinationHero(
        {
          region: 'Dubai',
          placeHubLabel: 'Al Qudra',
          geoRef: null,
        },
        'al-qudra'
      )
    ).toEqual({
      region: 'Dubai',
      placeHubLabel: 'Al Qudra',
      destinationSlug: 'al-qudra',
    });
  });

  it('falls back to geoRef names when region labels are sparse', () => {
    expect(
      resolveFacilityDetailDestinationHero(
        {
          region: '',
          placeHubLabel: null,
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
      placeHubLabel: 'Hatta',
      destinationSlug: null,
    });
  });
});