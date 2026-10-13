import { describe, expect, it } from 'vitest';
import {
  exploreMapPathFromListSearch,
  listDiscoveryPath,
  listDiscoveryPathFromExploreSearch,
} from './routing';

describe('list discovery routing', () => {
  it('listDiscoveryPath maps Trips to activity + demand topics', () => {
    expect(
      listDiscoveryPath({
        query: 'hatta',
        categories: ['trips', 'venues'],
        tripTopics: ['hiking'],
        price: 'free',
        activityDatePreset: 'week',
      })
    ).toBe('/list?q=hatta&topics=trips%2Clooking%2Cspots%2Cshops&filter=hiking&price=free&date=week');
  });

  it('exploreMapPathFromListSearch drops list-only price and keeps plan topics', () => {
    expect(exploreMapPathFromListSearch('q=dxb&topics=trips&price=paid&when=weekend')).toBe(
      '/explore?q=dxb&topics=trips%2Clooking&pinKind=trips'
    );
  });

  it('exploreMapPathFromListSearch keeps shared browse params including filter', () => {
    expect(exploreMapPathFromListSearch('q=jais&topics=spots&filter=camping&date=week&regions=Dubai')).toBe(
      '/explore?q=jais&topics=spots%2Cshops&filter=camping&date=week&regions=Dubai&pinKind=places'
    );
  });

  it('exploreMapPathFromListSearch adds pinKind=places for listCat=venues', () => {
    expect(
      exploreMapPathFromListSearch('listCat=venues&topics=spots&filter=hiking&regions=Dubai')
    ).toBe('/explore?topics=spots%2Cshops&filter=hiking&regions=Dubai&pinKind=places');
  });

  it('listDiscoveryPathFromExploreSearch infers listCat from pinKind=places', () => {
    expect(listDiscoveryPathFromExploreSearch('?q=wadi&topics=spots&pinKind=places&filter=camping')).toBe(
      '/list?q=wadi&topics=spots%2Cshops&filter=camping&listCat=venues'
    );
  });

  it('listDiscoveryPathFromExploreSearch mirrors explore browse query on /list', () => {
    expect(
      listDiscoveryPathFromExploreSearch('?q=hatta&topics=trips&filter=hiking&date=week&regions=Dubai')
    ).toBe('/list?q=hatta&topics=trips%2Clooking&filter=hiking&date=week&regions=Dubai&listCat=trips');
  });
});
