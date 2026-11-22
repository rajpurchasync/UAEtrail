import { describe, expect, it } from 'vitest';
import { compareCommunityDiscoverByGeo, type CommunityDiscoverCardDTO } from './community-discover.js';
import type { GeoRef } from './geo-hierarchy.js';

const geo = (country: string, area: string): GeoRef => ({
  chain: [],
  countryId: 'c1',
  stateId: 's1',
  areaId: 'a1',
  path: `${country}/${area}`,
  names: { country, state: area, area },
  searchTokens: [],
});

const card = (name: string, country: string, area: string): Pick<CommunityDiscoverCardDTO, 'geoRef' | 'name'> => ({
  name,
  geoRef: geo(country, area),
});

describe('compareCommunityDiscoverByGeo', () => {
  it('sorts country then city then name', () => {
    const rows = [
      card('Beta', 'United Arab Emirates', 'Dubai'),
      card('Alpha', 'Oman', 'Muscat'),
      card('Gamma', 'United Arab Emirates', 'Abu Dhabi'),
      card('Delta', 'United Arab Emirates', 'Dubai'),
    ];
    const sorted = [...rows].sort(compareCommunityDiscoverByGeo);
    expect(sorted.map((r) => `${r.geoRef.names.country}:${r.geoRef.names.area}:${r.name}`)).toEqual([
      'Oman:Muscat:Alpha',
      'United Arab Emirates:Abu Dhabi:Gamma',
      'United Arab Emirates:Dubai:Beta',
      'United Arab Emirates:Dubai:Delta',
    ]);
  });
});