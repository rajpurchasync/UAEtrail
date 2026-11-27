import { describe, expect, it } from 'vitest';
import {
  exploreMapPathFromListSearch,
  listDiscoveryPath,
  listDiscoveryPathFromExploreSearch,
  crewsHubHomePath,
  findCrewDiscoveryListPath,
  isFindCrewDiscoveryListPath,
} from './browseListRouting';

describe('list discovery routing', () => {
  it('crewsHubHomePath opens My crew hub on /list', () => {
    expect(crewsHubHomePath()).toBe('/list?listCat=people');
  });

  it('findCrewDiscoveryListPath opens Find crew list shell', () => {
    expect(findCrewDiscoveryListPath()).toContain('listCat=people');
    expect(findCrewDiscoveryListPath()).toContain('crewSurface=find');
  });

  it('isFindCrewDiscoveryListPath matches find crew query only', () => {
    expect(isFindCrewDiscoveryListPath('/list', findCrewDiscoveryListPath().split('?')[1] ?? '')).toBe(
      true
    );
    expect(isFindCrewDiscoveryListPath('/list', 'listCat=people')).toBe(false);
    expect(isFindCrewDiscoveryListPath('/explore/search', 'searchScope=crew')).toBe(false);
  });

  it('listDiscoveryPath maps Trips + venues browse topics', () => {
    expect(
      listDiscoveryPath({
        query: 'hatta',
        categories: ['activities', 'venues'],
        tripTopics: ['hiking'],
        price: 'free',
        activityDatePreset: 'week',
      })
    ).toBe(
      '/list?q=hatta&topics=trips%2Cspots%2Cshops&filter=hiking&tripTypes=hiking&price=free&date=week'
    );
  });

  it('exploreMapPathFromListSearch keeps shared price on the map and drops weekend-only when', () => {
    expect(exploreMapPathFromListSearch('q=dxb&topics=trips&price=paid&when=weekend')).toBe(
      '/explore?q=dxb&topics=trips&price=paid&pinKind=activities'
    );
  });

  it('exploreMapPathFromListSearch keeps shared browse params including filter', () => {
    expect(exploreMapPathFromListSearch('q=jais&topics=spots&filter=camping&date=week&regions=Dubai')).toBe(
      '/explore?q=jais&topics=spots%2Cshops&filter=camping&tripTypes=camping&placeTypes=camping&date=week&regions=Dubai&pinKind=places'
    );
  });

  it('exploreMapPathFromListSearch adds pinKind=places for listCat=venues', () => {
    expect(
      exploreMapPathFromListSearch('listCat=venues&topics=spots&filter=hiking&regions=Dubai')
    ).toBe(
      '/explore?topics=spots%2Cshops&filter=hiking&placeTypes=hiking&regions=Dubai&pinKind=places&panel=venues&listCat=venues'
    );
  });

  it('listDiscoveryPathFromExploreSearch infers listCat from pinKind=places', () => {
    expect(listDiscoveryPathFromExploreSearch('?q=wadi&topics=spots&pinKind=places&filter=camping')).toBe(
      '/list?q=wadi&topics=spots%2Cshops&filter=camping&placeTypes=camping&listCat=venues'
    );
  });

  it('listDiscoveryPathFromExploreSearch mirrors explore browse query on /list', () => {
    expect(
      listDiscoveryPathFromExploreSearch('?q=hatta&topics=trips&filter=hiking&date=week&regions=Dubai')
    ).toBe(
      '/list?q=hatta&topics=trips&filter=hiking&tripTypes=hiking&date=week&regions=Dubai&listCat=activities'
    );
  });

  it('listDiscoveryPathFromExploreSearch scopes trips from panel=activities', () => {
    expect(listDiscoveryPathFromExploreSearch('?panel=activities&filter=hiking&topics=spots')).toBe(
      '/list?topics=trips&filter=hiking&tripTypes=hiking&listCat=activities'
    );
  });

  it('listDiscoveryPathFromExploreSearch scopes venues from panel=venues', () => {
    expect(listDiscoveryPathFromExploreSearch('?panel=venues&filter=camping&topics=trips')).toBe(
      '/list?topics=spots%2Cshops&filter=camping&placeTypes=camping&listCat=venues'
    );
  });

  it('listDiscoveryPathFromExploreSearch keeps explicit listCat from explore', () => {
    expect(listDiscoveryPathFromExploreSearch('?browse=1&listCat=agencies&q=desert')).toBe(
      '/list?q=desert&listCat=agencies'
    );
  });
});
