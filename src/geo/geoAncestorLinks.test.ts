import { describe, expect, it } from 'vitest';
import type { GeoNodeLite } from '@uaetrail/shared-types';
import { pickGeoAncestorLinks } from './geoAncestorLinks';

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
