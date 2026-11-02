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

  it('formats Sunday', () => {
    expect(formatActivityTime('2026-10-11T17:00:00', now)).toBe('Sun, 5:00 PM');
  });

  it('uses a full date after 6 days', () => {
    expect(formatActivityTime('2026-10-20T17:00:00', now)).toBe('Tue 20 Oct 26, 5:00 PM');
  });
});
