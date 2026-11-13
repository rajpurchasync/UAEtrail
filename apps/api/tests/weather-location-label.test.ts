import { describe, expect, it } from 'vitest';
import { formatWeatherForecastLocationName } from '../src/lib/weather-location-label.js';

describe('formatWeatherForecastLocationName', () => {
  it('prefers community over city when both exist', () => {
    expect(
      formatWeatherForecastLocationName({ community: 'Wadi Shawka', city: 'Fujairah', state: null })
    ).toBe('Wadi Shawka');
  });

  it('falls back to city when community is missing', () => {
    expect(formatWeatherForecastLocationName({ community: null, city: 'Hatta', state: 'Dubai' })).toBe('Hatta');
  });
});
