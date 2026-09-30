import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  matchesBuddyOthersSubtype,
  parseExploreBuddySubtype,
  serializeExploreBuddySubtype,
} from './exploreBuddySubtype';
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

describe('exploreBuddySubtype', () => {
  it('serializes subtype only for others filter', () => {
    expect(serializeExploreBuddySubtype('events', 'others')).toBe('events');
    expect(serializeExploreBuddySubtype('all', 'others')).toBeNull();
    expect(serializeExploreBuddySubtype('events', 'hiking')).toBeNull();
    expect(parseExploreBuddySubtype('activities', 'others')).toBe('activities');
    expect(parseExploreBuddySubtype('activities', 'all')).toBe('all');
  });

  it('matchesBuddyMapFilter others uses outingCategory when present', () => {
    const eventPlan = item({ outingCategory: 'events' });
    const activityPlan = item({ outingCategory: 'activities', kind: 'event' });
    const legacyEvent = item({ kind: 'event' });

    expect(matchesBuddyMapFilter(eventPlan, 'others', 'events')).toBe(true);
    expect(matchesBuddyMapFilter(eventPlan, 'others', 'activities')).toBe(false);
    expect(matchesBuddyMapFilter(activityPlan, 'others', 'activities')).toBe(true);
    expect(matchesBuddyMapFilter(legacyEvent, 'others', 'all')).toBe(true);
    expect(matchesBuddyOthersSubtype(legacyEvent, 'events')).toBe(true);
  });
});
