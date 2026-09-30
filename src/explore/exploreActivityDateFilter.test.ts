import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  addDaysIso,
  matchesActivityDateFilter,
  parseExploreActivityDatePreset,
} from './exploreActivityDateFilter';

const activityOn = (iso: string): ExploreMapItemDTO =>
  ({
    id: 'a1',
    title: 'Outing',
    kind: 'hiking',
    source: 'activity',
    date: iso,
    latitude: 25,
    longitude: 55,
    path: '/activity/a1',
  }) as ExploreMapItemDTO;

describe('exploreActivityDateFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parseExploreActivityDatePreset reads presets and legacy iso', () => {
    expect(parseExploreActivityDatePreset(null)).toBe('anyday');
    expect(parseExploreActivityDatePreset('week')).toBe('week');
    expect(parseExploreActivityDatePreset('2026-09-12')).toBe('today');
    expect(parseExploreActivityDatePreset('2026-09-13')).toBe('tomorrow');
    expect(parseExploreActivityDatePreset('2026-09-01')).toBe('anyday');
  });

  it('matchesActivityDateFilter for today and week', () => {
    const today = '2026-09-12';
    const venue = { ...activityOn(today), source: 'venue', kind: 'hiking' } as ExploreMapItemDTO;

    expect(matchesActivityDateFilter(activityOn(today), 'today')).toBe(true);
    expect(matchesActivityDateFilter(activityOn(addDaysIso(today, 1)), 'today')).toBe(false);
    expect(matchesActivityDateFilter(venue, 'today')).toBe(true);
    expect(matchesActivityDateFilter(activityOn('2026-09-13'), 'week')).toBe(true);
    expect(matchesActivityDateFilter(activityOn('2026-09-20'), 'week')).toBe(false);
    expect(matchesActivityDateFilter(activityOn('2026-09-25'), 'month')).toBe(true);
  });
});
