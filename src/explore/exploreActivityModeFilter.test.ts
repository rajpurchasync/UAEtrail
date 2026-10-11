import { describe, expect, it } from 'vitest';
import { hostedExploreMapItem, seekingExploreMapItem } from './exploreMapItemFixtures';
import {
  exploreMapItemMatchesActivityModeFilter,
  parseExploreActivityModeFilter,
  serializeExploreActivityModeFilter,
} from './exploreActivityModeFilter';

describe('exploreActivityModeFilter', () => {
  it('parses and serializes URL values', () => {
    expect(parseExploreActivityModeFilter('seeking')).toBe('seeking');
    expect(parseExploreActivityModeFilter('hosted')).toBe('hosted');
    expect(parseExploreActivityModeFilter('nope')).toBe('all');
    expect(serializeExploreActivityModeFilter('all')).toBeNull();
    expect(serializeExploreActivityModeFilter('seeking')).toBe('seeking');
  });

  it('filters hosted vs seeking map items', () => {
    const hosted = hostedExploreMapItem();
    const seeking = seekingExploreMapItem();
    expect(exploreMapItemMatchesActivityModeFilter(hosted, 'hosted')).toBe(true);
    expect(exploreMapItemMatchesActivityModeFilter(seeking, 'hosted')).toBe(false);
    expect(exploreMapItemMatchesActivityModeFilter(seeking, 'seeking')).toBe(true);
    expect(exploreMapItemMatchesActivityModeFilter(hosted, 'all')).toBe(true);
  });
});
