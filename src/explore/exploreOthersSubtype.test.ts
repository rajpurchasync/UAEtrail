import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  matchesOthersMapSubtype,
  parseExploreOthersSubtype,
  serializeExploreOthersSubtype,
} from './exploreOthersSubtype';
import { matchesOthersMapFilter } from './ui/exploreMapPinModel';

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

describe('exploreOthersSubtype', () => {
  it('serializes subtype only for others filter', () => {
    expect(serializeExploreOthersSubtype('events', 'others')).toBe('events');
    expect(serializeExploreOthersSubtype('all', 'others')).toBeNull();
    expect(serializeExploreOthersSubtype('events', 'hiking')).toBeNull();
    expect(parseExploreOthersSubtype('activities', 'others')).toBe('activities');
    expect(parseExploreOthersSubtype('activities', 'all')).toBe('all');
  });

  it('matchesOthersMapFilter others uses outingCategory when present', () => {
    const eventPlan = item({ outingCategory: 'events' });
    const activityPlan = item({ outingCategory: 'activities', kind: 'event' });
    const legacyEvent = item({ kind: 'event' });

    expect(matchesOthersMapFilter(eventPlan, 'others', 'events')).toBe(true);
    expect(matchesOthersMapFilter(eventPlan, 'others', 'activities')).toBe(false);
    expect(matchesOthersMapFilter(activityPlan, 'others', 'activities')).toBe(true);
    expect(matchesOthersMapFilter(legacyEvent, 'others', 'all')).toBe(true);
    expect(matchesOthersMapSubtype(legacyEvent, 'events')).toBe(true);
  });
});
