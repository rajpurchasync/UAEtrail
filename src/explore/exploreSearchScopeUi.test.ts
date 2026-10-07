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
    expect(exploreSearchScopesForQuery('xyz', counts)).toEqual([]);
  });

  it('includes scopes with matches even when title does not match', () => {
    const counts = { ...emptyExploreSearchScopeCounts(), places: 2 };
    expect(exploreSearchScopesForQuery('hike', counts)).toContain('places');
  });

  it('matches scope titles', () => {
    expect(exploreSearchScopeTitleMatchesQuery('agencies', 'agen')).toBe(true);
    expect(exploreSearchScopeTitleMatchesQuery('shops', 'trip')).toBe(false);
  });
});
