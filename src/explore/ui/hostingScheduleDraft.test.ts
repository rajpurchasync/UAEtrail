import { describe, expect, it } from 'vitest';
import { emptyCreateActivityDraft } from './hostingFlowEngine';
import {
  buildHostingEndDateOptions,
  clampHostingEndDateToWindow,
  clampHostingStartDate,
  minHostingScheduleStartDate,
  defaultEndTimeFromStart,
  formatHostingScheduleFullDate,
  formatHostingWhenPreview,
  hostingScheduleSpanLabel,
  hostingScheduleTotalHoursLabel,
  isMultiDayHostingSchedule,
  maxSelectableHostingEndDate,
  patchHostingStartDate,
  validateHostingWhenSchedule,
} from './hostingScheduleDraft';

describe('hostingScheduleDraft', () => {
  it('defaults end time three hours after start', () => {
    expect(defaultEndTimeFromStart('06:00')).toBe('09:00');
    expect(defaultEndTimeFromStart('22:00')).toBe('23:30');
  });

  it('detects multi-day schedules', () => {
    expect(isMultiDayHostingSchedule({ date: '2026-11-10', endDate: '2026-11-10' })).toBe(false);
    expect(isMultiDayHostingSchedule({ date: '2026-11-10', endDate: '2026-11-12' })).toBe(true);
  });

  it('clamps start date to today', () => {
    expect(clampHostingStartDate('2020-01-01')).toBe(minHostingScheduleStartDate());
    const patch = patchHostingStartDate({ date: '2026-11-10', endDate: '2026-11-10' }, '2020-01-01');
    expect(patch.date).toBe(minHostingScheduleStartDate());
  });

  it('shifts end date with start when still same-day', () => {
    const patch = patchHostingStartDate({ date: '2026-11-10', endDate: '2026-11-10' }, '2026-11-12');
    expect(patch).toEqual({ date: '2026-11-12', endDate: '2026-11-12' });
  });

  it('keeps end date when multi-day', () => {
    const patch = patchHostingStartDate({ date: '2026-11-10', endDate: '2026-11-14' }, '2026-11-11');
    expect(patch.endDate).toBe('2026-11-14');
  });

  it('builds 30 end-date chips from start', () => {
    const options = buildHostingEndDateOptions('2026-11-10');
    expect(options).toHaveLength(30);
    expect(options[0]).toMatchObject({ iso: '2026-11-10', label: 'Same', day: 10 });
    expect(options[29].iso).toBe(maxSelectableHostingEndDate('2026-11-10'));
  });

  it('clamps end date to 30-day window', () => {
    expect(clampHostingEndDateToWindow('2026-11-10', '2026-12-20')).toBe(
      maxSelectableHostingEndDate('2026-11-10')
    );
  });

  it('validates same-day end after start', () => {
    const start = minHostingScheduleStartDate();
    const draft = {
      ...emptyCreateActivityDraft(),
      date: start,
      endDate: start,
      time: '09:00',
      meetingTime: '09:00',
      endTime: '08:00',
    };
    expect(validateHostingWhenSchedule(draft)).toMatch(/after/);
    draft.endTime = '18:00';
    expect(validateHostingWhenSchedule(draft)).toBeNull();
  });

  it('formats full date and span labels', () => {
    expect(formatHostingScheduleFullDate('2026-11-12')).toMatch(/12/);
    expect(hostingScheduleSpanLabel('2026-11-10', '2026-11-10')).toBe('Same day');
    expect(hostingScheduleSpanLabel('2026-11-10', '2026-11-12')).toBe('3 days');
  });

  it('formats total hours for same-day and multi-day', () => {
    expect(hostingScheduleTotalHoursLabel('2026-11-10', '09:00', '2026-11-10', '18:00')).toBe(
      '9 hours total'
    );
    expect(hostingScheduleTotalHoursLabel('2026-11-10', '09:00', '2026-11-12', '18:00')).toBe(
      '57 hours total'
    );
    expect(hostingScheduleTotalHoursLabel('2026-11-10', '18:00', '2026-11-10', '09:00')).toBeNull();
  });

  it('formats preview line', () => {
    const draft = {
      ...emptyCreateActivityDraft(),
      date: '2026-11-10',
      endDate: '2026-11-12',
      time: '06:00',
      endTime: '18:00',
    };
    expect(formatHostingWhenPreview(draft)).toBe('2026-11-10 → 2026-11-12 · 06:00–18:00');
  });
});
