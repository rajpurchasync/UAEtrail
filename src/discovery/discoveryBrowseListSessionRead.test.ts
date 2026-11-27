import { describe, expect, it } from 'vitest';
import {
  readDiscoveryBrowseListSession,
  resolveDiscoveryBrowseListCat,
} from './discoveryBrowseListSessionRead';

describe('discoveryBrowseListSessionRead', () => {
  it('defaults listCat to activities on /list without params', () => {
    const searchParams = new URLSearchParams();
    expect(
      resolveDiscoveryBrowseListCat({
        pathname: '/list',
        searchParams,
        mapOverlay: false,
      })
    ).toBe('activities');
    const session = readDiscoveryBrowseListSession({
      pathname: '/list',
      searchParams,
      mapOverlay: false,
    });
    expect(session.listCat).toBe('activities');
    expect(session.filters.query).toBe('');
  });

  it('preserves people listCat from query on map overlay', () => {
    const searchParams = new URLSearchParams({ listCat: 'people' });
    const session = readDiscoveryBrowseListSession({
      pathname: '/explore',
      searchParams,
      mapOverlay: true,
    });
    expect(session.listCat).toBe('people');
  });
});