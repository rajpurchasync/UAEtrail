import { describe, expect, it } from 'vitest';
import { exploreMapCatalogQuery } from './exploreMapCatalogQuery';

describe('explore map catalog query', () => {
  it('asks the home map for places and outings', () => {
    expect(exploreMapCatalogQuery({ pinKind: 'all', mapFilter: 'all' })).toEqual({
      sources: 'place,activity',
      includeRideshare: true,
    });
  });

  it('does not load rideshare when a single non-ride map filter is active', () => {
    expect(exploreMapCatalogQuery({ pinKind: 'all', mapFilter: 'hiking' })).toMatchObject({
      includeRideshare: false,
    });
  });

  it('loads rides only when that topic is selected', () => {
    expect(exploreMapCatalogQuery({ pinKind: 'all', mapFilter: 'rideshare' })).toEqual({
      sources: 'activity',
      includeRideshare: true,
    });
    expect(
      exploreMapCatalogQuery({ pinKind: 'all', mapFilter: 'all', tripTopics: ['rideshare'] })
    ).toEqual({
      sources: 'activity',
      includeRideshare: true,
    });
  });

  it('loads facilities and shops as their own layers', () => {
    expect(exploreMapCatalogQuery({ pinKind: 'all', mapFilter: 'facilities' })).toEqual({
      sources: 'facility',
      includeRideshare: false,
    });
    expect(
      exploreMapCatalogQuery({ pinKind: 'all', mapFilter: 'all', placeTopics: ['facilities'] })
    ).toEqual({
      sources: 'facility',
      includeRideshare: false,
    });
    expect(exploreMapCatalogQuery({ pinKind: 'shops', mapFilter: 'all' })).toEqual({
      sources: 'shop,agency',
      includeRideshare: false,
    });
  });
});
