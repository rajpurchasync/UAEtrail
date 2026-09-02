import { describe, expect, it } from 'vitest';
import { formatEventLocal } from '../src/lib/datetime.js';
import { scheduleInstantChanged } from '../src/services/activity-schedule.js';

describe('scheduleInstantChanged', () => {
  it('returns false when start instant is unchanged in local time', () => {
    const instant = new Date('2026-07-01T02:30:00.000Z'); // 06:30 in Dubai
    expect(scheduleInstantChanged(instant, instant, 'AE')).toBe(false);
  });

  it('returns true when local date changes', () => {
    const previous = new Date('2026-07-01T02:30:00.000Z');
    const next = new Date('2026-07-02T02:30:00.000Z');
    expect(scheduleInstantChanged(previous, next, 'AE')).toBe(true);
  });

  it('returns true when local time changes on same day', () => {
    const previous = new Date('2026-07-01T02:30:00.000Z');
    const next = new Date('2026-07-01T04:30:00.000Z');
    const prevLocal = formatEventLocal(previous, 'AE');
    const nextLocal = formatEventLocal(next, 'AE');
    expect(prevLocal.time).not.toBe(nextLocal.time);
    expect(scheduleInstantChanged(previous, next, 'AE')).toBe(true);
  });
});
