import { describe, expect, it } from 'vitest';
import { exploreBookingScopeFromMatchKey } from './ExploreBookingSearchMapMatches';

describe('exploreBookingScopeFromMatchKey', () => {
  it('maps count buckets to booking search scopes', () => {
    expect(exploreBookingScopeFromMatchKey('activities')).toBe('join');
    expect(exploreBookingScopeFromMatchKey('places')).toBe('places');
    expect(exploreBookingScopeFromMatchKey('people')).toBe('crew');
  });
});