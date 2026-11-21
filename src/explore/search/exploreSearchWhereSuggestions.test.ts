import { describe, expect, it } from 'vitest';
import { buildExploreSearchWhereSuggestions } from './exploreSearchWhereSuggestions';

describe('buildExploreSearchWhereSuggestions', () => {
  it('returns emirates matching query with country', () => {
    const hits = buildExploreSearchWhereSuggestions('dub', [], []);
    expect(
      hits.some(
        (h) => h.kind === 'emirate' && h.label === 'Dubai, United Arab Emirates' && h.query === 'Dubai'
      )
    ).toBe(true);
  });

  it('returns empty for blank query', () => {
    expect(buildExploreSearchWhereSuggestions('  ', [], [])).toEqual([]);
  });
});