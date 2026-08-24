import { describe, expect, it } from 'vitest';
import { formatTime24, parseTime24 } from './timePicker';

describe('timePicker', () => {
  it('round-trips morning times', () => {
    expect(formatTime24(parseTime24('09:30'))).toBe('09:30');
  });

  it('round-trips afternoon times', () => {
    expect(formatTime24(parseTime24('14:05'))).toBe('14:05');
  });

  it('handles midnight and noon', () => {
    expect(formatTime24(parseTime24('00:00'))).toBe('00:00');
    expect(formatTime24(parseTime24('12:00'))).toBe('12:00');
  });
});
