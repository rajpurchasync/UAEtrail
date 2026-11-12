import { describe, expect, it } from 'vitest';
import { formatActivityTime } from './formatActivityTime';

describe('formatActivityTime', () => {
  const now = new Date('2026-10-05T10:00:00');

  it('formats weekday and time within the next 6 days', () => {
    expect(formatActivityTime('2026-10-09T06:00:00', now)).toBe('Fri, 6:00 AM');
  });

  it('uses the coming weekday for the next calendar day', () => {
    expect(formatActivityTime('2026-10-06T17:00:00', now)).toBe('Tue, 5:00 PM');
  });

  it('uses the weekday for the same calendar day', () => {
    expect(formatActivityTime('2026-10-05T18:30:00', now)).toBe('Mon, 6:30 PM');
  });

  // now = Mon 05 Oct 2026 → calendar week Sun 04 – Sat 10.
  it('adds the day of month once the outing is past this week but still this month', () => {
    expect(formatActivityTime('2026-10-11T17:00:00', now)).toBe('Sun 11, 5:00 PM');
    expect(formatActivityTime('2026-10-20T17:00:00', now)).toBe('Tue 20, 5:00 PM');
  });

  it('adds the month for a later month this year', () => {
    expect(formatActivityTime('2026-11-17T17:00:00', now)).toBe('Tue 17 Nov, 5:00 PM');
  });

  it('uses a full date outside this year', () => {
    expect(formatActivityTime('2027-01-12T17:00:00', now)).toBe('Tue 12 Jan 27, 5:00 PM');
  });
});
