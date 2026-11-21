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
    expect(parseExploreActivityModeFilter('availability')).toBe('availability');
    expect(parseExploreActivityModeFilter('seeking')).toBe('availability');
    expect(parseExploreActivityModeFilter('hosted')).toBe('hosted');
    expect(parseExploreActivityModeFilter('nope')).toBe('all');
    expect(serializeExploreActivityModeFilter('all')).toBeNull();
    expect(serializeExploreActivityModeFilter('availability')).toBe('availability');
  });

  it('matches hosted vs availability (legacy seeking activities excluded)', () => {
    const hosted = hostedExploreMapItem();
    const legacySeeking = seekingExploreMapItem();
    const availability = availabilityExploreMapItem();
    expect(exploreMapItemMatchesActivityModeFilter(hosted, 'hosted')).toBe(true);
    expect(exploreMapItemMatchesActivityModeFilter(legacySeeking, 'hosted')).toBe(false);
    expect(exploreMapItemMatchesActivityModeFilter(legacySeeking, 'availability')).toBe(false);
    expect(exploreMapItemMatchesActivityModeFilter(availability, 'availability')).toBe(true);
    expect(exploreMapItemMatchesActivityModeFilter(hosted, 'all')).toBe(true);
  });
});