import { describe, expect, it } from 'vitest';
import { formatAdminDate, formatAdminDateTime } from './formatAdminDate';

describe('formatAdminDate', () => {
  it('formats a calendar date without UTC shift', () => {
    expect(formatAdminDate('2026-12-03')).toBe('Thu, 03/12/26');
  });

  it('formats the requested pattern', () => {
    expect(formatAdminDate('2026-01-31')).toBe('Sat, 31/01/26');
  });

  it('returns an em dash for empty values', () => {
    expect(formatAdminDate(null)).toBe('—');
    expect(formatAdminDate('')).toBe('—');
  });
});

describe('formatAdminDateTime', () => {
  it('keeps date-only values without a clock', () => {
    expect(formatAdminDateTime('2026-12-03')).toBe('Thu, 03/12/26');
  });

  it('uses 24-hour clock when asked', () => {
    expect(formatAdminDateTime(new Date(2026, 0, 31, 15, 4), '24')).toBe('Sat, 31/01/26 15:04');
  });

  it('uses AM/PM when asked', () => {
    expect(formatAdminDateTime(new Date(2026, 0, 31, 15, 4), '12')).toBe('Sat, 31/01/26 3:04 PM');
  });
});
