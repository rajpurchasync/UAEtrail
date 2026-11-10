import { describe, expect, it } from 'vitest';
import { GeoStore } from './geoStore';
import { GEO_AREA_AE_AL_AIN_ID, GEO_LEGACY_STATE_AE_AL_AIN_ID, type GeoTreeDTO } from '@uaetrail/shared-types';

describe('GeoStore', () => {
  it('indexes countries by iso/slug and lists children', () => {
    const store = new GeoStore();
    const tree: GeoTreeDTO = {
      version: 1,
      nodes: [
        {
          id: 'c1',
          p: null,
          l: 1,
          s: 'ae',
          n: 'United Arab Emirates',
          c: [54.5, 24.4],
          path: 'ae',
          kind: 'country',
          iso: 'AE',
        },
        {
          id: 's1',
          p: 'c1',
          l: 2,
          s: 'dubai',
          n: 'Dubai',
          c: [55.3, 25.2],
          path: 'ae/dubai',
          kind: 'state',
        },
      ],
    };
    store.load(tree);
    expect(store.countryByCode('AE')?.id).toBe('c1');
    expect(store.countryByCode('ae')?.n).toBe('United Arab Emirates');
    expect(store.childrenOf('c1')).toHaveLength(1);
  });

  it('resolves the legacy Al Ain state id to the Abu Dhabi area node', () => {
    const store = new GeoStore();
    store.load({
      version: 1,
      nodes: [
        {
          id: 'geo-country-ae',
          p: null,
          l: 1,
          s: 'ae',
          n: 'United Arab Emirates',
          c: [54.5, 24.4],
          path: 'ae',
          kind: 'country',
          iso: 'AE',
        },
        {
          id: 'geo-state-ae-abu-dhabi',
          p: 'geo-country-ae',
          l: 2,
          s: 'abu-dhabi',
          n: 'Abu Dhabi',
          c: [54.37, 24.45],
          path: 'ae/abu-dhabi',
          kind: 'state',
        },
        {
          id: GEO_AREA_AE_AL_AIN_ID,
          p: 'geo-state-ae-abu-dhabi',
          l: 3,
          s: 'al-ain',
          n: 'Al Ain',
          c: [55.76, 24.21],
          path: 'ae/abu-dhabi/al-ain',
          kind: 'area',
        },
      ],
    });
    expect(store.byId.get(GEO_LEGACY_STATE_AE_AL_AIN_ID)?.id).toBe(GEO_AREA_AE_AL_AIN_ID);
    expect(store.byId.get(GEO_LEGACY_STATE_AE_AL_AIN_ID)?.kind).toBe('area');
    expect(store.childrenOf('geo-state-ae-abu-dhabi').map((n) => n.n)).toContain('Al Ain');
  });
});
