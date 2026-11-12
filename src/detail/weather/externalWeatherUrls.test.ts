import { describe, expect, it } from 'vitest';
import { externalWeatherDayUrl, externalWeatherWeekUrl } from './weatherDisplayUtils';

describe('external weather URLs', () => {
  it('builds a weekly Yr forecast link from coordinates', () => {
    expect(externalWeatherWeekUrl(25.2891, 56.01234)).toBe(
      'https://www.yr.no/en/forecast/daily-table/25.2891,56.0123'
    );
  });

  it('builds a day graph link for an ISO date', () => {
    expect(externalWeatherDayUrl(25.2891, 56.01234, '2026-11-14')).toBe(
      'https://www.yr.no/en/forecast/graph/25.2891,56.0123/2026-11-14'
    );
  });
});
