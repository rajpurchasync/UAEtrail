import { describe, expect, it } from 'vitest';
import {
  activityInstantHasEnded,
  activityScheduleHasEnded,
  activityScheduleIncludesDate,
  activityScheduleOverlapsRange,
  activityScheduleSpanLabel,
} from './activity-schedule.js';

describe('activity-schedule', () => {
  it('activityInstantHasEnded uses endAt when present', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    expect(activityInstantHasEnded(yesterday, null, 'AE')).toBe(true);
    const future = new Date(Date.now() + 60_000);
    expect(activityInstantHasEnded(future, null, 'AE')).toBe(false);
    const futureEnd = new Date(Date.now() + 120_000);
    expect(activityInstantHasEnded(future, futureEnd, 'AE')).toBe(false);
  });

  it('activityInstantHasEnded uses end of outing day when endAt is missing', () => {
    const start = new Date();
    start.setHours(start.getHours() + 2);
    expect(activityInstantHasEnded(start, null, 'AE')).toBe(false);
  });

  it('activityScheduleHasEnded uses same-day endTime when set', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
    expect(
      activityScheduleHasEnded({
        date,
        time: '09:00',
        endTime: '18:00',
        countryCode: 'AE',
      })
    ).toBe(false);
  });

  it('formats schedule span and overlap helpers', () => {
    expect(activityScheduleSpanLabel('2026-11-10', '2026-11-10')).toBe('Same day');
    expect(activityScheduleSpanLabel('2026-11-10', '2026-11-12')).toBe('3 days');
    expect(activityScheduleIncludesDate({ date: '2026-11-10', endDate: '2026-11-12' }, '2026-11-11')).toBe(
      true
    );
    expect(activityScheduleIncludesDate({ date: '2026-11-10', endDate: '2026-11-12' }, '2026-11-13')).toBe(
      false
    );
    expect(
      activityScheduleOverlapsRange('2026-11-10', '2026-11-14', '2026-11-12', '2026-11-13')
    ).toBe(true);
    expect(
      activityScheduleOverlapsRange('2026-11-10', '2026-11-14', '2026-11-15', '2026-11-16')
    ).toBe(false);
  });

  it('activityScheduleHasEnded uses endDate when present', () => {
    const farFuture = '2099-06-01';
    expect(
      activityScheduleHasEnded({
        date: farFuture,
        time: '09:00',
        endDate: farFuture,
        endTime: '18:00',
        countryCode: 'AE',
      })
    ).toBe(false);

    const past = '2020-01-01';
    expect(
      activityScheduleHasEnded({
        date: past,
        time: '09:00',
        countryCode: 'AE',
      })
    ).toBe(true);
  });
});
