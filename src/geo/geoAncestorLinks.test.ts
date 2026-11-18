import { describe, expect, it } from 'vitest';
import type { GeoNodeLite } from '@uaetrail/shared-types';
import { pickGeoAncestorLinks } from './geoAncestorLinks';
import { pickGeoRefAncestorLinks } from './geoRefAncestorLinks';

const node = (partial: Partial<GeoNodeLite> & Pick<GeoNodeLite, 'id' | 'kind' | 'n' | 's'>): GeoNodeLite => ({
  p: partial.p ?? null,
  l: partial.l ?? 1,
  a: partial.a,
  c: partial.c ?? [55, 25],
  path: partial.path ?? `/${partial.s}`,
  iso: partial.iso,
  ...partial,
});

describe('pickGeoAncestorLinks', () => {
  const tree = [
    node({ id: 'ae', kind: 'country', n: 'United Arab Emirates', s: 'ae', iso: 'AE', path: '/ae', l: 1 }),
    node({
      id: 'dxb',
      kind: 'state',
      n: 'Dubai',
      s: 'dubai',
      p: 'ae',
      path: '/ae/dubai',
      l: 2,
    }),
  ];

  it('links country and emirate for an area in Dubai', () => {
    expect(pickGeoAncestorLinks(tree, { region: 'Dubai', countryCode: 'AE' })).toEqual([
      { label: 'United Arab Emirates', href: '/geo/country/ae' },
      { label: 'Dubai', href: '/geo/n/dxb' },
    ]);
  });

  it('links the emirate when only the region label is known', () => {
    expect(pickGeoAncestorLinks(tree, { region: 'dubai' })).toEqual([
      { label: 'Dubai', href: '/geo/n/dxb' },
    ]);
  });
});

describe('pickGeoRefAncestorLinks', () => {
  const tree = [
    node({ id: 'np', kind: 'country', n: 'Nepal', s: 'np', iso: 'NP', path: '/np', l: 1 }),
    node({
      id: 'bagmati',
      kind: 'state',
      n: 'Bagmati',
      s: 'bagmati',
      p: 'np',
      path: '/np/bagmati',
      l: 2,
    }),
    node({
      id: 'ktm-area',
      kind: 'area',
      n: 'Kathmandu Valley',
      s: 'kathmandu-valley',
      p: 'bagmati',
      path: '/np/bagmati/kathmandu-valley',
      l: 3,
    }),
    node({
      id: 'thamel-venue',
      kind: 'venue',
      n: 'Thamel',
      s: 'thamel',
      p: 'ktm-area',
      path: '/np/bagmati/kathmandu-valley/thamel',
      l: 4,
    }),
  ];

  it('walks geoRef.chain for country and state, skipping venue level', () => {
    const geoRef = {
      chain: ['np', 'bagmati', 'ktm-area', 'thamel-venue'],
      countryId: 'np',
      stateId: 'bagmati',
      areaId: 'ktm-area',
      venueId: 'thamel-venue',
      path: 'np/bagmati/kathmandu-valley/thamel',
      names: {
        country: 'Nepal',
        state: 'Bagmati',
        area: 'Kathmandu Valley',
        venue: 'Thamel',
      },
      searchTokens: ['thamel'],
    };
    expect(pickGeoRefAncestorLinks(tree, geoRef)).toEqual([
      { label: 'Nepal', href: '/geo/country/np' },
      { label: 'Bagmati', href: '/geo/n/bagmati' },
      { label: 'Kathmandu Valley', href: '/geo/n/ktm-area' },
    ]);
  });
});
