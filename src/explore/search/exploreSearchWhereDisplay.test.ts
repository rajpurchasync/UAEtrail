import { describe, expect, it } from 'vitest';
import {
  exploreSearchWhereEffectiveQuery,
  formatExploreSearchStateWithCountry,
  formatExploreSearchWhereDisplay,
} from './exploreSearchWhereDisplay';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';

describe('exploreSearchWhereDisplay', () => {
  it('formats emirate with UAE suffix', () => {
    expect(formatExploreSearchWhereDisplay('Dubai')).toBe('Dubai, United Arab Emirates');
    expect(formatExploreSearchStateWithCountry('RAK')).toBe('Ras Al Khaimah, United Arab Emirates');
  });

  it('does not double-append suffix', () => {
    expect(formatExploreSearchWhereDisplay('Dubai, United Arab Emirates')).toBe(
      'Dubai, United Arab Emirates'
    );
  });

  it('resolves effective query from detected fallback', () => {
    expect(exploreSearchWhereEffectiveQuery('', 'Dubai')).toBe('Dubai');
    expect(exploreSearchWhereEffectiveQuery('Hatta', 'Dubai')).toBe('Hatta');
  });

  it('strips UAE suffix for browse matching', () => {
    expect(exploreSearchWhereBrowseQuery('Dubai, United Arab Emirates')).toBe('Dubai');
    expect(exploreSearchWhereBrowseQuery('Dubai')).toBe('Dubai');
  });
});