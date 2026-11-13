import { describe, expect, it } from 'vitest';
import { isOpenMeteoForecastDateInRange } from './openMeteoClientForecast';

describe('openMeteoClientForecast', () => {
  it('allows today through +15 days', () => {
    const today = '2026-03-09';
    expect(isOpenMeteoForecastDateInRange(today, today)).toBe(true);
    expect(isOpenMeteoForecastDateInRange('2026-03-24', today)).toBe(true);
    expect(isOpenMeteoForecastDateInRange('2026-03-25', today)).toBe(false);
    expect(isOpenMeteoForecastDateInRange('2026-03-08', today)).toBe(false);
  });
});
