import { describe, expect, it } from 'vitest';
import { exploreBookingScopeFromMatchKey } from './exploreSearchRouting';

describe('exploreBookingScopeFromMatchKey', () => {
  it('maps catalog count keys to search scopes', () => {
    expect(exploreBookingScopeFromMatchKey('activities')).toBe('join');
    expect(exploreBookingScopeFromMatchKey('places')).toBe('places');
    expect(exploreBookingScopeFromMatchKey('people')).toBe('crew');
  });
});