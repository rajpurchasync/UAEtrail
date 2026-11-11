import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  addDaysIso,
  encodeCustomActivityDateRange,
  exploreActivityDatePresetToInclusiveRange,
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
    expect(parseExploreActivityDatePreset('2026-09-14..2026-09-20')).toBe('2026-09-14..2026-09-20');
    expect(parseExploreActivityDatePreset('2026-09-20..2026-09-14')).toBe('2026-09-14..2026-09-20');
  });

  it('matches a custom inclusive date range', () => {
    const range = encodeCustomActivityDateRange('2026-09-14', '2026-09-16');
    expect(matchesActivityDateFilter(activityOn('2026-09-14'), range)).toBe(true);
    expect(matchesActivityDateFilter(activityOn('2026-09-16'), range)).toBe(true);
    expect(matchesActivityDateFilter(activityOn('2026-09-17'), range)).toBe(false);
  });

  it('matches multi-day outings when filter day falls inside the window', () => {
    const multiDay = {
      ...activityOn('2026-09-10'),
      activity: {
        id: 'a1',
        date: '2026-09-10',
        endDate: '2026-09-14',
        time: '09:00',
        endTime: '18:00',
      },
    } as ExploreMapItemDTO;
    expect(matchesActivityDateFilter(multiDay, 'today')).toBe(true);
    expect(matchesActivityDateFilter(multiDay, encodeCustomActivityDateRange('2026-09-12', '2026-09-12'))).toBe(
      true
    );
    expect(matchesActivityDateFilter(multiDay, encodeCustomActivityDateRange('2026-09-15', '2026-09-15'))).toBe(
      false
    );
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

  it('exploreActivityDatePresetToInclusiveRange maps presets to ISO bounds', () => {
    expect(exploreActivityDatePresetToInclusiveRange('today')).toEqual({
      from: '2026-09-12',
      to: '2026-09-12',
    });
    expect(exploreActivityDatePresetToInclusiveRange('tomorrow')).toEqual({
      from: '2026-09-13',
      to: '2026-09-13',
    });
    expect(exploreActivityDatePresetToInclusiveRange('week')).toEqual({
      from: '2026-09-07',
      to: '2026-09-13',
    });
    expect(exploreActivityDatePresetToInclusiveRange('nextmonth')).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(exploreActivityDatePresetToInclusiveRange('thisyear')).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
    expect(exploreActivityDatePresetToInclusiveRange('nextyear')).toEqual({
      from: '2027-01-01',
      to: '2027-12-31',
    });
  });

  it('matches extended date presets', () => {
    expect(matchesActivityDateFilter(activityOn('2026-10-15'), 'nextmonth')).toBe(true);
    expect(matchesActivityDateFilter(activityOn('2026-09-15'), 'nextmonth')).toBe(false);
    expect(matchesActivityDateFilter(activityOn('2026-11-01'), 'thisyear')).toBe(true);
    expect(matchesActivityDateFilter(activityOn('2027-01-02'), 'nextyear')).toBe(true);
    expect(parseExploreActivityDatePreset('nextmonth')).toBe('nextmonth');
  });
});
