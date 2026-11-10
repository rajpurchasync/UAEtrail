import { describe, expect, it } from 'vitest';
import {
  activityScheduleIsMultiDay,
  formatActivityScheduleDateRangeLabel,
  formatActivityScheduleTimeRangeLabel,
} from './activity-schedule-presentation.js';

describe('activity-schedule-presentation', () => {
  it('formats multi-day range', () => {
    expect(formatActivityScheduleDateRangeLabel('2026-11-22', '2026-11-24')).toContain('–');
    expect(activityScheduleIsMultiDay('2026-11-22', '2026-11-24')).toBe(true);
  });

  it('formats time range', () => {
    expect(formatActivityScheduleTimeRangeLabel('16:00', '18:30')).toBe('4:00 PM – 6:30 PM');
  });
});
