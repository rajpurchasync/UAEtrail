import { describe, expect, it } from 'vitest';
import { parseLocalDateTime, formatEventLocal } from '../src/lib/datetime.js';

describe('GCC timezone parsing', () => {
  it('parses UAE local time to UTC (+04:00)', () => {
    const instant = parseLocalDateTime('2026-03-15', '06:30', 'AE');
    expect(instant.toISOString()).toBe('2026-03-15T02:30:00.000Z');
  });

  it('parses Saudi local time to UTC (+03:00)', () => {
    const instant = parseLocalDateTime('2026-01-10', '09:00', 'SA');
    expect(instant.toISOString()).toBe('2026-01-10T06:00:00.000Z');
  });

  it('defaults to UAE when country code is unknown', () => {
    const instant = parseLocalDateTime('2026-06-01', '12:00', 'XX');
    expect(instant.toISOString()).toBe('2026-06-01T08:00:00.000Z');
  });

  it('formats UTC instant back to local date/time for Oman', () => {
    const instant = new Date('2026-07-04T18:00:00.000Z');
    const local = formatEventLocal(instant, 'OM');
    expect(local.date).toBe('2026-07-04');
    expect(local.time).toBe('22:00');
  });
});
