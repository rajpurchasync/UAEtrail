import { describe, expect, it } from 'vitest';
import { addIsoCalendarDays, inclusiveIsoDateRange, nextIsoDaysFromToday } from './weatherDateRange';

describe('weatherDateRange', () => {
  it('addIsoCalendarDays steps calendar days', () => {
    expect(addIsoCalendarDays('2026-11-09', 1)).toBe('2026-11-10');
    expect(addIsoCalendarDays('2026-11-09', 6)).toBe('2026-11-15');
  });

  it('inclusiveIsoDateRange covers start through end', () => {
    expect(inclusiveIsoDateRange('2026-11-09', '2026-11-11')).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
    ]);
    expect(inclusiveIsoDateRange('2026-11-11', '2026-11-09')).toEqual(['2026-11-11']);
  });

  it('nextIsoDaysFromToday returns seven days including today', () => {
    const days = nextIsoDaysFromToday(7);
    expect(days).toHaveLength(7);
    expect(days[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(days[6]).toBe(addIsoCalendarDays(days[0], 6));
  });
});
