import { describe, expect, it } from 'vitest';
import {
  availabilityKindMatchesActivityType,
  availabilityKindsForActivityType,
  memberAvailabilityCalendarDays,
  memberAvailabilitySlotsAsDayPicks,
  groupConsecutiveMemberAvailabilityDays,
  normalizeMemberAvailabilitySlotsForStorage,
} from './member-availability.js';

describe('availabilityKindMatchesActivityType', () => {
  it('matches hosted activity types to availability kinds without location', () => {
    expect(availabilityKindMatchesActivityType(['hiking'], 'HIKING')).toBe(true);
    expect(availabilityKindMatchesActivityType(['camping'], 'HIKING')).toBe(false);
    expect(availabilityKindMatchesActivityType(['rideshare'], 'RIDESHARE')).toBe(true);
    expect(availabilityKindsForActivityType('HIKING')).toContain('hiking');
  });
});

describe('memberAvailabilityCalendarDays', () => {
  it('projects single-day and multi-day picks onto calendar days', () => {
    expect(
      memberAvailabilityCalendarDays([
        { startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'any' },
        { startDate: '2026-10-14', endDate: '2026-10-14', timeBand: 'any' },
      ])
    ).toEqual(['2026-10-11', '2026-10-14']);

    expect(
      memberAvailabilityCalendarDays([{ startDate: '2026-10-10', endDate: '2026-10-12', timeBand: 'any' }])
    ).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
  });

  it('normalizes stored ranges into one row per day', () => {
    expect(
      memberAvailabilitySlotsAsDayPicks([
        { startDate: '2026-10-10', endDate: '2026-10-11', timeBand: 'morning' },
      ])
    ).toEqual([
      { startDate: '2026-10-10', endDate: '2026-10-10', timeBand: 'morning' },
      { startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'morning' },
    ]);
  });

  it('dedupes and sorts day rows for storage', () => {
    expect(
      normalizeMemberAvailabilitySlotsForStorage([
        { startDate: '2026-10-14', endDate: '2026-10-14', timeBand: 'any' },
        { startDate: '2026-10-10', endDate: '2026-10-12', timeBand: 'any' },
        { startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'any' },
      ])
    ).toEqual([
      { startDate: '2026-10-10', endDate: '2026-10-10', timeBand: 'any' },
      { startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'any' },
      { startDate: '2026-10-12', endDate: '2026-10-12', timeBand: 'any' },
      { startDate: '2026-10-14', endDate: '2026-10-14', timeBand: 'any' },
    ]);
  });

  it('groups consecutive days for compact labels', () => {
    expect(
      groupConsecutiveMemberAvailabilityDays(['2026-10-10', '2026-10-11', '2026-10-14'])
    ).toEqual([
      { start: '2026-10-10', end: '2026-10-11' },
      { start: '2026-10-14', end: '2026-10-14' },
    ]);
  });
});
