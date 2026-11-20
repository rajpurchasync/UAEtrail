import { describe, expect, it } from 'vitest';
import { buildExploreHubWhereSuggestions } from './exploreHubWhereSuggestions';

describe('buildExploreHubWhereSuggestions', () => {
  it('returns emirates matching query with country', () => {
    const hits = buildExploreHubWhereSuggestions('dub', [], []);
    expect(
      hits.some(
        (h) => h.kind === 'emirate' && h.label === 'Dubai, United Arab Emirates' && h.query === 'Dubai'
      )
    ).toBe(true);
  });

  it('returns empty for blank query', () => {
    expect(buildExploreHubWhereSuggestions('  ', [], [])).toEqual([]);
  });
});