import { describe, expect, it } from 'vitest';
import { exploreSearchComposeShowsRecommendations } from './exploreSearchComposeMode';

describe('exploreSearchComposeShowsRecommendations', () => {
  it('recommends on empty or default where only', () => {
    expect(exploreSearchComposeShowsRecommendations('', 'Dubai', 'Dubai')).toBe(true);
    expect(exploreSearchComposeShowsRecommendations('Dubai', 'Dubai', 'Sharjah')).toBe(true);
    expect(exploreSearchComposeShowsRecommendations('Dubai, United Arab Emirates', 'Dubai', '')).toBe(true);
  });

  it('switches to matches when activity or venue intent appears', () => {
    expect(exploreSearchComposeShowsRecommendations('hiking', 'Dubai', 'Dubai')).toBe(false);
    expect(exploreSearchComposeShowsRecommendations('Hatta dam', 'Dubai', 'Dubai')).toBe(false);
    expect(exploreSearchComposeShowsRecommendations('hiking Dubai', 'Dubai', 'Dubai')).toBe(false);
  });
});