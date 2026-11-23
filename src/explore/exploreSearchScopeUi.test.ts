import { describe, expect, it } from 'vitest';
import { emptyExploreSearchScopeCounts } from './exploreBrowseTaxonomy';
import {
  exploreSearchScopeTitleMatchesQuery,
  exploreSearchScopesForQuery,
} from './exploreSearchScopeUi';

describe('exploreSearchScopeUi', () => {
  it('returns no scopes for empty query', () => {
    expect(exploreSearchScopesForQuery('', emptyExploreSearchScopeCounts())).toEqual([]);
  });

  it('filters scopes by title while typing', () => {
    const counts = emptyExploreSearchScopeCounts();
    expect(exploreSearchScopesForQuery('act', counts).some((s) => s === 'activities')).toBe(true);
    expect(exploreSearchScopesForQuery('x', counts)).toEqual([]);
    expect(exploreSearchScopesForQuery('xyz', counts)).toContain('people');
    expect(exploreSearchScopesForQuery('xyz', counts, { signedIn: false })).not.toContain('people');
  });

  it('includes scopes with matches even when title does not match', () => {
    const counts = { ...emptyExploreSearchScopeCounts(), places: 2 };
    expect(exploreSearchScopesForQuery('hike', counts)).toContain('places');
  });

  it('matches scope titles', () => {
    expect(exploreSearchScopeTitleMatchesQuery('agencies', 'agen')).toBe(true);
    expect(exploreSearchScopeTitleMatchesQuery('shops', 'trip')).toBe(false);
    expect(exploreSearchScopeTitleMatchesQuery('people', 'host')).toBe(true);
    expect(exploreSearchScopeTitleMatchesQuery('people', 'friends')).toBe(true);
  });
});
