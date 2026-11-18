import { describe, expect, it } from 'vitest';
import {
  availabilityExploreMapItem,
  hostedExploreMapItem,
  seekingExploreMapItem,
} from './exploreMapItemFixtures';
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

  it('matches hosted vs availability for legacy activityMode=seeking URL', () => {
    const hosted = hostedExploreMapItem();
    const legacySeeking = seekingExploreMapItem();
    const availability = availabilityExploreMapItem();
    expect(exploreMapItemMatchesActivityModeFilter(hosted, 'hosted')).toBe(true);
    expect(exploreMapItemMatchesActivityModeFilter(legacySeeking, 'hosted')).toBe(false);
    expect(exploreMapItemMatchesActivityModeFilter(legacySeeking, 'seeking')).toBe(false);
    expect(exploreMapItemMatchesActivityModeFilter(availability, 'seeking')).toBe(true);
    expect(exploreMapItemMatchesActivityModeFilter(hosted, 'all')).toBe(true);
  });
});