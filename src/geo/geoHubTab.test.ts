import { describe, expect, it } from 'vitest';
import { geoHubTabsForChildren, parseGeoHubTabParam } from './geoHubTab';

describe('parseGeoHubTabParam', () => {
  it('defaults to overview', () => {
    expect(parseGeoHubTabParam(null)).toBe('overview');
    expect(parseGeoHubTabParam('overview')).toBe('overview');
    expect(parseGeoHubTabParam('bogus')).toBe('overview');
  });

  it('parses places and explore, mapping legacy activities', () => {
    expect(parseGeoHubTabParam('places')).toBe('places');
    expect(parseGeoHubTabParam('explore')).toBe('explore');
    expect(parseGeoHubTabParam('activities')).toBe('explore');
  });
});

describe('geoHubTabsForChildren', () => {
  it('hides Places when the node has no sub-geo children', () => {
    expect(geoHubTabsForChildren(0)).toEqual(['overview', 'explore']);
    expect(geoHubTabsForChildren(3)).toEqual(['overview', 'places', 'explore']);
  });
});
