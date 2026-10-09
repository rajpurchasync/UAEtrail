import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  matchesOutingTopicFilter,
  parseExploreOutingTopic,
  serializeExploreOutingTopic,
} from './exploreOutingTopic';
import { matchesBuddyMapFilter } from './ui/exploreMapPinModel';

const item = (overrides: Partial<ExploreMapItemDTO>): ExploreMapItemDTO =>
  ({
    id: 'x',
    title: 'Test',
    kind: 'event',
    source: 'activity',
    latitude: 25,
    longitude: 55,
    path: '/activity/x',
    ...overrides,
  }) as ExploreMapItemDTO;

describe('exploreOutingTopic', () => {
  it('serializes topic only for others + activities', () => {
    expect(serializeExploreOutingTopic('climbing', 'others', 'activities')).toBe('climbing');
    expect(serializeExploreOutingTopic('all', 'others', 'activities')).toBeNull();
    expect(serializeExploreOutingTopic('climbing', 'others', 'events')).toBeNull();
    expect(serializeExploreOutingTopic('climbing', 'hiking', 'activities')).toBeNull();
    expect(parseExploreOutingTopic('workshop', 'others', 'activities')).toBe('workshop');
    expect(parseExploreOutingTopic('workshop', 'others', 'events')).toBe('all');
  });

  it('matchesOutingTopicFilter on activities and tagged places', () => {
    const climb = item({ outingCategory: 'activities', outingTopic: 'climbing' });
    const event = item({ outingCategory: 'events', outingTopic: 'climbing' });
    const venue = item({
      source: 'venue',
      kind: 'hiking',
      outingTopic: 'climbing',
      outingCategory: 'hiking',
    });
    expect(matchesOutingTopicFilter(climb, 'climbing')).toBe(true);
    expect(matchesOutingTopicFilter(climb, 'all')).toBe(true);
    expect(matchesOutingTopicFilter(climb, 'workshop')).toBe(false);
    expect(matchesOutingTopicFilter(event, 'climbing')).toBe(false);
    expect(matchesOutingTopicFilter(venue, 'climbing')).toBe(true);
    expect(matchesOutingTopicFilter(venue, 'trail_run')).toBe(false);
  });

  it('matchesBuddyMapFilter applies topic within others activities', () => {
    const climb = item({ outingCategory: 'activities', outingTopic: 'climbing' });
    const run = item({ outingCategory: 'activities', outingTopic: 'trail_run' });
    expect(matchesBuddyMapFilter(climb, 'others', 'activities', 'climbing')).toBe(true);
    expect(matchesBuddyMapFilter(climb, 'others', 'activities', 'trail_run')).toBe(false);
    expect(matchesBuddyMapFilter(run, 'others', 'activities', 'all')).toBe(true);
  });
});
