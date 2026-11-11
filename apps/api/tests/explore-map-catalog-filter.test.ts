import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { filterExploreMapCatalogItems } from '../src/lib/explore-map-route.js';

const item = (
  patch: Partial<ExploreMapItemDTO> & { id: string; source: string; kind: ExploreMapItemDTO['kind'] }
): ExploreMapItemDTO =>
  ({
    title: patch.id,
    latitude: 25,
    longitude: 55,
    path: '/',
    ...patch,
  }) as ExploreMapItemDTO;

const catalog = [
  item({ id: 'place', source: 'place', kind: 'hiking' }),
  item({ id: 'venue', source: 'venue', kind: 'hiking' }),
  item({ id: 'hike', source: 'activity', kind: 'hiking' }),
  item({
    id: 'ride',
    source: 'activity',
    kind: 'rideshare',
    activity: { activityType: 'rideshare' } as ExploreMapItemDTO['activity'],
  }),
  item({ id: 'shop', source: 'shop', kind: 'shop' }),
  item({ id: 'facility', source: 'facility', kind: 'hiking' }),
];

describe('explore map catalog filter', () => {
  it('keeps the full catalog when sources is omitted', () => {
    expect(filterExploreMapCatalogItems(catalog, {}).map((row) => row.id)).toEqual([
      'place',
      'venue',
      'hike',
      'ride',
      'shop',
      'facility',
    ]);
  });

  it('home map is places and outings, without rideshare pins', () => {
    expect(
      filterExploreMapCatalogItems(catalog, { sources: 'place,activity' }).map((row) => row.id)
    ).toEqual(['place', 'venue', 'hike']);
  });

  it('rideshare topic keeps ride activities only', () => {
    expect(
      filterExploreMapCatalogItems(catalog, { sources: 'activity', includeRideshare: '1' }).map(
        (row) => row.id
      )
    ).toEqual(['hike', 'ride']);
  });

  it('facilities and shops are their own layers', () => {
    expect(filterExploreMapCatalogItems(catalog, { sources: 'facility' }).map((row) => row.id)).toEqual([
      'facility',
    ]);
    expect(
      filterExploreMapCatalogItems(catalog, { sources: 'shop,agency' }).map((row) => row.id)
    ).toEqual(['shop']);
  });
});
